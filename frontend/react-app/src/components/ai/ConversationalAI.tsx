import React, { useState, useRef, useEffect } from 'react'
import { 
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  IconButton,
  Stack,
  Chip,
  Alert,
  CircularProgress,
  Avatar,
  Divider,
  Collapse,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Tooltip
} from '@mui/material'
import {
  Send,
  SmartToy,
  Person,
  ExpandMore,
  ExpandLess,
  CheckCircle,
  Schedule,
  ContactMail,
  GroupAdd,
  Analytics,
  Error,
  ContentCopy
} from '@mui/icons-material'

interface ConversationMessage {
  id: string
  type: 'user' | 'ai'
  content: string
  timestamp: Date
  command?: ActionCommand
  status?: 'pending' | 'success' | 'error'
  details?: string
}

interface ActionCommand {
  type: 'create_contact_list' | 'schedule_broadcast' | 'add_voter' | 'query_data'
  parameters: Record<string, any>
  description: string
}

interface ConversationalAIProps {
  onExecuteCommand: (command: ActionCommand) => Promise<{ success: boolean; result?: any; error?: string }>
  onAnalyticsQuery: (query: string) => Promise<any>
}

const ConversationalAI: React.FC<ConversationalAIProps> = ({
  onExecuteCommand,
  onAnalyticsQuery
}) => {
  const [messages, setMessages] = useState<ConversationMessage[]>([
    {
      id: '1',
      type: 'ai',
      content: 'Hello! I\'m your campaign AI assistant. I can help you with data analysis, creating contact lists, scheduling broadcasts, adding voters, and more. Try asking me something like "Create a contact list for voters under 30 in Austin, TX" or "Show me voter turnout by age group".',
      timestamp: new Date()
    }
  ])
  const [input, setInput] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [expandedActions, setExpandedActions] = useState<Set<string>>(new Set())
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const parseUserIntent = (message: string): ActionCommand | null => {
    const lower = message.toLowerCase()
    
    // Create contact list patterns
    if (lower.includes('create') && (lower.includes('contact') || lower.includes('list'))) {
      const ageMatch = message.match(/(?:under|below|less than)\s+(\d+)|(\d+)\s*(?:and under|or younger|or below)/i)
      const locationMatch = message.match(/in\s+([^,]+(?:,\s*[^,]+)*)/i)
      
      return {
        type: 'create_contact_list',
        parameters: {
          age_filter: ageMatch ? parseInt(ageMatch[1] || ageMatch[2]) : null,
          location: locationMatch ? locationMatch[1].trim() : null,
          name: `Contact List - ${new Date().toLocaleDateString()}`
        },
        description: `Create contact list${ageMatch ? ` for voters under ${ageMatch[1] || ageMatch[2]}` : ''}${locationMatch ? ` in ${locationMatch[1]}` : ''}`
      }
    }
    
    // Schedule broadcast patterns
    if (lower.includes('schedule') && (lower.includes('email') || lower.includes('broadcast') || lower.includes('message'))) {
      const timeMatch = message.match(/(?:at\s+)?(\d{1,2}(?::\d{2})?\s*(?:am|pm|AM|PM))/i) ||
                       message.match(/(?:tomorrow|today)\s+(?:at\s+)?(\d{1,2}(?::\d{2})?\s*(?:am|pm|AM|PM))/i)
      const recipientMatch = message.match(/to\s+([\w\s]+?)(?:\s+for|\s+at|\s*$)/i)
      
      return {
        type: 'schedule_broadcast',
        parameters: {
          time: timeMatch ? timeMatch[1] : 'tomorrow at 10 AM',
          recipients: recipientMatch ? recipientMatch[1].trim() : 'all active volunteers',
          subject: 'Campaign Update',
          message: 'Important campaign update from your team.'
        },
        description: `Schedule broadcast to ${recipientMatch ? recipientMatch[1] : 'all active volunteers'}${timeMatch ? ` at ${timeMatch[1]}` : ' tomorrow at 10 AM'}`
      }
    }
    
    // Add voter patterns
    if (lower.includes('add') && lower.includes('voter')) {
      const nameMatch = message.match(/(?:add|with)\s+(?:a\s+)?(?:new\s+)?voter\s+(?:with\s+)?(?:the\s+)?name\s+['"]?([^'"]+?)['"]?(?:\s+and|\s+with|\s*$)/i) ||
                       message.match(/name\s+['"]?([^'"]+?)['"]?(?:\s+and|\s+with|\s*$)/i)
      const phoneMatch = message.match(/phone\s+(?:number\s+)?['"]?([^'"]+?)['"]?(?:\s+and|\s*$)/i)
      
      return {
        type: 'add_voter',
        parameters: {
          name: nameMatch ? nameMatch[1].trim() : 'New Voter',
          phone: phoneMatch ? phoneMatch[1].trim() : '',
          email: '',
          address: ''
        },
        description: `Add voter${nameMatch ? ` "${nameMatch[1]}"` : ''}${phoneMatch ? ` with phone ${phoneMatch[1]}` : ''}`
      }
    }
    
    // Data query patterns
    if (lower.includes('show') || lower.includes('what') || lower.includes('how many') || 
        lower.includes('analyze') || lower.includes('chart') || lower.includes('graph')) {
      return {
        type: 'query_data',
        parameters: {
          query: message
        },
        description: `Analyze: "${message}"`
      }
    }
    
    return null
  }

  const handleSendMessage = async () => {
    if (!input.trim() || isProcessing) return

    const userMessage: ConversationMessage = {
      id: Date.now().toString(),
      type: 'user',
      content: input.trim(),
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInput('')
    setIsProcessing(true)

    try {
      // Parse user intent
      const command = parseUserIntent(input.trim())
      
      if (command) {
        // Create AI response with action
        const aiMessage: ConversationMessage = {
          id: (Date.now() + 1).toString(),
          type: 'ai',
          content: `I understand you want to: ${command.description}. Let me execute this for you.`,
          timestamp: new Date(),
          command,
          status: 'pending'
        }
        
        setMessages(prev => [...prev, aiMessage])
        
        // Execute the command
        try {
          const result = await onExecuteCommand(command)
          
          // Update message with result
          setMessages(prev => prev.map(msg => 
            msg.id === aiMessage.id 
              ? { 
                  ...msg, 
                  status: result.success ? 'success' : 'error',
                  details: result.success 
                    ? `✅ Successfully completed: ${command.description}`
                    : `❌ Error: ${result.error || 'Unknown error occurred'}`
                }
              : msg
          ))
          
          // Add follow-up message
          if (result.success) {
            const followUpMessage: ConversationMessage = {
              id: (Date.now() + 2).toString(),
              type: 'ai',
              content: `Great! I've successfully ${command.description.toLowerCase()}. ${command.type === 'query_data' ? 'Here\'s what I found:' : 'Is there anything else you\'d like me to help you with?'}`,
              timestamp: new Date()
            }
            setMessages(prev => [...prev, followUpMessage])
          }
          
        } catch (error) {
          setMessages(prev => prev.map(msg => 
            msg.id === aiMessage.id 
              ? { 
                  ...msg, 
                  status: 'error',
                  details: `❌ Error executing command: ${error instanceof Error ? error.message : 'Unknown error'}`
                }
              : msg
          ))
        }
      } else {
        // Handle as general conversation
        const aiMessage: ConversationMessage = {
          id: (Date.now() + 1).toString(),
          type: 'ai',
          content: `I understand you're asking about "${input.trim()}". Here are some things I can help you with:

• **Create contact lists**: "Create a contact list for voters under 30 in Austin, TX"
• **Schedule broadcasts**: "Schedule an email to all volunteers for tomorrow at 10 AM"  
• **Add voters**: "Add a new voter with name 'Jane Doe' and phone '555-123-4567'"
• **Data analysis**: "Show me voter turnout by age group" or "What's the demographic breakdown?"

Try rephrasing your request with one of these patterns, and I'll be happy to help!`,
          timestamp: new Date()
        }
        setMessages(prev => [...prev, aiMessage])
      }
    } catch (error) {
      const errorMessage: ConversationMessage = {
        id: (Date.now() + 1).toString(),
        type: 'ai',
        content: `I apologize, but I encountered an error processing your request. Please try again or rephrase your question.`,
        timestamp: new Date()
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsProcessing(false)
    }
  }

  const toggleActionExpansion = (messageId: string) => {
    setExpandedActions(prev => {
      const newSet = new Set(prev)
      if (newSet.has(messageId)) {
        newSet.delete(messageId)
      } else {
        newSet.add(messageId)
      }
      return newSet
    })
  }

  const getActionIcon = (type: ActionCommand['type']) => {
    switch (type) {
      case 'create_contact_list': return <ContactMail />
      case 'schedule_broadcast': return <Schedule />
      case 'add_voter': return <GroupAdd />
      case 'query_data': return <Analytics />
      default: return <SmartToy />
    }
  }

  const getStatusIcon = (status?: string) => {
    switch (status) {
      case 'success': return <CheckCircle color="success" />
      case 'error': return <Error color="error" />
      case 'pending': return <CircularProgress size={16} />
      default: return null
    }
  }

  return (
    <Card sx={{ height: '600px', display: 'flex', flexDirection: 'column' }}>
      <CardContent sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
        <Stack direction="row" alignItems="center" spacing={2}>
          <Avatar sx={{ bgcolor: 'primary.main' }}>
            <SmartToy />
          </Avatar>
          <Box>
            <Typography variant="h6">Campaign AI Assistant</Typography>
            <Typography variant="caption" color="text.secondary">
              Powered by Conversational AI - Execute commands and analyze data
            </Typography>
          </Box>
        </Stack>
      </CardContent>
      
      <Box sx={{ flexGrow: 1, overflow: 'auto', p: 1 }}>
        <Stack spacing={2}>
          {messages.map((message) => (
            <Box
              key={message.id}
              sx={{
                display: 'flex',
                justifyContent: message.type === 'user' ? 'flex-end' : 'flex-start',
                px: 1
              }}
            >
              <Box
                sx={{
                  maxWidth: '80%',
                  bgcolor: message.type === 'user' ? 'primary.main' : 'grey.100',
                  color: message.type === 'user' ? 'white' : 'text.primary',
                  borderRadius: 2,
                  p: 2,
                  position: 'relative'
                }}
              >
                <Stack direction="row" alignItems="flex-start" spacing={1}>
                  <Avatar 
                    sx={{ 
                      width: 24, 
                      height: 24, 
                      bgcolor: message.type === 'user' ? 'primary.dark' : 'grey.300'
                    }}
                  >
                    {message.type === 'user' ? <Person /> : <SmartToy />}
                  </Avatar>
                  <Box sx={{ flexGrow: 1 }}>
                    <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                      {message.content}
                    </Typography>
                    <Typography variant="caption" sx={{ opacity: 0.7, mt: 0.5, display: 'block' }}>
                      {message.timestamp.toLocaleTimeString()}
                    </Typography>
                    
                    {/* Action Command Display */}
                    {message.command && (
                      <Box sx={{ mt: 1 }}>
                        <Chip
                          icon={getActionIcon(message.command.type)}
                          label={
                            <Stack direction="row" alignItems="center" spacing={1}>
                              <span>{message.command.description}</span>
                              {getStatusIcon(message.status)}
                            </Stack>
                          }
                          variant="outlined"
                          size="small"
                          clickable
                          onClick={() => toggleActionExpansion(message.id)}
                          onDelete={expandedActions.has(message.id) ? 
                            () => toggleActionExpansion(message.id) : undefined}
                          deleteIcon={expandedActions.has(message.id) ? <ExpandLess /> : <ExpandMore />}
                          sx={{ 
                            bgcolor: message.status === 'success' ? 'success.light' : 
                                    message.status === 'error' ? 'error.light' : 'action.hover',
                            color: message.type === 'user' ? 'primary.contrastText' : 'text.primary'
                          }}
                        />
                        
                        <Collapse in={expandedActions.has(message.id)}>
                          <Box sx={{ mt: 1, p: 1, bgcolor: 'action.hover', borderRadius: 1 }}>
                            <Typography variant="caption" component="div">
                              <strong>Command:</strong> {message.command.type}
                            </Typography>
                            <Typography variant="caption" component="div">
                              <strong>Parameters:</strong> {JSON.stringify(message.command.parameters, null, 2)}
                            </Typography>
                            {message.details && (
                              <Typography variant="caption" component="div" sx={{ mt: 0.5 }}>
                                <strong>Result:</strong> {message.details}
                              </Typography>
                            )}
                          </Box>
                        </Collapse>
                      </Box>
                    )}
                  </Box>
                </Stack>
              </Box>
            </Box>
          ))}
          {isProcessing && (
            <Box sx={{ display: 'flex', justifyContent: 'flex-start', px: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, p: 2 }}>
                <CircularProgress size={16} />
                <Typography variant="body2" color="text.secondary">
                  AI is thinking...
                </Typography>
              </Box>
            </Box>
          )}
        </Stack>
        <div ref={messagesEndRef} />
      </Box>
      
      <Divider />
      
      <Box sx={{ p: 2 }}>
        <Stack direction="row" spacing={1}>
          <TextField
            fullWidth
            variant="outlined"
            placeholder="Ask me to create contact lists, schedule broadcasts, add voters, or analyze data..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
            multiline
            maxRows={3}
            size="small"
            disabled={isProcessing}
          />
          <Tooltip title="Send message">
            <IconButton 
              color="primary" 
              onClick={handleSendMessage}
              disabled={!input.trim() || isProcessing}
              sx={{ alignSelf: 'flex-end' }}
            >
              <Send />
            </IconButton>
          </Tooltip>
        </Stack>
        
        <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
          💡 Try: "Create contact list for voters under 30" or "Schedule email to volunteers tomorrow"
        </Typography>
      </Box>
    </Card>
  )
}

export default ConversationalAI