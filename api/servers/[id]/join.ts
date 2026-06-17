import { VercelRequest, VercelResponse } from "@vercel/node";
import { supabase } from "../../lib/supabase";
import { authenticate } from "../../lib/auth";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const userId = authenticate(req);
  if (!userId) return res.status(401).json({ error: "No token" });

  const { id } = req.query;

  if (req.method === "POST") {
    const { code } = req.body;
    let serverId = id as string;

    if (code) {
      const { data: s } = await supabase.from("servers").select("id").eq("invite_code", code).single();
      if (!s) return res.status(404).json({ error: "Invalid invite code" });
      serverId = s.id;
    }

    // Check if already member
    const { data: existing } = await supabase.from("server_members").select("id").eq("user_id", userId).eq("server_id", serverId).single();
    if (existing) return res.status(400).json({ error: "Already a member" });

    const { error } = await supabase.from("server_members").insert({ user_id: userId, server_id: serverId });
    if (error) return res.status(500).json({ error: error.message });

    const { data: server } = await supabase
      .from("servers")
      .select("*, channels(*), members:server_members(*, user:users(id, username))")
      .eq("id", serverId)
      .single();

    return res.json(server);
  }

  return res.status(405).json({ error: "Method not allowed" });
}
