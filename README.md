# FlowVeda Investor Portal

A comprehensive investor portal SaaS platform supporting multiple roles: Investors, Fund Managers, Accountants, and Attorneys.

## Tech Stack

- **Frontend**: React + TypeScript + Vite + Tailwind CSS + shadcn/ui
- **Backend**: Node.js + Fastify + TypeScript
- **Database**: Supabase (PostgreSQL)
- **State Management**: React Query + Zustand
- **Forms**: React Hook Form + Zod
- **Monorepo**: pnpm workspaces

## Project Structure

```
/investor-portal
├── /apps
│   ├── /web          # React frontend
│   └── /api          # Fastify backend
├── /packages
│   └── /shared       # Shared schemas, types, constants
└── /database         # SQL migrations
```

## Getting Started

### Prerequisites

- Node.js >= 18.0.0
- pnpm >= 8.0.0
- Supabase account and project

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd investor-portal
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   ```

3. **Set up Supabase**
   - Create a new Supabase project at https://supabase.com
   - Note your project URL and anon key from Settings > API

4. **Set up environment variables**
   
   **Backend (`apps/api/.env`):**
   ```bash
   # Copy the template file and rename it
   cp apps/api/env.example.txt apps/api/.env
   # Or on Windows PowerShell:
   Copy-Item apps/api/env.example.txt apps/api/.env
   ```
   Then edit `apps/api/.env` and fill in:
   - `SUPABASE_URL` - Your Supabase project URL
   - `SUPABASE_ANON_KEY` - Your Supabase anon key
   - `SUPABASE_SERVICE_ROLE_KEY` - Your Supabase service role key (from Settings > API)
   - `JWT_SECRET` - A random secret string (at least 32 characters)

   **Frontend (`apps/web/.env`):**
   ```bash
   # Copy the template file and rename it
   cp apps/web/env.example.txt apps/web/.env
   # Or on Windows PowerShell:
   Copy-Item apps/web/env.example.txt apps/web/.env
   ```
   Then edit `apps/web/.env` and fill in:
   - `VITE_SUPABASE_URL` - Your Supabase project URL
   - `VITE_SUPABASE_ANON_KEY` - Your Supabase anon key
   - `VITE_API_URL` - Backend API URL (default: http://localhost:3001/api)

5. **Set up the database**
   - Open your Supabase project dashboard
   - Go to SQL Editor
   - Run `database/migrations/001_initial_schema.sql` first
   - Then run `database/migrations/002_rls_policies.sql`
   - See `database/README.md` for detailed instructions

6. **Start development servers**

Frontend: cd "E:\Mizu AI\Investor SaaS Project Jay\apps\web"; npx vite

Backend: cd "E:\Mizu AI\Investor SaaS Project Jay\apps\api"; npx tsx watch src/server.ts

   ```bash
   pnpm dev
   ```

   This will start:
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:3001

7. **Create your first user**
   - Navigate to http://localhost:5173/signup
   - Create an account (you can choose any role for testing)
   - Log in and you'll be redirected to the appropriate dashboard

## Development

- `pnpm dev` - Start all apps in development mode
- `pnpm build` - Build all apps
- `pnpm type-check` - Run TypeScript type checking

## Environment Variables

See `.env.example` files in each app directory for required environment variables.

## License

Proprietary - FlowVeda

