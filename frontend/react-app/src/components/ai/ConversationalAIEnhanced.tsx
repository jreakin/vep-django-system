import React, { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Send,
  Bot,
  User,
  ChevronDown,
  ChevronUp,
  CheckCircle,
  Clock,
  Mail,
  UserPlus,
  BarChart3,
  AlertCircle,
  Copy,
  Sparkles
} from 'lucide-react'
import { Button, Input } from '../ui/Form'
import { AnimatedContainer, AnimatedList } from '../animations'

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
      content: 'Hello! I\'m your enhanced campaign AI assistant with advanced animations and adaptive theming. I can help you with data analysis, creating contact lists, scheduling broadcasts, adding voters, and more. Try asking me something like "Create a contact list for voters under 30 in Austin, TX" or "Show me voter turnout by age group".',
      timestamp: new Date()
    }
  ])
  const [input, setInput] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [expandedActions, setExpandedActions] = useState<Set<string>>(new Set())
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

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
      const timeMatch = message.match(/(?:tomorrow|today|monday|tuesday|wednesday|thursday|friday|saturday|sunday)(?:\s+at\s+\d+(?::\d+)?\s*(?:am|pm)?)?/i)
      const recipientMatch = message.match(/to\s+(all\s+)?([^,]+)/i)
      
      return {
        type: 'schedule_broadcast',
        parameters: {
          time: timeMatch ? timeMatch[0] : 'tomorrow at 10 AM',
          recipients: recipientMatch ? recipientMatch[2].trim() : 'all active volunteers',
          subject: 'Campaign Update'
        },
        description: `Schedule broadcast ${timeMatch ? `for ${timeMatch[0]}` : 'for tomorrow at 10 AM'} to ${recipientMatch ? recipientMatch[2] : 'all active volunteers'}`
      }
    }
    
    // Add voter patterns
    if (lower.includes('add') && lower.includes('voter')) {
      const nameMatch = message.match(/name\s+['"]([^'"]+)['"]/i) || message.match(/voter\s+['"]?([^'"]+?)['"]?\s+(?:with|and)/i)
      const phoneMatch = message.match(/phone\s+['"]?([^'"]+?)['"]?/i)
      
      return {
        type: 'add_voter',
        parameters: {
          name: nameMatch ? nameMatch[1].trim() : 'New Voter',
          phone: phoneMatch ? phoneMatch[1].trim() : '',
          status: 'registered'
        },
        description: `Add voter${nameMatch ? ` "${nameMatch[1]}"` : ''}${phoneMatch ? ` with phone ${phoneMatch[1]}` : ''}`
      }
    }
    
    // Data query patterns
    if (lower.includes('show') || lower.includes('data') || lower.includes('chart') || lower.includes('analytics')) {
      return {
        type: 'query_data',
        parameters: {
          query: message,
          type: 'demographic_analysis'
        },
        description: `Analyze data: "${message}"`
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
        // Add AI response with command
        const aiMessage: ConversationMessage = {
          id: (Date.now() + 1).toString(),
          type: 'ai',
          content: `I'll help you ${command.description}. Let me process that for you...`,
          timestamp: new Date(),
          command,
          status: 'pending'
        }
        
        setMessages(prev => [...prev, aiMessage])
        
        // Execute command
        const result = await onExecuteCommand(command)
        
        // Update message with result
        setMessages(prev => prev.map(msg => 
          msg.id === aiMessage.id 
            ? {
                ...msg,
                status: result.success ? 'success' : 'error',
                content: result.success 
                  ? `✅ Successfully ${command.description.toLowerCase()}!`
                  : `❌ Failed to ${command.description.toLowerCase()}: ${result.error}`,
                details: result.success ? JSON.stringify(result.result, null, 2) : undefined
              }
            : msg
        ))
      } else {
        // Handle as analytics query
        const aiMessage: ConversationMessage = {
          id: (Date.now() + 1).toString(),
          type: 'ai',
          content: 'Let me analyze that data for you...',
          timestamp: new Date(),
          status: 'pending'
        }
        
        setMessages(prev => [...prev, aiMessage])
        
        try {
          const result = await onAnalyticsQuery(input.trim())
          
          setMessages(prev => prev.map(msg => 
            msg.id === aiMessage.id 
              ? {
                  ...msg,
                  status: 'success',
                  content: `📊 Here's your analysis for "${input.trim()}":`,
                  details: JSON.stringify(result, null, 2)
                }
              : msg
          ))
        } catch (error) {
          setMessages(prev => prev.map(msg => 
            msg.id === aiMessage.id 
              ? {
                  ...msg,
                  status: 'error',
                  content: `❌ I couldn't process that query. Could you try rephrasing it?`
                }
              : msg
          ))
        }
      }
    } catch (error) {
      console.error('Error processing message:', error)
      const errorMessage: ConversationMessage = {
        id: (Date.now() + 1).toString(),
        type: 'ai',
        content: '❌ Sorry, I encountered an error processing your request. Please try again.',
        timestamp: new Date(),
        status: 'error'
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsProcessing(false)
      inputRef.current?.focus()
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const toggleActionDetails = (messageId: string) => {
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

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  const getCommandIcon = (type: string) => {
    switch (type) {
      case 'create_contact_list':
        return <Mail className="tw-h-4 tw-w-4" />
      case 'schedule_broadcast':
        return <Clock className="tw-h-4 tw-w-4" />
      case 'add_voter':
        return <UserPlus className="tw-h-4 tw-w-4" />
      case 'query_data':
        return <BarChart3 className="tw-h-4 tw-w-4" />
      default:
        return <Sparkles className="tw-h-4 tw-w-4" />
    }
  }

  const getStatusIcon = (status?: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="tw-h-4 tw-w-4 tw-text-success" />
      case 'error':
        return <AlertCircle className="tw-h-4 tw-w-4 tw-text-error" />
      case 'pending':
        return (
          <motion.div
            className="tw-h-4 tw-w-4 tw-border-2 tw-border-primary/30 tw-border-t-primary tw-rounded-full"
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          />
        )
      default:
        return null
    }
  }

  return (
    <AnimatedContainer className="tw-flex tw-flex-col tw-h-96 tw-bg-background tw-border tw-border-border tw-rounded-lg tw-overflow-hidden">
      {/* Messages Container */}
      <div className="tw-flex-1 tw-overflow-y-auto tw-p-4 tw-space-y-4">
        <AnimatedList>
          {messages.map((message) => (
            <motion.div
              key={message.id}
              className={`tw-flex tw-gap-3 ${message.type === 'user' ? 'tw-justify-end' : 'tw-justify-start'}`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              {message.type === 'ai' && (
                <motion.div
                  className="tw-flex-shrink-0"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.1, type: "spring", stiffness: 200 }}
                >
                  <div className="tw-w-8 tw-h-8 tw-rounded-full tw-bg-gradient-to-br tw-from-primary tw-to-secondary tw-flex tw-items-center tw-justify-center">
                    <Bot className="tw-h-4 tw-w-4 tw-text-white" />
                  </div>
                </motion.div>
              )}
              
              <motion.div
                className={`tw-max-w-xs lg:tw-max-w-md tw-px-4 tw-py-3 tw-rounded-lg tw-break-words ${
                  message.type === 'user'
                    ? 'tw-bg-primary tw-text-white tw-rounded-br-none'
                    : 'tw-bg-surface tw-text-text-primary tw-rounded-bl-none tw-border tw-border-border'
                }`}
                whileHover={{ scale: 1.01 }}
                transition={{ duration: 0.2 }}
              >
                <div className="tw-text-sm">{message.content}</div>
                
                {message.command && (
                  <motion.div
                    className="tw-mt-3 tw-p-3 tw-bg-background/50 tw-rounded-md tw-border tw-border-border/50"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    transition={{ delay: 0.2 }}
                  >
                    <div className="tw-flex tw-items-center tw-justify-between tw-mb-2">
                      <div className="tw-flex tw-items-center tw-gap-2 tw-text-xs tw-font-medium tw-text-text-secondary">
                        {getCommandIcon(message.command.type)}
                        Action Command
                      </div>
                      <div className="tw-flex tw-items-center tw-gap-2">
                        {getStatusIcon(message.status)}
                        <motion.button
                          className="tw-text-text-muted hover:tw-text-text-primary tw-transition-colors"
                          onClick={() => toggleActionDetails(message.id)}
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                        >
                          {expandedActions.has(message.id) ? (
                            <ChevronUp className="tw-h-4 tw-w-4" />
                          ) : (
                            <ChevronDown className="tw-h-4 tw-w-4" />
                          )}
                        </motion.button>
                      </div>
                    </div>
                    
                    <div className="tw-text-xs tw-text-text-muted tw-mb-2">
                      {message.command.description}
                    </div>
                    
                    <AnimatePresence>
                      {expandedActions.has(message.id) && message.details && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.3 }}
                          className="tw-mt-2 tw-p-2 tw-bg-surface tw-rounded tw-border tw-border-border"
                        >
                          <div className="tw-flex tw-items-center tw-justify-between tw-mb-2">
                            <span className="tw-text-xs tw-font-medium tw-text-text-secondary">Result Details</span>
                            <motion.button
                              className="tw-text-text-muted hover:tw-text-text-primary tw-transition-colors"
                              onClick={() => copyToClipboard(message.details!)}
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                            >
                              <Copy className="tw-h-3 tw-w-3" />
                            </motion.button>
                          </div>
                          <pre className="tw-text-xs tw-text-text-muted tw-whitespace-pre-wrap tw-max-h-32 tw-overflow-y-auto">
                            {message.details}
                          </pre>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                )}
                
                <div className="tw-text-xs tw-text-text-muted tw-mt-2 tw-opacity-70">
                  {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </motion.div>

              {message.type === 'user' && (
                <motion.div
                  className="tw-flex-shrink-0"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.1, type: "spring", stiffness: 200 }}
                >
                  <div className="tw-w-8 tw-h-8 tw-rounded-full tw-bg-gradient-to-br tw-from-accent tw-to-success tw-flex tw-items-center tw-justify-center">
                    <User className="tw-h-4 tw-w-4 tw-text-white" />
                  </div>
                </motion.div>
              )}
            </motion.div>
          ))}
        </AnimatedList>
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <motion.div
        className="tw-p-4 tw-bg-surface tw-border-t tw-border-border"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <div className="tw-flex tw-gap-2">
          <div className="tw-flex-1">
            <Input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask me anything about your campaign..."
              disabled={isProcessing}
              className="tw-border-border focus:tw-border-primary"
            />
          </div>
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button
              onClick={handleSendMessage}
              disabled={!input.trim() || isProcessing}
              size="icon"
              className="tw-h-11 tw-w-11"
            >
              {isProcessing ? (
                <motion.div
                  className="tw-h-4 tw-w-4 tw-border-2 tw-border-white/30 tw-border-t-white tw-rounded-full"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                />
              ) : (
                <Send className="tw-h-4 tw-w-4" />
              )}
            </Button>
          </motion.div>
        </div>
      </motion.div>
    </AnimatedContainer>
  )
}

export default ConversationalAI