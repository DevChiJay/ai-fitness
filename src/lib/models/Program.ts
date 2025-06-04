import mongoose, { Document, Schema } from 'mongoose';

// Exercise interface for individual exercises
export interface IExercise {
  name: string;
  sets?: number;
  reps?: string; // Can be "10", "8-12", "AMRAP", etc.
  weight?: string; // Can be "bodyweight", "50kg", "progressive", etc.
  duration?: string; // For time-based exercises like "30s", "2min"
  restTime?: string; // Rest between sets "60s", "2min"
  instructions?: string;
  targetMuscles?: string[];
  equipment?: string[];
  difficulty?: 'easy' | 'moderate' | 'hard';
  videoUrl?: string;
  imageUrl?: string;
}

// Workout interface for daily workouts
export interface IWorkout {
  name: string;
  description?: string;
  exercises: IExercise[];
  estimatedDuration?: number; // in minutes
  targetCaloriesBurn?: number;
  workoutType?: 'strength' | 'cardio' | 'flexibility' | 'sports' | 'mixed';
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
  equipmentNeeded?: string[];
  warmupInstructions?: string;
  cooldownInstructions?: string;
  notes?: string;
}

// Meal interface for nutrition plan
export interface IMeal {
  name: string;
  mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  calories?: number;
  macros?: {
    protein?: number; // in grams
    carbs?: number; // in grams
    fat?: number; // in grams
    fiber?: number; // in grams
  };
  ingredients: string[];
  instructions?: string;
  prepTime?: number; // in minutes
  servings?: number;
  allergens?: string[];
  imageUrl?: string;
  recipeUrl?: string;
}

// Nutrition plan interface
export interface INutritionPlan {
  dailyCalorieTarget?: number;
  macroTargets?: {
    proteinPercentage?: number;
    carbsPercentage?: number;
    fatPercentage?: number;
  };
  meals: IMeal[];
  supplements?: string[];
  hydrationGoal?: number; // in liters
  specialInstructions?: string;
  mealTiming?: {
    breakfast?: string;
    lunch?: string;
    dinner?: string;
    snacks?: string[];
  };
}

// Progress tracking interface
export interface IProgressEntry {
  date: Date;
  weight?: number;
  bodyFatPercentage?: number;
  measurements?: {
    chest?: number;
    waist?: number;
    hips?: number;
    arms?: number;
    thighs?: number;
  };
  workoutCompleted?: boolean;
  notes?: string;
  photos?: string[];
  mood?: 'excellent' | 'good' | 'okay' | 'poor';
  energyLevel?: 'high' | 'medium' | 'low';
}

// Main Program interface
export interface IProgram extends Document {
  _id: string;
  userId: mongoose.Types.ObjectId;
  title: string;
  description?: string;
  programType: 'weight_loss' | 'muscle_gain' | 'strength' | 'endurance' | 'general_fitness' | 'rehabilitation';
  duration: number; // in weeks
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  
  // Workout plan
  workouts: IWorkout[];
  workoutSchedule?: {
    monday?: string; // workout name or "rest"
    tuesday?: string;
    wednesday?: string;
    thursday?: string;
    friday?: string;
    saturday?: string;
    sunday?: string;
  };
  
  // Nutrition plan
  nutritionPlan?: INutritionPlan;
  
  // Progress tracking
  progressEntries: IProgressEntry[];
  
  // Program status
  status: 'draft' | 'active' | 'completed' | 'paused';
  startDate?: Date;
  endDate?: Date;
  completionPercentage?: number;
  
  // AI generation metadata
  generatedBy?: 'ai' | 'manual' | 'template';
  aiPrompt?: string;
  aiModel?: string;
  
  // Program settings
  isPublic?: boolean;
  tags?: string[];
  
  createdAt: Date;
  updatedAt: Date;
}

// Exercise schema
const ExerciseSchema = new Schema<IExercise>({
  name: {
    type: String,
    required: [true, 'Exercise name is required'],
    trim: true,
  },
  sets: {
    type: Number,
    min: 1,
    max: 20,
  },
  reps: {
    type: String,
    trim: true,
  },
  weight: {
    type: String,
    trim: true,
  },
  duration: {
    type: String,
    trim: true,
  },
  restTime: {
    type: String,
    trim: true,
    default: '60s',
  },
  instructions: {
    type: String,
    trim: true,
  },
  targetMuscles: [{
    type: String,
    trim: true,
  }],
  equipment: [{
    type: String,
    trim: true,
  }],
  difficulty: {
    type: String,
    enum: ['easy', 'moderate', 'hard'],
    default: 'moderate',
  },
  videoUrl: {
    type: String,
    trim: true,
  },
  imageUrl: {
    type: String,
    trim: true,
  },
});

