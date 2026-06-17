import { VercelRequest, VercelResponse } from "@vercel/node";
import { supabase } from "./lib/supabase";
import { authenticate } from "./lib/auth";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const userId = authenticate(req);
  if (!userId) return res.status(401).json({ error: "No token provided" });

  if (req.method === "GET") {
    const { channelId, id } = req.query;

    if (id) {
      const { data, error } = await supabase
        .from("messages")
        .select("*, user:users(id, username), reply_to:messages!reply_to(id, content, user:users(id, username)), reactions(*)")
        .eq("id", id)
        .single();
      if (error) return res.status(500).json({ error: error.message });
      return res.json(data);
    }

    if (!channelId) return res.status(400).json({ error: "channelId required" });
    const { data, error } = await supabase
      .from("messages")
      .select("*, user:users(id, username), reply_to:messages!reply_to(id, content, user:users(id, username)), reactions(*)")
      .eq("channel_id", channelId)
      .order("created_at", { ascending: true })
      .limit(100);
    if (error) return res.status(500).json({ error: error.message });
    return res.json(data);
  }

  return res.status(405).json({ error: "Method not allowed" });
}
