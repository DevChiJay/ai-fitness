import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { verifyToken } from '@/lib/auth';
import User from '@/lib/models/User';
import { z } from 'zod';

// Validation schema for profile updates
const updateProfileSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name too long').optional(),
  email: z.string().email('Invalid email format').optional(),
  fitnessProfile: z.object({
    age: z.number().min(13).max(120).optional(),
    weight: z.number().min(30).max(300).optional(),
    height: z.number().min(100).max(250).optional(),
    fitnessLevel: z.enum(['beginner', 'intermediate', 'advanced']).optional(),
    activityLevel: z.enum(['sedentary', 'lightly_active', 'moderately_active', 'very_active', 'extremely_active']).optional(),
    goals: z.array(z.string()).optional(),
    injuries: z.array(z.string()).optional(),
    allergies: z.array(z.string()).optional(),
    dietaryRestrictions: z.array(z.string()).optional(),
    preferredWorkoutTypes: z.array(z.string()).optional(),
  }).optional(),
}).refine(data => Object.keys(data).length > 0, {
  message: "At least one field must be provided for update"
});

export async function PUT(request: NextRequest) {
  try {
    // Verify authentication
    const token = request.cookies.get('auth-token')?.value;
    if (!token) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json(
        { error: 'Invalid authentication token' },
        { status: 401 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    
    let validatedData;
    try {
      validatedData = updateProfileSchema.parse(body);
    } catch (validationError) {
      if (validationError instanceof z.ZodError) {
        return NextResponse.json(
          { 
            error: 'Validation failed', 
            details: validationError.errors.map(err => ({
              field: err.path.join('.'),
              message: err.message
            }))
          },
          { status: 400 }
        );
      }
      throw validationError;
    }

    // Connect to database
    await connectToDatabase();

    // Check if email is being updated and if it's already taken
    if (validatedData.email) {
      const existingUser = await User.findOne({ 
        email: validatedData.email,
        _id: { $ne: decoded.userId }
      });
      
      if (existingUser) {
        return NextResponse.json(
          { error: 'Email already in use' },
          { status: 400 }
        );
      }
    }

    // Prepare update data
    const updateData: any = {};
    
    if (validatedData.name) {
      updateData.name = validatedData.name;
    }
    
    if (validatedData.email) {
      updateData.email = validatedData.email;
    }
    
    if (validatedData.fitnessProfile) {
      updateData.fitnessProfile = validatedData.fitnessProfile;
    }

    updateData.updatedAt = new Date();    // Update user in database
    const updatedUser = await User.findByIdAndUpdate(
      decoded.userId,
      { $set: updateData },
      { new: true, runValidators: true }
    ).select('-password').lean() as any;

    if (!updatedUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Format user data for frontend
    const userData = {
      id: updatedUser._id.toString(),
      email: updatedUser.email,
      name: updatedUser.name,
      fitnessProfile: updatedUser.fitnessProfile,
      programs: updatedUser.programs?.map((id: any) => id.toString()) || [],
      createdAt: updatedUser.createdAt,
      updatedAt: updatedUser.updatedAt,
    };

    return NextResponse.json({
      success: true,
      user: userData,
      message: 'Profile updated successfully'
    });

  } catch (error) {
    console.error('Error updating profile:', error);
    
    if (error instanceof Error) {
      if (error.message.includes('validation failed')) {
        return NextResponse.json(
          { error: 'Invalid data provided' },
          { status: 400 }
        );
      }
      if (error.message.includes('duplicate key')) {
        return NextResponse.json(
          { error: 'Email already in use' },
          { status: 400 }
        );
      }
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
