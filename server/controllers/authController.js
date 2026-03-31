import { generateToken } from "../utils/generateToken.js";

export async function loginUser(req, res) {
  // Placeholder: replace with real password verification and user lookup.
  const { username } = req.body || {};
  if (!username) {
    return res.status(400).json({ message: "username is required" });
  }

  const token = generateToken({ username });
  return res.json({ token });
}

export async function registerUser(req, res) {
  // Placeholder: replace with creating a User and hashing the password.
  const { username } = req.body || {};
  if (!username) {
    return res.status(400).json({ message: "username is required" });
  }

  return res.status(201).json({ ok: true });
}

