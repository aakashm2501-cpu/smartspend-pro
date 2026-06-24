# SmartSpend Pro

SmartSpend Pro is a premium personal finance operating system focused on cycle-based budgeting, forecasting, and financial independence.

## Architecture
- **Frontend**: React, Vite, TypeScript, Tailwind CSS
- **Backend/Auth/Database**: Supabase
- **State Management**: React Query (Server), Zustand (Client)

## Getting Started

1. Run `npm install`
2. Create a `.env.local` file with the following variables:
   ```env
   VITE_SUPABASE_URL=your-project-url
   VITE_SUPABASE_ANON_KEY=your-anon-key
   ```
3. Run `npm run dev` to start the local development server.

## Deployment (Vercel)
This project is perfectly optimized for Vercel edge deployment.
1. Push the repository to GitHub.
2. Import the project in Vercel.
3. Add the `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` to your Vercel Environment Variables.
4. Deploy! The PWA manifest and service workers will be compiled automatically.
