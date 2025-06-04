import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { verifyToken } from '@/lib/auth';
import { generateQuickWorkout, AIUtils } from '@/lib/ai/openai';

export async function POST(request: NextRequest) {
  try {
    // Check if AI is configured
    if (!AIUtils.isConfigured()) {
      return NextResponse.json(
        { error: 'AI service is not configured. Please check OpenAI API key.' },
        { status: 503 }
      );
    }

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

    // Connect to database (for potential future logging)
    await connectToDatabase();

    // Parse request body
    const body = await request.json();
    const {
      timeAvailable,
      equipment = [],
      targetMuscles = [],
      fitnessLevel = 'intermediate'
    } = body;

    // Validate required fields
    if (!timeAvailable || timeAvailable < 5 || timeAvailable > 120) {
      return NextResponse.json(
        { error: 'Time available must be between 5 and 120 minutes' },
        { status: 400 }
      );
    }

    // Validate fitness level
    const validFitnessLevels = ['beginner', 'intermediate', 'advanced'];
    if (!validFitnessLevels.includes(fitnessLevel)) {
      return NextResponse.json(
        { error: 'Invalid fitness level' },
        { status: 400 }
      );
    }

    // Sanitize inputs
    const sanitizedEquipment = Array.isArray(equipment) 
      ? equipment.map(AIUtils.sanitizeInput) 
      : [];
    const sanitizedTargetMuscles = Array.isArray(targetMuscles) 
      ? targetMuscles.map(AIUtils.sanitizeInput) 
      : [];

    // Generate quick workout
    const quickWorkoutJson = await generateQuickWorkout(
      timeAvailable,
      sanitizedEquipment,
      sanitizedTargetMuscles,
      fitnessLevel
    );
    
    const quickWorkout = AIUtils.parseResponse(quickWorkoutJson);

    return NextResponse.json({
      success: true,
      quickWorkout,
      requestedTime: timeAvailable,
      equipment: sanitizedEquipment,
      targetMuscles: sanitizedTargetMuscles,
      fitnessLevel
    });

  } catch (error) {
    console.error('Error generating quick workout:', error);
    
    if (error instanceof Error) {
      if (error.message.includes('Failed to generate quick workout')) {
        return NextResponse.json(
          { error: 'Unable to generate quick workout. Please try again with different parameters.' },
          { status: 500 }
        );
      }
      if (error.message.includes('Invalid AI response format')) {
        return NextResponse.json(
          { error: 'Generated workout format is invalid. Please try again.' },
          { status: 500 }
        );
      }
    }

    return NextResponse.json(
      { error: 'Internal server error. Please try again later.' },
      { status: 500 }
    );
  }
}
