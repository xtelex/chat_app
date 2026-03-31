import { getSupabaseUserClient } from "../services/supabase.js";

export async function getMessages(req, res) {
  const supabase = getSupabaseUserClient(req.supabaseAccessToken);
  if (!supabase) {
    return res.status(500).json({
      message:
        "Supabase is not configured. Set SUPABASE_URL and SUPABASE_ANON_KEY on the server."
    });
  }

  const requestedLimit = Number(req.query.limit);
  const limit = Number.isFinite(requestedLimit)
    ? Math.max(1, Math.min(100, requestedLimit))
    : 50;

  const { data, error } = await supabase
    .from("messages")
    .select("id, created_at, text, sender_id, profiles:profiles(display_name, avatar_url)")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    return res.status(500).json({ message: error.message });
  }

  const messages = Array.isArray(data) ? data.slice().reverse() : [];
  return res.json({ messages });
}

export async function postMessage(req, res) {
  const { text } = req.body || {};
  if (!text) {
    return res.status(400).json({ message: "text is required" });
  }

  const supabase = getSupabaseUserClient(req.supabaseAccessToken);
  if (!supabase) {
    return res.status(500).json({
      message:
        "Supabase is not configured. Set SUPABASE_URL and SUPABASE_ANON_KEY on the server."
    });
  }

  const trimmed = String(text).trim();
  if (!trimmed) {
    return res.status(400).json({ message: "text is required" });
  }

  const senderId = req.user?.id;
  if (!senderId) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const { data, error } = await supabase
    .from("messages")
    .insert({ sender_id: senderId, text: trimmed })
    .select("id, created_at, text, sender_id")
    .single();

  if (error) {
    return res.status(500).json({ message: error.message });
  }

  return res.status(201).json({ message: data });
}
