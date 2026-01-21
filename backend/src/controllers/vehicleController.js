import Vehicle from '../models/Vehicle.js';

// Add new vehicle
export const addVehicle = async (req, res) => {
  try {
    const { 
      make, 
      model, 
      year, 
      color, 
      licensePlate, 
      status,
      dateOut, 
      timeOut, 
      dateIn, 
      timeIn, 
      dailyRate 
    } = req.body;

    // Validate required fields
    if (!make || !model || !year || !licensePlate || !dailyRate) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: make, model, year, licensePlate, and dailyRate are required'
      });
    }

    // Check for existing vehicle with same license plate
    const existingVehicle = await Vehicle.findOne({ 
      licensePlate: licensePlate.toUpperCase() 
    });

    if (existingVehicle) {
      return res.status(400).json({
        success: false,
        message: 'License plate already exists'
      });
    }

    // Validate date logic
    if (dateOut && dateIn && new Date(dateOut) > new Date(dateIn)) {
      return res.status(400).json({
        success: false,
        message: 'Date out cannot be after date in'
      });
    }

    if (status && !['Available', 'Booked', 'Maintenance'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status. Must be one of: Available, Booked, Maintenance'
      });
    }

    const vehicle = await Vehicle.create({
      make: make.trim(),
      model: model.trim(),
      year: parseInt(year),
      color: color ? color.trim() : undefined,
      licensePlate: licensePlate.toUpperCase(),
      status: status ? status.trim() : undefined,
      dateOut: dateOut ? new Date(dateOut) : undefined,
      timeOut: timeOut ? timeOut.trim() : undefined,
      dateIn: dateIn ? new Date(dateIn) : undefined,
      timeIn: timeIn ? timeIn.trim() : undefined,
      dailyRate: parseFloat(dailyRate)
    });

    return res.status(201).json({
      success: true,
      message: 'Vehicle added successfully',
      data: {
        _id: vehicle._id,
        make: vehicle.make,
        model: vehicle.model,
        year: vehicle.year,
        color: vehicle.color,
        licensePlate: vehicle.licensePlate,
        status: vehicle.status,
        dateOut: vehicle.dateOut,
        timeOut: vehicle.timeOut,
        dateIn: vehicle.dateIn,
        timeIn: vehicle.timeIn,
        dailyRate: vehicle.dailyRate
      }
    });

  } catch (error) {
    console.error('Error adding vehicle:', error);
    
    if (error.message.includes('already exists')) {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Failed to add vehicle. Please try again.'
    });
  }
};

// Update vehicle status only
export const updateVehicleStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status || !['Available', 'Booked', 'Maintenance'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status. Must be one of: Available, Booked, Maintenance'
      });
    }

    const vehicle = await Vehicle.findByIdAndUpdate(
      id,
      { status: status.trim() },
      { new: true, runValidators: true }
    ).lean();

    if (!vehicle) {
      return res.status(404).json({
        success: false,
        message: 'Vehicle not found'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Vehicle status updated successfully',
      data: vehicle
    });
  } catch (error) {
    console.error('Error updating vehicle status:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update vehicle status. Please try again.'
    });
  }
};

// Fetch all vehicles
export const getAllVehicles = async (req, res) => {
  try {
    const vehicles = await Vehicle.find({})
      .select('_id make model year color licensePlate status dateOut timeOut dateIn timeIn dailyRate createdAt')
      .sort({ createdAt: -1 })
      .lean();

    return res.status(200).json({
      success: true,
      count: vehicles.length,
      data: vehicles
    });

  } catch (error) {
    console.error('Error fetching vehicles:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch vehicles. Please try again.'
    });
  }
};

// Get single vehicle by ID
export const getVehicleById = async (req, res) => {
  try {
    const { id } = req.params;
    const vehicle = await Vehicle.findById(id).lean();

    if (!vehicle) {
      return res.status(404).json({
        success: false,
        message: 'Vehicle not found'
      });
    }

    return res.status(200).json({
      success: true,
      data: vehicle
    });

  } catch (error) {
    console.error('Error fetching vehicle:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch vehicle. Please try again.'
    });
  }
};

// Update vehicle
export const updateVehicle = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Check if license plate is being updated and if it already exists
    if (updateData.licensePlate) {
      const existingVehicle = await Vehicle.findOne({ 
        licensePlate: updateData.licensePlate.toUpperCase(),
        _id: { $ne: id }
      });

      if (existingVehicle) {
        return res.status(400).json({
          success: false,
          message: 'License plate already exists'
        });
      }

      updateData.licensePlate = updateData.licensePlate.toUpperCase();
    }

    const vehicle = await Vehicle.findByIdAndUpdate(
      id, 
      updateData, 
      { new: true, runValidators: true }
    ).lean();

    if (!vehicle) {
      return res.status(404).json({
        success: false,
        message: 'Vehicle not found'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Vehicle updated successfully',
      data: vehicle
    });

  } catch (error) {
    console.error('Error updating vehicle:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update vehicle. Please try again.'
    });
  }
};

// Delete vehicle
export const deleteVehicle = async (req, res) => {
  try {
    const { id } = req.params;
    const vehicle = await Vehicle.findByIdAndDelete(id);

    if (!vehicle) {
      return res.status(404).json({
        success: false,
        message: 'Vehicle not found'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Vehicle deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting vehicle:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to delete vehicle. Please try again.'
    });
  }
};
