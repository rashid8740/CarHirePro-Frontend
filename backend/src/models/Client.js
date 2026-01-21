import mongoose from 'mongoose';

const clientSchema = new mongoose.Schema(
  {
    fullName: { 
      type: String, 
      required: [true, 'Full name is required'],
      trim: true,
      minlength: [2, 'Full name must be at least 2 characters']
    },
    idOrPassport: { 
      type: String, 
      required: [true, 'ID or Passport is required'],
      unique: true,
      trim: true,
      uppercase: true
    },
    phone: { 
      type: String, 
      required: [true, 'Phone number is required'],
      unique: true,
      trim: true,
      match: [/^[0-9+\-\s()]+$/, 'Please enter a valid phone number']
    },
    address: { 
      type: String, 
      trim: true,
      maxlength: [200, 'Address cannot exceed 200 characters']
    },
    citizenship: { 
      type: String, 
      required: [true, 'Citizenship is required'],
      trim: true
    },
    licenseNumber: { 
      type: String, 
      required: [true, 'License number is required'],
      unique: true,
      trim: true,
      uppercase: true
    },
    status: { 
      type: String, 
      enum: ['ACTIVE', 'SUSPENDED'], 
      default: 'ACTIVE',
      required: true
    }
  },
  { 
    timestamps: true,
    collection: 'clients'
  }
);

// Custom validation for duplicate entries
clientSchema.post('save', function(error, doc, next) {
  if (error.name === 'MongoError' && error.code === 11000) {
    const field = Object.keys(error.keyPattern)[0];
    let message = 'Duplicate entry';
    
    switch (field) {
      case 'idOrPassport':
        message = 'ID or Passport number already exists';
        break;
      case 'phone':
        message = 'Phone number already exists';
        break;
      case 'licenseNumber':
        message = 'License number already exists';
        break;
    }
    
    next(new Error(message));
  } else {
    next(error);
  }
});

export default mongoose.model('Client', clientSchema);
