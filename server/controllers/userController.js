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

// Search users by display name (profiles.display_name contains email by default)
export const searchUsers = async (req, res) => {
  const rawQuery = (req.query.q ?? req.query.query ?? "").toString();
  const query = rawQuery.trim();

  if (!query) return res.json({ users: [] });

  const requestedLimit = Number(req.query.limit);
  const limit = Number.isFinite(requestedLimit)
    ? Math.max(1, Math.min(25, requestedLimit))
    : 15;

  const supabase = getClient(req, res);
  if (!supabase) return;

  const { data, error } = await supabase
    .from("profiles")
    .select("id, display_name, avatar_url")
    .ilike("display_name", `%${query}%`)
    .neq("id", req.user?.id)
    .order("updated_at", { ascending: false })
    .limit(limit);

  if (error) {
    return res.status(500).json({ message: error.message });
  }

  const users = Array.isArray(data)
    ? data.map((row) => ({
        id: row.id,
        name: row.display_name || "Unknown",
        avatar_url: row.avatar_url || ""
      }))
    : [];

  return res.json({ users });
};

// Add contact to user's contacts
export const addContact = async (req, res) => {
  const contactId = (req.body?.contactId ?? "").toString().trim();
  if (!contactId) {
    return res.status(400).json({ message: "contactId is required" });
  }

  const userId = req.user?.id;
  if (!userId) return res.status(401).json({ message: "Unauthorized" });
  if (contactId === userId) {
    return res.status(400).json({ message: "You cannot add yourself as a contact" });
  }

  const supabase = getClient(req, res);
  if (!supabase) return;

  const { data, error } = await supabase
    .from("contacts")
    .insert({ user_id: userId, contact_id: contactId })
    .select("user_id, contact_id, created_at")
    .single();

  if (error) {
    if (error.code === "23505") {
      return res.json({ success: true, message: "Contact already added" });
    }
    return res.status(500).json({ message: error.message });
  }

  return res.status(201).json({ success: true, contact: data });
};

// Get user's contacts
export const getContacts = async (req, res) => {
  const userId = req.user?.id;
  if (!userId) return res.status(401).json({ message: "Unauthorized" });

  const supabase = getClient(req, res);
  if (!supabase) return;

  const { data, error } = await supabase
    .from("contacts")
    .select(
      "contact_id, created_at, nickname, contact:profiles!contacts_contact_id_fkey(id, display_name, avatar_url)"
    )
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    return res.status(500).json({ message: error.message });
  }

  const contacts = Array.isArray(data)
    ? data
        .map((row) => ({
          id: row.contact?.id ?? row.contact_id,
          name: row.nickname || row.contact?.display_name || "Unknown",
          display_name: row.contact?.display_name ?? "Unknown",
          nickname: row.nickname ?? null,
          avatar_url: row.contact?.avatar_url ?? "",
          created_at: row.created_at
        }))
        .filter((row) => Boolean(row.id))
    : [];

  return res.json({ contacts });
};

// Remove contact
export const removeContact = async (req, res) => {
  const contactId = (req.body?.contactId ?? "").toString().trim();
  if (!contactId) {
    return res.status(400).json({ message: "contactId is required" });
  }

  const userId = req.user?.id;
  if (!userId) return res.status(401).json({ message: "Unauthorized" });

  const supabase = getClient(req, res);
  if (!supabase) return;

  const { error } = await supabase
    .from("contacts")
    .delete()
    .eq("user_id", userId)
    .eq("contact_id", contactId);

  if (error) {
    return res.status(500).json({ message: error.message });
  }

  return res.json({ success: true });
};

export const setContactNickname = async (req, res) => {
  const contactId = (req.body?.contactId ?? "").toString().trim();
  const nicknameRaw = req.body?.nickname ?? null;
  const nickname =
    nicknameRaw == null || String(nicknameRaw).trim() === "" ? null : String(nicknameRaw).trim();

  if (!contactId) return res.status(400).json({ message: "contactId is required" });

  if (nickname && nickname.length > 50) {
    return res.status(400).json({ message: "nickname must be 50 characters or less" });
  }

  const userId = req.user?.id;
  if (!userId) return res.status(401).json({ message: "Unauthorized" });

  const supabase = getClient(req, res);
  if (!supabase) return;

  const { data, error } = await supabase
    .from("contacts")
    .update({ nickname })
    .eq("user_id", userId)
    .eq("contact_id", contactId)
    .select("user_id, contact_id, nickname")
    .single();

  if (error) {
    return res.status(500).json({ message: error.message });
  }

  return res.json({ success: true, contact: data });
};

