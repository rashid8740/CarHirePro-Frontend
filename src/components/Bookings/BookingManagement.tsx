import React, { useState, useEffect, useMemo } from "react";
import {
  Plus,
  Search,
  AlertCircle,
  Eye,
  Edit3,
  Trash2,
  X,
  // Add any extra icons if needed in future
} from "lucide-react";
import { api } from "../../lib/api";
import { useAuth } from "../../contexts/AuthContext";
import { hasPermission } from "../../lib/permissions";
import PermissionGuard from "../Layout/PermissionGuard";
import AddBookingForm from "./AddBookingForm";
import EditBookingModal from "./EditBookingModal";
import BookingDetailsModal from "./BookingDetailsModal";

interface Client {
  _id: string;
  fullName: string;
  phone: string;
  address?: string;
}

interface Vehicle {
  _id: string;
  make: string;
  model: string;
  licensePlate: string;
  dailyRate: number;
  color?: string;
}

interface Booking {
  _id: string;
  client: Client;
  vehicle?: Vehicle;
  startDate: string;
  endDate: string;
  status: "Active" | "Completed" | "Cancelled";
  createdAt: string;
}

const STATUS_COLORS: Record<Booking["status"], string> = {
  Active: "bg-green-100 text-green-800",
  Completed: "bg-gray-100 text-gray-800",
  Cancelled: "bg-red-100 text-red-800",
};

export const calculateDays = (startDate: string, endDate: string) => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const diff = Math.abs(end.getTime() - start.getTime());
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
};

