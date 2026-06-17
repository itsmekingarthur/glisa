import { VercelRequest, VercelResponse } from "@vercel/node";
import { supabase } from "./lib/supabase.js";
import { authenticate } from "./lib/auth.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const userId = authenticate(req);
  if (!userId) return res.status(401).json({ error: "Unauthorized" });

  if (req.method === "GET") {
    const { type } = req.query;
    const status = type === "pending" ? "pending" : "accepted";

    const { data, error } = await supabase
      .from("friendships")
      .select("*, friend:friend_id(id, username), user:user_id(id, username)")
      .or(`user_id.eq.${userId},friend_id.eq.${userId}`)
      .eq("status", status);

    if (error) return res.status(500).json({ error: error.message });

    const items = (data || []).map((f: any) => {
      const other = f.user_id === userId ? f.friend : f.user;
      const incoming = f.friend_id === userId && f.status === "pending";
      return { id: f.id, user: other, created_at: f.created_at, incoming };
    });

    return res.json(items);
  }

  if (req.method === "POST") {
    const { type, targetId } = req.body;
    if (!targetId) return res.status(400).json({ error: "targetId required" });
    if (targetId === userId) return res.status(400).json({ error: "Cannot friend yourself" });

    if (type === "request") {
      const { error } = await supabase.from("friendships").insert({ user_id: userId, friend_id: targetId, status: "pending" });
      if (error) return res.status(400).json({ error: error.message });
      return res.json({ success: true });
    }

    if (type === "accept") {
      const { error } = await supabase
        .from("friendships")
        .update({ status: "accepted" })
        .eq("user_id", targetId)
        .eq("friend_id", userId)
        .eq("status", "pending");
      if (error) return res.status(400).json({ error: error.message });
      return res.json({ success: true });
    }

    if (type === "block") {
      await supabase.from("friendships").insert({ user_id: userId, friend_id: targetId, status: "blocked" });
      return res.json({ success: true });
    }

    return res.status(400).json({ error: "Invalid type" });
  }

  return res.status(405).json({ error: "Method not allowed" });
}
