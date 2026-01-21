import { useState, useEffect } from 'react';
import { 
  Activity, AlertTriangle, CheckCircle, TrendingUp, TrendingDown,
  Clock, Car, Users, DollarSign, Zap, Shield, Calendar, Info
} from 'lucide-react';
import { useNotifications } from './NotificationSystem';

interface MetricData {
  value: number;
  change: number;
  status: 'normal' | 'warning' | 'critical';
  threshold: {
    warning: number;
    critical: number;
  };
}

interface SystemMetrics {
  bookings: MetricData;
  revenue: MetricData;
  vehicles: MetricData;
  clients: MetricData;
  systemHealth: MetricData;
}

export default function RealTimeMonitoring() {
  const { addAlert } = useNotifications();
  const [metrics, setMetrics] = useState<SystemMetrics>({
    bookings: { value: 0, change: 0, status: 'normal', threshold: { warning: 80, critical: 95 } },
    revenue: { value: 0, change: 0, status: 'normal', threshold: { warning: -10, critical: -20 } },
    vehicles: { value: 0, change: 0, status: 'normal', threshold: { warning: 70, critical: 50 } },
    clients: { value: 0, change: 0, status: 'normal', threshold: { warning: -5, critical: -15 } },
    systemHealth: { value: 100, change: 0, status: 'normal', threshold: { warning: 90, critical: 75 } }
  });
  const [isMonitoring, setIsMonitoring] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(new Date());

  // Simulate real-time data updates
  useEffect(() => {
    if (!isMonitoring) return;

    const interval = setInterval(() => {
      updateMetrics();
      checkAlerts();
    }, 5000); // Update every 5 seconds

    return () => clearInterval(interval);
  }, [isMonitoring]);

  const updateMetrics = () => {
    // Simulate metric changes
    setMetrics(prev => ({
      bookings: {
        ...prev.bookings,
        value: Math.max(0, prev.bookings.value + Math.floor(Math.random() * 11) - 5),
        change: (Math.random() - 0.5) * 10
      },
      revenue: {
        ...prev.revenue,
        value: Math.max(0, prev.revenue.value + (Math.random() - 0.3) * 1000),
        change: (Math.random() - 0.5) * 15
      },
      vehicles: {
        ...prev.vehicles,
        value: Math.max(0, Math.min(100, prev.vehicles.value + (Math.random() - 0.5) * 5)),
        change: (Math.random() - 0.5) * 3
      },
      clients: {
        ...prev.clients,
        value: Math.max(0, prev.clients.value + Math.floor(Math.random() * 3) - 1),
        change: (Math.random() - 0.5) * 2
      },
      systemHealth: {
        ...prev.systemHealth,
        value: Math.max(0, Math.min(100, prev.systemHealth.value + (Math.random() - 0.5) * 2)),
        change: (Math.random() - 0.5) * 1
      }
    }));

    setLastUpdate(new Date());
  };

  const checkAlerts = () => {
    // Check each metric against thresholds and trigger alerts
    Object.entries(metrics).forEach(([key, metric]) => {
      if (metric.status === 'critical') {
        addAlert({
          type: 'error',
          title: `Critical: ${key.charAt(0).toUpperCase() + key.slice(1)} Alert`,
          message: `${key} has reached critical levels: ${metric.value}`,
          category: key === 'systemHealth' ? 'system' : 
                   key === 'revenue' ? 'financial' : 
                   key === 'vehicles' ? 'vehicle' : 
                   key === 'clients' ? 'client' : 'booking'
        });
      } else if (metric.status === 'warning') {
        addAlert({
          type: 'warning',
          title: `Warning: ${key.charAt(0).toUpperCase() + key.slice(1)} Alert`,
          message: `${key} is approaching warning threshold: ${metric.value}`,
          category: key === 'systemHealth' ? 'system' : 
                   key === 'revenue' ? 'financial' : 
                   key === 'vehicles' ? 'vehicle' : 
                   key === 'clients' ? 'client' : 'booking'
        });
      }
    });
  };

  // Update metric status based on thresholds
  useEffect(() => {
    setMetrics(prev => {
      const updated = { ...prev };
      
      Object.keys(updated).forEach(key => {
        const metric = updated[key as keyof SystemMetrics];
        
        if (key === 'revenue') {
          // Revenue thresholds are negative (drops)
          if (metric.change <= metric.threshold.critical) {
            metric.status = 'critical';
          } else if (metric.change <= metric.threshold.warning) {
            metric.status = 'warning';
          } else {
            metric.status = 'normal';
          }
        } else {
          // Other metrics are positive values
          if (metric.value <= metric.threshold.critical) {
            metric.status = 'critical';
          } else if (metric.value <= metric.threshold.warning) {
            metric.status = 'warning';
          } else {
            metric.status = 'normal';
          }
        }
      });
      
      return updated;
    });
  }, [metrics.bookings.value, metrics.revenue.change, metrics.vehicles.value, metrics.clients.value, metrics.systemHealth.value]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'normal': return 'text-green-600 bg-green-100';
      case 'warning': return 'text-yellow-600 bg-yellow-100';
      case 'critical': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'normal': return <CheckCircle className="w-4 h-4" />;
      case 'warning': return <AlertTriangle className="w-4 h-4" />;
      case 'critical': return <AlertTriangle className="w-4 h-4" />;
      default: return <Activity className="w-4 h-4" />;
    }
  };

  const getMetricIcon = (metricKey: string): React.ComponentType<any> => {
    switch (metricKey) {
      case 'bookings': return Calendar;
      case 'revenue': return DollarSign;
      case 'vehicles': return Car;
      case 'clients': return Users;
      case 'systemHealth': return Shield;
      default: return Activity;
    }
  };

  const formatMetricValue = (key: string, value: number) => {
    switch (key) {
      case 'revenue': return `KSH ${value.toLocaleString()}`;
      case 'vehicles':
      case 'systemHealth': return `${value.toFixed(1)}%`;
      default: return value.toString();
    }
  };

  return (
    <div className="space-y-6">
      {/* Monitoring Header */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <Activity className="w-6 h-6 text-blue-600" />
            <h2 className="text-xl font-bold text-gray-900">Real-Time Monitoring</h2>
            <div className="flex items-center space-x-2 text-sm">
              <div className={`w-2 h-2 rounded-full ${isMonitoring ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`}></div>
              <span className={isMonitoring ? 'text-green-600' : 'text-gray-500'}>
                {isMonitoring ? 'Live' : 'Paused'}
              </span>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="text-sm text-gray-500">
              Last update: {lastUpdate.toLocaleTimeString()}
            </div>
            <button
              onClick={() => setIsMonitoring(!isMonitoring)}
              className={`px-4 py-2 rounded-md transition-colors ${
                isMonitoring 
                  ? 'bg-red-600 text-white hover:bg-red-700' 
                  : 'bg-green-600 text-white hover:bg-green-700'
              }`}
            >
              {isMonitoring ? 'Pause Monitoring' : 'Resume Monitoring'}
            </button>
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {Object.entries(metrics).map(([key, metric]) => {
            const MetricIcon = getMetricIcon(key);
            const StatusIconElement = getStatusIcon(metric.status);
            
            return (
              <div key={key} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <MetricIcon className="w-5 h-5 text-gray-600" />
                  <div className={`p-1 rounded-full ${getStatusColor(metric.status)}`}>
                    {StatusIconElement}
                  </div>
                </div>
                
                <div className="mb-2">
                  <div className="text-2xl font-bold text-gray-900">
                    {formatMetricValue(key, metric.value)}
                  </div>
                  <div className="text-sm text-gray-500 capitalize">
                    {key.replace(/([A-Z])/g, ' $1').trim()}
                  </div>
                </div>
                
                <div className="flex items-center text-sm">
                  {metric.change >= 0 ? (
                    <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
                  ) : (
                    <TrendingDown className="w-4 h-4 text-red-500 mr-1" />
                  )}
                  <span className={metric.change >= 0 ? 'text-green-600' : 'text-red-600'}>
                    {Math.abs(metric.change).toFixed(1)}%
                  </span>
                </div>
                
                <div className="mt-2 pt-2 border-t border-gray-100">
                  <div className="text-xs text-gray-500">
                    Thresholds: W: {metric.threshold.warning}, C: {metric.threshold.critical}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* System Status */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">System Health</h3>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Zap className="w-4 h-4 text-yellow-500" />
                <span className="text-sm font-medium">Server Response Time</span>
              </div>
              <span className="text-sm text-gray-600">142ms</span>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Activity className="w-4 h-4 text-blue-500" />
                <span className="text-sm font-medium">Database Connections</span>
              </div>
              <span className="text-sm text-gray-600">12/20</span>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Shield className="w-4 h-4 text-green-500" />
                <span className="text-sm font-medium">Security Status</span>
              </div>
              <span className="text-sm text-green-600">Secure</span>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Clock className="w-4 h-4 text-purple-500" />
                <span className="text-sm font-medium">Uptime</span>
              </div>
              <span className="text-sm text-gray-600">99.8%</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Alerts</h3>
          
          <div className="space-y-3">
            <div className="flex items-start space-x-3 p-3 bg-yellow-50 rounded-lg">
              <AlertTriangle className="w-4 h-4 text-yellow-600 mt-0.5" />
              <div className="flex-1">
                <div className="text-sm font-medium text-yellow-900">Vehicle Utilization Low</div>
                <div className="text-xs text-yellow-700">Toyota Camry at 45% utilization</div>
                <div className="text-xs text-gray-500 mt-1">2 minutes ago</div>
              </div>
            </div>
            
            <div className="flex items-start space-x-3 p-3 bg-green-50 rounded-lg">
              <CheckCircle className="w-4 h-4 text-green-600 mt-0.5" />
              <div className="flex-1">
                <div className="text-sm font-medium text-green-900">High-Value Booking</div>
                <div className="text-xs text-green-700">New booking worth KSH 15,000</div>
                <div className="text-xs text-gray-500 mt-1">5 minutes ago</div>
              </div>
            </div>
            
            <div className="flex items-start space-x-3 p-3 bg-blue-50 rounded-lg">
              <Info className="w-4 h-4 text-blue-600 mt-0.5" />
              <div className="flex-1">
                <div className="text-sm font-medium text-blue-900">System Update Available</div>
                <div className="text-xs text-blue-700">Version 2.1.0 ready to install</div>
                <div className="text-xs text-gray-500 mt-1">1 hour ago</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Performance Trends */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance Trends</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="text-3xl font-bold text-green-600">98.5%</div>
            <div className="text-sm text-gray-600">System Availability</div>
            <div className="text-xs text-green-600 mt-1">↑ 0.3% from last week</div>
          </div>
          
          <div className="text-center">
            <div className="text-3xl font-bold text-blue-600">1.2s</div>
            <div className="text-sm text-gray-600">Average Response Time</div>
            <div className="text-xs text-green-600 mt-1">↓ 200ms from last week</div>
          </div>
          
          <div className="text-center">
            <div className="text-3xl font-bold text-purple-600">24/7</div>
            <div className="text-sm text-gray-600">Monitoring Uptime</div>
            <div className="text-xs text-green-600 mt-1">No interruptions</div>
          </div>
        </div>
      </div>
    </div>
  );
}
