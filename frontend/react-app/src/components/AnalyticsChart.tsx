/**
 * AnalyticsChart component with NLP query support
 */
import React, { useState } from 'react';
import { 
  BarChart3, 
  LineChart, 
  PieChart, 
  Map,
  Table,
  Send,
  Loader2,
  Save,
  Download
} from 'lucide-react';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, LineElement, PointElement, ArcElement } from 'chart.js';
import { Bar, Line, Pie } from 'react-chartjs-2';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

interface ChartDataPoint {
  x: any;
  y: any;
  label?: string;
  color?: string;
}

interface ChartData {
  chart_type: string;
  title: string;
  data: ChartDataPoint[];
  x_axis_label?: string;
  y_axis_label?: string;
  metadata?: any;
}

interface AnalyticsChartProps {
  apiBaseUrl?: string;
  onChartSaved?: (chartId: string) => void;
  onError?: (error: string) => void;
}

export const AnalyticsChart: React.FC<AnalyticsChartProps> = ({
  apiBaseUrl = 'http://localhost:8000/api',
  onChartSaved,
  onError
}) => {
  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [chartData, setChartData] = useState<ChartData | null>(null);
  const [suggestions] = useState([
    'Show voters by state',
    'Count engagements by type',
    'Voters by political party',
    'Recent voter registrations over the last 30 days',
    'Show voter engagement activities',
  ]);

  const handleQuerySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setIsLoading(true);
    try {
      const response = await fetch(`${apiBaseUrl}/dashboards/analytics/nlp/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: query,
          save_chart: false
        })
      });

      if (!response.ok) {
        throw new Error('Failed to generate chart');
      }

      const data = await response.json();
      if (data.success) {
        setChartData(data.chart_data);
      } else {
        throw new Error(data.message || 'Failed to generate chart');
      }
    } catch (error) {
      console.error('Chart generation error:', error);
      onError?.(error instanceof Error ? error.message : 'Failed to generate chart');
    } finally {
      setIsLoading(false);
    }
  };

  const saveChart = async () => {
    if (!chartData || !query) return;

    try {
      const response = await fetch(`${apiBaseUrl}/dashboards/analytics/nlp/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: query,
          save_chart: true
        })
      });

      if (!response.ok) {
        throw new Error('Failed to save chart');
      }

      const data = await response.json();
      if (data.success && data.saved_chart_id) {
        onChartSaved?.(data.saved_chart_id);
      } else {
        throw new Error(data.message || 'Failed to save chart');
      }
    } catch (error) {
      console.error('Chart save error:', error);
      onError?.(error instanceof Error ? error.message : 'Failed to save chart');
    }
  };

  const downloadChart = () => {
    if (!chartData) return;
    
    const dataStr = JSON.stringify(chartData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `chart-data-${Date.now()}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const prepareChartJSData = (data: ChartData) => {
    const labels = data.data.map(point => point.x);
    const values = data.data.map(point => point.y);
    
    const colors = [
      '#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6',
      '#06B6D4', '#84CC16', '#F97316', '#EC4899', '#6B7280'
    ];

    const backgroundColor = data.chart_type === 'pie' 
      ? colors.slice(0, data.data.length)
      : colors[0] + '80'; // Add transparency for non-pie charts

    const borderColor = data.chart_type === 'pie' 
      ? colors.slice(0, data.data.length)
      : colors[0];

    return {
      labels,
      datasets: [{
        label: data.y_axis_label || 'Value',
        data: values,
        backgroundColor,
        borderColor,
        borderWidth: 1,
        fill: false
      }]
    };
  };

  const getChartOptions = (data: ChartData) => {
    const baseOptions = {
      responsive: true,
      plugins: {
        legend: {
          position: 'top' as const,
        },
        title: {
          display: true,
          text: data.title,
        },
      },
    };

    if (data.chart_type === 'pie') {
      return baseOptions;
    }

    return {
      ...baseOptions,
      scales: {
        x: {
          title: {
            display: true,
            text: data.x_axis_label || 'Categories'
          }
        },
        y: {
          title: {
            display: true,
            text: data.y_axis_label || 'Values'
          },
          beginAtZero: true
        }
      }
    };
  };

  const renderChart = () => {
    if (!chartData) return null;

    const chartJSData = prepareChartJSData(chartData);
    const options = getChartOptions(chartData);

    switch (chartData.chart_type) {
      case 'bar':
        return <Bar data={chartJSData} options={options} />;
      case 'line':
        return <Line data={chartJSData} options={options} />;
      case 'pie':
        return <Pie data={chartJSData} options={options} />;
      case 'table':
        return (
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white border border-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {chartData.x_axis_label || 'Category'}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {chartData.y_axis_label || 'Value'}
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {chartData.data.map((point, index) => (
                  <tr key={index}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {point.x}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {point.y}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      default:
        return <div className="text-center text-gray-500">Unsupported chart type</div>;
    }
  };

  const getChartIcon = (type: string) => {
    switch (type) {
      case 'bar':
        return <BarChart3 className="w-5 h-5" />;
      case 'line':
        return <LineChart className="w-5 h-5" />;
      case 'pie':
        return <PieChart className="w-5 h-5" />;
      case 'map':
        return <Map className="w-5 h-5" />;
      case 'table':
        return <Table className="w-5 h-5" />;
      default:
        return <BarChart3 className="w-5 h-5" />;
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto p-6">
      {/* Query Input */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Analytics Dashboard</h2>
        <form onSubmit={handleQuerySubmit} className="flex space-x-2">
          <div className="flex-1 relative">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Ask a question about your data (e.g., 'Show voters by state')"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              disabled={isLoading}
            />
          </div>
          <button
            type="submit"
            disabled={isLoading || !query.trim()}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-6 py-2 rounded-lg font-medium transition-colors flex items-center space-x-2"
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
            <span>{isLoading ? 'Generating...' : 'Generate'}</span>
          </button>
        </form>

        {/* Suggestions */}
        <div className="mt-4">
          <p className="text-sm text-gray-600 mb-2">Try these examples:</p>
          <div className="flex flex-wrap gap-2">
            {suggestions.map((suggestion, index) => (
              <button
                key={index}
                onClick={() => setQuery(suggestion)}
                className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-full transition-colors"
                disabled={isLoading}
              >
                {suggestion}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Chart Display */}
      {chartData && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          {/* Chart Header */}
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center space-x-2">
              {getChartIcon(chartData.chart_type)}
              <h3 className="text-lg font-semibold text-gray-900">{chartData.title}</h3>
            </div>
            <div className="flex space-x-2">
              <button
                onClick={saveChart}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md font-medium transition-colors flex items-center space-x-2"
              >
                <Save className="w-4 h-4" />
                <span>Save</span>
              </button>
              <button
                onClick={downloadChart}
                className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md font-medium transition-colors flex items-center space-x-2"
              >
                <Download className="w-4 h-4" />
                <span>Export</span>
              </button>
            </div>
          </div>

          {/* Chart */}
          <div className="h-96">
            {renderChart()}
          </div>

          {/* Chart Metadata */}
          {chartData.metadata && (
            <div className="mt-4 p-3 bg-gray-50 rounded text-sm text-gray-600">
              <p>Total records: {chartData.metadata.total_records}</p>
              <p>Query: {query}</p>
            </div>
          )}
        </div>
      )}

      {/* Empty State */}
      {!chartData && !isLoading && (
        <div className="text-center py-12">
          <BarChart3 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Generate Your First Chart
          </h3>
          <p className="text-gray-600 mb-4">
            Ask a question about your data using natural language
          </p>
        </div>
      )}
    </div>
  );
};

export default AnalyticsChart;