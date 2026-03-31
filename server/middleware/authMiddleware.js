import jwt from "jsonwebtoken";

import { getSupabaseAuthClient } from "../services/supabase.js";

export function requireAuth(req, res, next) {
  const header = req.headers.authorization || "";
  const [scheme, token] = header.split(" ");

  if (scheme !== "Bearer" || !token) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const supabaseAuth = getSupabaseAuthClient();
  if (supabaseAuth) {
    supabaseAuth.auth
      .getUser(token)
      .then(({ data, error }) => {
        if (error || !data?.user?.id) {
          return res.status(401).json({ message: "Unauthorized" });
        }

        req.user = { id: data.user.id, email: data.user.email };
        req.supabaseAccessToken = token;
        return next();
      })
      .catch(() => res.status(401).json({ message: "Unauthorized" }));

    return;
  }

  try {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      throw new Error("JWT_SECRET is not set");
    }

    req.user = jwt.verify(token, secret);
    return next();
  } catch {
    return res.status(401).json({ message: "Unauthorized" });
  }
}
