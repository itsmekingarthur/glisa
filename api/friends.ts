import { VercelRequest, VercelResponse } from "@vercel/node";
import { supabase } from "./lib/supabase.js";
import { authenticate } from "./lib/auth.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const userId = authenticate(req);
  if (!userId) return res.status(401).json({ error: "Unauthorized" });

  if (req.method === "GET") {
    const { type, q } = req.query;

    // User search
    if (q && typeof q === "string" && q.length >= 1) {
      const { data, error } = await supabase
        .from("users")
        .select("id, username")
        .ilike("username", `%${q}%`)
        .neq("id", userId)
        .limit(10);
      if (error) return res.status(500).json({ error: error.message });

      // Check friendship status for each result
      const userIds = (data || []).map((u: any) => u.id);
      let friendStatus: any = {};
      if (userIds.length > 0) {
        const { data: fData, error: fErr } = await supabase
          .from("friendships")
          .select("user_id, friend_id, status")
          .or(`user_id.eq.${userId},friend_id.eq.${userId}`)
          .in("user_id", [userId, ...userIds])
          .in("friend_id", [userId, ...userIds]);
        if (!fErr && fData) {
          for (const f of fData) {
            const otherId = f.user_id === userId ? f.friend_id : f.user_id;
            if (userIds.includes(otherId)) {
              friendStatus[otherId] = f.status;
            }
          }
        }
      }

      const results = (data || []).map((u: any) => ({
        ...u,
        friend_status: friendStatus[u.id] || null,
      }));
      return res.json(results);
    }

    // Friend list
    const status = type === "pending" ? "pending" : "accepted";
    const { data, error } = await supabase
      .from("friendships")
      .select("*, friend:friend_id(id, username), user:user_id(id, username)")
      .or(`user_id.eq.${userId},friend_id.eq.${userId}`)
      .eq("status", status);

    if (error) {
      if (error.message?.includes("does not exist") || error.code === "42P01") {
        return res.json([]);
      }
      return res.status(500).json({ error: error.message });
    }

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
