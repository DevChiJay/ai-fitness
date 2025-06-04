import OpenAI from 'openai';
import { IFitnessProfile } from '@/lib/models/User';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

if (!process.env.OPENAI_API_KEY) {
  console.warn('OpenAI API key not found. AI features will not work.');
}

// Types for AI generation
export interface WorkoutGenerationOptions {
  userProfile: IFitnessProfile;
  programType: 'weight_loss' | 'muscle_gain' | 'strength' | 'endurance' | 'general_fitness' | 'rehabilitation';
  duration: number; // weeks
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  workoutsPerWeek: number;
  equipment?: string[];
  timePerWorkout?: number; // minutes
  specificGoals?: string;
}

export interface NutritionGenerationOptions {
  userProfile: IFitnessProfile;
  programType: 'weight_loss' | 'muscle_gain' | 'strength' | 'endurance' | 'general_fitness' | 'rehabilitation';
  targetCalories?: number;
  mealsPerDay: number;
  cookingTime?: 'quick' | 'moderate' | 'extensive';
  budget?: 'low' | 'medium' | 'high';
  cuisinePreferences?: string[];
}

/**
 * Generate a comprehensive workout plan using OpenAI
 */
export async function generateWorkoutPlan(options: WorkoutGenerationOptions): Promise<string> {
  try {
    const {
      userProfile,
      programType,
      duration,
      difficulty,
      workoutsPerWeek,
      equipment = [],
      timePerWorkout = 60,
      specificGoals = ''
    } = options;

    const prompt = `You are an expert fitness trainer creating a personalized workout program. Generate a comprehensive ${duration}-week ${programType} program for a ${difficulty} level individual.

USER PROFILE:
- Age: ${userProfile.age || 'Not specified'}
- Weight: ${userProfile.weight || 'Not specified'}kg
- Height: ${userProfile.height || 'Not specified'}cm
- Fitness Level: ${userProfile.fitnessLevel || 'beginner'}
- Activity Level: ${userProfile.activityLevel || 'moderately_active'}
- Goals: ${userProfile.goals?.join(', ') || 'general fitness'}
- Injuries/Limitations: ${userProfile.injuries?.join(', ') || 'None'}
- Preferred Workout Types: ${userProfile.preferredWorkoutTypes?.join(', ') || 'Mixed'}

PROGRAM REQUIREMENTS:
- Program Type: ${programType}
- Duration: ${duration} weeks
- Difficulty: ${difficulty}
- Workouts per week: ${workoutsPerWeek}
- Time per workout: ${timePerWorkout} minutes
- Available Equipment: ${equipment.length > 0 ? equipment.join(', ') : 'Bodyweight/Minimal equipment'}
- Specific Goals: ${specificGoals || 'Follow program type goals'}

Please provide a detailed workout program in the following JSON format:
{
  "title": "Program Title",
  "description": "Brief program description",
  "workouts": [
    {
      "name": "Workout Name (e.g., Upper Body Strength)",
      "description": "Workout description",
      "workoutType": "strength|cardio|flexibility|sports|mixed",
      "estimatedDuration": 60,
      "difficulty": "beginner|intermediate|advanced",
      "exercises": [
        {
          "name": "Exercise Name",
          "sets": 3,
          "reps": "8-12",
          "weight": "bodyweight|progressive|specific weight",
          "duration": "30s|2min|etc (for time-based exercises)",
          "restTime": "60s",
          "instructions": "Detailed form instructions",
          "targetMuscles": ["chest", "triceps"],
          "equipment": ["dumbbells"],
          "difficulty": "moderate"
        }
      ],
      "warmupInstructions": "5-10 minute warmup routine",
      "cooldownInstructions": "5-10 minute cooldown and stretching"
    }
  ],
  "workoutSchedule": {
    "monday": "Upper Body Strength",
    "tuesday": "rest",
    "wednesday": "Lower Body Strength",
    "thursday": "rest",
    "friday": "Full Body Circuit",
    "saturday": "Active Recovery",
    "sunday": "rest"
  }
}

IMPORTANT GUIDELINES:
1. Consider user's injuries and limitations when selecting exercises
2. Progress exercises appropriately for the difficulty level
3. Include proper warm-up and cool-down instructions
4. Provide clear, detailed exercise instructions
5. Balance different muscle groups and movement patterns
6. Include rest days and active recovery
7. Make the program progressive over the ${duration} weeks
8. Use available equipment or suggest bodyweight alternatives
9. Keep workouts within the specified time limit
10. Focus on the specific program type goals (${programType})

Generate ONLY the JSON response, no additional text.`;

    const response = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: "You are an expert fitness trainer and program designer. You create safe, effective, and personalized workout programs. Always respond with valid JSON only."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 4000,
    });

    const content = response.choices[0].message.content;
    if (!content) {
      throw new Error('No content received from OpenAI');
    }

    // Validate that the response is valid JSON
    try {
      JSON.parse(content);
      return content;
    } catch (parseError) {
      console.error('Invalid JSON response from OpenAI:', content);
      throw new Error('Generated workout plan is not valid JSON');
    }

  } catch (error) {
    console.error('Error generating workout plan:', error);
    throw new Error('Failed to generate workout plan. Please try again.');
  }
}

