import mongoose, { Document, Schema } from 'mongoose';

// Define interfaces for TypeScript
export interface IFitnessProfile {
  age?: number;
  weight?: number; // in kg
  height?: number; // in cm
  fitnessLevel?: 'beginner' | 'intermediate' | 'advanced';
  goals?: string[];
  injuries?: string[];
  allergies?: string[];
  dietaryRestrictions?: string[];
  activityLevel?: 'sedentary' | 'lightly_active' | 'moderately_active' | 'very_active' | 'extremely_active';
  preferredWorkoutTypes?: string[];
  workoutFrequency?: number; // times per week
}

export interface IUser extends Document {
  _id: string;
  email: string;
  password: string;
  name: string;
  fitnessProfile?: IFitnessProfile;
  programs: mongoose.Types.ObjectId[];
  isEmailVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Define the Fitness Profile schema
const FitnessProfileSchema = new Schema<IFitnessProfile>({
  age: {
    type: Number,
    min: 13,
    max: 120,
  },
  weight: {
    type: Number,
    min: 20,
    max: 500,
  },
  height: {
    type: Number,
    min: 100,
    max: 250,
  },
  fitnessLevel: {
    type: String,
    enum: ['beginner', 'intermediate', 'advanced'],
    default: 'beginner',
  },
  goals: [{
    type: String,
    trim: true,
  }],
  injuries: [{
    type: String,
    trim: true,
  }],
  allergies: [{
    type: String,
    trim: true,
  }],
  dietaryRestrictions: [{
    type: String,
    trim: true,
  }],
  activityLevel: {
    type: String,
    enum: ['sedentary', 'lightly_active', 'moderately_active', 'very_active', 'extremely_active'],
    default: 'moderately_active',
  },
  preferredWorkoutTypes: [{
    type: String,
    trim: true,
  }],
  workoutFrequency: {
    type: Number,
    min: 1,
    max: 7,
    default: 3,
  },
});

// Define the User schema
const UserSchema = new Schema<IUser>({
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [
      /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
      'Please enter a valid email address',
    ],
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters long'],
  },
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    maxlength: [50, 'Name cannot be longer than 50 characters'],
  },
  fitnessProfile: {
    type: FitnessProfileSchema,
    default: {},
  },
  programs: [{
    type: Schema.Types.ObjectId,
    ref: 'Program',
  }],
  isEmailVerified: {
    type: Boolean,
    default: false,
  },
}, {
  timestamps: true,
});

// Add indexes for better query performance
UserSchema.index({ createdAt: -1 });

// Add methods to the schema
UserSchema.methods.toJSON = function() {
  const userObject = this.toObject();
  delete userObject.password; // Remove password from JSON output
  return userObject;
};

// Static method to find user by email
UserSchema.statics.findByEmail = function(email: string) {
  return this.findOne({ email: email.toLowerCase() });
};

// Virtual for user's full fitness profile completion percentage
UserSchema.virtual('profileCompleteness').get(function() {
  if (!this.fitnessProfile) return 0;
  
  const fields = ['age', 'weight', 'height', 'fitnessLevel', 'goals', 'activityLevel'];
  const completedFields = fields.filter(field => {
    const value = this.fitnessProfile![field as keyof IFitnessProfile];
    return value !== undefined && value !== null && 
           (Array.isArray(value) ? value.length > 0 : true);
  });
  
  return Math.round((completedFields.length / fields.length) * 100);
});

// Ensure virtual fields are serialized
UserSchema.set('toJSON', {
  virtuals: true,
  transform: function(doc, ret) {
    delete ret.password;
    return ret;
  }
});

// Create and export the model
const User = mongoose.models.User || mongoose.model<IUser>('User', UserSchema);

export default User;
