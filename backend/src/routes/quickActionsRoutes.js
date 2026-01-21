import express from 'express';
import Booking from '../models/Booking.js';
import Vehicle from '../models/Vehicle.js';
import Client from '../models/Client.js';
import { startOfDay, endOfDay, addDays, format } from 'date-fns';

const router = express.Router();

// Get today's bookings
router.get('/today-bookings', async (req, res) => {
  try {
    const today = new Date();
    const todayStart = startOfDay(today);
    const todayEnd = endOfDay(today);

    const todayBookings = await Booking.find({
      start_date: { $gte: todayStart, $lte: todayEnd }
    })
    .populate('client', 'name email phone')
    .populate('vehicle', 'make model licensePlate dailyRate')
    .sort({ start_date: 1 });

    res.json({
      success: true,
      data: todayBookings,
      count: todayBookings.length,
      summary: {
        totalRevenue: todayBookings.reduce((sum, booking) => sum + (booking.total_amount || 0), 0),
        activeBookings: todayBookings.filter(b => b.status === 'active').length,
        pendingBookings: todayBookings.filter(b => b.status === 'pending').length,
        completedBookings: todayBookings.filter(b => b.status === 'completed').length
      }
    });
  } catch (error) {
    console.error('Error fetching today\'s bookings:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch bookings' });
  }
});

// Get available vehicles for date range
router.get('/available-vehicles', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    if (!startDate || !endDate) {
      return res.status(400).json({ 
        success: false, 
        error: 'Start date and end date are required' 
      });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    // Find vehicles that are not booked during the specified period
    const bookedVehicles = await Booking.find({
      $or: [
        {
          start_date: { $lte: start },
          end_date: { $gte: start }
        },
        {
          start_date: { $lte: end },
          end_date: { $gte: end }
        },
        {
          start_date: { $gte: start },
          end_date: { $lte: end }
        }
      ],
      status: { $in: ['active', 'confirmed'] }
    }).select('vehicle');

    const bookedVehicleIds = bookedVehicles.map(booking => booking.vehicle.toString());

    const availableVehicles = await Vehicle.find({
      _id: { $nin: bookedVehicleIds },
      status: 'Available'
    }).sort({ make: 1, model: 1 });

    res.json({
      success: true,
      data: availableVehicles,
      count: availableVehicles.length
    });
  } catch (error) {
    console.error('Error fetching available vehicles:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch vehicles' });
  }
});

// Quick add booking
router.post('/add-booking', async (req, res) => {
  try {
    const {
      client_id,
      vehicle_id,
      start_date,
      end_date,
      daily_rate
    } = req.body;

    // Validate required fields
    if (!client_id || !vehicle_id || !start_date || !end_date) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields'
      });
    }

    // Check vehicle availability
    const conflictingBooking = await Booking.findOne({
      vehicle: vehicle_id,
      status: { $in: ['active', 'confirmed'] },
      $or: [
        {
          start_date: { $lte: new Date(start_date) },
          end_date: { $gte: new Date(start_date) }
        },
        {
          start_date: { $lte: new Date(end_date) },
          end_date: { $gte: new Date(end_date) }
        }
      ]
    });

    if (conflictingBooking) {
      return res.status(400).json({
        success: false,
        error: 'Vehicle is already booked for the selected dates'
      });
    }

    // Calculate total amount
    const startDate = new Date(start_date);
    const endDate = new Date(end_date);
    const days = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));
    const total_amount = daily_rate * days;

    // Create booking
    const booking = new Booking({
      client: client_id,
      vehicle: vehicle_id,
      start_date: startDate,
      end_date: endDate,
      status: 'confirmed',
      total_amount,
      daily_rate
    });

    await booking.save();

    // Update vehicle status
    await Vehicle.findByIdAndUpdate(vehicle_id, { status: 'Booked' });

    // Populate and return the booking
    const populatedBooking = await Booking.findById(booking._id)
      .populate('client', 'name email phone')
      .populate('vehicle', 'make model licensePlate');

    res.json({
      success: true,
      data: populatedBooking,
      message: 'Booking created successfully'
    });
  } catch (error) {
    console.error('Error creating booking:', error);
    res.status(500).json({ success: false, error: 'Failed to create booking' });
  }
});

