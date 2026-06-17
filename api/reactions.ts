import { VercelRequest, VercelResponse } from "@vercel/node";
import { supabase } from "./lib/supabase";
import { authenticate } from "./lib/auth";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const userId = authenticate(req);
  if (!userId) return res.status(401).json({ error: "No token" });

  if (req.method === "GET") {
    const { messageId } = req.query;
    if (!messageId) return res.status(400).json({ error: "messageId required" });
    const { data } = await supabase.from("reactions").select("*, user:users(id, username)").eq("message_id", messageId);
    return res.json(data || []);
  }

  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const { messageId, emoji } = req.body;
    if (!messageId || !emoji) return res.status(400).json({ error: "Missing messageId or emoji" });

    const { data: existing } = await supabase
      .from("reactions")
      .select("id")
      .eq("message_id", messageId)
      .eq("user_id", userId)
      .eq("emoji", emoji)
      .single();

    if (existing) {
      await supabase.from("reactions").delete().eq("id", existing.id);
      return res.json({ removed: true });
    }

    await supabase.from("reactions").insert({ message_id: messageId, user_id: userId, emoji });
    const { data: reactions } = await supabase
      .from("reactions")
      .select("*, user:users(id, username)")
      .eq("message_id", messageId);

    return res.json({ removed: false, reactions });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
}
