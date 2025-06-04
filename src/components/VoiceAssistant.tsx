"use client";

import React, { useState } from 'react';
import { useSpeechSynthesis, useSpeechRecognition } from 'react-speech-kit';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Mic, MicOff, Volume2, VolumeX, MessageSquare, Loader2 } from 'lucide-react';
import { useAuth } from '@/lib/hooks/useAuth';

interface VoiceAssistantProps {
  onWorkoutRequest?: (prompt: string) => void;
  onNutritionRequest?: (prompt: string) => void;
  className?: string;
}

const VoiceAssistant: React.FC<VoiceAssistantProps> = ({
  onWorkoutRequest,
  onNutritionRequest,
  className = ""
}) => {
  const { user } = useAuth();
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [response, setResponse] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  // Speech synthesis (text-to-speech)
  const { speak, cancel, speaking, supported: speechSupported } = useSpeechSynthesis();
  
  // Speech recognition (speech-to-text)
  const { listen, listening, stop, supported: recognitionSupported } = useSpeechRecognition({
    onResult: (result: string) => {
      setTranscript(result);
      if (result.length > 0) {
        handleVoiceCommand(result);
      }
    },
    onEnd: () => {
      setIsListening(false);
    }
  });

  // Voice command processing
  const handleVoiceCommand = async (command: string) => {
    if (!command.trim()) return;
    
    setIsProcessing(true);
    const lowerCommand = command.toLowerCase();
    
    try {
      if (lowerCommand.includes('workout') || lowerCommand.includes('exercise') || lowerCommand.includes('training')) {
        setResponse(`Processing workout request: "${command}"`);
        speak({ text: `I'll help you create a workout plan. Processing your request now.` });
        
        if (onWorkoutRequest) {
          onWorkoutRequest(command);
        } else {
          // Default workout response
          await generateWorkoutResponse(command);
        }
      } else if (lowerCommand.includes('nutrition') || lowerCommand.includes('diet') || lowerCommand.includes('meal') || lowerCommand.includes('food')) {
        setResponse(`Processing nutrition request: "${command}"`);
        speak({ text: `I'll help you with nutrition planning. Let me create a meal plan for you.` });
        
        if (onNutritionRequest) {
          onNutritionRequest(command);
        } else {
          // Default nutrition response
          await generateNutritionResponse(command);
        }
      } else if (lowerCommand.includes('hello') || lowerCommand.includes('hi') || lowerCommand.includes('hey')) {
        const greeting = `Hello ${user?.name || 'there'}! I'm your fitness AI assistant. I can help you create workout plans and nutrition advice. Just ask me about workouts or nutrition!`;
        setResponse(greeting);
        speak({ text: greeting });
      } else if (lowerCommand.includes('help')) {
        const helpText = `I can help you with fitness and nutrition. Try saying things like "Create a workout plan for building muscle" or "I need a healthy meal plan for weight loss".`;
        setResponse(helpText);
        speak({ text: helpText });
      } else {
        const fallbackResponse = `I heard "${command}". I specialize in fitness and nutrition advice. Try asking me about workouts or meal planning!`;
        setResponse(fallbackResponse);
        speak({ text: fallbackResponse });
      }
    } catch (error) {
      console.error('Error processing voice command:', error);
      const errorResponse = 'Sorry, I had trouble processing that request. Please try again.';
      setResponse(errorResponse);
      speak({ text: errorResponse });
    } finally {
      setIsProcessing(false);
    }
  };

  // Generate workout response
  const generateWorkoutResponse = async (command: string) => {
    try {
      const response = await fetch('/api/ai/quick-workout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt: command }),
      });

      if (response.ok) {
        const data = await response.json();
        const workoutResponse = `I've created a quick workout for you: ${data.exercises?.slice(0, 2).map((ex: any) => ex.name).join(' and ') || 'custom exercises'}. Check your screen for details!`;
        setResponse(workoutResponse);
        speak({ text: workoutResponse });
      }
    } catch (error) {
      console.error('Error generating workout:', error);
    }
  };

  // Generate nutrition response
  const generateNutritionResponse = async (command: string) => {
    try {
      const response = await fetch('/api/ai/nutrition', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          goals: command,
          preferences: [],
          restrictions: []
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const nutritionResponse = `I've created a nutrition plan for you with ${data.meals?.length || 3} meals. Check your screen for the detailed meal plan!`;
        setResponse(nutritionResponse);
        speak({ text: nutritionResponse });
      }
    } catch (error) {
      console.error('Error generating nutrition plan:', error);
    }
  };

  // Start listening
  const startListening = () => {
    if (recognitionSupported) {
      setIsListening(true);
      setTranscript('');
      setResponse('');
      listen({ interimResults: false, lang: 'en-US' });
    }
  };

  // Stop listening
  const stopListening = () => {
    if (listening) {
      stop();
    }
    setIsListening(false);
  };

  // Toggle listening
  const toggleListening = () => {
    if (isListening || listening) {
      stopListening();
    } else {
      startListening();
    }
  };

  // Stop speaking
  const stopSpeaking = () => {
    cancel();
  };

  // Check if voice features are supported
  const isVoiceSupported = speechSupported && recognitionSupported;

  if (!isVoiceSupported) {
    return (
      <Card className={`${className} border-amber-200 bg-amber-50/50`}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-amber-800">
            <MessageSquare className="h-5 w-5" />
            Voice Assistant
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-amber-700 text-sm">
            Voice features are not supported in your browser. Please use a modern browser like Chrome, Edge, or Safari for voice functionality.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`${className} border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10`}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5 text-primary" />
          AI Voice Assistant
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Voice Controls */}
        <div className="flex items-center gap-2">
          <Button
            onClick={toggleListening}
            variant={isListening || listening ? "destructive" : "default"}
            size="sm"
            className="flex items-center gap-2"
            disabled={isProcessing}
          >
            {isListening || listening ? (
              <>
                <MicOff className="h-4 w-4" />
                Stop Listening
              </>
            ) : (
              <>
                <Mic className="h-4 w-4" />
                Start Listening
              </>
            )}
          </Button>

          <Button
            onClick={stopSpeaking}
            variant="outline"
            size="sm"
            className="flex items-center gap-2"
            disabled={!speaking}
          >
            {speaking ? (
              <>
                <VolumeX className="h-4 w-4" />
                Stop Speaking
              </>
            ) : (
              <>
                <Volume2 className="h-4 w-4" />
                Voice
              </>
            )}
          </Button>
        </div>

        {/* Status Indicators */}
        <div className="space-y-2">
          {(isListening || listening) && (
            <div className="flex items-center gap-2 text-sm text-blue-600">
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
              Listening...
            </div>
          )}

          {speaking && (
            <div className="flex items-center gap-2 text-sm text-green-600">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              Speaking...
            </div>
          )}

          {isProcessing && (
            <div className="flex items-center gap-2 text-sm text-orange-600">
              <Loader2 className="w-4 h-4 animate-spin" />
              Processing your request...
            </div>
          )}
        </div>

        {/* Voice Transcript */}
        {transcript && (
          <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
            <p className="text-sm font-medium text-blue-800">You said:</p>
            <p className="text-sm text-blue-700 mt-1">"{transcript}"</p>
          </div>
        )}

        {/* AI Response */}
        {response && (
          <div className="p-3 bg-green-50 rounded-lg border border-green-200">
            <p className="text-sm font-medium text-green-800">AI Assistant:</p>
            <p className="text-sm text-green-700 mt-1">{response}</p>
          </div>
        )}

        {/* Quick Tips */}
        <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
          <p className="text-xs font-medium text-gray-700 mb-2">Try saying:</p>
          <ul className="text-xs text-gray-600 space-y-1">
            <li>• "Create a workout plan for building muscle"</li>
            <li>• "I need a healthy meal plan for weight loss"</li>
            <li>• "Help me with exercise modifications"</li>
            <li>• "Hello" or "Help" for assistance</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};

export default VoiceAssistant;