/**
 * Generate a comprehensive nutrition plan using OpenAI
 */
export async function generateNutritionPlan(options: NutritionGenerationOptions): Promise<string> {
  try {
    const {
      userProfile,
      programType,
      targetCalories,
      mealsPerDay,
      cookingTime = 'moderate',
      budget = 'medium',
      cuisinePreferences = []
    } = options;

    // Calculate target calories if not provided
    let calculatedCalories = targetCalories;
    if (!calculatedCalories && userProfile.weight && userProfile.height && userProfile.age) {
      // Basic BMR calculation (Mifflin-St Jeor Equation)
      const bmr = userProfile.weight * 10 + userProfile.height * 6.25 - userProfile.age * 5 + 5; // Male formula as baseline
      const activityMultiplier = {
        'sedentary': 1.2,
        'lightly_active': 1.375,
        'moderately_active': 1.55,
        'very_active': 1.725,
        'extremely_active': 1.9
      }[userProfile.activityLevel || 'moderately_active'];
      
      calculatedCalories = Math.round(bmr * activityMultiplier);
      
      // Adjust based on program type
      if (programType === 'weight_loss') calculatedCalories -= 500;
      else if (programType === 'muscle_gain') calculatedCalories += 300;
    }

    const prompt = `You are a professional nutritionist creating a personalized meal plan. Generate a comprehensive nutrition plan for a ${programType} program.

USER PROFILE:
- Age: ${userProfile.age || 'Not specified'}
- Weight: ${userProfile.weight || 'Not specified'}kg
- Height: ${userProfile.height || 'Not specified'}cm
- Activity Level: ${userProfile.activityLevel || 'moderately_active'}
- Goals: ${userProfile.goals?.join(', ') || 'general fitness'}
- Allergies: ${userProfile.allergies?.join(', ') || 'None'}
- Dietary Restrictions: ${userProfile.dietaryRestrictions?.join(', ') || 'None'}

NUTRITION REQUIREMENTS:
- Program Type: ${programType}
- Target Daily Calories: ${calculatedCalories || 2000}
- Meals per Day: ${mealsPerDay}
- Cooking Time Preference: ${cookingTime}
- Budget: ${budget}
- Cuisine Preferences: ${cuisinePreferences.length > 0 ? cuisinePreferences.join(', ') : 'No specific preferences'}

Please provide a detailed nutrition plan in the following JSON format:
{
  "dailyCalorieTarget": ${calculatedCalories || 2000},
  "macroTargets": {
    "proteinPercentage": 25,
    "carbsPercentage": 45,
    "fatPercentage": 30
  },
  "meals": [
    {
      "name": "Protein-Rich Breakfast Bowl",
      "mealType": "breakfast",
      "calories": 400,
      "macros": {
        "protein": 25,
        "carbs": 35,
        "fat": 15,
        "fiber": 8
      },
      "ingredients": [
        "2 eggs",
        "1 slice whole grain toast",
        "1/2 avocado",
        "1 cup spinach"
      ],
      "instructions": "Detailed cooking instructions",
      "prepTime": 15,
      "servings": 1,
      "allergens": ["eggs", "gluten"]
    }
  ],
  "supplements": ["whey protein", "multivitamin"],
  "hydrationGoal": 2.5,
  "specialInstructions": "Timing and additional notes",
  "mealTiming": {
    "breakfast": "7:00-8:00 AM",
    "lunch": "12:00-1:00 PM",
    "dinner": "6:00-7:00 PM",
    "snacks": ["10:00 AM", "3:00 PM"]
  }
}

IMPORTANT GUIDELINES:
1. Consider all allergies and dietary restrictions
2. Adjust macronutrients based on program type:
   - Weight Loss: Higher protein (30%), moderate carbs (35%), moderate fat (35%)
   - Muscle Gain: High protein (30%), higher carbs (45%), moderate fat (25%)
   - General Fitness: Balanced macros (25% protein, 45% carbs, 30% fat)
3. Include variety in meals and ingredients
4. Provide realistic prep times based on cooking preference
5. Consider budget constraints in ingredient selection
6. Include proper hydration recommendations
7. Add relevant supplements if beneficial
8. Provide meal timing suggestions
9. Include fiber-rich foods for digestive health
10. Make meals practical and sustainable
11. Respect cuisine preferences while maintaining nutritional goals
12. Calculate accurate calorie and macro information

Generate ONLY the JSON response, no additional text.`;

    const response = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: "You are a professional nutritionist and meal planning expert. You create balanced, practical, and personalized nutrition plans. Always respond with valid JSON only."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 4000,
    });

    const content = response.choices[0].message.content;
    if (!content) {
      throw new Error('No content received from OpenAI');
    }

    // Validate that the response is valid JSON
    try {
      JSON.parse(content);
      return content;
    } catch (parseError) {
      console.error('Invalid JSON response from OpenAI:', content);
      throw new Error('Generated nutrition plan is not valid JSON');
    }

  } catch (error) {
    console.error('Error generating nutrition plan:', error);
    throw new Error('Failed to generate nutrition plan. Please try again.');
  }
}

