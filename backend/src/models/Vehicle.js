import mongoose from 'mongoose';

const vehicleSchema = new mongoose.Schema(
  {
    make: { 
      type: String, 
      required: [true, 'Make is required'],
      trim: true,
      minlength: [2, 'Make must be at least 2 characters']
    },
    model: { 
      type: String, 
      required: [true, 'Model is required'],
      trim: true,
      minlength: [2, 'Model must be at least 2 characters']
    },
    year: { 
      type: Number, 
      required: [true, 'Year is required'],
      min: [1900, 'Year must be after 1900'],
      max: [new Date().getFullYear() + 1, 'Year cannot be in the future']
    },
    color: { 
      type: String, 
      trim: true,
      maxlength: [50, 'Color cannot exceed 50 characters']
    },
    licensePlate: { 
      type: String, 
      required: [true, 'License plate is required'],
      unique: true,
      trim: true,
      uppercase: true,
      match: [/^[A-Z0-9\s-]+$/, 'License plate must contain only letters, numbers, spaces, and hyphens']
    },
    status: {
      type: String,
      enum: ['Available', 'Booked', 'Maintenance'],
      default: 'Available',
      trim: true
    },
    dateOut: { 
      type: Date 
    },
    timeOut: { 
      type: String,
      match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Time must be in HH:MM format']
    },
    dateIn: { 
      type: Date 
    },
    timeIn: { 
      type: String,
      match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Time must be in HH:MM format']
    },
    dailyRate: { 
      type: Number, 
      required: [true, 'Daily rate is required'],
      min: [0, 'Daily rate cannot be negative']
    }
  },
  { 
    timestamps: true,
    collection: 'vehicles'
  }
);

// Custom validation for duplicate license plates
vehicleSchema.post('save', function(error, doc, next) {
  if (error.name === 'MongoError' && error.code === 11000) {
    next(new Error('License plate already exists'));
  } else {
    next(error);
  }
});

// Index for better query performance
const VehicleSchema = new mongoose.Schema({
  licensePlate: { type: String, required: true, unique: true }, // No need for index:true
});

export default mongoose.model('Vehicle', vehicleSchema);