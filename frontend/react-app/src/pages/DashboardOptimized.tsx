import React, { useState, useEffect } from 'react'
import { BarChart3, Users, Activity, Bell, TrendingUp, Calendar, Database } from 'lucide-react'
import dashboardService, { type DashboardStats } from '../services/dashboard'
import { 
  TabsRoot, 
  TabsList, 
  TabsTrigger, 
  TabsContent,
  Button
} from '../components/ui'
import ConversationalAI from '../components/ai/ConversationalAI'
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

// Metric Card Component
interface MetricCardProps {
  title: string
  value: string
  icon: React.ReactNode
  color: string
  trend?: {
    value: number
    isPositive: boolean
  }
}

const MetricCard: React.FC<MetricCardProps> = ({ title, value, icon, color, trend }) => (
  <div className="tw-bg-white tw-border tw-border-gray-200 tw-rounded-lg tw-p-6 tw-shadow-sm">
    <div className="tw-flex tw-items-center tw-justify-between">
      <div>
        <p className="tw-text-sm tw-font-medium tw-text-gray-600">{title}</p>
        <p className="tw-text-2xl tw-font-bold tw-text-gray-900 tw-mt-2">{value}</p>
        {trend && (
          <div className={`tw-flex tw-items-center tw-mt-2 tw-text-sm ${trend.isPositive ? 'tw-text-green-600' : 'tw-text-red-600'}`}>
            <TrendingUp className={`tw-h-4 tw-w-4 tw-mr-1 ${trend.isPositive ? '' : 'tw-rotate-180'}`} />
            {Math.abs(trend.value)}% from last month
          </div>
        )}
      </div>
      <div className="tw-p-3 tw-rounded-full" style={{ backgroundColor: `${color}20`, color: color }}>
        {icon}
      </div>
    </div>
  </div>
)

