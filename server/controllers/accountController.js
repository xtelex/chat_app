import { getSupabaseAdmin } from "../services/supabase.js";

export async function deleteAccount(req, res) {
  const authHeader = req.headers.authorization || "";
  const token = authHeader.startsWith("Bearer ")
    ? authHeader.slice("Bearer ".length)
    : null;

  if (!token) {
    return res.status(401).json({ message: "Missing Authorization bearer token" });
  }

  const supabaseAdmin = getSupabaseAdmin();
  if (!supabaseAdmin) {
    return res.status(500).json({
      message:
        "Server is missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY configuration"
    });
  }

  const { data, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !data?.user?.id) {
    return res.status(401).json({ message: "Invalid or expired token" });
  }

  const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(
    data.user.id
  );

  if (deleteError) {
    return res.status(500).json({ message: deleteError.message });
  }

  return res.json({ ok: true });
}
