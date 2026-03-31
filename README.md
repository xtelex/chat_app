# my-chat-app

Monorepo-style layout with separate frontend and backend folders.

## Structure

```
.
├── client/   # React (Vite) + Tailwind
└── server/   # Node/Express (MVC-ish)
```

## Getting started

### Backend

```bash
cd server
cp .env.example .env
npm install
npm run dev
```

### Frontend

```bash
cd client
npm install
npm run dev
```

## Supabase

This project is set up to use Supabase Auth on the frontend, and Supabase Postgres for chat messages.

- SQL schema + RLS policies: `supabase/migrations/20260324190000_init_chat_schema.sql`
- Contacts table (search/add contacts): `supabase/migrations/20260326160000_add_contacts.sql`
- Setup guide: `supabase/README.md`
