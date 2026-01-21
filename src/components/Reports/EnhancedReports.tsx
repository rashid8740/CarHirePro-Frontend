import { useState, useEffect } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, 
  CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area 
} from 'recharts';
import { 
  Download, Calendar, Car, Users, DollarSign, BarChart2, 
  ArrowDown, ArrowUp, Activity, AlertCircle, RefreshCw, TrendingUp
} from 'lucide-react';
import { analyticsService } from '../../services/analyticsService';
import AdvancedAnalytics from './AdvancedAnalytics';
import ReportExport from './ReportExport';

interface DashboardData {
  summary: {
    totalBookings: number;
    activeBookings: number;
    completedBookings: number;
    cancelledBookings: number;
    totalVehicles: number;
    availableVehicles: number;
    totalClients: number;
    activeClients: number;
    bookingTrend: {
      value: number;
      percentage: number;
    };
  };
  revenue: Array<{ month: string; revenue: number; expenses?: number; profit?: number }>;
  vehicleUtilization: Array<{
    make: string;
    model: string;
    totalBookings: number;
    activeBookings: number;
    utilizationRate: number;
  }>;
  topClients: Array<{
    name: string;
    email: string;
    totalBookings: number;
    totalSpent: number;
  }>;
  recentBookings: Array<any>;
  lastUpdated: string;
}