// Workout schema
const WorkoutSchema = new Schema<IWorkout>({
  name: {
    type: String,
    required: [true, 'Workout name is required'],
    trim: true,
  },
  description: {
    type: String,
    trim: true,
  },
  exercises: [ExerciseSchema],
  estimatedDuration: {
    type: Number,
    min: 5,
    max: 300, // 5 hours max
  },
  targetCaloriesBurn: {
    type: Number,
    min: 0,
  },
  workoutType: {
    type: String,
    enum: ['strength', 'cardio', 'flexibility', 'sports', 'mixed'],
    default: 'mixed',
  },
  difficulty: {
    type: String,
    enum: ['beginner', 'intermediate', 'advanced'],
    default: 'beginner',
  },
  equipmentNeeded: [{
    type: String,
    trim: true,
  }],
  warmupInstructions: {
    type: String,
    trim: true,
  },
  cooldownInstructions: {
    type: String,
    trim: true,
  },
  notes: {
    type: String,
    trim: true,
  },
});

// Meal schema
const MealSchema = new Schema<IMeal>({
  name: {
    type: String,
    required: [true, 'Meal name is required'],
    trim: true,
  },
  mealType: {
    type: String,
    enum: ['breakfast', 'lunch', 'dinner', 'snack'],
    required: true,
  },
  calories: {
    type: Number,
    min: 0,
  },
  macros: {
    protein: { type: Number, min: 0 },
    carbs: { type: Number, min: 0 },
    fat: { type: Number, min: 0 },
    fiber: { type: Number, min: 0 },
  },
  ingredients: [{
    type: String,
    required: true,
    trim: true,
  }],
  instructions: {
    type: String,
    trim: true,
  },
  prepTime: {
    type: Number,
    min: 0,
  },
  servings: {
    type: Number,
    min: 1,
    default: 1,
  },
  allergens: [{
    type: String,
    trim: true,
  }],
  imageUrl: {
    type: String,
    trim: true,
  },
  recipeUrl: {
    type: String,
    trim: true,
  },
});

// Nutrition plan schema
const NutritionPlanSchema = new Schema<INutritionPlan>({
  dailyCalorieTarget: {
    type: Number,
    min: 800,
    max: 5000,
  },
  macroTargets: {
    proteinPercentage: { type: Number, min: 10, max: 50 },
    carbsPercentage: { type: Number, min: 20, max: 70 },
    fatPercentage: { type: Number, min: 15, max: 50 },
  },
  meals: [MealSchema],
  supplements: [{
    type: String,
    trim: true,
  }],
  hydrationGoal: {
    type: Number,
    min: 1,
    max: 10,
    default: 2.5,
  },
  specialInstructions: {
    type: String,
    trim: true,
  },
  mealTiming: {
    breakfast: { type: String, trim: true },
    lunch: { type: String, trim: true },
    dinner: { type: String, trim: true },
    snacks: [{ type: String, trim: true }],
  },
});

// Progress entry schema
const ProgressEntrySchema = new Schema<IProgressEntry>({
  date: {
    type: Date,
    required: true,
    default: Date.now,
  },
  weight: {
    type: Number,
    min: 20,
    max: 500,
  },
  bodyFatPercentage: {
    type: Number,
    min: 1,
    max: 50,
  },
  measurements: {
    chest: { type: Number, min: 0 },
    waist: { type: Number, min: 0 },
    hips: { type: Number, min: 0 },
    arms: { type: Number, min: 0 },
    thighs: { type: Number, min: 0 },
  },
  workoutCompleted: {
    type: Boolean,
    default: false,
  },
  notes: {
    type: String,
    trim: true,
  },
  photos: [{
    type: String,
    trim: true,
  }],
  mood: {
    type: String,
    enum: ['excellent', 'good', 'okay', 'poor'],
  },
  energyLevel: {
    type: String,
    enum: ['high', 'medium', 'low'],
  },
});

