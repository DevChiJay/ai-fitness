import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { verifyToken } from '@/lib/auth';
import { generateExerciseModifications, AIUtils } from '@/lib/ai/openai';
import User from '@/lib/models/User';

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

    // Connect to database
    await connectToDatabase();

    // Get user for fitness level context
    const user = await User.findById(decoded.userId).select('fitnessProfile');

    // Parse request body
    const body = await request.json();
    const {
      exerciseName,
      injury,
      fitnessLevel
    } = body;

    // Validate required fields
    if (!exerciseName || !injury) {
      return NextResponse.json(
        { error: 'Exercise name and injury/limitation are required' },
        { status: 400 }
      );
    }

    // Determine fitness level
    let userFitnessLevel = fitnessLevel;
    if (!userFitnessLevel && user?.fitnessProfile?.fitnessLevel) {
      userFitnessLevel = user.fitnessProfile.fitnessLevel;
    }
    if (!userFitnessLevel) {
      userFitnessLevel = 'intermediate';
    }

    // Validate fitness level
    const validFitnessLevels = ['beginner', 'intermediate', 'advanced'];
    if (!validFitnessLevels.includes(userFitnessLevel)) {
      return NextResponse.json(
        { error: 'Invalid fitness level' },
        { status: 400 }
      );
    }

    // Sanitize inputs
    const sanitizedExercise = AIUtils.sanitizeInput(exerciseName);
    const sanitizedInjury = AIUtils.sanitizeInput(injury);

    // Generate exercise modifications
    const modificationsJson = await generateExerciseModifications(
      sanitizedExercise,
      sanitizedInjury,
      userFitnessLevel
    );
    
    const modifications = AIUtils.parseResponse(modificationsJson);

    return NextResponse.json({
      success: true,
      modifications,
      originalExercise: sanitizedExercise,
      injury: sanitizedInjury,
      fitnessLevel: userFitnessLevel
    });

  } catch (error) {
    console.error('Error generating exercise modifications:', error);
    
    if (error instanceof Error) {
      if (error.message.includes('Failed to generate exercise modifications')) {
        return NextResponse.json(
          { error: 'Unable to generate exercise modifications. Please consult a healthcare professional.' },
          { status: 500 }
        );
      }
      if (error.message.includes('Invalid AI response format')) {
        return NextResponse.json(
          { error: 'Generated modifications format is invalid. Please try again.' },
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
