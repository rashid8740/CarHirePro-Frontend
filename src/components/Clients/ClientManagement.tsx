import React, { useState, useEffect } from 'react';
import { Plus, Search, Phone, MapPin, Edit, Trash2, X, AlertCircle, CreditCard, UserX, UserCheck } from 'lucide-react';
import { api } from '../../lib/api';
import { useAuth } from '../../contexts/AuthContext';
import { hasPermission } from '../../lib/permissions';
import PermissionGuard from '../Layout/PermissionGuard';
import AddClientForm from './AddClientForm';

interface Client {
  _id: string;
  fullName: string;
  idOrPassport: string;
  phone: string;
  address?: string;
  licenseNumber: string;
  status: 'ACTIVE' | 'SUSPENDED';
  createdAt: string;
}

// -- User Friendly Edit Modal (inline implementation) --
function EditClientModal({
  client,
  onClose,
  onSave
}: {
  client: Client;
  onClose: () => void;
  onSave: (updated: Client) => void;
}) {
  const [formData, setFormData] = useState<Client>(client);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSaving(true);

    // Simple validation
    if (!formData.fullName || !formData.phone || !formData.idOrPassport || !formData.licenseNumber) {
      setError('Please fill in all required fields');
      setSaving(false);
      return;
    }

    try {
      // NOTE: Implement client update API on backend. PATCH is a common choice.
      // const resp = await api.patch(`/clients/${formData._id}`, formData);
      // For UI demo: simulate save
      await new Promise(res => setTimeout(res, 400));
      onSave(formData);
      onClose();
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to update client');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold text-gray-900">Edit Client</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-500"
              aria-label="Close"
              disabled={saving}
            >
              <X className="h-6 w-6" />
            </button>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-red-50 border-l-4 border-red-400 p-2">
                <div className="flex items-center text-sm text-red-700">
                  <AlertCircle className="h-4 w-4 mr-1" />
                  <span>{error}</span>
                </div>
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-700">Full Name*</label>
              <input
                type="text"
                name="fullName"
                value={formData.fullName}
                onChange={handleChange}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                disabled={saving}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Phone*</label>
              <input
                type="text"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                disabled={saving}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">ID/Passport*</label>
              <input
                type="text"
                name="idOrPassport"
                value={formData.idOrPassport}
                onChange={handleChange}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                disabled={saving}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Driver's License*</label>
              <input
                type="text"
                name="licenseNumber"
                value={formData.licenseNumber}
                onChange={handleChange}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                disabled={saving}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Address</label>
              <input
                type="text"
                name="address"
                value={formData.address || ""}
                onChange={handleChange}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                disabled={saving}
              />
            </div>
            <div className="flex items-center justify-end space-x-2 pt-2">
              <button
                type="button"
                className="px-4 py-2 rounded-md bg-gray-200 text-gray-700 hover:bg-gray-300"
                onClick={onClose}
                disabled={saving}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700"
                disabled={saving}
              >
                {saving ? "Saving..." : "Save"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default function ClientManagement() {
  const { user } = useAuth();
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [statusUpdating, setStatusUpdating] = useState<string | null>(null);

  // Fetch clients from backend
  const fetchClients = async () => {
    try {
      setLoading(true);
      const response = await api.get('/clients');
      if (response.data.success) {
        setClients(response.data.data);
      } else {
        setError('Failed to fetch clients');
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to fetch clients');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClients();
  }, []);

  const filteredClients = clients.filter(client => {
    const matchesSearch = (client.fullName && client.fullName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (client.idOrPassport && client.idOrPassport.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (client.phone && client.phone.includes(searchTerm)) ||
      (client.address && client.address.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (client.licenseNumber && client.licenseNumber.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesSearch;
  });

  const handleDeleteClick = (client: Client) => {
    setSelectedClient(client);
    setShowDeleteConfirm(true);
  };

  const handleDeleteClient = async () => {
    if (!selectedClient) return;

    try {
      // Note: You'll need to implement DELETE endpoint in backend
      // await api.delete(`/clients/${selectedClient._id}`);
      setClients(prev => prev.filter(client => client._id !== selectedClient._id));
      setShowDeleteConfirm(false);
      setShowDetailsModal(false);
      setSelectedClient(null);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to delete client');
    }
  };

  const handleClientAdded = () => {
    fetchClients(); // Refresh the list
  };

  const handleEditClientClick = (client: Client) => {
    setSelectedClient(client);
    setShowEditModal(true);
  };

  const handleEditClientSave = (updated: Client) => {
    setClients((prev) =>
      prev.map((c) => (c._id === updated._id ? { ...updated, createdAt: c.createdAt } : c))
    );
  };

  const handleStatusChange = async (clientId: string, newStatus: 'ACTIVE' | 'SUSPENDED') => {
    try {
      setStatusUpdating(clientId);
      const response = await api.put(`/clients/${clientId}/status`, { status: newStatus });
      
      if (response.data.success) {
        setClients(prev => 
          prev.map(client => 
            client._id === clientId 
              ? { ...client, status: newStatus }
              : client
          )
        );
        setError('');
      } else {
        setError(response.data.message || 'Failed to update client status');
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to update client status');
    } finally {
      setStatusUpdating(null);
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading clients...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Add Client Modal */}
      {showAddModal && (
        <AddClientForm
          onClose={() => setShowAddModal(false)}
          onClientAdded={handleClientAdded}
        />
      )}
      {/* Edit Client Modal */}
      {showEditModal && selectedClient && (
        <EditClientModal
          client={selectedClient}
          onClose={() => {
            setShowEditModal(false);
            setSelectedClient(null);
          }}
          onSave={handleEditClientSave}
        />
      )}

      {/* Details Modal */}
      {showDetailsModal && selectedClient && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-md">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Client Details</h3>
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="text-gray-400 hover:text-gray-500"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center text-2xl font-bold text-gray-600">
                    {selectedClient.fullName.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold">{selectedClient.fullName}</h2>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-start">
                    <CreditCard className="h-5 w-5 text-gray-400 mr-2 mt-0.5" />
                    <span className="text-gray-600">{selectedClient.idOrPassport}</span>
                  </div>
                  <div className="flex items-start">
                    <Phone className="h-5 w-5 text-gray-400 mr-2 mt-0.5" />
                    <span className="text-gray-600">{selectedClient.phone}</span>
                  </div>
                  {selectedClient.address && (
                    <div className="flex items-start">
                      <MapPin className="h-5 w-5 text-gray-400 mr-2 mt-0.5" />
                      <span className="text-gray-600">{selectedClient.address}</span>
                    </div>
                  )}
                  <div className="flex items-start">
                    <span className="text-gray-400 text-sm font-medium mr-2">License:</span>
                    <span className="text-gray-600">{selectedClient.licenseNumber}</span>
                  </div>
                  <div className="flex items-center">
                    <span className="text-gray-400 text-sm font-medium mr-2">Status:</span>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      selectedClient.status === 'ACTIVE' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {selectedClient.status}
                    </span>
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-200">
                  <div className="flex justify-between text-sm text-gray-500">
                    <span>Member since</span>
                    <span>{new Date(selectedClient.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
                <div className="flex space-x-2 pt-4 border-t border-gray-100 justify-end">
                  <button
                    className="flex items-center text-blue-600 hover:bg-blue-50 rounded px-3 py-1 text-sm"
                    onClick={() => {
                      setShowDetailsModal(false);
                      setShowEditModal(true);
                    }}
                  >
                    <Edit className="h-4 w-4 mr-1" /> Edit
                  </button>
                  <button
                    className="flex items-center text-red-600 hover:bg-red-50 rounded px-3 py-1 text-sm"
                    onClick={() => {
                      setShowDetailsModal(false);
                      setShowDeleteConfirm(true);
                    }}
                  >
                    <Trash2 className="h-4 w-4 mr-1" /> Delete
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirm Modal */}
      {showDeleteConfirm && selectedClient && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
                <Trash2 className="h-6 w-6 text-red-600" />
              </div>
              <h3 className="mt-3 text-lg font-medium text-gray-900">Delete Client</h3>
              <p className="mt-2 text-sm text-gray-500">
                Are you sure you want to delete <span className="font-semibold">{selectedClient.fullName}</span>? This action cannot be undone.
              </p>
              <div className="mt-5 flex justify-center space-x-3">
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleDeleteClient}
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-2">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Client Management</h1>
          <p className="text-gray-600 mt-1">Manage your client database and accounts</p>
        </div>
        <PermissionGuard module="clients" action="create">
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Client
          </button>
        </PermissionGuard>
      </div>

      {error && (
        <div className="mb-4 bg-red-50 border-l-4 border-red-400 p-4">
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

      {/* Search */}
      <div className="bg-white rounded-lg shadow-sm border p-4 mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search clients by name, ID, or phone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            aria-label="Search clients"
          />
        </div>
      </div>

      {/* User-Friendly Table with Edit icon */}
      <div className="bg-white shadow-sm rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Client</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID/Passport</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">License</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Joined</th>
                <th scope="col" className="relative px-6 py-3">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredClients.map((client) => (
                <tr key={client._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-sm font-medium text-blue-600">
                          {client.fullName.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{client.fullName}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{client.phone}</div>
                    {client.address && (
                      <div className="text-sm text-gray-500 truncate max-w-xs">{client.address}</div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {client.idOrPassport}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {client.licenseNumber}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      client.status === 'ACTIVE' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {client.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(client.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium flex flex-row gap-2 justify-end" style={{minWidth:200}}>
                    <button
                      onClick={() => {
                        setSelectedClient(client);
                        setShowDetailsModal(true);
                      }}
                      title="View client details"
                      className="text-blue-600 hover:underline px-2"
                    >
                      View
                    </button>
                    <button
                      onClick={() => handleEditClientClick(client)}
                      className="text-yellow-500 hover:bg-yellow-50 rounded transition-colors p-1"
                      title="Edit client"
                      aria-label="Edit"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    {client.status === 'ACTIVE' ? (
                      <PermissionGuard module="clients" action="suspend">
                        <button
                          onClick={() => handleStatusChange(client._id, 'SUSPENDED')}
                          disabled={statusUpdating === client._id}
                          className="text-orange-600 hover:bg-orange-50 rounded transition-colors p-1 disabled:opacity-50"
                          title="Suspend client"
                          aria-label="Suspend"
                        >
                          <UserX className="h-4 w-4" />
                        </button>
                      </PermissionGuard>
                    ) : (
                      <PermissionGuard module="clients" action="activate">
                        <button
                          onClick={() => handleStatusChange(client._id, 'ACTIVE')}
                          disabled={statusUpdating === client._id}
                          className="text-green-600 hover:bg-green-50 rounded transition-colors p-1 disabled:opacity-50"
                          title="Activate client"
                          aria-label="Activate"
                        >
                          <UserCheck className="h-4 w-4" />
                        </button>
                      </PermissionGuard>
                    )}
                    <button
                      onClick={() => handleDeleteClick(client)}
                      className="text-red-600 hover:bg-red-50 rounded transition-colors p-1"
                      title="Delete client"
                      aria-label="Delete"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {filteredClients.length === 0 && !loading && (
        <div className="text-center py-12">
          <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Search className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No clients found</h3>
          <p className="text-gray-600">
            {searchTerm
              ? 'Try adjusting your search criteria'
              : 'Get started by adding your first client'
            }
          </p>
        </div>
      )}
    </div>
  );
}