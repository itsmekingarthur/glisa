import { VercelRequest, VercelResponse } from "@vercel/node";
import bcrypt from "bcryptjs";
import { supabase } from "../lib/supabase";
import { generateToken } from "../lib/auth";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  try {
    const { username, email, password } = req.body;
    if (!username || !email || !password) return res.status(400).json({ error: "Missing fields" });

    const hashed = await bcrypt.hash(password, 10);
    const { data, error } = await supabase.from("users").insert({ username, email, password: hashed }).select().single();
    if (error) return res.status(400).json({ error: error.message });

    const token = generateToken(data.id);
    return res.json({ token, user: { id: data.id, username: data.username, email: data.email } });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
}
