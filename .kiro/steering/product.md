# Product Brief — My Chat App

## What this is
`my-chat-app` is a small full‑stack chat app with:

- A marketing/landing page (`/`)
- Login (`/login`) backed by Supabase Auth
- An account/chat experience (`/account`)
- A Node/Express API (`server/`) used by the frontend (`client/`)

## Core user flows
- Sign in with Supabase Auth on the client.
- The client calls the API with `Authorization: Bearer <supabase_access_token>`.
- The API validates the token (via Supabase Auth when configured) and serves protected resources.
- Chat messages are stored in Supabase Postgres (`messages` table) and read/written via the API.

## Constraints & non-goals
- Never expose `SUPABASE_SERVICE_ROLE_KEY` to the browser.
- Keep auth checks server-side for any protected data mutations.
- Prefer minimal, incremental UI changes: this repo already has a polished animated landing page.

