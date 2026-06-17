import { VercelRequest, VercelResponse } from "@vercel/node";
import { supabase } from "./lib/supabase.js";
import { authenticate } from "./lib/auth.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const userId = authenticate(req);
  if (!userId) return res.status(401).json({ error: "No token provided" });

  const { channelId, id: qId, messageId } = req.query;
  const id = qId || messageId;

  if (req.method === "GET") {
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

  if (req.method === "POST") {
    const { channelId: bodyChannelId, content, replyToId } = req.body;
    if (!bodyChannelId || !content) return res.status(400).json({ error: "Missing channelId or content" });

    const { data, error } = await supabase
      .from("messages")
      .insert({ channel_id: bodyChannelId, user_id: userId, content, reply_to_id: replyToId || null })
      .select("*, user:users(id, username), reply_to:messages!reply_to(id, content, user:users(id, username))")
      .single();

    if (error) return res.status(500).json({ error: error.message });
    return res.json(data);
  }

  if (req.method === "PATCH") {
    const messageId = id as string;
    const { content } = req.body;
    if (!messageId || !content) return res.status(400).json({ error: "id and content required" });

    const { data, error } = await supabase
      .from("messages")
      .update({ content, edited_at: new Date().toISOString() })
      .eq("id", messageId)
      .eq("user_id", userId)
      .select("*, user:users(id, username), reactions(*)")
      .single();

    if (error) return res.status(500).json({ error: error.message });
    if (!data) return res.status(404).json({ error: "Message not found or not yours" });
    return res.json(data);
  }

  if (req.method === "DELETE") {
    const messageId = id as string;
    if (!messageId) return res.status(400).json({ error: "id required" });

    const { error } = await supabase.from("messages").delete().eq("id", messageId).eq("user_id", userId);
    if (error) return res.status(500).json({ error: error.message });
    return res.json({ success: true, messageId });
  }

  return res.status(405).json({ error: "Method not allowed" });
}
