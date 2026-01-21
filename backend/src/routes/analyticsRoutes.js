import express from 'express';
import Booking from '../models/Booking.js';
import Vehicle from '../models/Vehicle.js';
import Client from '../models/Client.js';
import { startOfDay, endOfDay, startOfMonth, endOfMonth, subDays, subMonths, format } from 'date-fns';

const router = express.Router();

// Get comprehensive dashboard analytics
router.get('/dashboard', async (req, res) => {
  try {
    const now = new Date();
    const thirtyDaysAgo = subDays(now, 30);
    const lastMonthStart = startOfMonth(subMonths(now, 1));
    const lastMonthEnd = endOfMonth(subMonths(now, 1));
    const thisMonthStart = startOfMonth(now);
    const thisMonthEnd = endOfMonth(now);

    // Parallel data fetching for better performance
    const [
      totalBookings,
      activeBookings,
      completedBookings,
      cancelledBookings,
      totalVehicles,
      availableVehicles,
      totalClients,
      activeClients,
      thisMonthBookings,
      lastMonthBookings,
      vehicleUtilization,
      revenueData,
      topClients,
      recentBookings
    ] = await Promise.all([
      // Booking counts
      Booking.countDocuments(),
      Booking.countDocuments({ status: 'Active' }),
      Booking.countDocuments({ status: 'Completed' }),
      Booking.countDocuments({ status: 'Cancelled' }),
      
      // Vehicle counts
      Vehicle.countDocuments(),
      Vehicle.countDocuments({ status: 'Available' }),
      
      // Client counts
      Client.countDocuments(),
      Client.countDocuments({ status: 'Active' }),
      
      // Monthly bookings comparison
      Booking.countDocuments({
        createdAt: { $gte: thisMonthStart, $lte: thisMonthEnd }
      }),
      Booking.countDocuments({
        createdAt: { $gte: lastMonthStart, $lte: lastMonthEnd }
      }),
      
      // Vehicle utilization
      Vehicle.aggregate([
        {
          $lookup: {
            from: 'bookings',
            localField: '_id',
            foreignField: 'vehicle',
            as: 'bookings'
          }
        },
        {
          $project: {
            make: 1,
            model: 1,
            licensePlate: 1,
            status: 1,
            dailyRate: 1,
            totalBookings: { $size: '$bookings' },
            activeBookings: {
              $size: {
                $filter: {
                  input: '$bookings',
                  cond: { $eq: ['$$this.status', 'Active'] }
                }
              }
            }
          }
        }
      ]),
      
      // Revenue data (simulated - would need payment integration)
      Booking.aggregate([
        {
          $match: {
            status: { $in: ['Active', 'Completed'] },
            createdAt: { $gte: subMonths(now, 6) }
          }
        },
        {
          $lookup: {
            from: 'vehicles',
            localField: 'vehicle',
            foreignField: '_id',
            as: 'vehicleInfo'
          }
        },
        {
          $unwind: '$vehicleInfo'
        },
        {
          $project: {
            month: { $dateToString: { format: '%Y-%m', date: '$createdAt' } },
            revenue: {
              $multiply: [
                '$vehicleInfo.dailyRate',
                { $divide: [{ $subtract: ['$endDate', '$startDate'] }, 1000 * 60 * 60 * 24] }
              ]
            }
          }
        },
        {
          $group: {
            _id: '$month',
            revenue: { $sum: '$revenue' }
          }
        },
        { $sort: { _id: 1 } }
      ]),
      
      // Top clients by booking count
      Booking.aggregate([
        {
          $match: { createdAt: { $gte: thirtyDaysAgo } }
        },
        {
          $lookup: {
            from: 'clients',
            localField: 'client',
            foreignField: '_id',
            as: 'clientInfo'
          }
        },
        {
          $lookup: {
            from: 'vehicles',
            localField: 'vehicle',
            foreignField: '_id',
            as: 'vehicleInfo'
          }
        },
        {
          $unwind: '$clientInfo'
        },
        {
          $unwind: '$vehicleInfo'
        },
        {
          $project: {
            clientName: '$clientInfo.name',
            clientEmail: '$clientInfo.email',
            vehicleMake: '$vehicleInfo.make',
            vehicleModel: '$vehicleInfo.model',
            startDate: 1,
            endDate: 1,
            status: 1,
            estimatedRevenue: {
              $multiply: [
                '$vehicleInfo.dailyRate',
                { $divide: [{ $subtract: ['$endDate', '$startDate'] }, 1000 * 60 * 60 * 24] }
              ]
            }
          }
        },
        {
          $group: {
            _id: '$clientName',
            totalBookings: { $sum: 1 },
            totalSpent: { $sum: '$estimatedRevenue' },
            email: { $first: '$clientEmail' }
          }
        },
        { $sort: { totalSpent: -1 } },
        { $limit: 10 }
      ]),
      
      // Recent bookings
      Booking.find({})
        .populate('client', 'name email')
        .populate('vehicle', 'make model licensePlate')
        .sort({ createdAt: -1 })
        .limit(10)
    ]);

    // Calculate trends
    const bookingTrend = thisMonthBookings - lastMonthBookings;
    const bookingTrendPercent = lastMonthBookings > 0 
      ? ((bookingTrend / lastMonthBookings) * 100).toFixed(1)
      : 0;

    // Format revenue data
    const formattedRevenueData = revenueData.map(item => ({
      month: format(new Date(item._id + '-01'), 'MMM'),
      revenue: Math.round(item.revenue)
    }));

    // Calculate vehicle utilization rates
    const utilizationData = vehicleUtilization.map(vehicle => {
      const utilizationRate = vehicle.totalBookings > 0 
        ? Math.min(100, (vehicle.activeBookings / vehicle.totalBookings) * 100)
        : 0;
      
      return {
        ...vehicle,
        utilizationRate: Math.round(utilizationRate)
      };
    });

    res.json({
      summary: {
        totalBookings,
        activeBookings,
        completedBookings,
        cancelledBookings,
        totalVehicles,
        availableVehicles,
        totalClients,
        activeClients,
        bookingTrend: {
          value: bookingTrend,
          percentage: parseFloat(bookingTrendPercent)
        }
      },
      revenue: formattedRevenueData,
      vehicleUtilization: utilizationData,
      topClients,
      recentBookings,
      lastUpdated: new Date()
    });
  } catch (error) {
    console.error('Analytics dashboard error:', error);
    res.status(500).json({ error: 'Failed to fetch analytics data' });
  }
});

