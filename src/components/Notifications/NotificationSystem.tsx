import { useState, useEffect, createContext, useContext } from 'react';
import { 
  AlertTriangle, CheckCircle, Info, X, Bell, 
  Car, Users, DollarSign, Calendar, Settings
} from 'lucide-react';

interface Alert {
  id: string;
  type: 'success' | 'warning' | 'error' | 'info';
  title: string;
  message: string;
  timestamp: Date;
  category: 'booking' | 'vehicle' | 'financial' | 'system' | 'client';
  action?: {
    label: string;
    onClick: () => void;
  };
  isRead: boolean;
  autoClose?: boolean;
}

interface NotificationContextType {
  alerts: Alert[];
  addAlert: (alert: Omit<Alert, 'id' | 'timestamp' | 'isRead'>) => void;
  removeAlert: (id: string) => void;
  markAsRead: (id: string) => void;
  clearAll: () => void;
  unreadCount: number;
}

const NotificationContext = createContext<NotificationContextType | null>(null);

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within NotificationProvider');
  }
  return context;
};

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [alerts, setAlerts] = useState<Alert[]>([]);

  const addAlert = (alert: Omit<Alert, 'id' | 'timestamp' | 'isRead'>) => {
    const newAlert: Alert = {
      ...alert,
      id: Date.now().toString(),
      timestamp: new Date(),
      isRead: false,
      autoClose: alert.type === 'success' || alert.type === 'info'
    };

    setAlerts(prev => [newAlert, ...prev]);

    // Auto-close success and info messages after 5 seconds
    if (newAlert.autoClose) {
      setTimeout(() => {
        removeAlert(newAlert.id);
      }, 5000);
    }
  };

  const removeAlert = (id: string) => {
    setAlerts(prev => prev.filter(alert => alert.id !== id));
  };

  const markAsRead = (id: string) => {
    setAlerts(prev => prev.map(alert => 
      alert.id === id ? { ...alert, isRead: true } : alert
    ));
  };

  const clearAll = () => {
    setAlerts([]);
  };

  const unreadCount = alerts.filter(alert => !alert.isRead).length;

  return (
    <NotificationContext.Provider value={{
      alerts,
      addAlert,
      removeAlert,
      markAsRead,
      clearAll,
      unreadCount
    }}>
      {children}
    </NotificationContext.Provider>
  );
};

