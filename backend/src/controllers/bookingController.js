import mongoose from 'mongoose';
import Booking from '../models/Booking.js';
import Client from '../models/Client.js';
import Vehicle from '../models/Vehicle.js';

// Helper: Check overlapping booking
const hasConflict = async (vehicleId, start, end, excludeId = null) => {
  const conflict = await Booking.findOne({
    _id: excludeId ? { $ne: excludeId } : { $exists: true },
    vehicle: vehicleId,
    status: { $in: ['Active'] },
    $or: [
      { startDate: { $lte: start }, endDate: { $gt: start } },
      { startDate: { $lt: end }, endDate: { $gte: end } },
      { startDate: { $gte: start }, endDate: { $lte: end } }
    ]
  });
  return !!conflict;
};

// ✅ Create booking
export const createBooking = async (req, res) => {
  try {
    const { client, vehicle, startDate, endDate } = req.body;
    if (!client || !vehicle || !startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: client, vehicle, startDate, endDate'
      });
    }

    const clientId = typeof client === 'object' ? client._id : client;
    const vehicleId = typeof vehicle === 'object' ? vehicle._id : vehicle;

    const [clientExists, vehicleExists] = await Promise.all([
      Client.findById(clientId),
      Vehicle.findById(vehicleId)
    ]);

    if (!clientExists)
      return res.status(400).json({ success: false, message: 'Client not found' });
    if (!vehicleExists)
      return res.status(400).json({ success: false, message: 'Vehicle not found' });

    // Check if client is suspended
    if (clientExists.status === 'SUSPENDED') {
      return res.status(403).json({
        success: false,
        message: 'Cannot create booking for suspended client. Client account is currently suspended.'
      });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (isNaN(start) || isNaN(end))
      return res.status(400).json({ success: false, message: 'Invalid date format' });
    if (start < today)
      return res.status(400).json({ success: false, message: 'Start date cannot be in the past' });
    if (end <= start)
      return res.status(400).json({ success: false, message: 'End date must be after start date' });

    // Check conflicts
    if (await hasConflict(vehicleId, start, end))
      return res.status(400).json({
        success: false,
        message: 'Vehicle is already booked during the selected dates'
      });

    const booking = await Booking.create({
      client: clientId,
      vehicle: vehicleId,
      startDate: start,
      endDate: end,
      status: 'Active'
    });

    const populated = await Booking.findById(booking._id)
      .populate('client', 'fullName phone')
      .populate('vehicle', 'make model licensePlate color')
      .lean();

    return res.status(201).json({
      success: true,
      message: 'Booking created successfully',
      data: {
        ...populated,
        startDate: populated.startDate.toISOString().split('T')[0],
        endDate: populated.endDate.toISOString().split('T')[0]
      }
    });
  } catch (error) {
    console.error('Error creating booking:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to create booking. Please try again.'
    });
  }
};

// ✅ Get all bookings
export const getAllBookings = async (req, res) => {
  try {
    const bookings = await Booking.find({})
      .populate('client', 'fullName phone address')
      .populate('vehicle', 'make model licensePlate dailyRate color')
      .sort({ createdAt: -1 })
      .lean();

    const data = bookings.map(b => ({
      ...b,
      startDate: b.startDate.toISOString().split('T')[0],
      endDate: b.endDate.toISOString().split('T')[0]
    }));

    return res.status(200).json({
      success: true,
      count: data.length,
      data
    });
  } catch (error) {
    console.error('Error fetching bookings:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch bookings. Please try again.'
    });
  }
};

// ✅ Get booking by ID
export const getBookingById = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id))
      return res.status(400).json({ success: false, message: 'Invalid booking ID' });

    const booking = await Booking.findById(id)
      .populate('client', 'fullName phone address')
      .populate('vehicle', 'make model licensePlate dailyRate color')
      .lean();

    if (!booking)
      return res.status(404).json({ success: false, message: 'Booking not found' });

    return res.status(200).json({
      success: true,
      data: {
        ...booking,
        startDate: booking.startDate.toISOString().split('T')[0],
        endDate: booking.endDate.toISOString().split('T')[0]
      }
    });
  } catch (error) {
    console.error('Error fetching booking:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch booking. Please try again.'
    });
  }
};

// ✅ Update booking (with conflict check)
export const updateBooking = async (req, res) => {
  try {
    const { id } = req.params;
    const { client, vehicle, startDate, endDate, status } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id))
      return res.status(400).json({ success: false, message: 'Invalid booking ID' });

    const clientId = typeof client === 'object' ? client._id : client;
    const vehicleId = typeof vehicle === 'object' ? vehicle._id : vehicle;

    const [clientExists, vehicleExists] = await Promise.all([
      Client.findById(clientId),
      Vehicle.findById(vehicleId)
    ]);

    if (!clientExists || !vehicleExists)
      return res.status(400).json({ success: false, message: 'Client or Vehicle not found' });

    // Check if client is suspended
    if (clientExists.status === 'SUSPENDED') {
      return res.status(403).json({
        success: false,
        message: 'Cannot update booking for suspended client. Client account is currently suspended.'
      });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (isNaN(start) || isNaN(end))
      return res.status(400).json({ success: false, message: 'Invalid date format' });
    if (end <= start)
      return res.status(400).json({ success: false, message: 'End date must be after start date' });

    if (await hasConflict(vehicleId, start, end, id))
      return res.status(400).json({
        success: false,
        message: 'Vehicle is already booked during the selected dates'
      });

    const updated = await Booking.findByIdAndUpdate(
      id,
      { client: clientId, vehicle: vehicleId, startDate: start, endDate: end, status },
      { new: true, runValidators: false } // ✅ Disable schema validators that rely on "this"
    )
      .populate('client', 'fullName phone address')
      .populate('vehicle', 'make model licensePlate dailyRate color')
      .lean();

    if (!updated)
      return res.status(404).json({ success: false, message: 'Booking not found' });

    return res.status(200).json({
      success: true,
      message: 'Booking updated successfully',
      data: {
        ...updated,
        startDate: updated.startDate.toISOString().split('T')[0],
        endDate: updated.endDate.toISOString().split('T')[0]
      }
    });
  } catch (error) {
    console.error('Error updating booking:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update booking. Please try again.'
    });
  }
};

// ✅ Update booking status only
export const updateBookingStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id))
      return res.status(400).json({ success: false, message: 'Invalid booking ID' });
    if (!status || !['Active', 'Completed', 'Cancelled'].includes(status))
      return res.status(400).json({ success: false, message: 'Invalid booking status' });

    const updated = await Booking.findByIdAndUpdate(
      id,
      { status },
      { new: true, runValidators: true }
    )
      .populate('client', 'fullName')
      .populate('vehicle', 'make model licensePlate')
      .lean();

    if (!updated)
      return res.status(404).json({ success: false, message: 'Booking not found' });

    return res.status(200).json({
      success: true,
      message: 'Booking status updated successfully',
      data: updated
    });
  } catch (error) {
    console.error('Error updating booking status:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update booking status. Please try again.'
    });
  }
};

// ✅ Delete booking
export const deleteBooking = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id))
      return res.status(400).json({ success: false, message: 'Invalid booking ID' });

    const deleted = await Booking.findByIdAndDelete(id);
    if (!deleted)
      return res.status(404).json({ success: false, message: 'Booking not found' });

    return res.status(200).json({
      success: true,
      message: 'Booking deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting booking:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to delete booking. Please try again.'
    });
  }
};
