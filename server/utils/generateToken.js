import jwt from "jsonwebtoken";

export function generateToken(payload, options = {}) {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET is not set");
  }

  return jwt.sign(payload, secret, { expiresIn: "7d", ...options });
}

