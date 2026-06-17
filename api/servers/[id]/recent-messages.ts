import { VercelRequest, VercelResponse } from "@vercel/node";
import { supabase } from "../../lib/supabase.js";
import { authenticate } from "../../lib/auth.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const userId = authenticate(req);
  if (!userId) return res.status(401).json({ error: "No token provided" });

  const { id } = req.query;
  if (!id) return res.status(400).json({ error: "Server ID required" });

  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });

  const { data: channels, error: chErr } = await supabase
    .from("channels")
    .select("id")
    .eq("server_id", id)
    .eq("type", "text");

  if (chErr) return res.status(500).json({ error: chErr.message });

  const channelIds = channels?.map(c => c.id) || [];
  if (channelIds.length === 0) return res.json([]);

  const { data, error } = await supabase
    .from("messages")
    .select("*, user:users(id, username), channel:channels(id, name), reactions(*)")
    .in("channel_id", channelIds)
    .order("created_at", { ascending: false })
    .limit(3);

  if (error) return res.status(500).json({ error: error.message });
  return res.json(data || []);
}
