import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { verifyToken } from '@/lib/auth';
import { generateNutritionPlan, NutritionGenerationOptions, AIUtils } from '@/lib/ai/openai';
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
      targetCalories,
      mealsPerDay = 3,
      cookingTime = 'moderate',
      budget = 'medium',
      cuisinePreferences = [],
      saveToProgramId,
      createNewProgram = false,
      programName = ''
    } = body;

    // Validate required fields
    if (!programType) {
      return NextResponse.json(
        { error: 'Program type is required' },
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

    // Validate optional parameters
    const validCookingTimes = ['quick', 'moderate', 'extensive'];
    const validBudgets = ['low', 'medium', 'high'];
    
    if (!validCookingTimes.includes(cookingTime)) {
      return NextResponse.json(
        { error: 'Invalid cooking time preference' },
        { status: 400 }
      );
    }

    if (!validBudgets.includes(budget)) {
      return NextResponse.json(
        { error: 'Invalid budget preference' },
        { status: 400 }
      );
    }

    // Prepare nutrition generation options
    const options: NutritionGenerationOptions = {
      userProfile: user.fitnessProfile,
      programType,
      targetCalories: targetCalories ? Math.max(1000, Math.min(5000, targetCalories)) : undefined,
      mealsPerDay: Math.max(1, Math.min(6, mealsPerDay)),
      cookingTime,
      budget,
      cuisinePreferences: Array.isArray(cuisinePreferences) 
        ? cuisinePreferences.map(AIUtils.sanitizeInput) 
        : []
    };

    // Generate nutrition plan
    const nutritionPlanJson = await generateNutritionPlan(options);
    const nutritionPlan = AIUtils.parseResponse(nutritionPlanJson);

    // Handle saving to existing program or creating new program
    let updatedProgram = null;
    let createdProgram = null;

    if (saveToProgramId) {
      try {
        // Update existing program with nutrition plan
        const program = await Program.findOne({
          _id: saveToProgramId,
          createdBy: user._id
        });

        if (!program) {
          return NextResponse.json(
            { error: 'Program not found or access denied' },
            { status: 404 }
          );
        }

        program.nutritionPlan = {
          dailyCalorieTarget: nutritionPlan.dailyCalorieTarget,
          macroTargets: nutritionPlan.macroTargets,
          meals: nutritionPlan.meals?.map((meal: any) => ({
            name: meal.name,
            mealType: meal.mealType,
            calories: meal.calories,
            macros: meal.macros,
            ingredients: meal.ingredients || [],
            instructions: meal.instructions || '',
            prepTime: meal.prepTime || 0,
            servings: meal.servings || 1,
            allergens: meal.allergens || []
          })) || [],
          supplements: nutritionPlan.supplements || [],
          hydrationGoal: nutritionPlan.hydrationGoal || 2.5,
          specialInstructions: nutritionPlan.specialInstructions || '',
          mealTiming: nutritionPlan.mealTiming || {}
        };

        program.aiNutritionGenerated = true;
        program.aiNutritionOptions = options;
        
        updatedProgram = await program.save();
      } catch (saveError) {
        console.error('Error updating program with nutrition plan:', saveError);
        return NextResponse.json(
          { error: 'Failed to save nutrition plan to program' },
          { status: 500 }
        );
      }
    } else if (createNewProgram && programName.trim()) {
      try {
        // Create new program with nutrition plan only
        const program = new Program({
          name: AIUtils.sanitizeInput(programName.trim()),
          description: `AI-generated ${programType} nutrition program`,
          type: programType,
          difficulty: 'intermediate',
          duration: 4,
          createdBy: user._id,
          isPublic: false,
          workouts: [],
          nutritionPlan: {
            dailyCalorieTarget: nutritionPlan.dailyCalorieTarget,
            macroTargets: nutritionPlan.macroTargets,
            meals: nutritionPlan.meals?.map((meal: any) => ({
              name: meal.name,
              mealType: meal.mealType,
              calories: meal.calories,
              macros: meal.macros,
              ingredients: meal.ingredients || [],
              instructions: meal.instructions || '',
              prepTime: meal.prepTime || 0,
              servings: meal.servings || 1,
              allergens: meal.allergens || []
            })) || [],
            supplements: nutritionPlan.supplements || [],
            hydrationGoal: nutritionPlan.hydrationGoal || 2.5,
            specialInstructions: nutritionPlan.specialInstructions || '',
            mealTiming: nutritionPlan.mealTiming || {}
          },
          tags: [programType, 'nutrition', 'ai-generated'],
          aiGenerated: true,
          aiNutritionGenerated: true,
          aiNutritionOptions: options
        });

        createdProgram = await program.save();
        
        // Add program to user's programs
        await User.findByIdAndUpdate(
          user._id,
          { $addToSet: { programs: createdProgram._id } }
        );
      } catch (createError) {
        console.error('Error creating nutrition program:', createError);
        // Don't fail the request if saving fails
      }
    }

    // Return the generated nutrition plan
    return NextResponse.json({
      success: true,
      nutritionPlan,
      updatedProgram: updatedProgram ? {
        id: updatedProgram._id,
        name: updatedProgram.name,
        updatedAt: updatedProgram.updatedAt
      } : null,
      createdProgram: createdProgram ? {
        id: createdProgram._id,
        name: createdProgram.name,
        createdAt: createdProgram.createdAt
      } : null,
      generationOptions: options
    });

  } catch (error) {
    console.error('Error generating nutrition plan:', error);
    
    if (error instanceof Error) {
      if (error.message.includes('Failed to generate nutrition plan')) {
        return NextResponse.json(
          { error: 'Unable to generate nutrition plan. Please try again with different parameters.' },
          { status: 500 }
        );
      }
      if (error.message.includes('Invalid AI response format')) {
        return NextResponse.json(
          { error: 'Generated nutrition plan format is invalid. Please try again.' },
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

// Get nutrition information for foods
export async function GET(request: NextRequest) {
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

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const foodItem = searchParams.get('food');
    const quantity = searchParams.get('quantity');

    if (!foodItem) {
      return NextResponse.json(
        { error: 'Food item is required' },
        { status: 400 }
      );
    }

    // Import the function here to avoid circular dependencies
    const { getNutritionalInfo } = await import('@/lib/ai/openai');
    
    // Get nutritional information
    const nutritionalInfoJson = await getNutritionalInfo(
      AIUtils.sanitizeInput(foodItem),
      AIUtils.sanitizeInput(quantity || '100g')
    );
    
    const nutritionalInfo = AIUtils.parseResponse(nutritionalInfoJson);

    return NextResponse.json({
      success: true,
      nutritionalInfo
    });

  } catch (error) {
    console.error('Error getting nutritional information:', error);
    return NextResponse.json(
      { error: 'Failed to get nutritional information' },
      { status: 500 }
    );
  }
}
