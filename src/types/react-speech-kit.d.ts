declare module 'react-speech-kit' {
  export interface SpeechSynthesisOptions {
    voice?: SpeechSynthesisVoice;
    rate?: number;
    pitch?: number;
    volume?: number;
    lang?: string;
  }

  export interface UseSpeechSynthesisReturn {
    speak: (options?: { text: string } & SpeechSynthesisOptions) => void;
    cancel: () => void;
    speaking: boolean;
    supported: boolean;
    voices: SpeechSynthesisVoice[];
  }
  export interface SpeechRecognitionOptions {
    lang?: string;
    continuous?: boolean;
    interimResults?: boolean;
    maxAlternatives?: number;
    onResult?: (result: string) => void;
    onEnd?: () => void;
    onError?: (error: any) => void;
  }

  export interface UseSpeechRecognitionReturn {
    listen: (options?: SpeechRecognitionOptions) => void;
    stop: () => void;
    listening: boolean;
    supported: boolean;
    result: string;
  }

  export function useSpeechSynthesis(): UseSpeechSynthesisReturn;
  export function useSpeechRecognition(options?: SpeechRecognitionOptions): UseSpeechRecognitionReturn;
}
