'use client';

import { AuthProvider } from '@/lib/contexts/AuthContext';
import { ReactNode } from 'react';

interface AppAuthProviderProps {
  children: ReactNode;
}

/**
 * Main authentication provider for the entire application
 * This should wrap your app at the root level
 */
export function AppAuthProvider({ children }: AppAuthProviderProps) {
  return (
    <AuthProvider>
      {children}
    </AuthProvider>
  );
}

export default AppAuthProvider;
