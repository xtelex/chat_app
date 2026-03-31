# Project Structure

## Top-level
- `client/`: React (Vite) frontend
- `server/`: Node/Express API (MVC-ish layout)
- `supabase/`: SQL migrations + setup docs

## Frontend structure (`client/src/`)
- `pages/`: route-level pages (`LandingPage.jsx`, `LoginPage.jsx`, `AccountPage.jsx`)
- `components/`: UI sections and reusable components
- `services/`: API/Supabase clients and request helpers
- `context/`, `hooks/`, `utils/`: shared app logic

## Backend structure (`server/`)
- `server.js`: app entrypoint + route mounting
- `routes/`: Express routers (`authRoutes`, `accountRoutes`, `messageRoutes`)
- `controllers/`: request handlers (thin controllers)
- `middleware/`: auth middleware (`requireAuth`)
- `services/`: Supabase clients and helpers
- `config/`, `models/`, `utils/`: supporting code (Mongo is optional)

## Conventions
- JavaScript ESM (`"type": "module"`) everywhere.
- Keep API behavior explicit and predictable: validate inputs, return clear status codes, and don’t silently swallow Supabase errors.