// Recent Activity Component
const RecentActivity: React.FC<{ stats: DashboardStats }> = ({ stats }) => {
  const activities = [
    {
      id: 1,
      type: 'upload',
      description: `${stats.recent_uploads} new voter records uploaded`,
      time: '2 hours ago',
      icon: <Database className="tw-h-4 tw-w-4" />
    },
    {
      id: 2,
      type: 'registration',
      description: `${stats.recent_voters} new voter registrations`,
      time: '4 hours ago',
      icon: <Users className="tw-h-4 tw-w-4" />
    },
    {
      id: 3,
      type: 'chart',
      description: 'Analytics dashboard updated',
      time: '6 hours ago',
      icon: <BarChart3 className="tw-h-4 tw-w-4" />
    }
  ]

  return (
    <div className="tw-bg-white tw-border tw-border-gray-200 tw-rounded-lg tw-p-6">
      <h3 className="tw-text-lg tw-font-semibold tw-text-gray-900 tw-mb-4">Recent Activity</h3>
      <div className="tw-space-y-4">
        {activities.map((activity) => (
          <div key={activity.id} className="tw-flex tw-items-start tw-space-x-3">
            <div className="tw-flex-shrink-0 tw-p-2 tw-bg-gray-100 tw-rounded-full">
              {activity.icon}
            </div>
            <div className="tw-flex-1 tw-min-w-0">
              <p className="tw-text-sm tw-text-gray-900">{activity.description}</p>
              <p className="tw-text-xs tw-text-gray-500 tw-mt-1">{activity.time}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// Quick Actions Component
const QuickActions: React.FC = () => {
  const actions = [
    {
      title: 'Upload Voter Data',
      description: 'Import new voter records from CSV',
      icon: <Database className="tw-h-5 tw-w-5" />,
      action: () => console.log('Upload data')
    },
    {
      title: 'Create Campaign',
      description: 'Start a new campaign',
      icon: <Activity className="tw-h-5 tw-w-5" />,
      action: () => console.log('Create campaign')
    },
    {
      title: 'Analytics Report',
      description: 'Generate voter analytics',
      icon: <BarChart3 className="tw-h-5 tw-w-5" />,
      action: () => console.log('Analytics report')
    },
    {
      title: 'Schedule Event',
      description: 'Plan campaign events',
      icon: <Calendar className="tw-h-5 tw-w-5" />,
      action: () => console.log('Schedule event')
    }
  ]

  return (
    <div className="tw-bg-white tw-border tw-border-gray-200 tw-rounded-lg tw-p-6">
      <h3 className="tw-text-lg tw-font-semibold tw-text-gray-900 tw-mb-4">Quick Actions</h3>
      <div className="tw-grid tw-grid-cols-2 tw-gap-4">
        {actions.map((action, index) => (
          <Button
            key={index}
            variant="outline"
            className="tw-h-auto tw-p-4 tw-flex tw-flex-col tw-items-start tw-text-left"
            onClick={action.action}
          >
            <div className="tw-flex tw-items-center tw-mb-2">
              {action.icon}
              <span className="tw-ml-2 tw-font-medium">{action.title}</span>
            </div>
            <span className="tw-text-xs tw-text-gray-500">{action.description}</span>
          </Button>
        ))}
      </div>
    </div>
  )
}

// Sample data for 3D visualization
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

// Main Dashboard Component with RSC-like architecture
const DashboardOptimized: React.FC = () => {
  const { stats, loading, error, refetch } = useDashboardData()

  // Handler for AI command execution
  const handleExecuteCommand = async (command: any) => {
    console.log('Executing command:', command)
    
    // Simulate command execution with delay
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    switch (command.type) {
      case 'create_contact_list':
        // Simulate contact list creation
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
        // Simulate broadcast scheduling
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
        // Simulate voter addition
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
        // Simulate data query
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

  // Handler for analytics queries
  const handleAnalyticsQuery = async (query: string) => {
    console.log('Processing analytics query:', query)
    
    // Simulate analytics processing
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
    // You could show more details, navigate to a specific view, etc.
  }

  if (loading) {
    return (
      <div className="tw-flex tw-justify-center tw-items-center tw-min-h-96">
        <div className="tw-flex tw-items-center tw-gap-3">
          <div className="tw-animate-spin tw-rounded-full tw-h-8 tw-w-8 tw-border-b-2 tw-border-blue-600"></div>
          <span className="tw-text-gray-600">Loading dashboard...</span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="tw-space-y-6">
        <div>
          <h1 className="tw-text-3xl tw-font-bold tw-text-gray-900">Dashboard</h1>
        </div>
        <div className="tw-bg-red-50 tw-border tw-border-red-200 tw-rounded-md tw-p-4">
          <div className="tw-flex">
            <div className="tw-ml-3">
              <h3 className="tw-text-sm tw-font-medium tw-text-red-800">Error</h3>
              <div className="tw-mt-2 tw-text-sm tw-text-red-700">
                {error}
              </div>
              <div className="tw-mt-4">
                <Button variant="outline" onClick={refetch}>
                  Try Again
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!stats) {
    return (
      <div className="tw-space-y-6">
        <div>
          <h1 className="tw-text-3xl tw-font-bold tw-text-gray-900">Dashboard</h1>
        </div>
        <div className="tw-bg-blue-50 tw-border tw-border-blue-200 tw-rounded-md tw-p-4">
          <div className="tw-text-blue-700">
            No dashboard data available.
          </div>
        </div>
      </div>
    )
  }

  const metrics = [
    {
      title: 'Total Dashboards',
      value: stats.dashboards_count.toString(),
      icon: <BarChart3 className="tw-h-6 tw-w-6" />,
      color: '#3B82F6',
      trend: { value: 12, isPositive: true }
    },
    {
      title: 'Total Voters',
      value: stats.total_voters ? stats.total_voters.toLocaleString() : 'N/A',
      icon: <Users className="tw-h-6 tw-w-6" />,
      color: '#10B981',
      trend: { value: 8, isPositive: true }
    },
    {
      title: 'Charts Created',
      value: stats.charts_count.toString(),
      icon: <BarChart3 className="tw-h-6 tw-w-6" />,
      color: '#F59E0B',
      trend: { value: 23, isPositive: true }
    },
    {
      title: 'Notifications',
      value: stats.unread_notifications.toString(),
      icon: <Bell className="tw-h-6 tw-w-6" />,
      color: '#8B5CF6',
      trend: { value: 5, isPositive: false }
    },
  ]

  return (
    <div className="tw-space-y-6">
      <div>
        <h1 className="tw-text-3xl tw-font-bold tw-text-gray-900">Dashboard</h1>
        <p className="tw-mt-2 tw-text-gray-600">
          Welcome to your Political Campaign Management dashboard. Here's an overview of your current activities.
        </p>
      </div>

      {/* Metrics Grid */}
      <div className="tw-grid tw-grid-cols-1 sm:tw-grid-cols-2 lg:tw-grid-cols-4 tw-gap-6">
        {metrics.map((metric) => (
          <MetricCard key={metric.title} {...metric} />
        ))}
      </div>

      {/* Tabbed Content */}
      <TabsRoot defaultValue="overview" className="tw-space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="ai-assistant">AI Assistant</TabsTrigger>
          <TabsTrigger value="3d-analytics">3D Analytics</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="tw-space-y-6">
          <div className="tw-grid tw-grid-cols-1 lg:tw-grid-cols-2 tw-gap-6">
            <RecentActivity stats={stats} />
            <QuickActions />
          </div>
        </TabsContent>
        
        <TabsContent value="ai-assistant" className="tw-space-y-6">
          <div className="tw-bg-white tw-border tw-border-gray-200 tw-rounded-lg tw-p-6">
            <h3 className="tw-text-lg tw-font-semibold tw-text-gray-900 tw-mb-4">AI Campaign Assistant</h3>
            <p className="tw-text-gray-600 tw-mb-6">
              Use natural language to manage your campaign. Create contact lists, schedule broadcasts, add voters, and analyze data.
            </p>
            <ConversationalAI 
              onExecuteCommand={handleExecuteCommand}
              onAnalyticsQuery={handleAnalyticsQuery}
            />
          </div>
        </TabsContent>
        
        <TabsContent value="3d-analytics" className="tw-space-y-6">
          <div className="tw-bg-white tw-border tw-border-gray-200 tw-rounded-lg tw-p-6">
            <h3 className="tw-text-lg tw-font-semibold tw-text-gray-900 tw-mb-4">3D Geographic Analytics</h3>
            <p className="tw-text-gray-600 tw-mb-6">
              Interactive 3D visualization of your district data. Explore voter density, fundraising, and canvassing progress.
            </p>
            <District3DMap 
              data={sampleGeographicData}
              districtBounds={sampleDistrictBounds}
              onDataPointClick={handleDataPointClick}
            />
          </div>
        </TabsContent>
        
        <TabsContent value="reports" className="tw-space-y-6">
          <div className="tw-bg-white tw-border tw-border-gray-200 tw-rounded-lg tw-p-6">
            <h3 className="tw-text-lg tw-font-semibold tw-text-gray-900 tw-mb-4">Campaign Reports</h3>
            <p className="tw-text-gray-600">
              Generate and view comprehensive reports on campaign activities, voter outreach, 
              and performance summaries.
            </p>
          </div>
        </TabsContent>
      </TabsRoot>
    </div>
  )
}

export default DashboardOptimized