// Create a contact request (requester -> recipient)
export const createContactRequest = async (req, res) => {
  const recipientId = (req.body?.recipientId ?? "").toString().trim();
  if (!recipientId) {
    return res.status(400).json({ message: "recipientId is required" });
  }

  const requesterId = req.user?.id;
  if (!requesterId) return res.status(401).json({ message: "Unauthorized" });
  if (recipientId === requesterId) {
    return res.status(400).json({ message: "You cannot send a request to yourself" });
  }

  const supabase = getClient(req, res);
  if (!supabase) return;

  const { data, error } = await supabase
    .from("contact_requests")
    .insert({ requester_id: requesterId, recipient_id: recipientId, status: "pending" })
    .select("requester_id, recipient_id, status, created_at")
    .single();

  if (error) {
    if (error.code === "23505") {
      return res.json({ success: true, message: "Request already sent" });
    }
    return res.status(500).json({ message: error.message });
  }

  return res.status(201).json({ success: true, request: data });
};

// Respond to a contact request (recipient updates status)
export const respondToContactRequest = async (req, res) => {
  const requesterId = (req.body?.requesterId ?? "").toString().trim();
  const rawStatus = (req.body?.status ?? "").toString().trim().toLowerCase();

  if (!requesterId) return res.status(400).json({ message: "requesterId is required" });
  if (!["accepted", "declined"].includes(rawStatus)) {
    return res.status(400).json({ message: "status must be 'accepted' or 'declined'" });
  }

  const recipientId = req.user?.id;
  if (!recipientId) return res.status(401).json({ message: "Unauthorized" });

  const supabase = getClient(req, res);
  if (!supabase) return;

  const { data, error } = await supabase
    .from("contact_requests")
    .update({ status: rawStatus })
    .eq("requester_id", requesterId)
    .eq("recipient_id", recipientId)
    .select("requester_id, recipient_id, status, updated_at")
    .single();

  if (error) {
    return res.status(500).json({ message: error.message });
  }

  return res.json({ success: true, request: data });
};

// List contact requests for the current user
export const listContactRequests = async (req, res) => {
  const userId = req.user?.id;
  if (!userId) return res.status(401).json({ message: "Unauthorized" });

  const status = (req.query.status ?? "pending").toString().trim().toLowerCase();
  const allowedStatuses = new Set(["pending", "accepted", "declined", "all"]);
  const effectiveStatus = allowedStatuses.has(status) ? status : "pending";

  const supabase = getClient(req, res);
  if (!supabase) return;

  let query = supabase
    .from("contact_requests")
    .select(
      "requester_id, recipient_id, status, created_at, updated_at, requester:profiles!contact_requests_requester_id_fkey(id, display_name, avatar_url), recipient:profiles!contact_requests_recipient_id_fkey(id, display_name, avatar_url)"
    )
    .or(`requester_id.eq.${userId},recipient_id.eq.${userId}`)
    .order("created_at", { ascending: false })
    .limit(50);

  if (effectiveStatus !== "all") {
    query = query.eq("status", effectiveStatus);
  }

  const { data, error } = await query;

  if (error) {
    return res.status(500).json({ message: error.message });
  }

  const requests = Array.isArray(data)
    ? data.map((row) => ({
        requester_id: row.requester_id,
        recipient_id: row.recipient_id,
        status: row.status,
        created_at: row.created_at,
        updated_at: row.updated_at,
        requester: row.requester
          ? {
              id: row.requester.id,
              name: row.requester.display_name ?? "Unknown",
              avatar_url: row.requester.avatar_url ?? ""
            }
          : null,
        recipient: row.recipient
          ? {
              id: row.recipient.id,
              name: row.recipient.display_name ?? "Unknown",
              avatar_url: row.recipient.avatar_url ?? ""
            }
          : null
      }))
    : [];

  return res.json({ requests });
};
