# Authentication System Documentation

This document provides comprehensive guidance on using the custom JWT-based authentication system that replaces Clerk in the Fitness Trainer application.

## Overview

The authentication system consists of:
- **JWT-based authentication** with HTTP-only cookies
- **React Context** for state management
- **Custom hooks** for easy integration
- **Protected routes** and components
- **Form validation** utilities
- **MongoDB integration** with User models

## Quick Start

### 1. Wrap Your App with AuthProvider

```tsx
// app/layout.tsx or your root component
import { AppAuthProvider } from '@/lib/auth';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <AppAuthProvider>
          {children}
        </AppAuthProvider>
      </body>
    </html>
  );
}
```

### 2. Use Authentication in Components

```tsx
// components/auth/loginForm.tsx
'use client';

import { useState } from 'react';
import { useAuthForm } from '@/lib/auth';

export function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { formState, handleLogin } = useAuthForm();

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = await handleLogin({ email, password });
    if (result.success) {
      // Redirect or show success message
      window.location.href = '/dashboard';
    }
  };

  return (
    <form onSubmit={onSubmit}>
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Email"
        required
      />
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Password"
        required
      />
      <button type="submit" disabled={formState.isLoading}>
        {formState.isLoading ? 'Signing In...' : 'Sign In'}
      </button>
      {formState.error && <p className="error">{formState.error}</p>}
    </form>
  );
}
```

### 3. Protect Routes and Components

```tsx
// Using HOC
import { withAuth } from '@/lib/auth';

function Dashboard() {
  return <div>Protected Dashboard Content</div>;
}

export default withAuth(Dashboard);

// Using Component
import { RequireAuth } from '@/lib/auth';

export function ProtectedPage() {
  return (
    <RequireAuth>
      <div>This content requires authentication</div>
    </RequireAuth>
  );
}
```

## Available Hooks

### `useAuth()`
Main authentication hook providing all functionality:

```tsx
import { useAuth } from '@/lib/auth';

function MyComponent() {
  const {
    user,                // Current user data
    isLoading,          // Auth loading state
    isAuthenticated,    // Authentication status
    login,              // Login function
    register,           // Register function
    logout,             // Logout function
    updateUser,         // Update user profile
    refreshUser,        // Refresh user data
  } = useAuth();

  // Use the auth state and methods
}
```

### `useUser()`
Get current user information:

```tsx
import { useUser } from '@/lib/auth';

function UserProfile() {
  const user = useUser();
  
  if (!user) return <div>Not logged in</div>;
  
  return (
    <div>
      <h1>Welcome, {user.name}!</h1>
      <p>Email: {user.email}</p>
    </div>
  );
}
```

### `useAuthStatus()`
Check authentication status:

```tsx
import { useAuthStatus } from '@/lib/auth';

function AuthStatus() {
  const { isAuthenticated, isLoading, isReady } = useAuthStatus();
  
  if (isLoading) return <div>Loading...</div>;
  if (!isAuthenticated) return <div>Please log in</div>;
  
  return <div>You are authenticated!</div>;
}
```

### `useFitnessProfile()`
Manage fitness profile data:

```tsx
import { useFitnessProfile } from '@/lib/auth';

function FitnessProfileForm() {
  const {
    fitnessProfile,
    updateFitnessProfile,
    hasFitnessProfile,
    isProfileComplete,
  } = useFitnessProfile();

  const handleUpdate = async (newData) => {
    const result = await updateFitnessProfile(newData);
    if (result.success) {
      // Profile updated successfully
    }
  };

  return (
    <div>
      {!isProfileComplete && (
        <p>Please complete your fitness profile</p>
      )}
      {/* Fitness profile form */}
    </div>
  );
}
```

### `useAuthForm()`
Handle authentication forms with validation:

```tsx
import { useAuthForm } from '@/lib/auth';

function RegisterForm() {
  const { formState, handleRegister, resetFormState } = useAuthForm();
  
  const onSubmit = async (formData) => {
    const result = await handleRegister({
      email: formData.email,
      password: formData.password,
      name: formData.name,
      confirmPassword: formData.confirmPassword,
    });
    
    if (result.success) {
      // Registration successful
    }
  };

  return (
    <form onSubmit={onSubmit}>
      {/* Form fields */}
      {formState.error && <p>{formState.error}</p>}
      {formState.success && <p>Registration successful!</p>}
    </form>
  );
}
```

## API Routes

The system provides several API endpoints:

### Authentication Routes
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration  
- `POST /api/auth/logout` - User logout
- `GET /api/auth/me` - Get current user data
- `PUT /api/auth/update-profile` - Update user profile

### AI Routes
- `POST /api/ai/workout` - Generate workout plans
- `POST /api/ai/nutrition` - Generate nutrition plans
- `POST /api/ai/quick-workout` - Generate quick workouts
- `POST /api/ai/exercise-modifications` - Get exercise modifications

## User Data Structure

```typescript
interface AuthUser {
  id: string;
  email: string;
  name: string;
  fitnessProfile?: {
    age?: number;
    weight?: number;
    height?: number;
    fitnessLevel?: 'beginner' | 'intermediate' | 'advanced';
    activityLevel?: string;
    goals?: string[];
    injuries?: string[];
    allergies?: string[];
    dietaryRestrictions?: string[];
    preferredWorkoutTypes?: string[];
  };
  programs?: string[];
  createdAt?: Date;
  updatedAt?: Date;
}
```

## Error Handling

All authentication functions return results in this format:

```typescript
// Success
{ success: true }

// Error
{ success: false, error: "Error message" }
```

Handle errors appropriately in your components:

```tsx
const result = await login(email, password);
if (!result.success) {
  // Show error message
  setErrorMessage(result.error);
}
```

## Best Practices

1. **Always wrap your app** with `AppAuthProvider` at the root level
2. **Check authentication status** before rendering protected content
3. **Handle loading states** to provide good UX
4. **Validate forms** using the provided form hooks
5. **Use TypeScript types** provided by the system
6. **Handle errors gracefully** with user-friendly messages
7. **Refresh user data** when needed using `refreshUser()`

## Migration from Clerk

If migrating from Clerk, replace:

```tsx
// Old Clerk code
import { useUser, useAuth } from '@clerk/nextjs';
const { user } = useUser();
const { signOut } = useAuth();

// New custom auth code
import { useUser, useAuth } from '@/lib/auth';
const user = useUser();
const { logout } = useAuth();
```

## Environment Variables

Make sure these are set in your `.env.local`:

```env
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_super_secret_jwt_key
OPENAI_API_KEY=your_openai_api_key
```

## Security Features

- **HTTP-only cookies** for token storage
- **Password hashing** with bcrypt
- **JWT token verification** on all protected routes
- **Input validation** and sanitization
- **CSRF protection** through cookie-based auth
- **Secure headers** and middleware protection
