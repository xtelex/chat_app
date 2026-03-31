# Technical Stack

## Frontend (`client/`)
- React 18 + React Router
- Vite
- Tailwind CSS
- State: Zustand
- UI/animation: `motion/react`, `lucide-react`, `sonner`
- Supabase client: `@supabase/supabase-js`

### Frontend dev commands
- `npm install` (in `client/`)
- `npm run dev` (in `client/`)

## Backend (`server/`)
- Node.js (ESM) + Express
- Auth middleware:
  - Primary: validate Supabase access tokens via Supabase Auth (`SUPABASE_URL` + `SUPABASE_ANON_KEY` or `SUPABASE_SERVICE_ROLE_KEY`)
  - Fallback: JWT validation using `JWT_SECRET`
- Optional MongoDB connection (only when `MONGO_URI` is set)
- Supabase client: `@supabase/supabase-js`

### Backend dev commands
- `cp .env.example .env` (in `server/`)
- `npm install` (in `server/`)
- `npm run dev` (in `server/`)

## Supabase (`supabase/`)
- Schema + RLS policies live in `supabase/migrations/20260324190000_init_chat_schema.sql`
- Setup notes live in `supabase/README.md`

## Environment variables (high level)
- Client (`client/.env`): `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_API_BASE_URL`
- Server (`server/.env`): `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` (server only), optional `MONGO_URI`