// Get financial analytics
router.get('/financial', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const start = startDate ? new Date(startDate) : startOfMonth(subDays(new Date(), 90));
    const end = endDate ? new Date(endDate) : endOfDay(new Date());

    const financialData = await Booking.aggregate([
      {
        $match: {
          createdAt: { $gte: start, $lte: end },
          status: { $in: ['Active', 'Completed'] }
        }
      },
      {
        $lookup: {
          from: 'vehicles',
          localField: 'vehicle',
          foreignField: '_id',
          as: 'vehicleInfo'
        }
      },
      {
        $unwind: '$vehicleInfo'
      },
      {
        $project: {
          month: { $dateToString: { format: '%Y-%m', date: '$createdAt' } },
          revenue: {
            $multiply: [
              '$vehicleInfo.dailyRate',
              { $divide: [{ $subtract: ['$endDate', '$startDate'] }, 1000 * 60 * 60 * 24] }
            ]
          },
          expenses: { $multiply: ['$vehicleInfo.dailyRate', 0.3] } // Simulated expenses
        }
      },
      {
        $group: {
          _id: '$month',
          revenue: { $sum: '$revenue' },
          expenses: { $sum: '$expenses' }
        }
      },
      {
        $project: {
          month: '$_id',
          revenue: 1,
          expenses: 1,
          profit: { $subtract: ['$revenue', '$expenses'] }
        }
      },
      { $sort: { month: 1 } }
    ]);

    const formattedData = financialData.map(item => ({
      name: format(new Date(item.month + '-01'), 'MMM'),
      revenue: Math.round(item.revenue),
      expenses: Math.round(item.expenses),
      profit: Math.round(item.profit)
    }));

    res.json(formattedData);
  } catch (error) {
    console.error('Financial analytics error:', error);
    res.status(500).json({ error: 'Failed to fetch financial data' });
  }
});

