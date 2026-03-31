# Agent Notes (Kiro / AI assistants)

## Repo layout
- `client/` is a standalone Vite + React app (separate `package.json`).
- `server/` is a standalone Node/Express API (separate `package.json`).
- `supabase/` contains SQL migrations and setup notes.

## How to run
- Frontend: `cd client && npm install && npm run dev`
- Backend: `cd server && cp .env.example .env && npm install && npm run dev`

## Environment + secrets
- Do not commit `.env` files or secrets.
- Never expose `SUPABASE_SERVICE_ROLE_KEY` to the client.

## Code conventions
- ESM modules everywhere (`"type": "module"`).
- Keep changes small and consistent with existing style.
- Prefer explicit request validation and clear error responses in the API.

