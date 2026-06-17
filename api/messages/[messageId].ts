import { VercelRequest, VercelResponse } from "@vercel/node";
import { supabase } from "../lib/supabase.js";
import { authenticate } from "../lib/auth.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const userId = authenticate(req);
  if (!userId) return res.status(401).json({ error: "No token" });

  const { messageId } = req.query;

  if (req.method === "PATCH") {
    const { content } = req.body;
    if (!content) return res.status(400).json({ error: "Content required" });

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
    const { error } = await supabase.from("messages").delete().eq("id", messageId).eq("user_id", userId);
    if (error) return res.status(500).json({ error: error.message });
    return res.json({ success: true, messageId });
  }

  return res.status(405).json({ error: "Method not allowed" });
}
