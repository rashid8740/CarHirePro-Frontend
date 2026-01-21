import { useState, useEffect } from 'react';
import { 
  Plus, Calendar, Car, DollarSign, Bell, 
  X, Check, Clock, AlertCircle, FileText, Send,
  Users, Mail, Download, RefreshCw, Eye
} from 'lucide-react';
import { quickActionsService } from '../../services/quickActionsService';
import { useAuth } from '../../contexts/AuthContext';
import { hasPermission } from '../../lib/permissions';

interface QuickAction {
  id: string;
  title: string;
  description: string;
  icon: any;
  color: string;
  permission: string;
  action: () => void;
  badge?: number;
}

interface Stats {
  todayBookings: number;
  activeBookings: number;
  availableVehicles: number;
  pendingPayments: number;
  lastUpdated: string;
}

interface QuickActionsProps {
  className?: string;
}

export default function QuickActions({ className = '' }: QuickActionsProps) {
  const { user } = useAuth();
  const userRole = user?.role || 'staff';
  
  const [stats, setStats] = useState<Stats>({
    todayBookings: 0,
    activeBookings: 0,
    availableVehicles: 0,
    pendingPayments: 0,
    lastUpdated: ''
  });
  const [loading, setLoading] = useState(false);
  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [modalData, setModalData] = useState<any>(null);
  const [todayBookings, setTodayBookings] = useState<any[]>([]);
  const [availableVehicles, setAvailableVehicles] = useState<any[]>([]);

  // Form states
  const [bookingForm, setBookingForm] = useState({
    client_id: '',
    vehicle_id: '',
    start_date: '',
    end_date: '',
    daily_rate: 0
  });

  const [returnForm, setReturnForm] = useState({
    mileage: '',
    notes: '',
    damageReport: ''
  });

  const [reminderForm, setReminderForm] = useState({
    message: ''
  });

  // Quick actions configuration
  const quickActions: QuickAction[] = [
    {
      id: 'add-booking',
      title: 'Add Booking',
      description: 'Create a new booking instantly',
      icon: Plus,
      color: 'bg-blue-500',
      permission: 'bookings.create',
      action: () => {
        console.log('Add Booking clicked');
        openModal('add-booking');
      }
    },
    {
      id: 'today-bookings',
      title: 'Today\'s Bookings',
      description: 'View all bookings for today',
      icon: Calendar,
      color: 'bg-green-500',
      permission: 'bookings.view',
      action: () => {
        console.log('Today\'s Bookings clicked');
        openModal('today-bookings');
      },
      badge: stats.todayBookings
    },
    {
      id: 'available-cars',
      title: 'Available Cars',
      description: 'Check real-time vehicle availability',
      icon: Car,
      color: 'bg-purple-500',
      permission: 'vehicles.view',
      action: () => {
        console.log('Available Cars clicked');
        openModal('available-cars');
      },
      badge: stats.availableVehicles
    },
    {
      id: 'generate-invoice',
      title: 'Generate Invoice',
      description: 'Create invoice for any booking',
      icon: FileText,
      color: 'bg-yellow-500',
      permission: 'bookings.view',
      action: () => {
        console.log('Generate Invoice clicked');
        openModal('generate-invoice');
      }
    },
    {
      id: 'send-reminder',
      title: 'Send Reminder',
      description: 'Send payment reminders to clients',
      icon: Bell,
      color: 'bg-red-500',
      permission: 'bookings.view',
      action: () => {
        console.log('Send Reminder clicked');
        openModal('send-reminder');
      }
    },
    {
      id: 'mark-returned',
      title: 'Mark Returned',
      description: 'Process vehicle returns',
      icon: Check,
      color: 'bg-indigo-500',
      permission: 'bookings.update',
      action: () => {
        console.log('Mark Returned clicked');
        openModal('mark-returned');
      }
    }
  ];

  // Filter actions based on permissions
  const availableActions = quickActions.filter(action => {
    const [module, actionName] = action.permission.split('.');
    const hasPermissionResult = hasPermission(userRole, module, actionName);
    return hasPermissionResult;
  });

  // Load initial data
  useEffect(() => {
    loadQuickActionsStats();
    loadTodayBookings();
  }, []);

  const loadQuickActionsStats = async () => {
    try {
      setLoading(true);
      const response = await quickActionsService.getQuickActionsStats();
      if (response.success) {
        setStats(response.data);
      }
    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadTodayBookings = async () => {
    try {
      const response = await quickActionsService.getTodayBookings();
      if (response.success) {
        setTodayBookings(response.data);
      }
    } catch (error) {
      console.error('Error loading today\'s bookings:', error);
    }
  };

  const loadAvailableVehicles = async (startDate?: string, endDate?: string) => {
    try {
      const start = startDate || new Date().toISOString().split('T')[0];
      const end = endDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      
      const response = await quickActionsService.getAvailableVehicles(start, end);
      if (response.success) {
        setAvailableVehicles(response.data);
      }
    } catch (error) {
      console.error('Error loading available vehicles:', error);
    }
  };

  const openModal = (modalType: string, data?: any) => {
    setActiveModal(modalType);
    setModalData(data);
    
    if (modalType === 'available-cars') {
      loadAvailableVehicles();
    }
  };

  const closeModal = () => {
    setActiveModal(null);
    setModalData(null);
    // Reset forms
    setBookingForm({
      client_id: '',
      vehicle_id: '',
      start_date: '',
      end_date: '',
      daily_rate: 0
    });
    setReturnForm({
      mileage: '',
      notes: '',
      damageReport: ''
    });
    setReminderForm({
      message: ''
    });
  };

  const handleAddBooking = async () => {
    try {
      const validation = quickActionsService.validateBookingDates(
        bookingForm.start_date,
        bookingForm.end_date
      );
      
      if (!validation.valid) {
        alert(validation.error);
        return;
      }

      setLoading(true);
      const response = await quickActionsService.addBooking(bookingForm);
      
      if (response.success) {
        alert('Booking created successfully!');
        closeModal();
        loadQuickActionsStats();
        loadTodayBookings();
      } else {
        alert(response.error || 'Failed to create booking');
      }
    } catch (error) {
      alert('Error creating booking. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleMarkReturned = async () => {
    if (!modalData) return;

    try {
      setLoading(true);
      const response = await quickActionsService.markVehicleAsReturned(
        modalData.bookingId,
        returnForm
      );
      
      if (response.success) {
        alert('Vehicle marked as returned successfully!');
        closeModal();
        loadQuickActionsStats();
        loadTodayBookings();
      } else {
        alert(response.error || 'Failed to process return');
      }
    } catch (error) {
      alert('Error processing return. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateInvoice = async () => {
    if (!modalData) return;

    try {
      setLoading(true);
      const response = await quickActionsService.generateInvoice(modalData.bookingId);
      
      if (response.success) {
        quickActionsService.downloadInvoice(response.data);
        closeModal();
      } else {
        alert(response.error || 'Failed to generate invoice');
      }
    } catch (error) {
      alert('Error generating invoice. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSendReminder = async () => {
    if (!modalData) return;

    try {
      setLoading(true);
      const response = await quickActionsService.sendPaymentReminder(
        modalData.bookingId,
        reminderForm.message
      );
      
      if (response.success) {
        alert('Payment reminder sent successfully!');
        closeModal();
      } else {
        alert(response.error || 'Failed to send reminder');
      }
    } catch (error) {
      alert('Error sending reminder. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={className}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Quick Actions</h2>
          <p className="text-sm text-gray-600">
            Perform real-time business operations instantly
          </p>
        </div>
        
        <button
          onClick={loadQuickActionsStats}
          className="flex items-center px-3 py-1.5 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          <RefreshCw className={`w-3 h-3 mr-1 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-500">Today's Bookings</p>
              <p className="text-lg font-bold text-gray-900">{stats.todayBookings}</p>
            </div>
            <div className="p-2 bg-blue-100 rounded-full">
              <Calendar className="w-4 h-4 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-500">Active Bookings</p>
              <p className="text-lg font-bold text-gray-900">{stats.activeBookings}</p>
            </div>
            <div className="p-2 bg-green-100 rounded-full">
              <Clock className="w-4 h-4 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-500">Available Vehicles</p>
              <p className="text-lg font-bold text-gray-900">{stats.availableVehicles}</p>
            </div>
            <div className="p-2 bg-purple-100 rounded-full">
              <Car className="w-4 h-4 text-purple-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-500">Pending Payments</p>
              <p className="text-lg font-bold text-gray-900">{stats.pendingPayments}</p>
            </div>
            <div className="p-2 bg-yellow-100 rounded-full">
              <DollarSign className="w-4 h-4 text-yellow-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        {availableActions.slice(0, 6).map((action) => {
          const Icon = action.icon;
          return (
            <button
              key={action.id}
              onClick={(e) => {
                e.preventDefault();
                console.log('Button clicked:', action.id);
                action.action();
              }}
              className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-all duration-200 text-left group cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              type="button"
            >
              <div className="flex items-center justify-between mb-3">
                <div className={`p-2 rounded-full ${action.color} text-white`}>
                  <Icon className="w-4 h-4" />
                </div>
                {action.badge && action.badge > 0 && (
                  <span className="bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full">
                    {action.badge}
                  </span>
                )}
              </div>
              <h3 className="font-medium text-gray-900 mb-1 text-sm">{action.title}</h3>
              <p className="text-xs text-gray-600 line-clamp-2">{action.description}</p>
            </button>
          );
        })}
      </div>

      {/* Modals */}
      {activeModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-auto m-4">
            {/* Add Booking Modal */}
            {activeModal === 'add-booking' && (
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-gray-900">Add New Booking</h2>
                  <button
                    onClick={closeModal}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Client ID
                    </label>
                    <input
                      type="text"
                      value={bookingForm.client_id}
                      onChange={(e) => setBookingForm(prev => ({ ...prev, client_id: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter client ID"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Vehicle ID
                    </label>
                    <input
                      type="text"
                      value={bookingForm.vehicle_id}
                      onChange={(e) => setBookingForm(prev => ({ ...prev, vehicle_id: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter vehicle ID"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Start Date
                    </label>
                    <input
                      type="datetime-local"
                      value={bookingForm.start_date}
                      onChange={(e) => setBookingForm(prev => ({ ...prev, start_date: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      End Date
                    </label>
                    <input
                      type="datetime-local"
                      value={bookingForm.end_date}
                      onChange={(e) => setBookingForm(prev => ({ ...prev, end_date: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Daily Rate (KSH)
                    </label>
                    <input
                      type="number"
                      value={bookingForm.daily_rate}
                      onChange={(e) => setBookingForm(prev => ({ ...prev, daily_rate: parseFloat(e.target.value) || 0 }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter daily rate"
                    />
                  </div>
                </div>

                <div className="flex justify-end space-x-3 mt-6">
                  <button
                    onClick={closeModal}
                    className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleAddBooking}
                    disabled={loading}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors"
                  >
                    {loading ? 'Creating...' : 'Create Booking'}
                  </button>
                </div>
              </div>
            )}

            {/* Today's Bookings Modal */}
            {activeModal === 'today-bookings' && (
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-gray-900">Today's Bookings</h2>
                  <button
                    onClick={closeModal}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead>
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Client</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Vehicle</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Time</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {todayBookings.map((booking) => (
                        <tr key={booking.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">{booking.client?.name}</div>
                            <div className="text-xs text-gray-500">{booking.client?.email}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {booking.vehicle?.make} {booking.vehicle?.model}
                            </div>
                            <div className="text-xs text-gray-500">{booking.vehicle?.licensePlate}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {quickActionsService.formatDate(booking.start_date)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {quickActionsService.formatCurrency(booking.total_amount)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 py-1 text-xs rounded-full ${
                              booking.status === 'active' ? 'bg-green-100 text-green-800' :
                              booking.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                              booking.status === 'completed' ? 'bg-blue-100 text-blue-800' :
                              'bg-red-100 text-red-800'
                            }`}>
                              {booking.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex space-x-2">
                              {booking.status === 'active' && (
                                <button
                                  onClick={() => openModal('mark-returned', { bookingId: booking.id })}
                                  className="text-indigo-600 hover:text-indigo-900"
                                  title="Mark as returned"
                                >
                                  <Check className="w-4 h-4" />
                                </button>
                              )}
                              <button
                                onClick={() => openModal('generate-invoice', { bookingId: booking.id })}
                                className="text-blue-600 hover:text-blue-900"
                                title="Generate invoice"
                              >
                                <FileText className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => openModal('send-reminder', { bookingId: booking.id })}
                                className="text-yellow-600 hover:text-yellow-900"
                                title="Send reminder"
                              >
                                <Send className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Available Vehicles Modal */}
            {activeModal === 'available-cars' && (
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-gray-900">Available Vehicles</h2>
                  <button
                    onClick={closeModal}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {availableVehicles.map((vehicle) => (
                    <div key={vehicle.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-semibold text-gray-900">
                          {vehicle.make} {vehicle.model}
                        </h3>
                        <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full">
                          Available
                        </span>
                      </div>
                      <div className="space-y-1 text-sm text-gray-600">
                        <div>Year: {vehicle.year}</div>
                        <div>License: {vehicle.licensePlate}</div>
                        <div>Daily Rate: {quickActionsService.formatCurrency(vehicle.dailyRate)}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Generate Invoice Modal */}
            {activeModal === 'generate-invoice' && (
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-gray-900">Generate Invoice</h2>
                  <button
                    onClick={closeModal}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>

                <div className="text-center py-8">
                  <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Generate Invoice for Booking #{modalData?.bookingId}
                  </h3>
                  <p className="text-gray-600 mb-6">
                    This will create a detailed invoice for the selected booking
                  </p>
                  
                  <div className="flex justify-center space-x-3">
                    <button
                      onClick={closeModal}
                      className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleGenerateInvoice}
                      disabled={loading}
                      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors"
                    >
                      {loading ? 'Generating...' : 'Generate & Download'}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Send Reminder Modal */}
            {activeModal === 'send-reminder' && (
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-gray-900">Send Payment Reminder</h2>
                  <button
                    onClick={closeModal}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Custom Message (Optional)
                    </label>
                    <textarea
                      value={reminderForm.message}
                      onChange={(e) => setReminderForm(prev => ({ ...prev, message: e.target.value }))}
                      rows={4}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter a custom message for the payment reminder"
                    />
                  </div>
                </div>

                <div className="flex justify-end space-x-3 mt-6">
                  <button
                    onClick={closeModal}
                    className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSendReminder}
                    disabled={loading}
                    className="px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 disabled:opacity-50 transition-colors"
                  >
                    {loading ? 'Sending...' : 'Send Reminder'}
                  </button>
                </div>
              </div>
            )}

            {/* Mark Returned Modal */}
            {activeModal === 'mark-returned' && (
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-gray-900">Mark Vehicle as Returned</h2>
                  <button
                    onClick={closeModal}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Return Mileage
                    </label>
                    <input
                      type="number"
                      value={returnForm.mileage}
                      onChange={(e) => setReturnForm(prev => ({ ...prev, mileage: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter current mileage"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Notes
                    </label>
                    <textarea
                      value={returnForm.notes}
                      onChange={(e) => setReturnForm(prev => ({ ...prev, notes: e.target.value }))}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Any notes about the return"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Damage Report
                    </label>
                    <textarea
                      value={returnForm.damageReport}
                      onChange={(e) => setReturnForm(prev => ({ ...prev, damageReport: e.target.value }))}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Report any damage (if any)"
                    />
                  </div>
                </div>

                <div className="flex justify-end space-x-3 mt-6">
                  <button
                    onClick={closeModal}
                    className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleMarkReturned}
                    disabled={loading}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 transition-colors"
                  >
                    {loading ? 'Processing...' : 'Mark as Returned'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
