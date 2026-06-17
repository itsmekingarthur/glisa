import { VercelRequest, VercelResponse } from "@vercel/node";
import bcrypt from "bcryptjs";
import { supabase } from "../lib/supabase.js";
import { generateToken } from "../lib/auth.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: "Missing fields" });

    const { data, error } = await supabase.from("users").select("*").eq("email", email).single();
    if (error || !data) return res.status(401).json({ error: "Invalid credentials" });

    const valid = await bcrypt.compare(password, data.password);
    if (!valid) return res.status(401).json({ error: "Invalid credentials" });

    const token = generateToken(data.id);
    return res.json({ token, user: { id: data.id, username: data.username, email: data.email } });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
}
