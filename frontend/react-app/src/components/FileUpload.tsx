import React, { useState, useRef, useCallback } from 'react';
import {
  Box,
  Button,
  Typography,
  Paper,
  LinearProgress,
  Alert,
  Chip,
  Stack,
  IconButton,
} from '@mui/material';
import {
  CloudUpload,
  AttachFile,
  CheckCircle,
  Error as ErrorIcon,
  Close as CloseIcon,
} from '@mui/icons-material';
import voterDataService, { type UploadProgress } from '../services/voterData';

interface FileUploadProps {
  onUploadComplete?: () => void;
  onUploadError?: (error: string) => void;
  acceptedTypes?: string[];
  maxFileSize?: number; // in bytes
}

const FileUpload: React.FC<FileUploadProps> = ({
  onUploadComplete,
  onUploadError,
  acceptedTypes = ['.csv', '.xlsx', '.xls'],
  maxFileSize = 100 * 1024 * 1024 // 100MB
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<UploadProgress | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    handleFiles(files);
  }, []);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    handleFiles(files);
  }, []);

  const validateFile = (file: File): string | null => {
    // Check file type
    const hasValidExtension = acceptedTypes.some(type => 
      file.name.toLowerCase().endsWith(type.toLowerCase())
    );
    
    if (!hasValidExtension) {
      return `File type not supported. Accepted types: ${acceptedTypes.join(', ')}`;
    }

    // Check file size
    if (file.size > maxFileSize) {
      return `File size too large. Maximum size: ${Math.round(maxFileSize / (1024 * 1024))}MB`;
    }

    return null;
  };

  const handleFiles = async (files: File[]) => {
    if (files.length === 0) return;
    
    const file = files[0]; // Handle one file at a time
    const validationError = validateFile(file);
    
    if (validationError) {
      setError(validationError);
      if (onUploadError) {
        onUploadError(validationError);
      }
      return;
    }
    
    setError(null);
    setIsUploading(true);
    
    try {
      // Upload the file
      const uploadResult = await voterDataService.uploadVoterData(file, (progress) => {
        // Update upload progress during file transfer
        setUploadProgress(prev => prev ? {
          ...prev,
          progress: Math.min(progress / 2, 50) // First 50% is file upload
        } : null);
      });
      
      // Set initial progress state
      setUploadProgress({
        upload_id: uploadResult.id,
        status: 'pending',
        progress: 50, // File uploaded, now processing
        current_step: 'Processing file...',
        total_records: 0,
        processed_records: 0,
        duplicates_found: 0,
        errors: [],
        warnings: []
      });
      
      // Poll for processing status
      await pollUploadStatus(uploadResult.id);
      
    } catch (err: any) {
      console.error('Upload failed:', err);
      const errorMessage = err.response?.data?.error || 'Upload failed';
      setError(errorMessage);
      setIsUploading(false);
      if (onUploadError) {
        onUploadError(errorMessage);
      }
    }
  };

  const pollUploadStatus = async (uploadId: string) => {
    const maxAttempts = 120; // 10 minutes max
    let attempts = 0;
    
    const poll = async () => {
      try {
        const status = await voterDataService.getUploadStatus(uploadId);
        setUploadProgress(status);
        
        if (status.status === 'completed') {
          setIsUploading(false);
          if (onUploadComplete) {
            onUploadComplete();
          }
        } else if (status.status === 'failed') {
          setIsUploading(false);
          const errorMessage = status.errors.join(', ') || 'Processing failed';
          setError(errorMessage);
          if (onUploadError) {
            onUploadError(errorMessage);
          }
        } else if (attempts < maxAttempts) {
          attempts++;
          setTimeout(poll, 5000); // Poll every 5 seconds
        } else {
          setIsUploading(false);
          setError('Upload timeout - please check status manually');
        }
      } catch (err: any) {
        console.error('Failed to get upload status:', err);
        setIsUploading(false);
        setError('Failed to check upload status');
      }
    };
    
    poll();
  };

  const handleReset = () => {
    setUploadProgress(null);
    setError(null);
    setIsUploading(false);
  };

  return (
    <Box>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} action={
          <IconButton size="small" onClick={() => setError(null)}>
            <CloseIcon fontSize="small" />
          </IconButton>
        }>
          {error}
        </Alert>
      )}
      
      {/* Upload Area */}
      <Paper
        sx={{
          border: '2px dashed',
          borderColor: isDragOver ? 'primary.main' : 'grey.300',
          bgcolor: isDragOver ? 'action.hover' : 'background.paper',
          p: 4,
          textAlign: 'center',
          cursor: 'pointer',
          transition: 'all 0.2s ease-in-out',
          '&:hover': {
            borderColor: 'primary.main',
            bgcolor: 'action.hover',
          },
        }}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={acceptedTypes.join(',')}
          onChange={handleFileSelect}
          style={{ display: 'none' }}
        />
        
        <CloudUpload sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
        
        <Typography variant="h6" gutterBottom>
          {isUploading ? 'Uploading...' : 'Drag and drop your file here'}
        </Typography>
        
        <Typography variant="body2" color="text.secondary" paragraph>
          or click to browse files
        </Typography>
        
        <Typography variant="caption" color="text.secondary">
          Supported formats: {acceptedTypes.join(', ')} (max {Math.round(maxFileSize / (1024 * 1024))}MB)
        </Typography>
        
        {!isUploading && (
          <Box sx={{ mt: 2 }}>
            <Button
              variant="contained"
              startIcon={<AttachFile />}
              onClick={(e) => {
                e.stopPropagation();
                fileInputRef.current?.click();
              }}
            >
              Select File
            </Button>
          </Box>
        )}
      </Paper>

      {/* Progress Display */}
      {uploadProgress && (
        <Paper sx={{ p: 3, mt: 2 }}>
          <Stack spacing={2}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="h6">
                Upload Progress
              </Typography>
              {uploadProgress.status === 'completed' && (
                <Chip
                  icon={<CheckCircle />}
                  label="Completed"
                  color="success"
                  variant="filled"
                />
              )}
              {uploadProgress.status === 'failed' && (
                <Chip
                  icon={<ErrorIcon />}
                  label="Failed"
                  color="error"
                  variant="filled"
                />
              )}
            </Box>
            
            <LinearProgress 
              variant="determinate" 
              value={uploadProgress.progress} 
              sx={{ height: 8, borderRadius: 4 }}
            />
            
            <Typography variant="body2" color="text.secondary">
              {uploadProgress.current_step} ({Math.round(uploadProgress.progress)}%)
            </Typography>
            
            {uploadProgress.total_records > 0 && (
              <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 1 }}>
                <Typography variant="body2">
                  <strong>Total:</strong> {uploadProgress.total_records.toLocaleString()}
                </Typography>
                <Typography variant="body2">
                  <strong>Processed:</strong> {uploadProgress.processed_records.toLocaleString()}
                </Typography>
                <Typography variant="body2">
                  <strong>Duplicates:</strong> {uploadProgress.duplicates_found.toLocaleString()}
                </Typography>
                <Typography variant="body2" color="error">
                  <strong>Errors:</strong> {uploadProgress.errors.length}
                </Typography>
              </Box>
            )}
            
            {uploadProgress.errors.length > 0 && (
              <Alert severity="error">
                <Typography variant="body2" fontWeight="bold">Errors:</Typography>
                {uploadProgress.errors.map((error, index) => (
                  <Typography key={index} variant="body2">• {error}</Typography>
                ))}
              </Alert>
            )}
            
            {uploadProgress.warnings.length > 0 && (
              <Alert severity="warning">
                <Typography variant="body2" fontWeight="bold">Warnings:</Typography>
                {uploadProgress.warnings.map((warning, index) => (
                  <Typography key={index} variant="body2">• {warning}</Typography>
                ))}
              </Alert>
            )}
            
            {(uploadProgress.status === 'completed' || uploadProgress.status === 'failed') && (
              <Button
                variant="outlined"
                onClick={handleReset}
                sx={{ alignSelf: 'flex-start' }}
              >
                Upload Another File
              </Button>
            )}
          </Stack>
        </Paper>
      )}
    </Box>
  );
};

export default FileUpload;