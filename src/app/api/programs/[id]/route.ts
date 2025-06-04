import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import Program from '@/lib/models/Program';
import { verifyToken } from '@/lib/auth';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
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
    }    const userId = decoded.userId;
    const { id: programId } = await params;

    // Get specific program
    const program = await Program.findOne({ _id: programId, userId });
    
    if (!program) {
      return NextResponse.json({ error: 'Program not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      program: {
        id: program._id,
        name: program.name,
        description: program.description,
        isActive: program.isActive,
        createdAt: program.createdAt,
        updatedAt: program.updatedAt,
        workoutPlan: program.workoutPlan,
        nutritionPlan: program.nutritionPlan,
      },
    });
  } catch (error) {
    console.error('Error fetching program:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
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
    }    const userId = decoded.userId;
    const { id: programId } = await params;
    const body = await request.json();

    // Find and update program
    const program = await Program.findOne({ _id: programId, userId });
    
    if (!program) {
      return NextResponse.json({ error: 'Program not found' }, { status: 404 });
    }

    // Update program fields
    const { name, description, workoutPlan, nutritionPlan, isActive } = body;
    
    if (name !== undefined) program.name = name;
    if (description !== undefined) program.description = description;
    if (workoutPlan !== undefined) program.workoutPlan = workoutPlan;
    if (nutritionPlan !== undefined) program.nutritionPlan = nutritionPlan;
    if (isActive !== undefined) {
      program.isActive = isActive;
      
      // If setting this program as active, deactivate others
      if (isActive) {
        await Program.updateMany(
          { userId, _id: { $ne: programId }, isActive: true },
          { isActive: false, updatedAt: new Date() }
        );
      }
    }
    
    program.updatedAt = new Date();
    await program.save();

    return NextResponse.json({
      success: true,
      program: {
        id: program._id,
        name: program.name,
        description: program.description,
        isActive: program.isActive,
        createdAt: program.createdAt,
        updatedAt: program.updatedAt,
      },
    });
  } catch (error) {
    console.error('Error updating program:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
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
    }    const userId = decoded.userId;
    const { id: programId } = await params;

    // Find and delete program
    const program = await Program.findOneAndDelete({ _id: programId, userId });
    
    if (!program) {
      return NextResponse.json({ error: 'Program not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: 'Program deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting program:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