/**
 * Generate exercise modifications for injuries or limitations
 */
export async function generateExerciseModifications(
  exerciseName: string,
  injury: string,
  fitnessLevel: string
): Promise<string> {
  try {
    const prompt = `As a certified physical therapist and fitness trainer, provide safe exercise modifications for someone with "${injury}" who wants to perform "${exerciseName}".

Consider their fitness level: ${fitnessLevel}

Provide a JSON response with alternative exercises and modifications:
{
  "originalExercise": "${exerciseName}",
  "injury": "${injury}",
  "modifications": [
    {
      "name": "Modified Exercise Name",
      "description": "How this modification helps",
      "instructions": "Detailed instructions for safe performance",
      "equipment": ["required equipment"],
      "difficulty": "easy|moderate|hard"
    }
  ],
  "safetyTips": [
    "Important safety considerations"
  ],
  "whenToStop": "Warning signs to stop exercising"
}

Focus on injury prevention and safe alternatives. Generate ONLY the JSON response.`;

    const response = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: "You are a certified physical therapist and fitness trainer specializing in exercise modifications for injuries. Always prioritize safety."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.3, // Lower temperature for safety-focused responses
      max_tokens: 1500,
    });

    const content = response.choices[0].message.content;
    if (!content) {
      throw new Error('No content received from OpenAI');
    }

    return content;

  } catch (error) {
    console.error('Error generating exercise modifications:', error);
    throw new Error('Failed to generate exercise modifications. Please consult a healthcare professional.');
  }
}

/**
 * Generate a quick workout suggestion for specific time constraints
 */
export async function generateQuickWorkout(
  timeAvailable: number, // minutes
  equipment: string[],
  targetMuscles: string[],
  fitnessLevel: 'beginner' | 'intermediate' | 'advanced'
): Promise<string> {
  try {
    const prompt = `Create a quick ${timeAvailable}-minute workout for someone with ${fitnessLevel} fitness level.

Available equipment: ${equipment.length > 0 ? equipment.join(', ') : 'None (bodyweight only)'}
Target muscles: ${targetMuscles.length > 0 ? targetMuscles.join(', ') : 'Full body'}

Provide a JSON response:
{
  "workoutName": "Quick ${timeAvailable}-Minute Workout",
  "totalTime": ${timeAvailable},
  "exercises": [
    {
      "name": "Exercise Name",
      "duration": "45s work, 15s rest",
      "reps": "As many as possible",
      "instructions": "Brief form cues",
      "targetMuscles": ["muscle groups"]
    }
  ],
  "structure": "Circuit format, rounds, etc.",
  "tips": ["Quick workout tips"]
}

Make it efficient and effective for the time constraint. Generate ONLY the JSON response.`;

    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "You are a fitness trainer specializing in quick, effective workouts. Focus on time-efficient exercises."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 1000,
    });

    const content = response.choices[0].message.content;
    if (!content) {
      throw new Error('No content received from OpenAI');
    }

    return content;

  } catch (error) {
    console.error('Error generating quick workout:', error);
    throw new Error('Failed to generate quick workout. Please try again.');
  }
}

/**
 * Get nutritional information for a specific food or meal
 */
export async function getNutritionalInfo(
  foodItem: string,
  quantity: string
): Promise<string> {
  try {
    const prompt = `Provide detailed nutritional information for "${quantity} of ${foodItem}".

Return a JSON response:
{
  "food": "${foodItem}",
  "quantity": "${quantity}",
  "calories": 150,
  "macros": {
    "protein": 8,
    "carbs": 12,
    "fat": 6,
    "fiber": 3,
    "sugar": 2
  },
  "micronutrients": {
    "vitamin_c": "15mg",
    "iron": "2mg",
    "calcium": "100mg"
  },
  "healthBenefits": ["Key health benefits"],
  "allergens": ["potential allergens"],
  "tips": ["Storage and preparation tips"]
}

Provide accurate nutritional data. Generate ONLY the JSON response.`;

    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "You are a nutritionist providing accurate nutritional information. Be precise with nutritional data."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.3,
      max_tokens: 800,
    });

    const content = response.choices[0].message.content;
    if (!content) {
      throw new Error('No content received from OpenAI');
    }

    return content;

  } catch (error) {
    console.error('Error getting nutritional info:', error);
    throw new Error('Failed to get nutritional information. Please try again.');
  }
}

// Export utility functions for error handling and validation
export const AIUtils = {
  /**
   * Validate AI API key
   */
  isConfigured: (): boolean => {
    return !!process.env.OPENAI_API_KEY;
  },

  /**
   * Parse and validate AI response
   */
  parseResponse: (response: string): any => {
    try {
      return JSON.parse(response);
    } catch (error) {
      throw new Error('Invalid AI response format');
    }
  },

  /**
   * Sanitize user input for AI prompts
   */
  sanitizeInput: (input: string): string => {
    return input.replace(/[<>]/g, '').trim();
  }
};
