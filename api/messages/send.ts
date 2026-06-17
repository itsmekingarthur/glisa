import { VercelRequest, VercelResponse } from "@vercel/node";
import { supabase } from "../lib/supabase.js";
import { authenticate } from "../lib/auth.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const userId = authenticate(req);
  if (!userId) return res.status(401).json({ error: "No token" });

  try {
    const { channelId, content, replyToId } = req.body;
    if (!channelId || !content) return res.status(400).json({ error: "Missing channelId or content" });

    const { data, error } = await supabase
      .from("messages")
      .insert({ channel_id: channelId, user_id: userId, content, reply_to_id: replyToId || null })
      .select("*, user:users(id, username), reply_to:messages!reply_to(id, content, user:users(id, username))")
      .single();

    if (error) return res.status(500).json({ error: error.message });
    return res.json(data);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
}
