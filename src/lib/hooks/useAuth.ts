'use client';

import { useAuthContext, AuthUser } from '@/lib/contexts/AuthContext';
import { useRouter } from 'next/navigation'; // Added import

// Main auth hook that provides all authentication functionality
export function useAuth() {
  const context = useAuthContext();
  
  return {
    // State
    user: context.user,
    isLoading: context.isLoading,
    isAuthenticated: context.isAuthenticated,
    
    // Actions
    login: context.login,
    register: context.register,
    logout: context.logout,
    updateUser: context.updateUser,
    refreshUser: context.refreshUser,
  };
}

// Hook for getting current user information
export function useUser(): AuthUser | null {
  const { user } = useAuthContext();
  return user;
}

// Hook for checking authentication status
export function useAuthStatus() {
  const { isAuthenticated, isLoading } = useAuthContext();
  
  return {
    isAuthenticated,
    isLoading,
    isReady: !isLoading,
  };
}

// Hook for fitness profile specific operations
export function useFitnessProfile() {
  const { user, updateUser } = useAuthContext();
  
  const updateFitnessProfile = async (fitnessData: Partial<NonNullable<AuthUser['fitnessProfile']>>) => {
    if (!user) {
      return { success: false, error: 'User not authenticated' };
    }
    
    const updatedUser = {
      ...user,
      fitnessProfile: {
        ...user.fitnessProfile,
        ...fitnessData,
      },
    };
    
    return await updateUser(updatedUser);
  };
  
  const hasFitnessProfile = user?.fitnessProfile && 
    user.fitnessProfile.age && 
    user.fitnessProfile.weight && 
    user.fitnessProfile.height &&
    user.fitnessProfile.fitnessLevel;
  
  return {
    fitnessProfile: user?.fitnessProfile,
    updateFitnessProfile,
    hasFitnessProfile: Boolean(hasFitnessProfile),
    isProfileComplete: Boolean(hasFitnessProfile),
  };
}

// Hook for user programs
export function useUserPrograms() {
  const { user } = useAuthContext();
  
  return {
    programs: user?.programs || [],
    programCount: user?.programs?.length || 0,
    hasPrograms: Boolean(user?.programs && user.programs.length > 0),
  };
}

// Hook for authentication actions only (useful for forms)
export function useAuthActions() {
  const { login, register, logout } = useAuthContext();
  
  return {
    login,
    register, 
    logout,
  };
}

// Hook for user profile management
export function useProfile() {
  const { user, updateUser, refreshUser } = useAuthContext();
  
  const updateProfile = async (profileData: Partial<AuthUser>) => {
    return await updateUser(profileData);
  };
  
  const updateBasicInfo = async (basicInfo: { name?: string; email?: string }) => {
    if (!user) {
      return { success: false, error: 'User not authenticated' };
    }
    
    return await updateUser({
      ...user,
      ...basicInfo,
    });
  };
  
  return {
    user,
    updateProfile,
    updateBasicInfo,
    refreshProfile: refreshUser,
  };
}

// Hook for handling authentication redirects
export function useAuthRedirect() {
  const { isAuthenticated, isLoading } = useAuthContext();
  const router = useRouter(); // Added router instance
  
  const redirectToAuth = (returnUrl?: string) => {
    const url = returnUrl ? `/auth/login?returnUrl=${encodeURIComponent(returnUrl)}` : '/auth/login';
    router.push(url); // Changed from window.location.href
  };
  
  const redirectToDashboard = () => {
    router.push('/'); // Changed from window.location.href
  };
  
  return {
    isAuthenticated,
    isLoading,
    redirectToAuth,
    redirectToDashboard,
    shouldRedirectToAuth: !isLoading && !isAuthenticated,
    shouldRedirectToDashboard: !isLoading && isAuthenticated,
  };
}

// Hook for checking user permissions/roles (future extensibility)
export function usePermissions() {
  const { user } = useAuthContext();
  
  // For future role-based access control
  const hasRole = (role: string) => {
    // Implementation placeholder for future role system
    return false;
  };
  
  const canAccessFeature = (feature: string) => {
    // Implementation placeholder for feature-based permissions
    return Boolean(user); // For now, any authenticated user can access features
  };
  
  return {
    hasRole,
    canAccessFeature,
    isAuthenticated: Boolean(user),
  };
}

// Hook for managing authentication loading states
export function useAuthLoading() {
  const { isLoading } = useAuthContext();
  
  return {
    isLoading,
    isReady: !isLoading,
  };
}

// Utility hook for common authentication checks
export function useAuthChecks() {
  const { user, isAuthenticated, isLoading } = useAuthContext();
  
  return {
    isLoggedIn: isAuthenticated,
    isLoggedOut: !isAuthenticated && !isLoading,
    isCheckingAuth: isLoading,
    hasUser: Boolean(user),
    userId: user?.id,
    userEmail: user?.email,
    userName: user?.name,
  };
}