// Mark vehicle as returned
router.post('/mark-returned/:bookingId', async (req, res) => {
  try {
    const { bookingId } = req.params;
    const { mileage, notes, damageReport } = req.body;

    // Find and update booking
    const booking = await Booking.findById(bookingId)
      .populate('vehicle');

    if (!booking) {
      return res.status(404).json({
        success: false,
        error: 'Booking not found'
      });
    }

    if (booking.status !== 'active') {
      return res.status(400).json({
        success: false,
        error: 'Booking is not currently active'
      });
    }

    // Update booking status
    booking.status = 'completed';
    booking.end_date = new Date();
    if (notes) booking.notes = notes;
    if (damageReport) booking.damageReport = damageReport;
    if (mileage) booking.returnMileage = mileage;

    await booking.save();

    // Update vehicle status
    await Vehicle.findByIdAndUpdate(booking.vehicle._id, { 
      status: 'Available',
      ...(mileage && { mileage })
    });

    res.json({
      success: true,
      data: booking,
      message: 'Vehicle marked as returned successfully'
    });
  } catch (error) {
    console.error('Error marking vehicle as returned:', error);
    res.status(500).json({ success: false, error: 'Failed to process return' });
  }
});

// Generate invoice
router.post('/generate-invoice/:bookingId', async (req, res) => {
  try {
    const { bookingId } = req.params;

    const booking = await Booking.findById(bookingId)
      .populate('client', 'name email phone address')
      .populate('vehicle', 'make model licensePlate year');

    if (!booking) {
      return res.status(404).json({
        success: false,
        error: 'Booking not found'
      });
    }

    // Calculate invoice details
    const startDate = new Date(booking.start_date);
    const endDate = new Date(booking.end_date);
    const days = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));
    
    const subtotal = booking.total_amount;
    const tax = subtotal * 0.16; // 16% tax
    const total = subtotal + tax;

    const invoice = {
      invoiceNumber: `INV-${Date.now()}`,
      date: new Date().toISOString(),
      dueDate: addDays(new Date(), 7).toISOString(),
      booking: {
        id: booking._id,
        startDate: booking.start_date,
        endDate: booking.end_date,
        days: days,
        dailyRate: booking.daily_rate
      },
      client: booking.client,
      vehicle: booking.vehicle,
      amounts: {
        subtotal,
        tax,
        total
      },
      status: 'pending'
    };

    res.json({
      success: true,
      data: invoice,
      message: 'Invoice generated successfully'
    });
  } catch (error) {
    console.error('Error generating invoice:', error);
    res.status(500).json({ success: false, error: 'Failed to generate invoice' });
  }
});

// Send payment reminder
router.post('/send-payment-reminder/:bookingId', async (req, res) => {
  try {
    const { bookingId } = req.params;
    const { message } = req.body;

    const booking = await Booking.findById(bookingId)
      .populate('client', 'name email phone');

    if (!booking) {
      return res.status(404).json({
        success: false,
        error: 'Booking not found'
      });
    }

    if (booking.status === 'completed') {
      return res.status(400).json({
        success: false,
        error: 'Payment already completed'
      });
    }

    // Here you would integrate with your email/SMS service
    // For now, we'll just log the reminder
    const reminder = {
      bookingId: booking._id,
      clientName: booking.client.name,
      clientEmail: booking.client.email,
      clientPhone: booking.client.phone,
      amount: booking.total_amount,
      dueDate: booking.start_date,
      message: message || 'This is a reminder about your upcoming booking payment.',
      sentAt: new Date(),
      status: 'sent'
    };

    // TODO: Integrate with email service (SendGrid, etc.)
    // TODO: Integrate with SMS service (Twilio, etc.)
    
    console.log('Payment reminder sent:', reminder);

    res.json({
      success: true,
      data: reminder,
      message: 'Payment reminder sent successfully'
    });
  } catch (error) {
    console.error('Error sending payment reminder:', error);
    res.status(500).json({ success: false, error: 'Failed to send reminder' });
  }
});

// Get quick actions stats
router.get('/stats', async (req, res) => {
  try {
    const today = new Date();
    const todayStart = startOfDay(today);
    const todayEnd = endOfDay(today);

    const [
      todayBookings,
      activeBookings,
      availableVehicles,
      pendingPayments
    ] = await Promise.all([
      Booking.countDocuments({
        start_date: { $gte: todayStart, $lte: todayEnd }
      }),
      Booking.countDocuments({ status: 'active' }),
      Vehicle.countDocuments({ status: 'Available' }),
      Booking.countDocuments({
        status: { $in: ['pending', 'confirmed'] },
        start_date: { $lte: today }
      })
    ]);

    res.json({
      success: true,
      data: {
        todayBookings,
        activeBookings,
        availableVehicles,
        pendingPayments,
        lastUpdated: new Date()
      }
    });
  } catch (error) {
    console.error('Error fetching quick actions stats:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch stats' });
  }
});

export default router;
