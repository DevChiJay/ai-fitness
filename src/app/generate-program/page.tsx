"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/lib/hooks/useAuth";
import VoiceAssistant from "@/components/VoiceAssistant";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Loader2, Dumbbell, Apple, MessageSquare, Clock, Target, Utensils, Activity } from "lucide-react";

interface WorkoutExercise {
  name: string;
  sets: number;
  reps: string;
  duration?: string;
  description: string;
}

interface WorkoutData {
  title: string;
  description: string;
  duration: number;
  exercises: WorkoutExercise[];
  tips: string[];
}

interface NutritionData {
  title: string;
  description: string;
  dailyCalories: number;
  macros: {
    protein: number;
    carbs: number;
    fat: number;
  };
  meals: Array<{
    name: string;
    foods: string[];
    calories: number;
  }>;
  tips: string[];
}

const GenerateProgramPage = () => {  const [workoutData, setWorkoutData] = useState<WorkoutData | null>(null);
  const [nutritionData, setNutritionData] = useState<NutritionData | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'voice' | 'workout' | 'nutrition'>('voice');

  const { user, isLoading } = useAuth();
  const router = useRouter();

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/auth/login?callbackUrl=/generate-program');
    }
  }, [user, isLoading, router]);

  // Handle workout generation from voice assistant
  const handleWorkoutRequest = async (prompt: string) => {
    setIsGenerating(true);
    setActiveTab('workout');
    
    try {
      const response = await fetch('/api/ai/workout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },        body: JSON.stringify({
          fitnessLevel: user?.fitnessProfile?.fitnessLevel || 'intermediate',
          goals: [prompt],
          equipment: ['bodyweight'], // Default equipment
          timeAvailable: 45, // Default duration
          preferences: user?.fitnessProfile?.preferredWorkoutTypes || []
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setWorkoutData(data);
      } else {
        console.error('Failed to generate workout');
      }
    } catch (error) {
      console.error('Error generating workout:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  // Handle nutrition generation from voice assistant
  const handleNutritionRequest = async (prompt: string) => {
    setIsGenerating(true);
    setActiveTab('nutrition');
    
    try {
      const response = await fetch('/api/ai/nutrition', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },        body: JSON.stringify({
          goals: prompt,
          preferences: [], // User preferences would need to be added to the model
          restrictions: user?.fitnessProfile?.dietaryRestrictions || [],
          targetCalories: 2000 // Default calorie goal
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setNutritionData(data);
      } else {
        console.error('Failed to generate nutrition plan');
      }
    } catch (error) {      console.error('Error generating nutrition plan:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  // Save program to database
  const saveProgram = async () => {
    if (!workoutData || !nutritionData) {
      alert('Please generate both workout and nutrition plans first');
      return;
    }

    setIsSaving(true);
    try {
      const response = await fetch('/api/programs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: `Fitness Program - ${new Date().toLocaleDateString()}`,
          description: `Generated workout and nutrition plan for ${user?.name}`,
          workoutPlan: workoutData,
          nutritionPlan: nutritionData,
        }),
      });      if (response.ok) {
        await response.json();
        alert('Program saved successfully!');
        router.push('/profile');
      } else {
        console.error('Failed to save program');
        alert('Failed to save program. Please try again.');
      }
    } catch (error) {
      console.error('Error saving program:', error);
      alert('Failed to save program. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  // Show loading if authentication is still loading
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  // Show login prompt if not authenticated
  if (!user) {
    return null; // Will redirect to login
  }

  return (
    <div className="flex flex-col min-h-screen text-foreground overflow-hidden pb-6 pt-24">
      <div className="container mx-auto px-4 h-full max-w-6xl">
        {/* Title */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold font-mono">
            <span>Generate Your </span>
            <span className="text-primary uppercase">Fitness Program</span>
          </h1>
          <p className="text-muted-foreground mt-2">
            Use voice commands to create personalized workout and nutrition plans
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="flex justify-center mb-8">
          <div className="flex bg-muted rounded-lg p-1">
            <Button
              variant={activeTab === 'voice' ? 'default' : 'ghost'}
              onClick={() => setActiveTab('voice')}
              className="rounded-md"
            >
              <MessageSquare className="w-4 h-4 mr-2" />
              Voice Assistant
            </Button>
            <Button
              variant={activeTab === 'workout' ? 'default' : 'ghost'}
              onClick={() => setActiveTab('workout')}
              className="rounded-md"
              disabled={!workoutData}
            >
              <Dumbbell className="w-4 h-4 mr-2" />
              Workout Plan
            </Button>
            <Button
              variant={activeTab === 'nutrition' ? 'default' : 'ghost'}
              onClick={() => setActiveTab('nutrition')}
              className="rounded-md"
              disabled={!nutritionData}
            >
              <Apple className="w-4 h-4 mr-2" />
              Nutrition Plan
            </Button>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1">
          {activeTab === 'voice' && (
            <div className="max-w-4xl mx-auto">              <VoiceAssistant
                onWorkoutRequest={handleWorkoutRequest}
                onNutritionRequest={handleNutritionRequest}
              />
            </div>
          )}

          {activeTab === 'workout' && workoutData && (
            <Card className="max-w-4xl mx-auto">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-2xl flex items-center gap-2">
                      <Dumbbell className="w-6 h-6 text-primary" />
                      {workoutData.title}
                    </CardTitle>
                    <p className="text-muted-foreground mt-2">{workoutData.description}</p>
                  </div>
                  <div className="flex gap-2">
                    <Badge variant="outline" className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {workoutData.duration} min
                    </Badge>
                    <Badge variant="outline" className="flex items-center gap-1">
                      <Target className="w-3 h-3" />
                      {workoutData.exercises.length} exercises
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold mb-4">Exercises</h3>
                  <div className="grid gap-4">
                    {workoutData.exercises.map((exercise, index) => (
                      <Card key={index} className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h4 className="font-medium text-lg">{exercise.name}</h4>
                            <p className="text-muted-foreground text-sm mt-1">{exercise.description}</p>
                          </div>
                          <div className="text-right ml-4">
                            <div className="text-sm font-medium">
                              {exercise.sets} sets × {exercise.reps}
                            </div>
                            {exercise.duration && (
                              <div className="text-xs text-muted-foreground">
                                {exercise.duration}
                              </div>
                            )}
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>

                {workoutData.tips.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Tips</h3>
                    <ul className="space-y-2">
                      {workoutData.tips.map((tip, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <div className="w-1.5 h-1.5 bg-primary rounded-full mt-2 flex-shrink-0" />
                          <span className="text-sm">{tip}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {activeTab === 'nutrition' && nutritionData && (
            <Card className="max-w-4xl mx-auto">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-2xl flex items-center gap-2">
                      <Utensils className="w-6 h-6 text-primary" />
                      {nutritionData.title}
                    </CardTitle>
                    <p className="text-muted-foreground mt-2">{nutritionData.description}</p>
                  </div>
                  <div className="flex gap-2">
                    <Badge variant="outline" className="flex items-center gap-1">
                      <Activity className="w-3 h-3" />
                      {nutritionData.dailyCalories} cal
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold mb-4">Daily Macros</h3>
                  <div className="grid grid-cols-3 gap-4">
                    <Card className="p-3 text-center">
                      <div className="text-2xl font-bold text-blue-600">{nutritionData.macros.protein}g</div>
                      <div className="text-sm text-muted-foreground">Protein</div>
                    </Card>
                    <Card className="p-3 text-center">
                      <div className="text-2xl font-bold text-green-600">{nutritionData.macros.carbs}g</div>
                      <div className="text-sm text-muted-foreground">Carbs</div>
                    </Card>
                    <Card className="p-3 text-center">
                      <div className="text-2xl font-bold text-yellow-600">{nutritionData.macros.fat}g</div>
                      <div className="text-sm text-muted-foreground">Fat</div>
                    </Card>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-4">Meal Plan</h3>
                  <div className="space-y-4">
                    {nutritionData.meals.map((meal, index) => (
                      <Card key={index} className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h4 className="font-medium text-lg">{meal.name}</h4>
                            <ul className="mt-2 space-y-1">
                              {meal.foods.map((food, foodIndex) => (
                                <li key={foodIndex} className="text-sm text-muted-foreground">
                                  • {food}
                                </li>
                              ))}
                            </ul>
                          </div>
                          <div className="text-right ml-4">
                            <div className="text-sm font-medium">{meal.calories} cal</div>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>

                {nutritionData.tips.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Nutrition Tips</h3>
                    <ul className="space-y-2">
                      {nutritionData.tips.map((tip, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <div className="w-1.5 h-1.5 bg-primary rounded-full mt-2 flex-shrink-0" />
                          <span className="text-sm">{tip}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Loading State */}
          {isGenerating && (
            <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50">
              <Card className="p-6">
                <div className="flex items-center gap-3">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  <span className="text-lg">Generating your personalized plan...</span>
                </div>
              </Card>
            </div>          )}
        </div>

        {/* Floating Save Button */}
        {workoutData && nutritionData && (
          <div className="fixed bottom-8 right-8 z-50">
            <Button 
              onClick={saveProgram} 
              disabled={isSaving}
              size="lg"
              className="shadow-lg"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Program'
              )}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default GenerateProgramPage;
