/**
 * FileUpload component with progress tracking and drag-and-drop
 */
import React, { useState, useRef, useCallback } from 'react';
import { 
  Upload, 
  File, 
  CheckCircle, 
  AlertCircle, 
  Loader2,
  X,
  Download
} from 'lucide-react';

interface UploadStatus {
  id: string;
  filename: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress_percent: number;
  records_total: number;
  records_processed: number;
  records_created: number;
  records_updated: number;
  records_duplicates: number;
  records_errors: number;
  error_message?: string;
}

interface FileUploadProps {
  apiBaseUrl?: string;
  onUploadComplete?: (result: UploadStatus) => void;
  onUploadError?: (error: string) => void;
  acceptedTypes?: string[];
  maxFileSize?: number; // in bytes
}

export const FileUpload: React.FC<FileUploadProps> = ({
  apiBaseUrl = 'http://localhost:8000/api',
  onUploadComplete,
  onUploadError,
  acceptedTypes = ['.csv', '.xlsx', '.xls'],
  maxFileSize = 100 * 1024 * 1024 // 100MB
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploads, setUploads] = useState<UploadStatus[]>([]);
  const [isUploading, setIsUploading] = useState(false);
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
    for (const file of files) {
      const validationError = validateFile(file);
      if (validationError) {
        onUploadError?.(validationError);
        continue;
      }

      await uploadFile(file);
    }
  };

  const uploadFile = async (file: File) => {
    setIsUploading(true);
    
    const formData = new FormData();
    formData.append('file', file);
    formData.append('file_type', 'voter_data');

    try {
      // Start upload
      const uploadResponse = await fetch(`${apiBaseUrl}/voter-data/upload/voter-data/`, {
        method: 'POST',
        body: formData,
      });

      if (!uploadResponse.ok) {
        throw new Error('Upload failed');
      }

      const uploadData = await uploadResponse.json();
      const uploadId = uploadData.upload_id;

      // Add to uploads list
      const newUpload: UploadStatus = {
        id: uploadId,
        filename: file.name,
        status: 'pending',
        progress_percent: 0,
        records_total: 0,
        records_processed: 0,
        records_created: 0,
        records_updated: 0,
        records_duplicates: 0,
        records_errors: 0,
      };

      setUploads(prev => [newUpload, ...prev]);

      // Start processing
      const processResponse = await fetch(`${apiBaseUrl}/voter-data/upload/${uploadId}/process/`, {
        method: 'POST',
      });

      if (!processResponse.ok) {
        throw new Error('Processing failed');
      }

      // Poll for status updates
      pollUploadStatus(uploadId);

    } catch (error) {
      console.error('Upload error:', error);
      onUploadError?.(error instanceof Error ? error.message : 'Upload failed');
    } finally {
      setIsUploading(false);
    }
  };

  const pollUploadStatus = async (uploadId: string) => {
    let attempts = 0;
    const maxAttempts = 120; // 2 minutes max polling

    const poll = async () => {
      try {
        const response = await fetch(`${apiBaseUrl}/voter-data/upload/${uploadId}/status/`);
        if (response.ok) {
          const data = await response.json();
          const upload = data.upload;

          setUploads(prev => 
            prev.map(u => 
              u.id === uploadId 
                ? { ...u, ...upload }
                : u
            )
          );

          if (upload.status === 'completed') {
            onUploadComplete?.(upload);
            return;
          } else if (upload.status === 'failed') {
            onUploadError?.(upload.error_message || 'Upload failed');
            return;
          }
        }

        attempts++;
        if (attempts < maxAttempts) {
          setTimeout(poll, 2000); // Poll every 2 seconds
        }
      } catch (error) {
        console.error('Polling error:', error);
      }
    };

    poll();
  };

  const removeUpload = (uploadId: string) => {
    setUploads(prev => prev.filter(u => u.id !== uploadId));
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'failed':
        return <AlertCircle className="w-5 h-5 text-red-500" />;
      case 'processing':
      case 'pending':
        return <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />;
      default:
        return <File className="w-5 h-5 text-gray-500" />;
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-6">
      {/* Upload Area */}
      <div
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
          isDragOver 
            ? 'border-blue-500 bg-blue-50' 
            : 'border-gray-300 hover:border-gray-400'
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-700 mb-2">
          Upload Voter Data
        </h3>
        <p className="text-gray-500 mb-4">
          Drag and drop your CSV or Excel files here, or click to browse
        </p>
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-6 py-2 rounded-md font-medium transition-colors"
        >
          {isUploading ? 'Uploading...' : 'Choose Files'}
        </button>
        <p className="text-sm text-gray-400 mt-2">
          Supported: {acceptedTypes.join(', ')} • Max size: {Math.round(maxFileSize / (1024 * 1024))}MB
        </p>
        
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={acceptedTypes.join(',')}
          onChange={handleFileSelect}
          className="hidden"
        />
      </div>

      {/* Upload List */}
      {uploads.length > 0 && (
        <div className="mt-6">
          <h4 className="text-lg font-semibold mb-4">Recent Uploads</h4>
          <div className="space-y-4">
            {uploads.map((upload) => (
              <div key={upload.id} className="bg-white border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-3">
                    {getStatusIcon(upload.status)}
                    <div>
                      <h5 className="font-medium text-gray-900">{upload.filename}</h5>
                      <p className="text-sm text-gray-500 capitalize">{upload.status}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => removeUpload(upload.id)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Progress Bar */}
                {(upload.status === 'processing' || upload.status === 'pending') && (
                  <div className="mb-3">
                    <div className="bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${upload.progress_percent}%` }}
                      />
                    </div>
                    <p className="text-sm text-gray-600 mt-1">
                      {upload.progress_percent}% • {upload.records_processed} / {upload.records_total} records
                    </p>
                  </div>
                )}

                {/* Results */}
                {upload.status === 'completed' && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div className="text-center">
                      <p className="font-semibold text-green-600">{upload.records_created}</p>
                      <p className="text-gray-600">Created</p>
                    </div>
                    <div className="text-center">
                      <p className="font-semibold text-blue-600">{upload.records_updated}</p>
                      <p className="text-gray-600">Updated</p>
                    </div>
                    <div className="text-center">
                      <p className="font-semibold text-yellow-600">{upload.records_duplicates}</p>
                      <p className="text-gray-600">Duplicates</p>
                    </div>
                    <div className="text-center">
                      <p className="font-semibold text-red-600">{upload.records_errors}</p>
                      <p className="text-gray-600">Errors</p>
                    </div>
                  </div>
                )}

                {/* Error Message */}
                {upload.status === 'failed' && upload.error_message && (
                  <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-700">
                    {upload.error_message}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default FileUpload;