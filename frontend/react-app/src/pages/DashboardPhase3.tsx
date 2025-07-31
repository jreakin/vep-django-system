import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  BarChart3, 
  Users, 
  Activity, 
  Bell, 
  TrendingUp, 
  Calendar, 
  Database,
  Settings,
  Palette,
  Sparkles
} from 'lucide-react'
import dashboardService, { type DashboardStats } from '../services/dashboard'
import { 
  TabsRoot, 
  TabsList, 
  TabsTrigger, 
  TabsContent,
  Button
} from '../components/ui'
import { ThemeToggle, ThemeCustomizationPanel } from '../components/ui/ThemeComponents'
import { 
  AnimatedContainer, 
  AnimatedList, 
  AnimatedCard, 
  LoadingSpinner,
  FloatingActionButton
} from '../components/animations'
import ConversationalAIEnhanced from '../components/ai/ConversationalAIEnhanced'
import District3DMap from '../components/visualization/District3DMap'

// RSC-like data fetching hook
const useDashboardData = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      setError(null)
      const dashboardStats = await dashboardService.getStats()
      setStats(dashboardStats)
    } catch (err: any) {
      console.error('Failed to fetch dashboard data:', err)
      setError(err.response?.data?.error || 'Failed to load dashboard data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDashboardData()
  }, [])

  return { stats, loading, error, refetch: fetchDashboardData }
}

// Enhanced Metric Card Component with animations
interface MetricCardProps {
  title: string
  value: string
  icon: React.ReactNode
  color: string
  trend?: {
    value: number
    isPositive: boolean
  }
  delay?: number
}

const MetricCard: React.FC<MetricCardProps> = ({ title, value, icon, color, trend, delay = 0 }) => (
  <AnimatedCard
    className="tw-h-full tw-group"
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5, delay }}
    hoverable
  >
    <div className="tw-flex tw-items-center tw-justify-between">
      <div className="tw-flex-1">
        <p className="tw-text-sm tw-font-medium tw-text-text-secondary tw-mb-1">{title}</p>
        <motion.p 
          className="tw-text-3xl tw-font-bold tw-text-text-primary"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: delay + 0.2 }}
        >
          {value}
        </motion.p>
        {trend && (
          <motion.div 
            className={`tw-flex tw-items-center tw-mt-3 tw-text-sm ${trend.isPositive ? 'tw-text-success' : 'tw-text-error'}`}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: delay + 0.4 }}
          >
            <TrendingUp className={`tw-h-4 tw-w-4 tw-mr-1 ${trend.isPositive ? '' : 'tw-rotate-180'}`} />
            {Math.abs(trend.value)}% from last month
          </motion.div>
        )}
      </div>
      <motion.div 
        className="tw-p-4 tw-rounded-full tw-bg-gradient-to-br tw-from-primary/10 tw-to-secondary/10 group-hover:tw-from-primary/20 group-hover:tw-to-secondary/20 tw-transition-all tw-duration-300"
        style={{ color: color }}
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: delay + 0.3, type: "spring", stiffness: 200 }}
      >
        {icon}
      </motion.div>
    </div>
  </AnimatedCard>
)

