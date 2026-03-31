#!/usr/bin/env node
/**
 * Run this once to create the required Supabase storage buckets.
 * Usage:
 *   SUPABASE_URL=https://xxx.supabase.co SUPABASE_SERVICE_ROLE_KEY=your_key node supabase/setup-storage.js
 *
 * Or copy server/.env.example → server/.env, fill in the keys, then run:
 *   node -e "import('dotenv/config')" supabase/setup-storage.js
 */

import { createClient } from "@supabase/supabase-js";

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
  console.error("❌  Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY env vars before running.");
  process.exit(1);
}

const supabase = createClient(url, key, {
  auth: { persistSession: false }
});

async function ensureBucket(id, isPublic, fileSizeLimit, allowedMimeTypes) {
  const { data: existing } = await supabase.storage.getBucket(id);
  if (existing) {
    console.log(`✅  Bucket '${id}' already exists.`);
    return;
  }
  const { error } = await supabase.storage.createBucket(id, {
    public: isPublic,
    fileSizeLimit,
    allowedMimeTypes,
  });
  if (error) {
    console.error(`❌  Failed to create bucket '${id}':`, error.message);
  } else {
    console.log(`✅  Created bucket '${id}'.`);
  }
}

await ensureBucket("avatars", true, 5 * 1024 * 1024, [
  "image/jpeg", "image/png", "image/gif", "image/webp",
]);

await ensureBucket("chat-media", false, 20 * 1024 * 1024, [
  "image/jpeg", "image/png", "image/gif", "image/webp",
  "video/mp4", "video/webm",
  "audio/webm", "audio/ogg", "audio/mpeg",
]);

console.log("\nDone. Now run the SQL in supabase/migrations/20260331000000_create_storage_buckets.sql");
console.log("to set up the RLS policies (select/insert/update/delete rules).");