// Get vehicle performance analytics
router.get('/vehicles', async (req, res) => {
  try {
    const vehiclePerformance = await Vehicle.aggregate([
      {
        $lookup: {
          from: 'bookings',
          localField: '_id',
          foreignField: 'vehicle',
          as: 'bookings'
        }
      },
      {
        $project: {
          make: 1,
          model: 1,
          licensePlate: 1,
          status: 1,
          dailyRate: 1,
          totalBookings: { $size: '$bookings' },
          activeBookings: {
            $size: {
              $filter: {
                input: '$bookings',
                cond: { $eq: ['$$this.status', 'Active'] }
              }
            }
          },
          completedBookings: {
            $size: {
              $filter: {
                input: '$bookings',
                cond: { $eq: ['$$this.status', 'Completed'] }
              }
            }
          },
          totalRevenue: {
            $sum: {
              $map: {
                input: '$bookings',
                as: 'booking',
                in: {
                  $multiply: [
                    '$dailyRate',
                    { $divide: [{ $subtract: ['$$booking.endDate', '$$booking.startDate'] }, 1000 * 60 * 60 * 24] }
                  ]
                }
              }
            }
          }
        }
      },
      { $sort: { totalRevenue: -1 } }
    ]);

    res.json(vehiclePerformance);
  } catch (error) {
    console.error('Vehicle analytics error:', error);
    res.status(500).json({ error: 'Failed to fetch vehicle analytics' });
  }
});

// Get client analytics
router.get('/clients', async (req, res) => {
  try {
    const { limit = 20 } = req.query;
    const thirtyDaysAgo = subDays(new Date(), 30);

    const clientAnalytics = await Client.aggregate([
      {
        $lookup: {
          from: 'bookings',
          localField: '_id',
          foreignField: 'client',
          as: 'bookings'
        }
      },
      {
        $project: {
          name: 1,
          email: 1,
          phone: 1,
          status: 1,
          totalBookings: { $size: '$bookings' },
          recentBookings: {
            $size: {
              $filter: {
                input: '$bookings',
                cond: { $gte: ['$$this.createdAt', thirtyDaysAgo] }
              }
            }
          },
          totalSpent: {
            $sum: {
              $map: {
                input: '$bookings',
                as: 'booking',
                in: {
                  $multiply: [
                    { $ifNull: ['$$booking.estimatedRevenue', 1000] }, // Fallback revenue
                    1
                  ]
                }
              }
            }
          },
          lastBookingDate: { $max: '$bookings.createdAt' }
        }
      },
      { $sort: { totalSpent: -1 } },
      { $limit: parseInt(limit) }
    ]);

    res.json(clientAnalytics);
  } catch (error) {
    console.error('Client analytics error:', error);
    res.status(500).json({ error: 'Failed to fetch client analytics' });
  }
});

// Real-time metrics (for live dashboard updates)
router.get('/realtime', async (req, res) => {
  try {
    const now = new Date();
    const todayStart = startOfDay(now);
    const todayEnd = endOfDay(now);

    const [
      todayBookings,
      activeBookingsCount,
      availableVehiclesCount,
      recentActivity
    ] = await Promise.all([
      Booking.countDocuments({
        createdAt: { $gte: todayStart, $lte: todayEnd }
      }),
      Booking.countDocuments({ status: 'Active' }),
      Vehicle.countDocuments({ status: 'Available' }),
      Booking.find({})
        .populate('client', 'name')
        .populate('vehicle', 'make model')
        .sort({ createdAt: -1 })
        .limit(5)
    ]);

    res.json({
      timestamp: now,
      todayBookings,
      activeBookings: activeBookingsCount,
      availableVehicles: availableVehiclesCount,
      recentActivity: recentActivity.map(booking => ({
        id: booking._id,
        client: booking.client.name,
        vehicle: `${booking.vehicle.make} ${booking.vehicle.model}`,
        status: booking.status,
        time: booking.createdAt
      }))
    });
  } catch (error) {
    console.error('Real-time analytics error:', error);
    res.status(500).json({ error: 'Failed to fetch real-time data' });
  }
});

export default router;
