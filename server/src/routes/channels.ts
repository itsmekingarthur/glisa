import { Router, Response } from "express";
import { z } from "zod";
import { prisma } from "../index";
import { authenticate, AuthRequest } from "../middleware/auth";

const router = Router();

const createSchema = z.object({
  name: z.string().min(1).max(30),
  type: z.enum(["text", "voice"]),
  serverId: z.string().uuid(),
});

router.post("/", authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const data = createSchema.parse(req.body);
    const channel = await prisma.channel.create({ data: { ...data } });
    return res.json(channel);
  } catch (err) {
    if (err instanceof z.ZodError) return res.status(400).json({ error: err.errors });
    return res.status(500).json({ error: "Server error" });
  }
});

export default router;