// Enhanced Recent Activity Component
const RecentActivity: React.FC<{ stats: DashboardStats }> = ({ stats }) => {
  const activities = [
    {
      id: 1,
      type: 'upload',
      description: `${stats.recent_uploads} new voter records uploaded`,
      time: '2 hours ago',
      icon: <Database className="tw-h-4 tw-w-4" />,
      color: 'var(--color-info)'
    },
    {
      id: 2,
      type: 'registration',
      description: `${stats.recent_voters} new voter registrations`,
      time: '4 hours ago',
      icon: <Users className="tw-h-4 tw-w-4" />,
      color: 'var(--color-success)'
    },
    {
      id: 3,
      type: 'chart',
      description: 'Analytics dashboard updated',
      time: '6 hours ago',
      icon: <BarChart3 className="tw-h-4 tw-w-4" />,
      color: 'var(--color-warning)'
    }
  ]

  return (
    <AnimatedCard className="tw-h-full">
      <h3 className="tw-text-lg tw-font-semibold tw-text-text-primary tw-mb-6">Recent Activity</h3>
      <AnimatedList className="tw-space-y-4">
        {activities.map((activity, index) => (
          <motion.div 
            key={activity.id} 
            className="tw-flex tw-items-start tw-space-x-4 tw-group"
            whileHover={{ x: 4 }}
            transition={{ duration: 0.2 }}
          >
            <motion.div 
              className="tw-flex-shrink-0 tw-p-2 tw-rounded-full tw-bg-surface group-hover:tw-shadow-md tw-transition-all tw-duration-200"
              style={{ color: activity.color }}
              whileHover={{ scale: 1.1 }}
            >
              {activity.icon}
            </motion.div>
            <div className="tw-flex-1 tw-min-w-0">
              <p className="tw-text-sm tw-text-text-primary tw-font-medium group-hover:tw-text-primary tw-transition-colors">
                {activity.description}
              </p>
              <p className="tw-text-xs tw-text-text-muted tw-mt-1">{activity.time}</p>
            </div>
          </motion.div>
        ))}
      </AnimatedList>
    </AnimatedCard>
  )
}