// Alert Component
export const AlertItem: React.FC<{ alert: Alert; onRemove: (id: string) => void; onMarkRead: (id: string) => void }> = ({ 
  alert, 
  onRemove, 
  onMarkRead 
}) => {
  const getIcon = () => {
    switch (alert.type) {
      case 'success': return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'warning': return <AlertTriangle className="w-5 h-5 text-yellow-600" />;
      case 'error': return <AlertTriangle className="w-5 h-5 text-red-600" />;
      case 'info': return <Info className="w-5 h-5 text-blue-600" />;
      default: return <Info className="w-5 h-5 text-gray-600" />;
    }
  };

  const getCategoryIcon = () => {
    switch (alert.category) {
      case 'booking': return <Calendar className="w-4 h-4" />;
      case 'vehicle': return <Car className="w-4 h-4" />;
      case 'financial': return <DollarSign className="w-4 h-4" />;
      case 'client': return <Users className="w-4 h-4" />;
      case 'system': return <Settings className="w-4 h-4" />;
      default: return <Info className="w-4 h-4" />;
    }
  };

  const getBackgroundColor = () => {
    switch (alert.type) {
      case 'success': return 'bg-green-50 border-green-200';
      case 'warning': return 'bg-yellow-50 border-yellow-200';
      case 'error': return 'bg-red-50 border-red-200';
      case 'info': return 'bg-blue-50 border-blue-200';
      default: return 'bg-gray-50 border-gray-200';
    }
  };

  return (
    <div className={`${getBackgroundColor()} border rounded-lg p-4 mb-3 transition-all duration-300 ${
      alert.isRead ? 'opacity-60' : ''
    }`}>
      <div className="flex items-start">
        <div className="flex-shrink-0 mr-3">
          {getIcon()}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center space-x-2">
              <h4 className="text-sm font-semibold text-gray-900">{alert.title}</h4>
              <div className="flex items-center text-xs text-gray-500">
                {getCategoryIcon()}
                <span className="ml-1 capitalize">{alert.category}</span>
              </div>
            </div>
            <div className="flex items-center space-x-1">
              {!alert.isRead && (
                <button
                  onClick={() => onMarkRead(alert.id)}
                  className="text-gray-400 hover:text-gray-600 p-1"
                  title="Mark as read"
                >
                  <CheckCircle className="w-4 h-4" />
                </button>
              )}
              <button
                onClick={() => onRemove(alert.id)}
                className="text-gray-400 hover:text-gray-600 p-1"
                title="Dismiss"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
          <p className="text-sm text-gray-700 mb-2">{alert.message}</p>
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-500">
              {alert.timestamp.toLocaleTimeString()}
            </span>
            {alert.action && (
              <button
                onClick={alert.action.onClick}
                className="text-xs font-medium text-blue-600 hover:text-blue-800"
              >
                {alert.action.label}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// NotificationCenter Component
export const NotificationCenter: React.FC = () => {
  const { alerts, removeAlert, markAsRead, clearAll, unreadCount } = useNotifications();
  const [isOpen, setIsOpen] = useState(false);

  const handleMarkAllAsRead = () => {
    alerts.forEach(alert => markAsRead(alert.id));
  };

  return (
    <div className="relative">
      {/* Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-600 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-lg"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-10" 
            onClick={() => setIsOpen(false)}
          ></div>
          <div className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-xl border border-gray-200 z-20 max-h-96 overflow-hidden">
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-gray-900">Notifications</h3>
                <div className="flex items-center space-x-2">
                  {unreadCount > 0 && (
                    <button
                      onClick={handleMarkAllAsRead}
                      className="text-sm text-blue-600 hover:text-blue-800"
                    >
                      Mark all read
                    </button>
                  )}
                  <button
                    onClick={clearAll}
                    className="text-sm text-gray-600 hover:text-gray-800"
                  >
                    Clear all
                  </button>
                </div>
              </div>
              {unreadCount > 0 && (
                <p className="text-sm text-gray-500 mt-1">
                  {unreadCount} unread notification{unreadCount > 1 ? 's' : ''}
                </p>
              )}
            </div>

            <div className="overflow-y-auto max-h-80">
              {alerts.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  <Bell className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                  <p>No notifications</p>
                </div>
              ) : (
                <div className="p-4">
                  {alerts.map(alert => (
                    <AlertItem
                      key={alert.id}
                      alert={alert}
                      onRemove={removeAlert}
                      onMarkRead={markAsRead}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

// Alert Rules Engine
export class AlertRulesEngine {
  static checkBookingAlerts(bookingData: any): Omit<Alert, 'id' | 'timestamp' | 'isRead'>[] {
    const alerts: Omit<Alert, 'id' | 'timestamp' | 'isRead'>[] = [];

    // High-value booking alert
    if (bookingData.totalAmount > 10000) {
      alerts.push({
        type: 'info',
        title: 'High-Value Booking',
        message: `New booking worth KSH ${bookingData.totalAmount.toLocaleString()} received`,
        category: 'booking',
        action: {
          label: 'View Booking',
          onClick: () => console.log('Navigate to booking', bookingData.id)
        }
      });
    }

    // Same-day booking alert
    if (bookingData.isSameDay) {
      alerts.push({
        type: 'warning',
        title: 'Same-Day Booking',
        message: 'Urgent booking requires immediate vehicle preparation',
        category: 'booking'
      });
    }

    return alerts;
  }

  static checkVehicleAlerts(vehicleData: any): Omit<Alert, 'id' | 'timestamp' | 'isRead'>[] {
    const alerts: Omit<Alert, 'id' | 'timestamp' | 'isRead'>[] = [];

    // Low utilization alert
    if (vehicleData.utilizationRate < 50) {
      alerts.push({
        type: 'warning',
        title: 'Low Vehicle Utilization',
        message: `${vehicleData.make} ${vehicleData.model} has only ${vehicleData.utilizationRate}% utilization`,
        category: 'vehicle',
        action: {
          label: 'View Details',
          onClick: () => console.log('Navigate to vehicle', vehicleData.id)
        }
      });
    }

    // Maintenance due alert
    if (vehicleData.maintenanceDue) {
      alerts.push({
        type: 'error',
        title: 'Maintenance Required',
        message: `${vehicleData.make} ${vehicleData.model} is due for maintenance`,
        category: 'vehicle',
        action: {
          label: 'Schedule Maintenance',
          onClick: () => console.log('Schedule maintenance for', vehicleData.id)
        }
      });
    }

    return alerts;
  }

  static checkFinancialAlerts(financialData: any): Omit<Alert, 'id' | 'timestamp' | 'isRead'>[] {
    const alerts: Omit<Alert, 'id' | 'timestamp' | 'isRead'>[] = [];

    // Revenue drop alert
    if (financialData.revenueChange < -10) {
      alerts.push({
        type: 'error',
        title: 'Revenue Drop Alert',
        message: `Revenue decreased by ${Math.abs(financialData.revenueChange)}% this period`,
        category: 'financial',
        action: {
          label: 'View Analytics',
          onClick: () => console.log('Navigate to analytics')
        }
      });
    }

    // Profit margin alert
    if (financialData.profitMargin < 20) {
      alerts.push({
        type: 'warning',
        title: 'Low Profit Margin',
        message: `Profit margin is only ${financialData.profitMargin}%`,
        category: 'financial'
      });
    }

    return alerts;
  }

  static checkSystemAlerts(systemData: any): Omit<Alert, 'id' | 'timestamp' | 'isRead'>[] {
    const alerts: Omit<Alert, 'id' | 'timestamp' | 'isRead'>[] = [];

    // Database backup alert
    if (systemData.backupNeeded) {
      alerts.push({
        type: 'warning',
        title: 'Backup Required',
        message: 'System backup is recommended',
        category: 'system',
        action: {
          label: 'Initiate Backup',
          onClick: () => console.log('Start backup process')
        }
      });
    }

    // Storage alert
    if (systemData.storageUsage > 80) {
      alerts.push({
        type: 'error',
        title: 'Storage Warning',
        message: `Storage usage is at ${systemData.storageUsage}%`,
        category: 'system'
      });
    }

    return alerts;
  }
};
