import { getSupabaseUserClient } from "../services/supabase.js";

function getClient(req, res) {
  const supabase = getSupabaseUserClient(req.supabaseAccessToken);
  if (!supabase) {
    res.status(500).json({
      message:
        "Supabase is not configured on the server. Set SUPABASE_URL and SUPABASE_ANON_KEY in server/.env."
    });
    return null;
  }
  return supabase;
}

export async function getDirectMessages(req, res) {
  const contactId = (req.params.contactId ?? "").toString().trim();
  if (!contactId) return res.status(400).json({ message: "contactId is required" });

  const userId = req.user?.id;
  if (!userId) return res.status(401).json({ message: "Unauthorized" });

  const requestedLimit = Number(req.query.limit);
  const limit = Number.isFinite(requestedLimit)
    ? Math.max(1, Math.min(200, requestedLimit))
    : 50;

  const supabase = getClient(req, res);
  if (!supabase) return;

  const { data, error } = await supabase
    .from("direct_messages")
    .select("id, created_at, sender_id, recipient_id, text, media_path, media_type, media_mime")
    .or(
      `and(sender_id.eq.${userId},recipient_id.eq.${contactId}),and(sender_id.eq.${contactId},recipient_id.eq.${userId})`
    )
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    return res.status(500).json({ message: error.message });
  }

  const messages = Array.isArray(data) ? data.slice().reverse() : [];
  return res.json({ messages });
}

export async function postDirectMessage(req, res) {
  const contactId = (req.params.contactId ?? "").toString().trim();
  if (!contactId) return res.status(400).json({ message: "contactId is required" });

  const userId = req.user?.id;
  if (!userId) return res.status(401).json({ message: "Unauthorized" });

  const text = req.body?.text ?? null;
  const trimmed = text == null ? null : String(text).trim();
  const mediaPath = (req.body?.mediaPath ?? "").toString().trim() || null;
  const mediaType = (req.body?.mediaType ?? "").toString().trim() || null;
  const mediaMime = (req.body?.mediaMime ?? "").toString().trim() || null;

  if (!trimmed && !mediaPath) {
    return res.status(400).json({ message: "text or mediaPath is required" });
  }

  const supabase = getClient(req, res);
  if (!supabase) return;

  const payload = {
    sender_id: userId,
    recipient_id: contactId,
    text: trimmed || null,
    media_path: mediaPath,
    media_type: mediaType,
    media_mime: mediaMime
  };

  const { data, error } = await supabase
    .from("direct_messages")
    .insert(payload)
    .select("id, created_at, sender_id, recipient_id, text, media_path, media_type, media_mime")
    .single();

  if (error) {
    return res.status(500).json({ message: error.message });
  }

  return res.status(201).json({ message: data });
}

