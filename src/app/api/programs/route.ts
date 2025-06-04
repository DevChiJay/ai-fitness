import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import Program from '@/lib/models/Program';
import User from '@/lib/models/User';
import { verifyToken } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    await connectToDatabase();

    // Verify authentication
    const authToken = request.cookies.get('auth-token')?.value;
    if (!authToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = verifyToken(authToken);
    if (!decoded) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const userId = decoded.userId;
    const body = await request.json();

    // Validate required fields
    const { name, description, workoutPlan, nutritionPlan } = body;
    if (!name || !workoutPlan || !nutritionPlan) {
      return NextResponse.json(
        { error: 'Name, workout plan, and nutrition plan are required' },
        { status: 400 }
      );
    }

    // Check if user exists
    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Create new program
    const program = new Program({
      userId,
      name,
      description,
      workoutPlan,
      nutritionPlan,
      isActive: true, // New programs are active by default
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // Deactivate other programs for this user
    await Program.updateMany(
      { userId, isActive: true },
      { isActive: false, updatedAt: new Date() }
    );

    const savedProgram = await program.save();

    // Add program reference to user
    if (!user.programs) {
      user.programs = [];
    }
    user.programs.push(savedProgram._id as string);
    await user.save();

    return NextResponse.json({
      success: true,
      program: {
        id: savedProgram._id,
        name: savedProgram.name,
        description: savedProgram.description,
        isActive: savedProgram.isActive,
        createdAt: savedProgram.createdAt,
      },
    });
  } catch (error) {
    console.error('Error creating program:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    await connectToDatabase();

    // Verify authentication
    const authToken = request.cookies.get('auth-token')?.value;
    if (!authToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = verifyToken(authToken);
    if (!decoded) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const userId = decoded.userId;

    // Get all programs for the user
    const programs = await Program.find({ userId }).sort({ createdAt: -1 });

    return NextResponse.json({
      success: true,
      programs: programs.map(program => ({
        id: program._id,
        name: program.name,
        description: program.description,
        isActive: program.isActive,
        createdAt: program.createdAt,
        updatedAt: program.updatedAt,
        workoutPlan: program.workoutPlan,
        nutritionPlan: program.nutritionPlan,
      })),
    });
  } catch (error) {
    console.error('Error fetching programs:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
