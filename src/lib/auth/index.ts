// Authentication Context and Provider exports
export {
  AuthProvider,
  useAuthContext,
  withAuth,
  RequireAuth,
  type AuthUser,
  type AuthState,
  type AuthContextType,
} from '../contexts/AuthContext';

export { default as AppAuthProvider } from '../contexts/AppAuthProvider';

// Authentication Hooks exports
export {
  useAuth,
  useUser,
  useAuthStatus,
  useFitnessProfile,
  useUserPrograms,
  useAuthActions,
  useProfile,
  useAuthRedirect,
  usePermissions,
  useAuthLoading,
  useAuthChecks,
} from '../hooks/useAuth';

export {
  useAuthForm,
  useFitnessProfileForm,
} from '../hooks/useAuthForm';

// Re-export commonly used types
export type { IUser, IFitnessProfile } from '../models/User';