// Main Program schema
const ProgramSchema = new Schema<IProgram>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required'],
  },
  title: {
    type: String,
    required: [true, 'Program title is required'],
    trim: true,
    maxlength: [100, 'Title cannot be longer than 100 characters'],
  },
  description: {
    type: String,
    trim: true,
    maxlength: [1000, 'Description cannot be longer than 1000 characters'],
  },
  programType: {
    type: String,
    enum: ['weight_loss', 'muscle_gain', 'strength', 'endurance', 'general_fitness', 'rehabilitation'],
    required: [true, 'Program type is required'],
  },
  duration: {
    type: Number,
    required: [true, 'Program duration is required'],
    min: [1, 'Duration must be at least 1 week'],
    max: [52, 'Duration cannot exceed 52 weeks'],
  },
  difficulty: {
    type: String,
    enum: ['beginner', 'intermediate', 'advanced'],
    required: [true, 'Difficulty level is required'],
  },
  workouts: [WorkoutSchema],
  workoutSchedule: {
    monday: { type: String, trim: true },
    tuesday: { type: String, trim: true },
    wednesday: { type: String, trim: true },
    thursday: { type: String, trim: true },
    friday: { type: String, trim: true },
    saturday: { type: String, trim: true },
    sunday: { type: String, trim: true },
  },
  nutritionPlan: NutritionPlanSchema,
  progressEntries: [ProgressEntrySchema],
  status: {
    type: String,
    enum: ['draft', 'active', 'completed', 'paused'],
    default: 'draft',
  },
  startDate: {
    type: Date,
  },
  endDate: {
    type: Date,
  },
  completionPercentage: {
    type: Number,
    min: 0,
    max: 100,
    default: 0,
  },
  generatedBy: {
    type: String,
    enum: ['ai', 'manual', 'template'],
    default: 'manual',
  },
  aiPrompt: {
    type: String,
    trim: true,
  },
  aiModel: {
    type: String,
    trim: true,
  },
  isPublic: {
    type: Boolean,
    default: false,
  },
  tags: [{
    type: String,
    trim: true,
  }],
}, {
  timestamps: true,
});

// Add indexes for better performance
ProgramSchema.index({ userId: 1 });
ProgramSchema.index({ status: 1 });
ProgramSchema.index({ programType: 1 });
ProgramSchema.index({ difficulty: 1 });
ProgramSchema.index({ createdAt: -1 });
ProgramSchema.index({ tags: 1 });

// Add virtual for program progress
ProgramSchema.virtual('isActive').get(function() {
  return this.status === 'active' && 
         this.startDate && 
         this.startDate <= new Date() && 
         (!this.endDate || this.endDate >= new Date());
});

// Add virtual for remaining days
ProgramSchema.virtual('remainingDays').get(function() {
  if (!this.endDate) return null;
  const today = new Date();
  const diffTime = this.endDate.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return Math.max(0, diffDays);
});

// Add virtual for total workouts
ProgramSchema.virtual('totalWorkouts').get(function() {
  return this.workouts.length;
});

// Instance method to start program
ProgramSchema.methods.startProgram = function() {
  this.status = 'active';
  this.startDate = new Date();
  this.endDate = new Date();
  this.endDate.setWeeks(this.endDate.getWeeks() + this.duration);
  return this.save();
};

// Instance method to add progress entry
ProgramSchema.methods.addProgressEntry = function(progressData: Partial<IProgressEntry>) {
  this.progressEntries.push(progressData);
  return this.save();
};

// Static method to find programs by user
ProgramSchema.statics.findByUser = function(userId: string) {
  return this.find({ userId }).sort({ createdAt: -1 });
};

// Static method to find active programs
ProgramSchema.statics.findActivePrograms = function(userId: string) {
  return this.find({ 
    userId, 
    status: 'active',
    startDate: { $lte: new Date() }
  });
};

// Ensure virtual fields are serialized
ProgramSchema.set('toJSON', {
  virtuals: true,
});

// Add helper method to Date prototype for adding weeks
declare global {
  interface Date {
    setWeeks(weeks: number): void;
    getWeeks(): number;
  }
}

Date.prototype.setWeeks = function(weeks: number) {
  this.setDate(this.getDate() + (weeks * 7));
};

Date.prototype.getWeeks = function() {
  return Math.floor(this.getDate() / 7);
};

// Create and export the model
const Program = mongoose.models.Program || mongoose.model<IProgram>('Program', ProgramSchema);

export default Program;
