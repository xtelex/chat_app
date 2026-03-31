# Supabase setup

This project uses Supabase Auth (client) and stores chat data in Supabase Postgres + Storage.

## 1) Create a Supabase project

Go to [supabase.com](https://supabase.com), create a project, then copy:
- Project URL
- `anon` / publishable key → goes in `client/.env`
- `service_role` key → goes in `server/.env` only, never the client

---

## 2) Run database migrations

Go to **Supabase Dashboard → SQL Editor** and run each file in `supabase/migrations/` in order:

1. `20260324190000_init_chat_schema.sql`
2. `20260326160000_add_contacts.sql`
3. `20260326170000_add_contact_requests.sql`
4. `20260326180000_direct_messages_and_nicknames.sql`
5. `20260326181000_profile_defaults_google.sql`

---

## 3) Fix "Bucket not found" — create storage buckets

This is required for profile picture uploads, image messages, and voice messages to work.

### Option A — SQL Editor (quickest)

In **Supabase Dashboard → SQL Editor**, paste and run the contents of:

```
supabase/migrations/20260331000000_create_storage_buckets.sql
```

### Option B — Script (needs service role key)

```bash
# From the repo root
SUPABASE_URL=https://yourproject.supabase.co \
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key \
node supabase/setup-storage.js
```

Then still run the SQL migration above to apply the RLS policies.

### Option C — Supabase Dashboard UI

1. Go to **Storage** in the left sidebar
2. Click **New bucket**
3. Create `avatars` — set to **Public**, 5 MB limit
4. Create `chat-media` — set to **Private**, 20 MB limit
5. Then run the SQL migration to add the RLS policies

---

## 4) Configure environment variables

**Frontend** (`client/.env`):
```
VITE_SUPABASE_URL=https://yourproject.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key
VITE_API_BASE_URL=http://localhost:3001
```

**Backend** (`server/.env`):
```
SUPABASE_URL=https://yourproject.supabase.co
SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```
