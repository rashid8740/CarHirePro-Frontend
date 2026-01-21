import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { quickActionsService } from '../services/quickActionsService';

interface RealTimeData {
  stats: {
    todayBookings: number;
    activeBookings: number;
    availableVehicles: number;
    pendingPayments: number;
    lastUpdated: string;
  };
  todayBookings: any[];
  availableVehicles: any[];
  lastFetch: Date;
}

interface RealTimeContextType {
  data: RealTimeData;
  refreshData: () => void;
  updateStats: (newStats: any) => void;
  addBooking: (booking: any) => void;
  removeBooking: (bookingId: string) => void;
  updateVehicleStatus: (vehicleId: string, status: string) => void;
}

const RealTimeContext = createContext<RealTimeContextType | null>(null);

export const useRealTime = () => {
  const context = useContext(RealTimeContext);
  if (!context) {
    throw new Error('useRealTime must be used within RealTimeProvider');
  }
  return context;
};

interface RealTimeProviderProps {
  children: ReactNode;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

export const RealTimeProvider: React.FC<RealTimeProviderProps> = ({ 
  children, 
  autoRefresh = true, 
  refreshInterval = 30000 // 30 seconds
}) => {
  const [data, setData] = useState<RealTimeData>({
    stats: {
      todayBookings: 0,
      activeBookings: 0,
      availableVehicles: 0,
      pendingPayments: 0,
      lastUpdated: ''
    },
    todayBookings: [],
    availableVehicles: [],
    lastFetch: new Date()
  });

  // Fetch initial data
  const fetchInitialData = async () => {
    try {
      const [statsResponse, bookingsResponse] = await Promise.all([
        quickActionsService.getQuickActionsStats(),
        quickActionsService.getTodayBookings()
      ]);

      if (statsResponse.success) {
        setData(prev => ({
          ...prev,
          stats: statsResponse.data,
          lastFetch: new Date()
        }));
      }

      if (bookingsResponse.success) {
        setData(prev => ({
          ...prev,
          todayBookings: bookingsResponse.data,
          lastFetch: new Date()
        }));
      }
    } catch (error) {
      console.error('Error fetching initial data:', error);
    }
  };

  // Refresh all data
  const refreshData = async () => {
    await fetchInitialData();
  };

  // Update stats
  const updateStats = (newStats: any) => {
    setData(prev => ({
      ...prev,
      stats: { ...prev.stats, ...newStats, lastUpdated: new Date().toISOString() }
    }));
  };

  // Add new booking
  const addBooking = (booking: any) => {
    setData(prev => ({
      ...prev,
      todayBookings: [booking, ...prev.todayBookings],
      stats: {
        ...prev.stats,
        todayBookings: prev.stats.todayBookings + 1,
        lastUpdated: new Date().toISOString()
      }
    }));
  };

  // Remove booking
  const removeBooking = (bookingId: string) => {
    setData(prev => {
      const updatedBookings = prev.todayBookings.filter(b => b.id !== bookingId);
      const removedBooking = prev.todayBookings.find(b => b.id === bookingId);
      
      return {
        ...prev,
        todayBookings: updatedBookings,
        stats: {
          ...prev.stats,
          todayBookings: Math.max(0, prev.stats.todayBookings - 1),
          activeBookings: removedBooking?.status === 'active' 
            ? Math.max(0, prev.stats.activeBookings - 1)
            : prev.stats.activeBookings,
          lastUpdated: new Date().toISOString()
        }
      };
    });
  };

  // Update vehicle status
  const updateVehicleStatus = (vehicleId: string, status: string) => {
    setData(prev => {
      const updatedVehicles = prev.availableVehicles.map(v => 
        v.id === vehicleId ? { ...v, status } : v
      );
      
      const isCurrentlyAvailable = prev.availableVehicles.some(v => v.id === vehicleId);
      const willBeAvailable = status === 'Available';
      
      return {
        ...prev,
        availableVehicles: updatedVehicles,
        stats: {
          ...prev.stats,
          availableVehicles: isCurrentlyAvailable && !willBeAvailable
            ? prev.stats.availableVehicles - 1
            : !isCurrentlyAvailable && willBeAvailable
            ? prev.stats.availableVehicles + 1
            : prev.stats.availableVehicles,
          lastUpdated: new Date().toISOString()
        }
      };
    });
  };

  // Auto-refresh effect
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      fetchInitialData();
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval]);

  // Initial data fetch
  useEffect(() => {
    fetchInitialData();
  }, []);

  // WebSocket connection for real-time updates (optional implementation)
  useEffect(() => {
    // This would connect to your WebSocket server for real-time updates
    // For now, we'll use polling
    const connectWebSocket = () => {
      try {
        // Example WebSocket implementation
        // const ws = new WebSocket('ws://localhost:5000/ws');
        // ws.onmessage = (event) => {
        //   const update = JSON.parse(event.data);
        //   handleRealTimeUpdate(update);
        // };
      } catch (error) {
        console.log('WebSocket not available, using polling');
      }
    };

    connectWebSocket();
  }, []);

  // Handle real-time updates
  const handleRealTimeUpdate = (update: any) => {
    switch (update.type) {
      case 'booking_created':
        addBooking(update.data);
        break;
      case 'booking_updated':
        if (update.data.status === 'completed') {
          removeBooking(update.data.id);
        }
        break;
      case 'vehicle_status_changed':
        updateVehicleStatus(update.data.vehicleId, update.data.status);
        break;
      case 'stats_updated':
        updateStats(update.data);
        break;
      default:
        console.log('Unknown update type:', update.type);
    }
  };

  const value: RealTimeContextType = {
    data,
    refreshData,
    updateStats,
    addBooking,
    removeBooking,
    updateVehicleStatus
  };

  return (
    <RealTimeContext.Provider value={value}>
      {children}
    </RealTimeContext.Provider>
  );
};

// Hook for automatic data updates
export const useRealTimeUpdates = (updateHandler?: (data: RealTimeData) => void) => {
  const { data } = useRealTime();

  useEffect(() => {
    if (updateHandler) {
      updateHandler(data);
    }
  }, [data, updateHandler]);

  return data;
};

// Hook for stats with automatic refresh
export const useRealTimeStats = () => {
  const { data, refreshData } = useRealTime();

  return {
    stats: data.stats,
    refresh: refreshData,
    lastUpdated: data.stats.lastUpdated
  };
};

// Hook for today's bookings with real-time updates
export const useTodayBookings = () => {
  const { data, addBooking, removeBooking } = useRealTime();

  return {
    bookings: data.todayBookings,
    addBooking,
    removeBooking,
    lastFetch: data.lastFetch
  };
};

// Hook for available vehicles with real-time updates
export const useAvailableVehicles = () => {
  const { data, updateVehicleStatus } = useRealTime();

  return {
    vehicles: data.availableVehicles,
    updateVehicleStatus,
    lastFetch: data.lastFetch
  };
};