// Enhanced Quick Actions Component
const QuickActions: React.FC = () => {
  const actions = [
    {
      title: 'Upload Voter Data',
      description: 'Import new voter records from CSV',
      icon: <Database className="tw-h-5 tw-w-5" />,
      action: () => console.log('Upload data'),
      gradient: 'tw-from-blue-500 tw-to-blue-600'
    },
    {
      title: 'Create Campaign',
      description: 'Start a new campaign',
      icon: <Activity className="tw-h-5 tw-w-5" />,
      action: () => console.log('Create campaign'),
      gradient: 'tw-from-green-500 tw-to-green-600'
    },
    {
      title: 'Analytics Report',
      description: 'Generate voter analytics',
      icon: <BarChart3 className="tw-h-5 tw-w-5" />,
      action: () => console.log('Analytics report'),
      gradient: 'tw-from-purple-500 tw-to-purple-600'
    },
    {
      title: 'Schedule Event',
      description: 'Plan campaign events',
      icon: <Calendar className="tw-h-5 tw-w-5" />,
      action: () => console.log('Schedule event'),
      gradient: 'tw-from-orange-500 tw-to-orange-600'
    }
  ]

  return (
    <AnimatedCard className="tw-h-full">
      <h3 className="tw-text-lg tw-font-semibold tw-text-text-primary tw-mb-6">Quick Actions</h3>
      <div className="tw-grid tw-grid-cols-2 tw-gap-4">
        {actions.map((action, index) => (
          <motion.button
            key={index}
            className={`tw-group tw-h-auto tw-p-4 tw-flex tw-flex-col tw-items-start tw-text-left tw-rounded-lg tw-bg-gradient-to-br ${action.gradient} tw-text-white tw-shadow-md hover:tw-shadow-lg tw-transition-all tw-duration-200`}
            onClick={action.action}
            whileHover={{ scale: 1.02, y: -2 }}
            whileTap={{ scale: 0.98 }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <div className="tw-flex tw-items-center tw-mb-3">
              <motion.div
                className="tw-p-2 tw-rounded-md tw-bg-white/20"
                whileHover={{ rotate: 360 }}
                transition={{ duration: 0.5 }}
              >
                {action.icon}
              </motion.div>
              <span className="tw-ml-3 tw-font-medium">{action.title}</span>
            </div>
            <span className="tw-text-xs tw-text-white/80 group-hover:tw-text-white tw-transition-colors">
              {action.description}
            </span>
          </motion.button>
        ))}
      </div>
    </AnimatedCard>
  )
}

// Sample data for 3D visualization (same as before)
const sampleGeographicData = [
  {
    id: '1',
    name: 'Downtown Austin',
    coordinates: [30.2672, -97.7431] as [number, number],
    value: 0.8,
    type: 'voter_density' as const,
    details: {
      total: 12500,
      percentage: 68,
      trend: 'up' as const,
      description: 'High voter density in downtown core'
    }
  },
  {
    id: '2',
    name: 'South Austin',
    coordinates: [30.2240, -97.7690] as [number, number],
    value: 0.6,
    type: 'voter_density' as const,
    details: {
      total: 8900,
      percentage: 45,
      trend: 'stable' as const,
      description: 'Moderate voter engagement'
    }
  },
  {
    id: '3',
    name: 'East Austin',
    coordinates: [30.2711, -97.7156] as [number, number],
    value: 0.4,
    type: 'fundraising' as const,
    details: {
      total: 125000,
      percentage: 32,
      trend: 'up' as const,
      description: 'Growing fundraising activity'
    }
  },
  {
    id: '4',
    name: 'North Austin',
    coordinates: [30.3909, -97.7431] as [number, number],
    value: 0.7,
    type: 'canvassing_progress' as const,
    details: {
      total: 2840,
      percentage: 78,
      trend: 'up' as const,
      description: 'Active canvassing campaign'
    }
  },
  {
    id: '5',
    name: 'West Austin',
    coordinates: [30.2672, -97.8088] as [number, number],
    value: 0.5,
    type: 'volunteer_activity' as const,
    details: {
      total: 156,
      percentage: 23,
      trend: 'down' as const,
      description: 'Need more volunteer recruitment'
    }
  }
]

const sampleDistrictBounds = {
  north: 30.4909,
  south: 30.1240,
  east: -97.6156,
  west: -97.9088,
  center: [30.2672, -97.7431] as [number, number]
}

// Main Enhanced Dashboard Component
const DashboardPhase3: React.FC = () => {
  const { stats, loading, error, refetch } = useDashboardData()
  const [showThemePanel, setShowThemePanel] = useState(false)

  // Handler for AI command execution (same as before)
  const handleExecuteCommand = async (command: any) => {
    console.log('Executing command:', command)
    
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    switch (command.type) {
      case 'create_contact_list':
        return {
          success: true,
          result: {
            id: Date.now(),
            name: command.parameters.name,
            count: Math.floor(Math.random() * 500) + 100,
            filters: command.parameters
          }
        }
      
      case 'schedule_broadcast':
        return {
          success: true,
          result: {
            id: Date.now(),
            scheduled_time: command.parameters.time,
            recipients: command.parameters.recipients,
            status: 'scheduled'
          }
        }
      
      case 'add_voter':
        return {
          success: true,
          result: {
            id: Date.now(),
            name: command.parameters.name,
            phone: command.parameters.phone,
            status: 'added'
          }
        }
      
      case 'query_data':
        return {
          success: true,
          result: {
            query: command.parameters.query,
            data: [
              { category: 'Age 18-29', value: 25 },
              { category: 'Age 30-49', value: 35 },
              { category: 'Age 50-64', value: 30 },
              { category: 'Age 65+', value: 10 }
            ]
          }
        }
      
      default:
        return {
          success: false,
          error: 'Unknown command type'
        }
    }
  }

  // Handler for analytics queries (same as before)
  const handleAnalyticsQuery = async (query: string) => {
    console.log('Processing analytics query:', query)
    
    await new Promise(resolve => setTimeout(resolve, 1500))
    
    return {
      id: Date.now(),
      natural_language_query: query,
      query_type: 'demographic_analysis',
      status: 'completed',
      result_data: [
        { name: 'Democrats', value: 45 },
        { name: 'Republicans', value: 35 },
        { name: 'Independents', value: 20 }
      ],
      chart_config: {
        type: 'pie',
        title: query
      },
      insights: [
        'Democratic voters represent the largest segment',
        'Independent voters are a key swing demographic',
        'Voter engagement has increased 15% this quarter'
      ],
      execution_time_ms: 1200
    }
  }

  // Handler for 3D data point clicks
  const handleDataPointClick = (point: any) => {
    console.log('Clicked data point:', point)
  }

  if (loading) {
    return (
      <AnimatedContainer className="tw-flex tw-justify-center tw-items-center tw-min-h-96">
        <motion.div 
          className="tw-flex tw-items-center tw-gap-4"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          <LoadingSpinner size="lg" />
          <motion.span 
            className="tw-text-text-secondary tw-text-lg"
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            Loading dashboard...
          </motion.span>
        </motion.div>
      </AnimatedContainer>
    )
  }

  if (error) {
    return (
      <AnimatedContainer className="tw-space-y-6">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="tw-text-3xl tw-font-bold tw-text-text-primary">Dashboard</h1>
        </motion.div>
        <motion.div 
          className="tw-bg-error/10 tw-border tw-border-error/20 tw-rounded-lg tw-p-6"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="tw-flex tw-items-start tw-gap-3">
            <div className="tw-text-error">
              <svg className="tw-h-5 tw-w-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="tw-flex-1">
              <h3 className="tw-text-sm tw-font-medium tw-text-error tw-mb-2">Error</h3>
              <div className="tw-text-sm tw-text-text-primary tw-mb-4">{error}</div>
              <Button variant="outline" onClick={refetch}>
                Try Again
              </Button>
            </div>
          </div>
        </motion.div>
      </AnimatedContainer>
    )
  }

  if (!stats) {
    return (
      <AnimatedContainer className="tw-space-y-6">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="tw-text-3xl tw-font-bold tw-text-text-primary">Dashboard</h1>
        </motion.div>
        <motion.div 
          className="tw-bg-info/10 tw-border tw-border-info/20 tw-rounded-lg tw-p-6"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
        >
          <div className="tw-text-text-primary">
            No dashboard data available.
          </div>
        </motion.div>
      </AnimatedContainer>
    )
  }

  const metrics = [
    {
      title: 'Total Dashboards',
      value: stats.dashboards_count.toString(),
      icon: <BarChart3 className="tw-h-6 tw-w-6" />,
      color: 'var(--color-info)',
      trend: { value: 12, isPositive: true }
    },
    {
      title: 'Total Voters',
      value: stats.total_voters ? stats.total_voters.toLocaleString() : 'N/A',
      icon: <Users className="tw-h-6 tw-w-6" />,
      color: 'var(--color-success)',
      trend: { value: 8, isPositive: true }
    },
    {
      title: 'Charts Created',
      value: stats.charts_count.toString(),
      icon: <BarChart3 className="tw-h-6 tw-w-6" />,
      color: 'var(--color-warning)',
      trend: { value: 23, isPositive: true }
    },
    {
      title: 'Notifications',
      value: stats.unread_notifications.toString(),
      icon: <Bell className="tw-h-6 tw-w-6" />,
      color: 'var(--color-secondary)',
      trend: { value: 5, isPositive: false }
    },
  ]

  return (
    <AnimatedContainer className="tw-space-y-8" variant="stagger">
      {/* Header with theme controls */}
      <motion.div 
        className="tw-flex tw-flex-col sm:tw-flex-row tw-items-start sm:tw-items-center tw-justify-between tw-gap-4"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div>
          <motion.h1 
            className="tw-text-4xl tw-font-bold tw-bg-gradient-to-r tw-from-primary tw-to-secondary tw-bg-clip-text tw-text-transparent"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            Dashboard
          </motion.h1>
          <motion.p 
            className="tw-mt-2 tw-text-text-secondary"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            Welcome to your enhanced Political Campaign Management dashboard with advanced animations and adaptive theming.
          </motion.p>
        </div>
        <motion.div 
          className="tw-flex tw-items-center tw-gap-3"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
        >
          <ThemeToggle showLabel />
          <Button
            variant="outline"
            size="icon"
            onClick={() => setShowThemePanel(true)}
            className="tw-flex tw-items-center tw-gap-2"
          >
            <Palette className="tw-h-4 tw-w-4" />
          </Button>
        </motion.div>
      </motion.div>

      {/* Metrics Grid */}
      <motion.div 
        className="tw-grid tw-grid-cols-1 sm:tw-grid-cols-2 lg:tw-grid-cols-4 tw-gap-6"
        variants={{
          hidden: { opacity: 0 },
          visible: {
            opacity: 1,
            transition: {
              staggerChildren: 0.1
            }
          }
        }}
        initial="hidden"
        animate="visible"
      >
        {metrics.map((metric, index) => (
          <MetricCard key={metric.title} {...metric} delay={index * 0.1} />
        ))}
      </motion.div>

      {/* Enhanced Tabbed Content */}
      <TabsRoot defaultValue="overview" className="tw-space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="ai-assistant">AI Assistant</TabsTrigger>
          <TabsTrigger value="3d-analytics">3D Analytics</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="tw-space-y-6">
          <motion.div 
            className="tw-grid tw-grid-cols-1 lg:tw-grid-cols-2 tw-gap-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <RecentActivity stats={stats} />
            <QuickActions />
          </motion.div>
        </TabsContent>
        
        <TabsContent value="ai-assistant" className="tw-space-y-6">
          <AnimatedCard>
            <div className="tw-flex tw-items-center tw-gap-3 tw-mb-6">
              <motion.div
                className="tw-p-3 tw-rounded-full tw-bg-gradient-to-br tw-from-primary/10 tw-to-secondary/10"
                whileHover={{ rotate: 360 }}
                transition={{ duration: 0.5 }}
              >
                <Sparkles className="tw-h-6 tw-w-6 tw-text-primary" />
              </motion.div>
              <div>
                <h3 className="tw-text-lg tw-font-semibold tw-text-text-primary">AI Campaign Assistant</h3>
                <p className="tw-text-text-secondary">
                  Use natural language to manage your campaign with enhanced animations and real-time feedback.
                </p>
              </div>
            </div>
            <ConversationalAIEnhanced 
              onExecuteCommand={handleExecuteCommand}
              onAnalyticsQuery={handleAnalyticsQuery}
            />
          </AnimatedCard>
        </TabsContent>
        
        <TabsContent value="3d-analytics" className="tw-space-y-6">
          <AnimatedCard>
            <div className="tw-flex tw-items-center tw-gap-3 tw-mb-6">
              <motion.div
                className="tw-p-3 tw-rounded-full tw-bg-gradient-to-br tw-from-accent/10 tw-to-primary/10"
                whileHover={{ scale: 1.1 }}
                transition={{ duration: 0.2 }}
              >
                <Activity className="tw-h-6 tw-w-6 tw-text-accent" />
              </motion.div>
              <div>
                <h3 className="tw-text-lg tw-font-semibold tw-text-text-primary">3D Geographic Analytics</h3>
                <p className="tw-text-text-secondary">
                  Interactive 3D visualization with enhanced performance and smooth animations.
                </p>
              </div>
            </div>
            <District3DMap 
              data={sampleGeographicData}
              districtBounds={sampleDistrictBounds}
              onDataPointClick={handleDataPointClick}
            />
          </AnimatedCard>
        </TabsContent>
        
        <TabsContent value="reports" className="tw-space-y-6">
          <AnimatedCard>
            <div className="tw-flex tw-items-center tw-gap-3 tw-mb-6">
              <motion.div
                className="tw-p-3 tw-rounded-full tw-bg-gradient-to-br tw-from-success/10 tw-to-warning/10"
                whileHover={{ scale: 1.1 }}
              >
                <BarChart3 className="tw-h-6 tw-w-6 tw-text-success" />
              </motion.div>
              <div>
                <h3 className="tw-text-lg tw-font-semibold tw-text-text-primary">Campaign Reports</h3>
                <p className="tw-text-text-secondary">
                  Generate and view comprehensive reports with enhanced visual design and animations.
                </p>
              </div>
            </div>
            <motion.div
              className="tw-p-8 tw-text-center tw-bg-gradient-to-br tw-from-surface tw-to-background tw-rounded-lg tw-border tw-border-border"
              whileHover={{ scale: 1.01 }}
            >
              <motion.p 
                className="tw-text-text-muted tw-mb-4"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
              >
                Advanced reporting features with interactive charts and animations coming soon!
              </motion.p>
              <Button variant="gradient" className="tw-mt-4">
                Explore Features
              </Button>
            </motion.div>
          </AnimatedCard>
        </TabsContent>
      </TabsRoot>

      {/* Floating Action Button */}
      <FloatingActionButton
        onClick={() => setShowThemePanel(true)}
        pulse
      >
        <Palette className="tw-h-6 tw-w-6" />
      </FloatingActionButton>

      {/* Theme Customization Panel */}
      <AnimatePresence>
        {showThemePanel && (
          <ThemeCustomizationPanel
            isOpen={showThemePanel}
            onClose={() => setShowThemePanel(false)}
          />
        )}
      </AnimatePresence>
    </AnimatedContainer>
  )
}

export default DashboardPhase3