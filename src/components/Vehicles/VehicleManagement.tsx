import React, { useState, useEffect } from 'react';
import { Plus, Search, Car, Edit, Trash2, X, AlertCircle, Clock, RefreshCw } from 'lucide-react';
import { api } from '../../lib/api';
import { useAuth } from '../../contexts/AuthContext';
import { hasPermission } from '../../lib/permissions';
import PermissionGuard from '../Layout/PermissionGuard';

interface Vehicle {
  _id: string;
  make: string;
  model: string;
  year: number;
  color?: string;
  licensePlate: string;
  dailyRate: number;
  dateOut?: string;
  timeOut?: string;
  dateIn?: string;
  timeIn?: string;
  createdAt: string;
  status?: 'Available' | 'Booked' | 'Maintenance';
}

const VEHICLE_STATUSES = ['Available', 'Booked', 'Maintenance'] as const;
type VehicleStatus = typeof VEHICLE_STATUSES[number];

export default function VehicleManagement() {
  const { user } = useAuth();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);

  // New: State for tracking which vehicle is updating status, and the new status being applied
  const [statusLoadingId, setStatusLoadingId] = useState<string | null>(null);

  // Fetch vehicles from backend
  const fetchVehicles = async () => {
    try {
      setLoading(true);
      const response = await api.get('/vehicles');
      if (response.data.success) {
        setVehicles(response.data.data);
      } else {
        setError('Failed to fetch vehicles');
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to fetch vehicles');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (value?: string) => {
    if (!value) return 'N/A';
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return 'N/A';
    return d.toLocaleDateString();
  };

  const formatTime = (value?: string) => {
    if (!value) return 'N/A';
    return value;
  };

  useEffect(() => {
    fetchVehicles();
  }, []);

  const filteredVehicles = vehicles.filter(vehicle => {
    const matchesSearch =
      vehicle.make.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vehicle.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vehicle.licensePlate.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  const handleDeleteClick = (vehicle: Vehicle) => {
    setSelectedVehicle(vehicle);
    setShowDeleteConfirm(true);
  };

  const handleDeleteVehicle = async () => {
    if (!selectedVehicle) return;

    try {
      await api.delete(`/vehicles/${selectedVehicle._id}`);
      setVehicles(prev => prev.filter(vehicle => vehicle._id !== selectedVehicle._id));
      setShowDeleteConfirm(false);
      setShowDetailsModal(false);
      setSelectedVehicle(null);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to delete vehicle');
    }
  };

  const handleVehicleAdded = () => {
    fetchVehicles(); // Refresh the list
  };

  const handleEditClick = (vehicle: Vehicle) => {
    setSelectedVehicle(vehicle);
    setShowEditModal(true);
  };

  const handleVehicleEdited = () => {
    setShowEditModal(false);
    setSelectedVehicle(null);
    fetchVehicles();
  };

  // NEW: Function to update a vehicle's status
  const handleChangeVehicleStatus = async (vehicle: Vehicle, newStatus: VehicleStatus) => {
    setStatusLoadingId(vehicle._id);
    try {
      const response = await api.patch(`/vehicles/${vehicle._id}/status`, { status: newStatus });
      if (response.data.success) {
        setVehicles(prev =>
          prev.map(v =>
            v._id === vehicle._id
              ? { ...v, status: newStatus }
              : v
          )
        );
      } else {
        setError(response.data?.message || 'Failed to update vehicle status');
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to update vehicle status.');
    } finally {
      setStatusLoadingId(null);
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading vehicles...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Friendly success/error/toast notifications could be added here */}

      {showAddModal && (
        <AddVehicleForm
          onClose={() => setShowAddModal(false)}
          onVehicleAdded={handleVehicleAdded}
        />
      )}

      {showEditModal && selectedVehicle && (
        <EditVehicleForm
          vehicle={selectedVehicle}
          onClose={() => setShowEditModal(false)}
          onVehicleEdited={handleVehicleEdited}
        />
      )}

      {showDetailsModal && selectedVehicle && (
        <VehicleDetailsModal
          vehicle={selectedVehicle}
          onClose={() => setShowDetailsModal(false)}
        />
      )}

      {showDeleteConfirm && selectedVehicle && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
                <Trash2 className="h-6 w-6 text-red-600" />
              </div>
              <h3 className="mt-3 text-lg font-medium text-gray-900">Delete Vehicle</h3>
              <p className="mt-2 text-sm text-gray-500">
                Are you sure you want to delete{' '}
                <span className="font-semibold">
                  {selectedVehicle.year} {selectedVehicle.make} {selectedVehicle.model}
                </span>
                ? <br /> <span className="text-red-500">This action cannot be undone.</span>
              </p>
              <div className="mt-5 flex justify-center space-x-3">
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-100 transition"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleDeleteVehicle}
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 transition focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Vehicle Management</h1>
          <p className="text-gray-600 mt-1">Manage your fleet and vehicle status easily. Use the tools to search, add, edit, or remove vehicles. Click the icon buttons for quick actions.</p>
        </div>
        <PermissionGuard module="vehicles" action="create">
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Vehicle
          </button>
        </PermissionGuard>
      </div>

      {error && (
        <div className="mb-4 bg-red-50 border-l-4 border-red-400 p-4 rounded">
          <div className="flex">
            <div className="flex-shrink-0">
              <AlertCircle className="h-5 w-5 text-red-400" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Enhanced Search */}
      <div className="bg-white rounded-lg shadow-sm border p-4 mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" aria-label="Search Icon" />
          <input
            type="text"
            placeholder="🔍 Search vehicles by make, model, or license plate..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
            aria-label="Search vehicles"
            autoFocus
          />
        </div>
      </div>

      {/* Vehicles Table */}
      <div className="bg-white shadow-sm rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vehicle</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Details</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date Out</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time Out</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date In</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time In</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Daily Rate</th>
                <th scope="col" className="relative px-6 py-3">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredVehicles.length > 0 ? (
                filteredVehicles.map((vehicle) => (
                  <tr key={vehicle._id} className="hover:bg-gray-50 group">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center shadow-inner">
                          <Car className="w-5 h-5 text-blue-600" />
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {vehicle.year} {vehicle.make} {vehicle.model}
                          </div>
                          <div className="text-sm text-gray-500">{vehicle.licensePlate}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">{vehicle.color || <span className="text-gray-400 italic">N/A</span>}</div>
                      <div className="text-sm text-gray-500">Year: {vehicle.year}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">

                      {/* --- Status display with status change dropdown --- */}
                      <div className="flex items-center space-x-2">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-xs font-medium shadow-sm border
                            ${
                              vehicle.status === 'Available'
                                ? 'bg-green-100 text-green-800 border-green-200'
                                : vehicle.status === 'Booked'
                                ? 'bg-blue-100 text-blue-800 border-blue-200'
                                : 'bg-yellow-100 text-yellow-700 border-yellow-200'
                            }`
                          }
                        >
                          {vehicle.status || 'Available'}
                        </span>
                        <PermissionGuard module="vehicles" action="update">
                          <select
                            className={`text-xs rounded border-gray-300 py-0.5 pl-1 pr-8 focus:ring-2 focus:ring-blue-200
                            ${statusLoadingId === vehicle._id ? 'opacity-50 cursor-wait' : 'cursor-pointer'}
                            `}
                            value={vehicle.status || 'Available'}
                            onChange={e => handleChangeVehicleStatus(vehicle, e.target.value as VehicleStatus)}
                            disabled={statusLoadingId === vehicle._id}
                            aria-label="Change vehicle status"
                          >
                            {VEHICLE_STATUSES.map(status => (
                              <option key={status} value={status}>{status}</option>
                            ))}
                          </select>
                        </PermissionGuard>
                        {statusLoadingId === vehicle._id && (
                          <RefreshCw className="h-4 w-4 text-blue-400 animate-spin" />
                        )}
                      </div>
                      {/* --- End status display --- */}

                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {vehicle.dateOut ? (
                        formatDate(vehicle.dateOut)
                      ) : (
                        <span className="text-gray-400 italic">N/A</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {vehicle.timeOut ? (
                        formatTime(vehicle.timeOut)
                      ) : (
                        <span className="text-gray-400 italic">N/A</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {vehicle.dateIn ? (
                        formatDate(vehicle.dateIn)
                      ) : (
                        <span className="text-gray-400 italic">N/A</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {vehicle.timeIn ? (
                        formatTime(vehicle.timeIn)
                      ) : (
                        <span className="text-gray-400 italic">N/A</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      KSH {vehicle.dailyRate.toLocaleString('en-KE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-1">
                      <button
                        onClick={() => {
                          setSelectedVehicle(vehicle);
                          setShowDetailsModal(true);
                        }}
                        className="inline-flex items-center text-blue-600 hover:text-blue-800 px-2 py-1 rounded transition focus:outline-none"
                        title="View vehicle"
                        aria-label="View vehicle"
                      >
                        View
                      </button>
                      <button
                        onClick={() => handleEditClick(vehicle)}
                        className="ml-1 inline-flex items-center text-yellow-600 hover:text-yellow-800 px-2 py-1 rounded transition focus:outline-none"
                        title="Edit vehicle"
                        aria-label="Edit vehicle"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteClick(vehicle)}
                        className="ml-1 inline-flex items-center text-red-600 hover:text-red-800 px-2 py-1 rounded transition focus:outline-none"
                        title="Delete vehicle"
                        aria-label="Delete vehicle"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))
              ) : null}
            </tbody>
          </table>
        </div>
      </div>

      {filteredVehicles.length === 0 && !loading && (
        <div className="text-center py-12">
          <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Car className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No vehicles found</h3>
          <p className="text-gray-600">
            {searchTerm
              ? 'Try adjusting your search or check for typos.'
              : 'Easily add your first vehicle using the Add Vehicle button above.'}
          </p>
        </div>
      )}
    </div>
  );
}

// Add Vehicle Form Component
function AddVehicleForm({
  onClose,
  onVehicleAdded,
}: {
  onClose: () => void;
  onVehicleAdded?: () => void;
}) {
  const [formData, setFormData] = useState({
    make: '',
    model: '',
    year: new Date().getFullYear(),
    color: '',
    licensePlate: '',
    dateOut: '',
    timeOut: '',
    dateIn: '',
    timeIn: '',
    dailyRate: 0,
    status: 'Available' as VehicleStatus, // Added status default for Add
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'year' || name === 'dailyRate' ? +value : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (
      !formData.make ||
      !formData.model ||
      !formData.year ||
      !formData.licensePlate ||
      !formData.dailyRate
    ) {
      setError('Please fill in all required fields.');
      setLoading(false);
      return;
    }

    try {
      const response = await api.post('/vehicles', formData);

      if (response.data.success) {
        onClose();
        if (onVehicleAdded) {
          onVehicleAdded();
        }
      } else {
        setError(response.data.message || 'Failed to add vehicle.');
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to add vehicle. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
      aria-modal="true"
      role="dialog"
      tabIndex={-1}
    >
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-fadeIn">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold text-gray-900">Add New Vehicle</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-500"
              aria-label="Close"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          {error && (
            <div className="mb-4 bg-red-50 border-l-4 border-red-400 p-4 rounded">
              <div className="flex">
                <div className="flex-shrink-0">
                  <AlertCircle className="h-5 w-5 text-red-400" />
                </div>
                <div className="ml-3">
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              </div>
            </div>
          )}

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="make" className="block text-sm font-medium text-gray-700 mb-1">
                  Make <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="make"
                  name="make"
                  value={formData.make}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., Toyota"
                  required
                />
              </div>
              <div>
                <label htmlFor="model" className="block text-sm font-medium text-gray-700 mb-1">
                  Model <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="model"
                  name="model"
                  value={formData.model}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., Hiace"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="year" className="block text-sm font-medium text-gray-700 mb-1">
                  Year <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  id="year"
                  name="year"
                  value={formData.year}
                  onChange={handleChange}
                  min="1900"
                  max={new Date().getFullYear() + 1}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label htmlFor="color" className="block text-sm font-medium text-gray-700 mb-1">
                  Color
                </label>
                <input
                  type="text"
                  id="color"
                  name="color"
                  value={formData.color}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., White"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="licensePlate" className="block text-sm font-medium text-gray-700 mb-1">
                  License Plate <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="licensePlate"
                  name="licensePlate"
                  value={formData.licensePlate}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., KDG 530X"
                  required
                />
              </div>
              <div>
                <label htmlFor="dailyRate" className="block text-sm font-medium text-gray-700 mb-1">
                  Daily Rate (KSH) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  id="dailyRate"
                  name="dailyRate"
                  value={formData.dailyRate}
                  onChange={handleChange}
                  min="0"
                  step="0.01"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., 5000"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="dateOut" className="block text-sm font-medium text-gray-700 mb-1">
                  Date Out
                </label>
                <input
                  type="date"
                  id="dateOut"
                  name="dateOut"
                  value={formData.dateOut}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label htmlFor="timeOut" className="block text-sm font-medium text-gray-700 mb-1">
                  Time Out
                </label>
                <input
                  type="time"
                  id="timeOut"
                  name="timeOut"
                  value={formData.timeOut}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="dateIn" className="block text-sm font-medium text-gray-700 mb-1">
                  Date In
                </label>
                <input
                  type="date"
                  id="dateIn"
                  name="dateIn"
                  value={formData.dateIn}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label htmlFor="timeIn" className="block text-sm font-medium text-gray-700 mb-1">
                  Time In
                </label>
                <input
                  type="time"
                  id="timeIn"
                  name="timeIn"
                  value={formData.timeIn}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* NEW: Status select */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
                  Status
                </label>
                <select
                  id="status"
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  {VEHICLE_STATUSES.map((status) => (
                    <option key={status} value={status}>{status}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-100"
              >
                <X className="-ml-1 mr-2 h-4 w-4" />
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${loading && 'opacity-60 cursor-not-allowed'
                  }`}
              >
                {loading ? 'Adding...' : 'Add Vehicle'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

// Edit Vehicle Form Component -- User Friendly Modal
function EditVehicleForm({
  vehicle,
  onClose,
  onVehicleEdited,
}: {
  vehicle: Vehicle;
  onClose: () => void;
  onVehicleEdited?: () => void;
}) {
  // Clone vehicle values as state
  const [formData, setFormData] = useState({
    make: vehicle.make,
    model: vehicle.model,
    year: vehicle.year,
    color: vehicle.color || '',
    licensePlate: vehicle.licensePlate,
    dateOut: vehicle.dateOut || '',
    timeOut: vehicle.timeOut || '',
    dateIn: vehicle.dateIn || '',
    timeIn: vehicle.timeIn || '',
    dailyRate: vehicle.dailyRate,
    status: vehicle.status || 'Available', // include status for edits
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'year' || name === 'dailyRate' ? +value : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (
      !formData.make ||
      !formData.model ||
      !formData.year ||
      !formData.licensePlate ||
      !formData.dailyRate
    ) {
      setError('Please fill in all required fields.');
      setLoading(false);
      return;
    }

    try {
      const response = await api.put(`/vehicles/${vehicle._id}`, formData);

      if (response.data.success) {
        onClose();
        if (onVehicleEdited) {
          onVehicleEdited();
        }
      } else {
        setError(response.data.message || 'Failed to update vehicle.');
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to update vehicle. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
      aria-modal="true"
      role="dialog"
      tabIndex={-1}
    >
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-fadeIn">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold text-gray-900 flex items-center">
              <Edit className="h-6 w-6 mr-2 text-yellow-600" /> Edit Vehicle
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-500"
              aria-label="Close"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          {error && (
            <div className="mb-4 bg-red-50 border-l-4 border-red-400 p-4 rounded">
              <div className="flex">
                <div className="flex-shrink-0">
                  <AlertCircle className="h-5 w-5 text-red-400" />
                </div>
                <div className="ml-3">
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              </div>
            </div>
          )}

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="make" className="block text-sm font-medium text-gray-700 mb-1">
                  Make <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="make"
                  name="make"
                  value={formData.make}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
                  required
                />
              </div>
              <div>
                <label htmlFor="model" className="block text-sm font-medium text-gray-700 mb-1">
                  Model <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="model"
                  name="model"
                  value={formData.model}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="year" className="block text-sm font-medium text-gray-700 mb-1">
                  Year <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  id="year"
                  name="year"
                  value={formData.year}
                  onChange={handleChange}
                  min="1900"
                  max={new Date().getFullYear() + 1}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
                  required
                />
              </div>
              <div>
                <label htmlFor="color" className="block text-sm font-medium text-gray-700 mb-1">
                  Color
                </label>
                <input
                  type="text"
                  id="color"
                  name="color"
                  value={formData.color}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
                  placeholder="White"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="licensePlate" className="block text-sm font-medium text-gray-700 mb-1">
                  License Plate <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="licensePlate"
                  name="licensePlate"
                  value={formData.licensePlate}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
                  required
                  disabled // Editing license plate is typically restricted
                />
                <span className="text-xs text-gray-400 italic">License plate can not be changed.</span>
              </div>
              <div>
                <label htmlFor="dailyRate" className="block text-sm font-medium text-gray-700 mb-1">
                  Daily Rate (KSH) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  id="dailyRate"
                  name="dailyRate"
                  value={formData.dailyRate}
                  onChange={handleChange}
                  min="0"
                  step="0.01"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="dateOut" className="block text-sm font-medium text-gray-700 mb-1">
                  Date Out
                </label>
                <input
                  type="date"
                  id="dateOut"
                  name="dateOut"
                  value={formData.dateOut}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
                />
              </div>
              <div>
                <label htmlFor="timeOut" className="block text-sm font-medium text-gray-700 mb-1">
                  Time Out
                </label>
                <input
                  type="time"
                  id="timeOut"
                  name="timeOut"
                  value={formData.timeOut}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="dateIn" className="block text-sm font-medium text-gray-700 mb-1">
                  Date In
                </label>
                <input
                  type="date"
                  id="dateIn"
                  name="dateIn"
                  value={formData.dateIn}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
                />
              </div>
              <div>
                <label htmlFor="timeIn" className="block text-sm font-medium text-gray-700 mb-1">
                  Time In
                </label>
                <input
                  type="time"
                  id="timeIn"
                  name="timeIn"
                  value={formData.timeIn}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
                />
              </div>
            </div>

            {/* NEW: Status select */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
                  Status
                </label>
                <select
                  id="status"
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
                  required
                >
                  {VEHICLE_STATUSES.map((status) => (
                    <option key={status} value={status}>{status}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-100"
              >
                <X className="-ml-1 mr-2 h-4 w-4" />
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-yellow-500 hover:bg-yellow-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 ${loading && 'opacity-60 cursor-not-allowed'}`}
              >
                {loading ? 'Saving...' : (
                  <>
                    <Edit className="h-4 w-4 mr-1" /> Save Changes
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

// Vehicle Details Modal Component
function VehicleDetailsModal({ vehicle, onClose }: { vehicle: Vehicle; onClose: () => void }) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" aria-modal="true" role="dialog">
      <div className="bg-white rounded-lg w-full max-w-md shadow-lg animate-fadeIn">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold flex items-center">
              <Car className="mr-2 h-6 w-6 text-blue-600" /> Vehicle Details
            </h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-500"
              aria-label="Close"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center text-2xl font-bold text-gray-600">
                <Car className="w-8 h-8" />
              </div>
              <div>
                <h2 className="text-xl font-semibold">{vehicle.year} {vehicle.make} {vehicle.model}</h2>
                <p className="text-sm text-gray-500">{vehicle.licensePlate}</p>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-start">
                <span className="text-gray-400 text-sm font-medium mr-2 w-20">Status:</span>
                <span className="text-gray-600">{vehicle.status || 'Available'}</span>
              </div>
              <div className="flex items-start">
                <span className="text-gray-400 text-sm font-medium mr-2 w-20">Color:</span>
                <span className="text-gray-600">{vehicle.color || <span className="italic text-gray-400">N/A</span>}</span>
              </div>
              <div className="flex items-start">
                <span className="text-gray-400 text-sm font-medium mr-2 w-20">Rate:</span>
                <span className="text-gray-600">KSH {vehicle.dailyRate.toLocaleString('en-KE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
              {vehicle.dateOut && (
                <div className="flex items-start">
                  <Clock className="h-4 w-4 text-gray-400 mr-2 mt-0.5" />
                  <span className="text-gray-600">
                    Out: {new Date(vehicle.dateOut).toLocaleDateString()} {vehicle.timeOut}
                  </span>
                </div>
              )}
              {vehicle.dateIn && (
                <div className="flex items-start">
                  <Clock className="h-4 w-4 text-gray-400 mr-2 mt-0.5" />
                  <span className="text-gray-600">
                    In: {new Date(vehicle.dateIn).toLocaleDateString()} {vehicle.timeIn}
                  </span>
                </div>
              )}
            </div>

            <div className="pt-4 border-t border-gray-200">
              <div className="flex justify-between text-sm text-gray-500">
                <span>Added on</span>
                <span>{new Date(vehicle.createdAt).toLocaleDateString()}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}