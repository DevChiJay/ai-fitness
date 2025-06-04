"use client";

import { useAuth } from "@/lib/hooks/useAuth";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { IProgram, IWorkout, IExercise, IMeal } from "@/lib/models/Program";
import { 
  Mail, 
  Calendar, 
  Target,
  Activity, 
  Dumbbell, 
  Apple, 
  Settings,
  Loader2
} from "lucide-react";

const ProfilePage = () => {  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [programs, setPrograms] = useState<IProgram[]>([]);
  const [isLoadingPrograms, setIsLoadingPrograms] = useState(false);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/auth/login?callbackUrl=/profile');
    }
  }, [user, isLoading, router]);
  // Load user programs (placeholder for now)
  useEffect(() => {
    if (user) {
      fetchPrograms();
    }
  }, [user]);

  const fetchPrograms = async () => {
    setIsLoadingPrograms(true);
    try {
      const response = await fetch('/api/programs');
      if (response.ok) {
        const data = await response.json();
        setPrograms(data.programs || []);
      } else {
        console.error('Failed to fetch programs');
      }
    } catch (error) {
      console.error('Error fetching programs:', error);
    } finally {
      setIsLoadingPrograms(false);
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

  const userInitials = user.name 
    ? user.name.split(' ').map(n => n[0]).join('').toUpperCase()
    : user.email[0].toUpperCase();

  return (
    <div className="min-h-screen pt-24 pb-8">
      <div className="container mx-auto px-4 max-w-6xl">
        {/* Profile Header */}
        <Card className="mb-8">
          <CardHeader>            <div className="flex items-center gap-6">
              <Avatar className="w-20 h-20">
                <AvatarFallback className="text-2xl">{userInitials}</AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <CardTitle className="text-2xl mb-2">
                  {user.name}
                </CardTitle>
                <div className="flex items-center gap-4 text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4" />
                    <span>{user.email}</span>
                  </div>
                  {user.createdAt && (
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      <span>Member since {new Date(user.createdAt).toLocaleDateString()}</span>
                    </div>
                  )}
                </div>
              </div>
              <Button 
                variant="outline" 
                className="flex items-center gap-2"
                onClick={() => router.push('/settings')}
              >
                <Settings className="w-4 h-4" />
                Settings
              </Button>
            </div>
          </CardHeader>
        </Card>

        {/* Fitness Profile */}
        {user.fitnessProfile && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="w-5 h-5 text-primary" />
                Fitness Profile
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {user.fitnessProfile.age && (
                  <div className="text-center p-3 border rounded-lg">
                    <div className="text-2xl font-bold text-primary">{user.fitnessProfile.age}</div>
                    <div className="text-sm text-muted-foreground">Years Old</div>
                  </div>
                )}
                {user.fitnessProfile.weight && (
                  <div className="text-center p-3 border rounded-lg">
                    <div className="text-2xl font-bold text-primary">{user.fitnessProfile.weight}</div>
                    <div className="text-sm text-muted-foreground">kg</div>
                  </div>
                )}
                {user.fitnessProfile.height && (
                  <div className="text-center p-3 border rounded-lg">
                    <div className="text-2xl font-bold text-primary">{user.fitnessProfile.height}</div>
                    <div className="text-sm text-muted-foreground">cm</div>
                  </div>
                )}
                <div className="text-center p-3 border rounded-lg">
                  <div className="text-2xl font-bold text-primary capitalize">
                    {user.fitnessProfile.fitnessLevel}
                  </div>
                  <div className="text-sm text-muted-foreground">Fitness Level</div>
                </div>
              </div>
              
              {user.fitnessProfile.goals && user.fitnessProfile.goals.length > 0 && (
                <div className="mt-6">
                  <h4 className="font-medium mb-3">Goals</h4>
                  <div className="flex flex-wrap gap-2">
                    {user.fitnessProfile.goals.map((goal, index) => (
                      <Badge key={index} variant="outline">{goal}</Badge>
                    ))}
                  </div>
                </div>
              )}

              {user.fitnessProfile.preferredWorkoutTypes && user.fitnessProfile.preferredWorkoutTypes.length > 0 && (
                <div className="mt-6">
                  <h4 className="font-medium mb-3">Preferred Workouts</h4>
                  <div className="flex flex-wrap gap-2">
                    {user.fitnessProfile.preferredWorkoutTypes.map((type, index) => (
                      <Badge key={index} variant="secondary">{type}</Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Programs Section */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-primary" />
                Your Programs
              </CardTitle>
              <Button onClick={() => router.push('/generate-program')}>
                Create New Program
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {isLoadingPrograms ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin" />
                <span className="ml-2">Loading programs...</span>
              </div>
            ) : programs.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-muted-foreground mb-4">
                  You don't have any fitness programs yet.
                </div>
                <Button onClick={() => router.push('/generate-program')}>
                  <Dumbbell className="w-4 h-4 mr-2" />
                  Create Your First Program
                </Button>
              </div>            ) : (
              <div className="space-y-6">
                {programs.map((program) => (
                  <Card key={program._id} className="border-l-4 border-l-primary">
                    <CardHeader>                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">{program.title}</CardTitle>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">
                            {new Date(program.createdAt).toLocaleDateString()}
                          </Badge>
                          <Button variant="ghost" size="sm">
                            View Details
                          </Button>
                        </div>
                      </div>
                      {program.description && (
                        <p className="text-muted-foreground">{program.description}</p>
                      )}
                    </CardHeader>
                    <CardContent>
                      <Tabs defaultValue="workouts" className="w-full">
                        <TabsList>
                          <TabsTrigger value="workouts" className="flex items-center gap-2">
                            <Dumbbell className="w-4 h-4" />
                            Workouts
                          </TabsTrigger>
                          <TabsTrigger value="nutrition" className="flex items-center gap-2">
                            <Apple className="w-4 h-4" />
                            Nutrition
                          </TabsTrigger>
                        </TabsList>
                        
                        <TabsContent value="workouts" className="mt-4">
                          {program.workouts && program.workouts.length > 0 ? (
                            <div className="space-y-4">
                              {program.workouts.map((workout: IWorkout, workoutIndex: number) => (
                                <Card key={workoutIndex} className="bg-muted/30">
                                  <CardHeader className="pb-3">
                                    <CardTitle className="text-base flex items-center justify-between">
                                      {workout.name}
                                      <Badge variant="secondary">
                                        {workout.exercises?.length || 0} exercises
                                      </Badge>
                                    </CardTitle>
                                    {workout.description && (
                                      <p className="text-sm text-muted-foreground">{workout.description}</p>
                                    )}
                                  </CardHeader>
                                  {workout.exercises && workout.exercises.length > 0 && (
                                    <CardContent className="pt-0">
                                      <div className="grid gap-3">
                                        {workout.exercises.map((exercise: IExercise, exerciseIndex: number) => (
                                          <div key={exerciseIndex} className="flex items-center justify-between p-3 bg-background rounded-lg border">
                                            <div className="flex-1">
                                              <h5 className="font-medium">{exercise.name}</h5>                                              {exercise.instructions && (
                                                <p className="text-sm text-muted-foreground">{exercise.instructions}</p>
                                              )}
                                            </div>
                                            <div className="text-right text-sm">
                                              {exercise.sets && (
                                                <div>{exercise.sets} sets</div>
                                              )}
                                              {exercise.reps && (
                                                <div>{exercise.reps} reps</div>
                                              )}
                                              {exercise.duration && (
                                                <div>{exercise.duration}</div>
                                              )}                                              {exercise.restTime && (
                                                <div className="text-muted-foreground">Rest: {exercise.restTime}</div>
                                              )}
                                            </div>
                                          </div>
                                        ))}
                                      </div>
                                    </CardContent>
                                  )}
                                </Card>
                              ))}
                            </div>
                          ) : (
                            <div className="text-center py-6 text-muted-foreground">
                              No workouts found in this program
                            </div>
                          )}
                        </TabsContent>
                        
                        <TabsContent value="nutrition" className="mt-4">
                          {program.nutritionPlan ? (
                            <div className="space-y-4">                              {program.nutritionPlan.dailyCalorieTarget && (
                                <Card className="bg-primary/5">
                                  <CardContent className="pt-6">
                                    <div className="text-center">
                                      <div className="text-3xl font-bold text-primary">
                                        {program.nutritionPlan.dailyCalorieTarget}
                                      </div>
                                      <div className="text-sm text-muted-foreground">Daily Calories</div>
                                    </div>
                                  </CardContent>
                                </Card>
                              )}
                                {program.nutritionPlan.macroTargets && (
                                <Card>
                                  <CardHeader>
                                    <CardTitle className="text-base">Macro Targets</CardTitle>
                                  </CardHeader>
                                  <CardContent>
                                    <div className="grid grid-cols-3 gap-4">
                                      {program.nutritionPlan.macroTargets.proteinPercentage && (
                                        <div className="text-center p-3 border rounded-lg">
                                          <div className="text-xl font-bold text-primary">
                                            {program.nutritionPlan.macroTargets.proteinPercentage}%
                                          </div>
                                          <div className="text-sm text-muted-foreground">Protein</div>
                                        </div>
                                      )}
                                      {program.nutritionPlan.macroTargets.carbsPercentage && (
                                        <div className="text-center p-3 border rounded-lg">
                                          <div className="text-xl font-bold text-primary">
                                            {program.nutritionPlan.macroTargets.carbsPercentage}%
                                          </div>
                                          <div className="text-sm text-muted-foreground">Carbs</div>
                                        </div>
                                      )}
                                      {program.nutritionPlan.macroTargets.fatPercentage && (
                                        <div className="text-center p-3 border rounded-lg">
                                          <div className="text-xl font-bold text-primary">
                                            {program.nutritionPlan.macroTargets.fatPercentage}%
                                          </div>
                                          <div className="text-sm text-muted-foreground">Fats</div>
                                        </div>
                                      )}
                                    </div>
                                  </CardContent>
                                </Card>
                              )}
                              
                              {program.nutritionPlan.meals && program.nutritionPlan.meals.length > 0 && (
                                <Card>
                                  <CardHeader>
                                    <CardTitle className="text-base">Meal Plan</CardTitle>
                                  </CardHeader>
                                  <CardContent>
                                    <div className="space-y-3">
                                      {program.nutritionPlan.meals.map((meal: IMeal, mealIndex: number) => (
                                        <div key={mealIndex} className="p-3 bg-muted/30 rounded-lg">
                                          <div className="flex items-center justify-between mb-2">
                                            <h5 className="font-medium">{meal.name}</h5>
                                            {meal.calories && (
                                              <Badge variant="outline">{meal.calories} cal</Badge>
                                            )}
                                          </div>                                          {meal.instructions && (
                                            <p className="text-sm text-muted-foreground">{meal.instructions}</p>
                                          )}
                                          {meal.ingredients && meal.ingredients.length > 0 && (
                                            <div className="mt-2 flex flex-wrap gap-1">
                                              {meal.ingredients.map((food: string, foodIndex: number) => (
                                                <Badge key={foodIndex} variant="secondary" className="text-xs">
                                                  {food}
                                                </Badge>
                                              ))}
                                            </div>
                                          )}
                                        </div>
                                      ))}
                                    </div>
                                  </CardContent>
                                </Card>
                              )}
                                {program.nutritionPlan.specialInstructions && (
                                <Card>
                                  <CardHeader>
                                    <CardTitle className="text-base">Special Instructions</CardTitle>
                                  </CardHeader>
                                  <CardContent>
                                    <p className="text-sm">{program.nutritionPlan.specialInstructions}</p>
                                  </CardContent>
                                </Card>
                              )}
                            </div>
                          ) : (
                            <div className="text-center py-6 text-muted-foreground">
                              No nutrition plan found in this program
                            </div>
                          )}
                        </TabsContent>
                      </Tabs>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ProfilePage;
