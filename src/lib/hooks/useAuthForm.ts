'use client';

import { useState } from 'react';
import { useAuth } from './useAuth';

interface FormState {
  isLoading: boolean;
  error: string | null;
  success: boolean;
}

interface LoginFormData {
  email: string;
  password: string;
}

interface RegisterFormData {
  email: string;
  password: string;
  name: string;
  confirmPassword?: string;
}

/**
 * Custom hook for handling authentication forms with validation and state management
 */
export function useAuthForm() {
  const { login, register } = useAuth();
  const [formState, setFormState] = useState<FormState>({
    isLoading: false,
    error: null,
    success: false,
  });

  const resetFormState = () => {
    setFormState({
      isLoading: false,
      error: null,
      success: false,
    });
  };

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePassword = (password: string): string | null => {
    if (password.length < 8) {
      return 'Password must be at least 8 characters long';
    }
    if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) {
      return 'Password must contain at least one uppercase letter, one lowercase letter, and one number';
    }
    return null;
  };

  const handleLogin = async (formData: LoginFormData) => {
    setFormState({ isLoading: true, error: null, success: false });

    // Validation
    if (!formData.email || !formData.password) {
      setFormState({
        isLoading: false,
        error: 'Email and password are required',
        success: false,
      });
      return { success: false };
    }

    if (!validateEmail(formData.email)) {
      setFormState({
        isLoading: false,
        error: 'Please enter a valid email address',
        success: false,
      });
      return { success: false };
    }

    try {
      const result = await login(formData.email.trim(), formData.password);
      
      if (result.success) {
        setFormState({
          isLoading: false,
          error: null,
          success: true,
        });
        return { success: true };
      } else {
        setFormState({
          isLoading: false,
          error: result.error || 'Login failed',
          success: false,
        });
        return { success: false, error: result.error };
      }
    } catch (error) {
      setFormState({
        isLoading: false,
        error: 'Network error. Please try again.',
        success: false,
      });
      return { success: false, error: 'Network error' };
    }
  };

  const handleRegister = async (formData: RegisterFormData) => {
    setFormState({ isLoading: true, error: null, success: false });

    // Validation
    if (!formData.email || !formData.password || !formData.name) {
      setFormState({
        isLoading: false,
        error: 'All fields are required',
        success: false,
      });
      return { success: false };
    }

    if (!validateEmail(formData.email)) {
      setFormState({
        isLoading: false,
        error: 'Please enter a valid email address',
        success: false,
      });
      return { success: false };
    }

    const passwordError = validatePassword(formData.password);
    if (passwordError) {
      setFormState({
        isLoading: false,
        error: passwordError,
        success: false,
      });
      return { success: false };
    }

    if (formData.confirmPassword && formData.password !== formData.confirmPassword) {
      setFormState({
        isLoading: false,
        error: 'Passwords do not match',
        success: false,
      });
      return { success: false };
    }

    if (formData.name.trim().length < 2) {
      setFormState({
        isLoading: false,
        error: 'Name must be at least 2 characters long',
        success: false,
      });
      return { success: false };
    }

    try {
      const result = await register(
        formData.email.trim(),
        formData.password,
        formData.name.trim()
      );
      
      if (result.success) {
        setFormState({
          isLoading: false,
          error: null,
          success: true,
        });
        return { success: true };
      } else {
        setFormState({
          isLoading: false,
          error: result.error || 'Registration failed',
          success: false,
        });
        return { success: false, error: result.error };
      }
    } catch (error) {
      setFormState({
        isLoading: false,
        error: 'Network error. Please try again.',
        success: false,
      });
      return { success: false, error: 'Network error' };
    }
  };

  return {
    formState,
    handleLogin,
    handleRegister,
    resetFormState,
    validateEmail,
    validatePassword,
  };
}

/**
 * Hook for handling fitness profile form submissions
 */
export function useFitnessProfileForm() {
  const { updateUser } = useAuth();
  const [formState, setFormState] = useState<FormState>({
    isLoading: false,
    error: null,
    success: false,
  });

  const resetFormState = () => {
    setFormState({
      isLoading: false,
      error: null,
      success: false,
    });
  };

  const handleUpdateProfile = async (fitnessData: any) => {
    setFormState({ isLoading: true, error: null, success: false });

    // Basic validation
    if (fitnessData.age && (fitnessData.age < 13 || fitnessData.age > 120)) {
      setFormState({
        isLoading: false,
        error: 'Age must be between 13 and 120',
        success: false,
      });
      return { success: false };
    }

    if (fitnessData.weight && (fitnessData.weight < 30 || fitnessData.weight > 300)) {
      setFormState({
        isLoading: false,
        error: 'Weight must be between 30 and 300 kg',
        success: false,
      });
      return { success: false };
    }

    if (fitnessData.height && (fitnessData.height < 100 || fitnessData.height > 250)) {
      setFormState({
        isLoading: false,
        error: 'Height must be between 100 and 250 cm',
        success: false,
      });
      return { success: false };
    }

    try {
      const result = await updateUser({
        fitnessProfile: fitnessData,
      });
      
      if (result.success) {
        setFormState({
          isLoading: false,
          error: null,
          success: true,
        });
        return { success: true };
      } else {
        setFormState({
          isLoading: false,
          error: result.error || 'Profile update failed',
          success: false,
        });
        return { success: false, error: result.error };
      }
    } catch (error) {
      setFormState({
        isLoading: false,
        error: 'Network error. Please try again.',
        success: false,
      });
      return { success: false, error: 'Network error' };
    }
  };

  return {
    formState,
    handleUpdateProfile,
    resetFormState,
  };
}
