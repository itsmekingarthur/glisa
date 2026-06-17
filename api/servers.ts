import { VercelRequest, VercelResponse } from "@vercel/node";
import { supabase } from "./lib/supabase";
import { authenticate } from "./lib/auth";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const userId = authenticate(req);
  if (!userId) return res.status(401).json({ error: "No token provided" });

  if (req.method === "GET") {
    const { data, error } = await supabase
      .from("servers")
      .select("*, channels(*), members:server_members!inner(*, user:users!inner(id, username))")
      .eq("members.user_id", userId);
    if (error) return res.status(500).json({ error: error.message });
    return res.json(data);
  }

  if (req.method === "POST") {
    const { name } = req.body;
    if (!name) return res.status(400).json({ error: "Name required" });

    const { data: server, error: sErr } = await supabase
      .from("servers")
      .insert({ name, owner_id: userId, invite_code: crypto.randomUUID() })
      .select()
      .single();
    if (sErr) return res.status(500).json({ error: sErr.message });

    await supabase.from("server_members").insert({ user_id: userId, server_id: server.id });
    await supabase.from("channels").insert([
      { name: "general", type: "text", server_id: server.id },
      { name: "Voice", type: "voice", server_id: server.id },
    ]);

    const { data: full } = await supabase
      .from("servers")
      .select("*, channels(*), members:server_members(*, user:users(id, username))")
      .eq("id", server.id)
      .single();

    return res.json(full);
  }

  return res.status(405).json({ error: "Method not allowed" });
}
