import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { verifyToken } from '@/lib/auth';
import { generateWorkoutPlan, WorkoutGenerationOptions, AIUtils } from '@/lib/ai/openai';
import User from '@/lib/models/User';
import Program from '@/lib/models/Program';

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

    // Get user with fitness profile
    const user = await User.findById(decoded.userId).select('fitnessProfile email name');
    if (!user || !user.fitnessProfile) {
      return NextResponse.json(
        { error: 'User fitness profile not found. Please complete your profile first.' },
        { status: 400 }
      );
    }

    // Parse request body
    const body = await request.json();
    const {
      programType,
      duration = 4,
      difficulty,
      workoutsPerWeek = 3,
      equipment = [],
      timePerWorkout = 60,
      specificGoals = '',
      saveAsProgram = false,
      programName = ''
    } = body;

    // Validate required fields
    if (!programType || !difficulty) {
      return NextResponse.json(
        { error: 'Program type and difficulty are required' },
        { status: 400 }
      );
    }

    // Validate programType
    const validProgramTypes = ['weight_loss', 'muscle_gain', 'strength', 'endurance', 'general_fitness', 'rehabilitation'];
    if (!validProgramTypes.includes(programType)) {
      return NextResponse.json(
        { error: 'Invalid program type' },
        { status: 400 }
      );
    }

    // Validate difficulty
    const validDifficulties = ['beginner', 'intermediate', 'advanced'];
    if (!validDifficulties.includes(difficulty)) {
      return NextResponse.json(
        { error: 'Invalid difficulty level' },
        { status: 400 }
      );
    }

    // Prepare workout generation options
    const options: WorkoutGenerationOptions = {
      userProfile: user.fitnessProfile,
      programType,
      duration: Math.max(1, Math.min(52, duration)), // Limit to 1-52 weeks
      difficulty,
      workoutsPerWeek: Math.max(1, Math.min(7, workoutsPerWeek)), // Limit to 1-7 workouts per week
      equipment: Array.isArray(equipment) ? equipment.map(AIUtils.sanitizeInput) : [],
      timePerWorkout: Math.max(10, Math.min(180, timePerWorkout)), // Limit to 10-180 minutes
      specificGoals: AIUtils.sanitizeInput(specificGoals)
    };

    // Generate workout plan
    const workoutPlanJson = await generateWorkoutPlan(options);
    const workoutPlan = AIUtils.parseResponse(workoutPlanJson);

    // Save as program if requested
    let savedProgram = null;
    if (saveAsProgram && programName.trim()) {
      try {
        const program = new Program({
          name: AIUtils.sanitizeInput(programName.trim()),
          description: workoutPlan.description || `AI-generated ${programType} program`,
          type: programType,
          difficulty,
          duration,
          createdBy: user._id,
          isPublic: false,
          workouts: workoutPlan.workouts?.map((workout: any) => ({
            name: workout.name,
            description: workout.description,
            workoutType: workout.workoutType || 'mixed',
            estimatedDuration: workout.estimatedDuration || timePerWorkout,
            difficulty: workout.difficulty || difficulty,
            exercises: workout.exercises?.map((exercise: any) => ({
              name: exercise.name,
              sets: exercise.sets || 1,
              reps: exercise.reps || '10',
              weight: exercise.weight || 'bodyweight',
              duration: exercise.duration,
              restTime: exercise.restTime || '60s',
              instructions: exercise.instructions || '',
              targetMuscles: exercise.targetMuscles || [],
              equipment: exercise.equipment || [],
              difficulty: exercise.difficulty || 'moderate'
            })) || [],
            warmupInstructions: workout.warmupInstructions || '',
            cooldownInstructions: workout.cooldownInstructions || ''
          })) || [],
          schedule: workoutPlan.workoutSchedule || {},
          tags: [programType, difficulty, 'ai-generated'],
          aiGenerated: true,
          aiGenerationOptions: options
        });

        savedProgram = await program.save();
        
        // Add program to user's programs
        await User.findByIdAndUpdate(
          user._id,
          { $addToSet: { programs: savedProgram._id } }
        );
      } catch (saveError) {
        console.error('Error saving program:', saveError);
        // Don't fail the request if saving fails
      }
    }

    // Return the generated workout plan
    return NextResponse.json({
      success: true,
      workoutPlan,
      savedProgram: savedProgram ? {
        id: savedProgram._id,
        name: savedProgram.name,
        createdAt: savedProgram.createdAt
      } : null,
      generationOptions: options
    });

  } catch (error) {
    console.error('Error generating workout plan:', error);
    
    if (error instanceof Error) {
      if (error.message.includes('Failed to generate workout plan')) {
        return NextResponse.json(
          { error: 'Unable to generate workout plan. Please try again with different parameters.' },
          { status: 500 }
        );
      }
      if (error.message.includes('Invalid AI response format')) {
        return NextResponse.json(
          { error: 'Generated workout plan format is invalid. Please try again.' },
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

// Get user's saved workout programs
export async function GET(request: NextRequest) {
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

    // Connect to database
    await connectToDatabase();

    // Get user's programs with filtering options
    const { searchParams } = new URL(request.url);
    const programType = searchParams.get('type');
    const difficulty = searchParams.get('difficulty');
    const aiGenerated = searchParams.get('aiGenerated');
    const limit = parseInt(searchParams.get('limit') || '10');
    const page = parseInt(searchParams.get('page') || '1');

    // Build query
    const query: any = { createdBy: decoded.userId };
    if (programType) query.type = programType;
    if (difficulty) query.difficulty = difficulty;
    if (aiGenerated === 'true') query.aiGenerated = true;
    else if (aiGenerated === 'false') query.aiGenerated = { $ne: true };

    // Get programs with pagination
    const programs = await Program.find(query)
      .select('name description type difficulty duration createdAt aiGenerated tags')
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip((page - 1) * limit)
      .lean();

    const totalPrograms = await Program.countDocuments(query);

    return NextResponse.json({
      success: true,
      programs,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalPrograms / limit),
        totalPrograms,
        hasNext: page < Math.ceil(totalPrograms / limit),
        hasPrev: page > 1
      }
    });

  } catch (error) {
    console.error('Error fetching workout programs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch workout programs' },
      { status: 500 }
    );
  }
}