const BookingManagement: React.FC = () => {
  const { user } = useAuth();

  const [bookings, setBookings] = useState<Booking[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | Booking["status"]>("all");

  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [editingBookingId, setEditingBookingId] = useState<string | null>(null);

  // Fetch data
  const fetchBookings = async () => {
    try {
      setLoading(true);
      const res = await api.get("/bookings");
      if (res.data.success) setBookings(res.data.data);
      else setError("Failed to fetch bookings");
    } catch (err: any) {
      setError(err?.response?.data?.message || "Failed to fetch bookings");
    } finally {
      setLoading(false);
    }
  };

  const fetchClients = async () => {
    try {
      const res = await api.get("/clients");
      if (res.data.success) setClients(res.data.data);
    } catch (err) {
      console.error("Failed to fetch clients:", err);
    }
  };

  const fetchVehicles = async () => {
    try {
      const res = await api.get("/vehicles");
      if (res.data.success) setVehicles(res.data.data);
    } catch (err) {
      console.error("Failed to fetch vehicles:", err);
    }
  };

  useEffect(() => {
    fetchBookings();
    fetchClients();
    fetchVehicles();
  }, []);

  const filteredBookings = useMemo(() => {
    return bookings.filter((b) => {
      const q = searchTerm.toLowerCase();
      const matchSearch =
        b.client.fullName.toLowerCase().includes(q) ||
        b.vehicle?.make.toLowerCase().includes(q) ||
        b.vehicle?.model.toLowerCase().includes(q) ||
        b.vehicle?.licensePlate.toLowerCase().includes(q);
      const matchStatus = statusFilter === "all" || b.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [bookings, searchTerm, statusFilter]);

  const handleDelete = async () => {
    if (!selectedBooking) return;
    try {
      await api.delete(`/bookings/${selectedBooking._id}`);
      setBookings((prev) => prev.filter((b) => b._id !== selectedBooking._id));
      setShowDeleteConfirm(false);
      setSelectedBooking(null);
    } catch (err: any) {
      setError(err?.response?.data?.message || "Failed to delete booking");
    }
  };

  const handleEdit = (booking: Booking) => {
    setEditingBookingId(booking._id);
    setShowEditModal(true);
  };

  const refreshBookings = () => fetchBookings();

  if (loading) {
    return (
      <div className="p-6 flex justify-center items-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading bookings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Modals */}
      {showAddModal && (
        <AddBookingForm
          onClose={() => setShowAddModal(false)}
          onBookingAdded={refreshBookings}
          clients={clients}
          vehicles={vehicles}
        />
      )}
      {showEditModal && editingBookingId && (
        <EditBookingModal
          isOpen={showEditModal}
          bookingId={editingBookingId}
          onClose={() => setShowEditModal(false)}
          onUpdate={refreshBookings}
        />
      )}
      {showDetailsModal && selectedBooking && (
        <BookingDetailsModal
          booking={selectedBooking}
          onClose={() => setShowDetailsModal(false)}
        />
      )}

      {/* Inline Delete Confirmation Modal */}
      {showDeleteConfirm && selectedBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-md p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-gray-800">Confirm Delete</h2>
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="text-gray-500 hover:text-gray-700"
                aria-label="Close Delete Confirmation"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-sm text-gray-600 mb-6">
              Are you sure you want to delete this booking? This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-100 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 rounded-md bg-red-600 text-white hover:bg-red-700 transition flex items-center"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold text-gray-900">Booking Management</h1>
          <p className="text-sm sm:text-base text-gray-600 mt-1">
            Manage, track, and monitor your bookings efficiently in real-time.
          </p>
        </div>
        <PermissionGuard module="bookings" action="create">
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center justify-center w-full sm:w-auto gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all text-sm sm:text-base"
          >
            <Plus className="w-4 h-4" />
            Add Booking
          </button>
        </PermissionGuard>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded-md flex items-center gap-2">
          <AlertCircle className="h-5 w-5 text-red-500" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Search & Filter */}
      <div className="bg-white border rounded-lg shadow-sm p-4 flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search by client, vehicle, or plate..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) =>
            setStatusFilter(e.target.value as Booking["status"] | "all")
          }
          className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">All Status</option>
          <option value="Active">Active</option>
          <option value="Completed">Completed</option>
          <option value="Cancelled">Cancelled</option>
        </select>
      </div>

      {/* Desktop Table - Hidden on mobile */}
      <div className="hidden lg:block bg-white rounded-lg shadow-sm overflow-hidden border">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50">
              <tr>
                {["Booking", "Client", "Vehicle", "Dates", "Amount", "Status", "Actions"].map((h) => (
                  <th
                    key={h}
                    className="px-6 py-3 text-left font-medium text-gray-500 uppercase tracking-wide"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredBookings.length > 0 ? (
                filteredBookings.map((b) => {
                  const days = calculateDays(b.startDate, b.endDate);
                  const total = days * (b.vehicle?.dailyRate ?? 0);
                  return (
                    <tr key={b._id} className="hover:bg-gray-50 transition">
                      <td className="px-6 py-4 font-medium text-gray-700">
                        #{b._id.slice(-6)}
                        <div className="text-xs text-gray-400">
                          {new Date(b.createdAt).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-medium text-gray-900">{b.client.fullName}</div>
                        <div className="text-xs text-gray-500">{b.client.phone}</div>
                      </td>
                      <td className="px-6 py-4">
                        {b.vehicle ? (
                          <>
                            <div>{b.vehicle.make} {b.vehicle.model}</div>
                            <div className="text-xs text-gray-500">{b.vehicle.licensePlate}</div>
                          </>
                        ) : (
                          <span className="text-gray-400 text-sm">N/A</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {new Date(b.startDate).toLocaleDateString()} - {new Date(b.endDate).toLocaleDateString()}
                        <div className="text-xs text-gray-500">{days} day{days > 1 && "s"}</div>
                      </td>
                      <td className="px-6 py-4 font-semibold">
                        KSH {total.toLocaleString("en-KE", { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${STATUS_COLORS[b.status]}`}>
                          {b.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-3">
                          <button
                            onClick={() => { setSelectedBooking(b); setShowDetailsModal(true); }}
                            title="View Details"
                            className="text-blue-600 hover:text-blue-800"
                            aria-label="View Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          {/* Edit icon button */}
                          <button
                            onClick={() => handleEdit(b)}
                            title="Edit Booking"
                            className={`text-green-600 hover:text-green-800`}
                            aria-label="Edit Booking"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          {/* Delete icon button */}
                          <button
                            onClick={() => { setSelectedBooking(b); setShowDeleteConfirm(true); }}
                            title="Delete Booking"
                            className="text-red-600 hover:text-red-800"
                            aria-label="Delete Booking"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={7} className="px-6 py-4 text-center text-gray-500">
                    No bookings found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile Card View - Shown on mobile/tablet */}
      <div className="lg:hidden space-y-4">
        {filteredBookings.length > 0 ? (
          filteredBookings.map((b) => {
            const days = calculateDays(b.startDate, b.endDate);
            const total = days * (b.vehicle?.dailyRate ?? 0);
            return (
              <div key={b._id} className="bg-white rounded-lg shadow-sm border p-4">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="font-semibold text-gray-900">#{b._id.slice(-6)}</div>
                    <div className="text-xs text-gray-500">{new Date(b.createdAt).toLocaleDateString()}</div>
                  </div>
                  <span className={`px-2 py-1 text-xs font-semibold rounded-full ${STATUS_COLORS[b.status]}`}>
                    {b.status}
                  </span>
                </div>

                <div className="space-y-2 text-sm">
                  <div>
                    <span className="text-gray-600 font-medium">Client:</span>
                    <div className="text-gray-900">{b.client.fullName}</div>
                    <div className="text-xs text-gray-500">{b.client.phone}</div>
                  </div>
                  
                  {b.vehicle && (
                    <div>
                      <span className="text-gray-600 font-medium">Vehicle:</span>
                      <div className="text-gray-900">{b.vehicle.make} {b.vehicle.model}</div>
                      <div className="text-xs text-gray-500">{b.vehicle.licensePlate}</div>
                    </div>
                  )}

                  <div>
                    <span className="text-gray-600 font-medium">Period:</span>
                    <div className="text-gray-900">
                      {new Date(b.startDate).toLocaleDateString()} - {new Date(b.endDate).toLocaleDateString()}
                    </div>
                    <div className="text-xs text-gray-500">{days} day{days > 1 && "s"}</div>
                  </div>

                  <div className="pt-2 border-t">
                    <span className="text-gray-600 font-medium">Total:</span>
                    <div className="text-lg font-bold text-gray-900">
                      KSH {total.toLocaleString("en-KE", { minimumFractionDigits: 2 })}
                    </div>
                  </div>
                </div>

                <div className="flex gap-2 mt-4 pt-3 border-t">
                  <button
                    onClick={() => { setSelectedBooking(b); setShowDetailsModal(true); }}
                    className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-blue-50 text-blue-600 rounded-md text-sm font-medium hover:bg-blue-100"
                  >
                    <Eye className="w-4 h-4" />
                    View
                  </button>
                  <button
                    onClick={() => handleEdit(b)}
                    className="flex items-center justify-center px-3 py-2 bg-green-50 text-green-600 rounded-md hover:bg-green-100"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => { setSelectedBooking(b); setShowDeleteConfirm(true); }}
                    className="flex items-center justify-center px-3 py-2 bg-red-50 text-red-600 rounded-md hover:bg-red-100"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })
        ) : (
          <div className="text-center py-12 bg-white rounded-lg border">
            <p className="text-gray-500">No bookings found.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default BookingManagement;
