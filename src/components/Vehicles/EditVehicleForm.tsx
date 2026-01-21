import React, { useState } from "react";
import { X, Save, AlertCircle, Loader2, CheckCircle2 } from "lucide-react";
import { api } from "../../lib/api";

interface Vehicle {
  _id: string;
  make: string;
  model: string;
  year: number;
  color?: string;
  licensePlate: string;
  dailyRate: number;
  status?: "Available" | "Booked" | "Maintenance";
}

interface EditVehicleFormProps {
  vehicle: Vehicle;
  onClose: () => void;
  onVehicleUpdated: () => void;
}

const STATUS_OPTIONS = [
  { value: "Available", label: "Available" },
  { value: "Booked", label: "Booked" },
  { value: "Maintenance", label: "Maintenance" },
];

export const EditVehicleForm: React.FC<EditVehicleFormProps> = ({
  vehicle,
  onClose,
  onVehicleUpdated,
}) => {
  const [formData, setFormData] = useState({
    make: vehicle.make,
    model: vehicle.model,
    year: vehicle.year,
    color: vehicle.color || "",
    licensePlate: vehicle.licensePlate,
    dailyRate: vehicle.dailyRate,
    status: vehicle.status || "Available",
  });

  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === "year" || name === "dailyRate" ? Number(value) : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);
    setLoading(true);
    try {
      const response = await api.put(`/vehicles/${vehicle._id}`, formData);
      if (response.data.success) {
        setFeedback({ type: "success", message: "✅ Vehicle details updated successfully!" });
        onVehicleUpdated();
        setTimeout(() => onClose(), 1200); // auto-close after 1.2s
      } else {
        setFeedback({ type: "error", message: "Failed to update vehicle. Please try again." });
      }
    } catch (err: any) {
      setFeedback({
        type: "error",
        message: err?.response?.data?.message || "Something went wrong. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-lg relative animate-fadeIn">
        {/* Header */}
        <div className="flex justify-between items-center border-b pb-3 mb-4">
          <h2 className="text-xl font-semibold text-gray-800">Edit Vehicle Details</h2>
          <button
            onClick={onClose}
            type="button"
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Fields */}
          {[
            { name: "make", label: "Make", type: "text" },
            { name: "model", label: "Model", type: "text" },
            { name: "year", label: "Year", type: "number" },
            { name: "color", label: "Color", type: "text", placeholder: "Optional" },
            { name: "licensePlate", label: "License Plate", type: "text" },
            { name: "dailyRate", label: "Daily Rate (KES)", type: "number" },
          ].map(({ name, label, type, placeholder }) => (
            <div key={name}>
              <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
              <input
                type={type}
                name={name}
                value={(formData as any)[name]}
                onChange={handleChange}
                required={name !== "color"}
                placeholder={placeholder}
                min={name === "dailyRate" || name === "year" ? 0 : undefined}
                className="w-full border border-gray-300 rounded-md p-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          ))}

          {/* Status */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              name="status"
              value={formData.status}
              onChange={handleChange}
              required
              className="w-full border border-gray-300 rounded-md p-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {STATUS_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Feedback Message */}
          {feedback && (
            <div
              className={`flex items-center text-sm p-2 rounded border-l-4 ${
                feedback.type === "error"
                  ? "text-red-600 bg-red-50 border-red-400"
                  : "text-green-700 bg-green-50 border-green-400"
              }`}
            >
              {feedback.type === "error" ? (
                <AlertCircle className="w-4 h-4 mr-2" />
              ) : (
                <CheckCircle2 className="w-4 h-4 mr-2" />
              )}
              {feedback.message}
            </div>
          )}

          {/* Buttons */}
          <div className="flex justify-end gap-3 pt-2 border-t mt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-100 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center transition-all disabled:opacity-70"
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin w-4 h-4 mr-2" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Save Changes
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
