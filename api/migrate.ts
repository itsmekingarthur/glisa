import { VercelRequest, VercelResponse } from "@vercel/node";
import { supabase } from "../lib/supabase.js";
import { authenticate } from "../lib/auth.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const userId = authenticate(req);
  if (!userId) return res.status(401).json({ error: "Unauthorized" });

  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  // Try to check if friendships table exists by querying it
  const { error: checkErr } = await supabase.from("friendships").select("id").limit(1);
  if (!checkErr) return res.json({ success: true, message: "Table already exists" });

  // Create via raw SQL using Supabase's REST API
  const sql = encodeURIComponent(`
    CREATE TABLE IF NOT EXISTS friendships (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      friend_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'blocked')),
      created_at TIMESTAMPTZ DEFAULT now(),
      UNIQUE(user_id, friend_id)
    );
  `);

  const url = process.env.SUPABASE_URL || "";
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
  const projectRef = url.replace("https://", "").replace(".supabase.co", "");

  const r = await fetch(`https://api.supabase.com/v1/projects/${projectRef}/database/query`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query: decodeURIComponent(sql) }),
  });

  const result = await r.text();
  return res.json({ status: r.status, result });
}
