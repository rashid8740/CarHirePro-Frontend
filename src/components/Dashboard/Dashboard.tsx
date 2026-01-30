import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { api } from '../../lib/api';
import DashboardStats, { StatItem } from './DashboardStats';
import RecentActivity from './RecentActivity';
import QuickActions from './QuickActions';

type VehicleStatus = 'Available' | 'Booked' | 'Maintenance';

interface Vehicle {
  _id: string;
  make: string;
  model: string;
  licensePlate: string;
  status?: VehicleStatus;
  createdAt?: string;
  dailyRate?: number;
}

interface Client {
  _id: string;
  fullName: string;
  createdAt?: string;
}

interface Booking {
  _id: string;
  status: 'Active' | 'Completed' | 'Cancelled';
  startDate: string;
  endDate: string;
  createdAt?: string;
  client?: {
    _id: string;
    fullName: string;
  };
  vehicle?: {
    _id: string;
    make: string;
    model: string;
    licensePlate: string;
    dailyRate?: number;
  };
}

export default function Dashboard() {
  const { user } = useAuth();

  const [clients, setClients] = React.useState<Client[]>([]);
  const [vehicles, setVehicles] = React.useState<Vehicle[]>([]);
  const [bookings, setBookings] = React.useState<Booking[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState('');

  React.useEffect(() => {
    let cancelled = false;

    const fetchDashboardData = async () => {
      setLoading(true);
      setError('');
      try {
        const [clientsRes, vehiclesRes, bookingsRes] = await Promise.all([
          api.get('/clients'),
          api.get('/vehicles'),
          api.get('/bookings'),
        ]);

        if (cancelled) return;

        setClients(clientsRes.data?.data || []);
        setVehicles(vehiclesRes.data?.data || []);
        setBookings(bookingsRes.data?.data || []);
      } catch (err: any) {
        if (cancelled) return;
        setError(err?.response?.data?.message || 'Failed to load dashboard data');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchDashboardData();
    return () => {
      cancelled = true;
    };
  }, []);

  const daysBetween = (start: string, end: string) => {
    const s = new Date(start);
    const e = new Date(end);
    const ms = e.getTime() - s.getTime();
    if (!Number.isFinite(ms) || ms <= 0) return 0;
    return Math.ceil(ms / (1000 * 60 * 60 * 24));
  };

  const isCurrentMonth = (dateStr?: string) => {
    if (!dateStr) return false;
    const d = new Date(dateStr);
    if (Number.isNaN(d.getTime())) return false;
    const now = new Date();
    return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
  };

  const totalClients = clients.length;
  const totalVehicles = vehicles.length;
  const availableVehicles = vehicles.filter(v => (v.status || 'Available') === 'Available').length;
  const bookedVehicles = vehicles.filter(v => v.status === 'Booked').length;
  const maintenanceVehicles = vehicles.filter(v => v.status === 'Maintenance').length;
  const activeBookings = bookings.filter(b => b.status === 'Active').length;

  const monthlyRevenueEstimate = bookings
    .filter(b => isCurrentMonth(b.createdAt || b.startDate))
    .filter(b => b.status !== 'Cancelled')
    .reduce((sum, b) => {
      const rate = b.vehicle?.dailyRate || 0;
      const days = daysBetween(b.startDate, b.endDate);
      return sum + rate * days;
    }, 0);

  const stats: StatItem[] = [
    {
      title: 'Total Clients',
      value: totalClients.toString(),
      subtitle: 'Registered clients',
      trend: '',
      color: 'blue'
    },
    {
      title: 'Fleet Status',
      value: totalVehicles.toString(),
      subtitle: `${availableVehicles} available, ${bookedVehicles} booked, ${maintenanceVehicles} maintenance`,
      trend: '',
      color: 'green'
    },
    {
      title: 'Active Bookings',
      value: activeBookings.toString(),
      subtitle: 'Current rentals',
      trend: '',
      color: 'purple'
    },
    {
      title: 'Monthly Revenue',
      value: `KSH ${monthlyRevenueEstimate.toLocaleString('en-KE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      subtitle: 'Estimated from bookings',
      trend: '',
      color: 'amber'
    }
  ];

  return (
    <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
            Welcome back, {user?.name || user?.email}
          </h1>
          <p className="text-sm sm:text-base text-gray-600 mt-1">
            Here's what's happening with your car hire business today.
          </p>
        </div>
        <div className="text-left sm:text-right">
          <p className="text-xs sm:text-sm text-gray-500">Today</p>
          <p className="text-sm sm:text-lg font-semibold text-gray-900">
            {new Date().toLocaleDateString('en-US', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </p>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-3 sm:p-4 text-xs sm:text-sm text-red-700">
          {error}
        </div>
      )}

      <DashboardStats stats={stats} loading={loading} />
      
      <QuickActions className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6" />
      
      <RecentActivity bookings={bookings} clients={clients} vehicles={vehicles} loading={loading} />
    </div>
  );
}