export default function EnhancedReports() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState({
    start: new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  });
  const [activeTab, setActiveTab] = useState('overview');
  const [realTimeData, setRealTimeData] = useState<any>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [refreshInterval] = useState(30000); // 30 seconds

  // Fetch dashboard data
  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      const dashboardData = await analyticsService.getDashboardAnalytics();
      setData(dashboardData);
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError('Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  };

  // Fetch real-time metrics
  const fetchRealTimeData = async () => {
    try {
      const realTimeMetrics = await analyticsService.getRealTimeMetrics();
      setRealTimeData(realTimeMetrics);
    } catch (err) {
      console.error('Error fetching real-time data:', err);
    }
  };

  // Initial data fetch
  useEffect(() => {
    fetchDashboardData();
    fetchRealTimeData();
  }, [dateRange]);

  // Auto-refresh real-time data
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      fetchRealTimeData();
      fetchDashboardData();
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, dateRange]);

  // Format currency
  const formatCurrency = (amount: number) => {
    return analyticsService.formatCurrency(amount);
  };

  // Export data
  const handleExport = (dataType: string) => {
    if (!data) return;

    switch (dataType) {
      case 'revenue':
        analyticsService.exportToCSV(data.revenue, `revenue-report-${dateRange.start}-to-${dateRange.end}`);
        break;
      case 'vehicles':
        analyticsService.exportToCSV(data.vehicleUtilization, 'vehicle-utilization-report');
        break;
      case 'clients':
        analyticsService.exportToCSV(data.topClients, 'top-clients-report');
        break;
      default:
        analyticsService.exportToCSV(data.recentBookings, 'recent-bookings-report');
    }
  };

  // KPI Cards Component
  const KPICards = () => {
    if (!data) return null;

    const kpis = [
      {
        title: 'Total Revenue',
        value: formatCurrency(data.revenue.reduce((sum, item) => sum + item.revenue, 0)),
        change: data.summary.bookingTrend.percentage,
        icon: DollarSign,
        color: 'bg-blue-100 text-blue-600',
        trendColor: data.summary.bookingTrend.percentage >= 0 ? 'text-green-600' : 'text-red-600'
      },
      {
        title: 'Active Bookings',
        value: data.summary.activeBookings,
        change: data.summary.bookingTrend.percentage,
        icon: Calendar,
        color: 'bg-green-100 text-green-600',
        trendColor: data.summary.bookingTrend.percentage >= 0 ? 'text-green-600' : 'text-red-600'
      },
      {
        title: 'Available Vehicles',
        value: `${data.summary.availableVehicles}/${data.summary.totalVehicles}`,
        change: ((data.summary.availableVehicles / data.summary.totalVehicles) * 100).toFixed(1),
        icon: Car,
        color: 'bg-yellow-100 text-yellow-600',
        trendColor: 'text-gray-600'
      },
      {
        title: 'Active Clients',
        value: data.summary.activeClients,
        change: ((data.summary.activeClients / data.summary.totalClients) * 100).toFixed(1),
        icon: Users,
        color: 'bg-purple-100 text-purple-600',
        trendColor: 'text-gray-600'
      }
    ];

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {kpis.map((kpi, index) => {
          const Icon = kpi.icon;
          return (
            <div key={index} className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition-shadow">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-500">{kpi.title}</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{kpi.value}</p>
                  <div className={`flex items-center text-sm mt-2 ${kpi.trendColor}`}>
                    {(typeof kpi.change === 'number' ? kpi.change : parseFloat(kpi.change)) >= 0 ? <ArrowUp className="w-4 h-4 mr-1" /> : <ArrowDown className="w-4 h-4 mr-1" />}
                    {typeof kpi.change === 'number' ? kpi.change : parseFloat(kpi.change)}% from last month
                  </div>
                </div>
                <div className={`p-3 rounded-full ${kpi.color}`}>
                  <Icon className="w-6 h-6" />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  // Real-time Activity Feed
  const RealTimeActivity = () => {
    if (!realTimeData) return null;

    return (
      <div className="bg-white p-6 rounded-lg shadow">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Live Activity</h3>
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-sm text-gray-500">Live</span>
            <button
              onClick={() => setAutoRefresh(!autoRefresh)}
              className="p-1 hover:bg-gray-100 rounded"
            >
              <RefreshCw className={`w-4 h-4 ${autoRefresh ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
        
        <div className="grid grid-cols-3 gap-4 mb-4">
          <div className="text-center p-3 bg-blue-50 rounded">
            <div className="text-2xl font-bold text-blue-600">{realTimeData.todayBookings}</div>
            <div className="text-sm text-gray-600">Today's Bookings</div>
          </div>
          <div className="text-center p-3 bg-green-50 rounded">
            <div className="text-2xl font-bold text-green-600">{realTimeData.activeBookings}</div>
            <div className="text-sm text-gray-600">Active</div>
          </div>
          <div className="text-center p-3 bg-yellow-50 rounded">
            <div className="text-2xl font-bold text-yellow-600">{realTimeData.availableVehicles}</div>
            <div className="text-sm text-gray-600">Available</div>
          </div>
        </div>

        <div className="space-y-2">
          {realTimeData.recentActivity?.map((activity: any, index: number) => (
            <div key={index} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded">
              <div className="flex items-center space-x-3">
                <Activity className="w-4 h-4 text-gray-400" />
                <div>
                  <div className="text-sm font-medium">{activity.client}</div>
                  <div className="text-xs text-gray-500">{activity.vehicle}</div>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <span className={`px-2 py-1 text-xs rounded-full ${
                  activity.status === 'Active' ? 'bg-green-100 text-green-800' :
                  activity.status === 'Completed' ? 'bg-blue-100 text-blue-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  {activity.status}
                </span>
                <span className="text-xs text-gray-500">
                  {new Date(activity.time).toLocaleTimeString()}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Tab Content Renderer
  const renderTabContent = () => {
    if (!data) return null;

    switch (activeTab) {
      case 'overview':
        return (
          <div className="space-y-6">
            <KPICards />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-lg font-semibold mb-4">Revenue Trend</h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data.revenue}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip formatter={(value) => [formatCurrency(Number(value)), 'Revenue']} />
                      <Area type="monotone" dataKey="revenue" stroke="#0088FE" fill="#0088FE" fillOpacity={0.6} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <RealTimeActivity />
            </div>
          </div>
        );

      case 'financial':
        return (
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Financial Analytics</h3>
              <button
                onClick={() => handleExport('revenue')}
                className="flex items-center px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                <Download className="w-4 h-4 mr-1" />
                Export
              </button>
            </div>
            <div className="h-96">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.revenue}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip formatter={(value) => [formatCurrency(Number(value)), '']} />
                  <Legend />
                  <Bar dataKey="revenue" fill="#0088FE" name="Revenue" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        );

      case 'vehicles':
        return (
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Vehicle Performance</h3>
              <button
                onClick={() => handleExport('vehicles')}
                className="flex items-center px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                <Download className="w-4 h-4 mr-1" />
                Export
              </button>
            </div>
            <div className="h-96">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  layout="horizontal"
                  data={data.vehicleUtilization.slice(0, 10)}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" domain={[0, 100]} />
                  <YAxis dataKey="make" type="category" width={100} />
                  <Tooltip />
                  <Bar dataKey="utilizationRate" fill="#8884d8" name="Utilization %" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        );

      case 'clients':
        return (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-lg shadow">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Top Clients</h3>
                <button
                  onClick={() => handleExport('clients')}
                  className="flex items-center px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  <Download className="w-4 h-4 mr-1" />
                  Export
                </button>
              </div>
              <div className="h-96">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    layout="horizontal"
                    data={data.topClients.slice(0, 10)}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis dataKey="name" type="category" width={150} />
                    <Tooltip formatter={(value) => [formatCurrency(Number(value)), 'Total Spent']} />
                    <Bar dataKey="totalSpent" fill="#00C49F" name="Total Spent" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        );

      case 'advanced':
        return <AdvancedAnalytics />;

      case 'export':
        return <ReportExport />;

      default:
        return null;
    }
  };

  if (loading && !data) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <AlertCircle className="w-5 h-5 text-red-600 mr-2" />
            <span className="text-red-800">{error}</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Analytics Dashboard</h1>
          <p className="text-gray-600 mt-1">
            Real-time insights and performance metrics
          </p>
        </div>
        
        <div className="mt-4 md:mt-0 flex items-center space-x-2">
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="date"
              value={dateRange.start}
              onChange={(e) => setDateRange({...dateRange, start: e.target.value})}
              className="pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <span className="text-gray-500">to</span>
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="date"
              value={dateRange.end}
              onChange={(e) => setDateRange({...dateRange, end: e.target.value})}
              className="pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <button
            onClick={fetchDashboardData}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'overview', label: 'Overview', icon: BarChart2 },
            { id: 'financial', label: 'Financial', icon: DollarSign },
            { id: 'vehicles', label: 'Vehicles', icon: Car },
            { id: 'clients', label: 'Clients', icon: Users },
            { id: 'advanced', label: 'Advanced', icon: TrendingUp },
            { id: 'export', label: 'Export', icon: Download },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`${activeTab === tab.id
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center`}
            >
              <tab.icon className="w-4 h-4 mr-2" />
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="space-y-6">
        {renderTabContent()}
      </div>

      {/* Last Updated */}
      {data && (
        <div className="mt-6 text-center text-sm text-gray-500">
          Last updated: {new Date(data.lastUpdated).toLocaleString()}
        </div>
      )}
    </div>
  );
}
