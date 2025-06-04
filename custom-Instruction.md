# Migration Phases for Agent Mode

## **Phase 1: Dependency Cleanup & Installation**
**Goal**: Remove old dependencies and install new ones

**Tasks**:
1. Remove Clerk, Convex, Vapi, and Svix dependencies
2. Install JWT, MongoDB, and AI dependencies

**Commands**:
```bash
npm uninstall @clerk/nextjs convex @vapi-ai/web svix
npm install jsonwebtoken bcryptjs mongoose @types/jsonwebtoken @types/bcryptjs
npm install openai
```

---

## **Phase 2: Database Setup & Connection**
**Goal**: Set up MongoDB connection and database utilities

**Tasks**:
1. Create MongoDB connection utility
2. Set up environment variables structure

**Files to create**:
- `lib/mongodb.ts`
- Update `.env.local` with MongoDB URI

---

## **Phase 3: User Authentication Models**
**Goal**: Create JWT utilities and User model

**Tasks**:
1. Create JWT authentication utilities (hash, verify, generate tokens)
2. Create MongoDB User model schema

**Files to create**:
- `lib/auth.ts`
- `lib/models/User.ts`

---

## **Phase 4: Fitness Program Models**
**Goal**: Create database models for fitness programs

**Tasks**:
1. Create Program model for workouts and nutrition
2. Set up model relationships between User and Program

**Files to create**:
- `lib/models/Program.ts`

---

## **Phase 5: Authentication API Routes**
**Goal**: Create login/register API endpoints

**Tasks**:
1. Create login API route with JWT token generation
2. Create register API route with password hashing

**Files to create**:
- `app/api/auth/login/route.ts`
- `app/api/auth/register/route.ts`

---

## **Phase 6: Authentication Middleware**
**Goal**: Create authentication middleware and logout functionality

**Tasks**:
1. Create middleware to verify JWT tokens
2. Create logout API route

**Files to create**:
- `middleware.ts`
- `app/api/auth/logout/route.ts`

---

## **Phase 7: AI Integration Setup**
**Goal**: Set up OpenAI integration for workout/nutrition generation

**Tasks**:
1. Create AI utility functions for workout generation
2. Create AI utility functions for nutrition planning

**Files to create**:
- `lib/ai/openai.ts`

---

## **Phase 8: AI API Routes**
**Goal**: Create API endpoints for AI-generated content

**Tasks**:
1. Create API route for generating workout plans
2. Create API route for generating nutrition plans

**Files to create**:
- `app/api/ai/generate-workout/route.ts`
- `app/api/ai/generate-nutrition/route.ts`

---

## **Phase 9: Authentication Context & Hooks**
**Goal**: Create React context for authentication state

**Tasks**:
1. Create authentication context provider
2. Create custom hooks for auth operations

**Files to create**:
- `lib/contexts/AuthContext.tsx`
- `lib/hooks/useAuth.ts`

---

## **Phase 10: Simple Voice Assistant**
**Goal**: Replace Vapi with simple voice features

**Tasks**:
1. Install react-speech-kit
2. Create basic voice assistant component

**Commands & Files**:
```bash
npm install react-speech-kit
```
- `components/VoiceAssistant.tsx`

---

## **Phase 11: Update Existing Components**
**Goal**: Remove Clerk imports and replace with new auth

**Tasks**:
1. Find and update components using Clerk authentication
2. Replace Clerk hooks with custom auth hooks

**Files to modify**:
- Any existing components using `@clerk/nextjs`

---

## **Phase 12: Update Database Queries**
**Goal**: Replace Convex queries with MongoDB operations

**Tasks**:
1. Find and replace Convex database operations
2. Update data fetching with MongoDB queries

**Files to modify**:
- Any existing components using Convex queries

---

## **Usage Instructions for Agent Mode**
1. Run one phase at a time
2. Test functionality after each phase
3. Move to next phase only after current phase is complete
4. Each phase should take 5-10 minutes to complete

## **Environment Variables Needed** (Set up in Phase 2)
```env
MONGODB_URI=mongodb://localhost:27017/fitness-trainer
JWT_SECRET=your-super-secret-jwt-key
OPENAI_API_KEY=your-openai-api-key
```

## **Dependencies to Remove**
- `@clerk/nextjs`
- `convex`
- `@vapi-ai/web`
- `svix`

## **Dependencies to Add**
- `jsonwebtoken`
- `bcryptjs`
- `mongoose`
- `@types/jsonwebtoken`
- `@types/bcryptjs`
- `openai`
- `react-speech-kit`

## **Project Structure After Migration**
```
lib/
├── mongodb.ts
├── auth.ts
├── models/
│   ├── User.ts
│   └── Program.ts
├── ai/
│   └── openai.ts
├── contexts/
│   └── AuthContext.tsx
└── hooks/
    └── useAuth.ts

app/api/
├── auth/
│   ├── login/route.ts
│   ├── register/route.ts
│   └── logout/route.ts
└── ai/
    ├── generate-workout/route.ts
    └── generate-nutrition/route.ts

components/
└── VoiceAssistant.tsx

middleware.ts
```