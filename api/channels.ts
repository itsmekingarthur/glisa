import { VercelRequest, VercelResponse } from "@vercel/node";
import { supabase } from "./lib/supabase.js";
import { authenticate } from "./lib/auth.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const userId = authenticate(req);
  if (!userId) return res.status(401).json({ error: "No token" });

  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const { serverId, name, type } = req.body;
    if (!serverId || !name) return res.status(400).json({ error: "Missing serverId or name" });

    // Check ownership
    const { data: server } = await supabase.from("servers").select("owner_id").eq("id", serverId).single();
    if (!server || server.owner_id !== userId) return res.status(403).json({ error: "Not allowed" });

    const { data, error } = await supabase.from("channels").insert({ server_id: serverId, name, type: type || "text" }).select().single();
    if (error) return res.status(500).json({ error: error.message });
    return res.json(data);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
}
