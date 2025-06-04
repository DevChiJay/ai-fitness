<h1 align="center">💪 AI Fitness Assistant 🤖</h1>

![Demo App](/public/screenshot-for-readme.png)

## Highlights:

- 🚀 Tech stack: Next.js, React, Tailwind & Shadcn UI
- 🧠 LLM Integration (Gemini AI)
- 🏋️ Personalized Workout Plans
- 🥗 Custom Diet Programs
- 🔒 Authentication & Authorization (JWT)
- 💾 Database (MongoDB)
- 🎬 Real-time Program Generation
- 💻 Layouts
- 🎭 Client & Server Components

## Features

- **Smart AI Assistant**: Engage in conversation with an AI that asks about your fitness goals, physical condition, and preferences
- **Personalized Workout Plans**: Get custom exercise routines based on your fitness level, injuries, and goals
- **Diet Recommendations**: Receive personalized meal plans accounting for your allergies and dietary preferences
- **User Authentication**: Sign in with GitHub, Google, or email/password
- **Program Management**: Create and view multiple fitness programs with only the latest one active
- **Responsive Design**: Beautiful UI that works across all devices

## Setup .env file

```js
# MongoDB Database
MONGODB_URI=mongodb://localhost:27017/fitness-trainer
# JWT Authentication
JWT_SECRET=your-super-secret-jwt-key-here
# OpenAI API
OPENAI_API_KEY=your-openai-api-key-here
```

## Getting Started

1. Clone the repository
2. Install dependencies:

```shell
npm install
```

3. Set up your environment variables as shown above
4. Run the development server:

```shell
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser

## Deployment

This application can be easily deployed to Vercel:

```shell
npm run build
npm run start
```

Or connect your GitHub repository to Vercel for automatic deployments.

## Technologies Used

- **Next.js**: React framework for building the frontend and API routes
- **Tailwind CSS & Shadcn UI**: For styling and UI components
- **Clerk**: Authentication and user management
- **Vapi**: Voice agent platform for conversational AI
- **MongoDB**: Database for storing user data and fitness programs
- **JWT**: Token-based authentication system
- **OpenAI**: AI-powered workout and nutrition plan generation
- **Gemini AI**: Large Language Model for generating personalized fitness programs

## Learn More

To learn more about the technologies used in this project:

- [Next.js Documentation](https://nextjs.org/docs)
- [MongoDB Documentation](https://docs.mongodb.com)
- [JWT Documentation](https://jwt.io/introduction)
- [OpenAI API Documentation](https://platform.openai.com/docs)
- [Gemini AI Documentation](https://ai.google.dev/gemini-api)
