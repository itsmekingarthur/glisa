import { Router, Response } from "express";
import { z } from "zod";
import { prisma } from "../index";
import { authenticate, AuthRequest } from "../middleware/auth";

const router = Router();

const createSchema = z.object({ name: z.string().min(1).max(50) });

router.post("/", authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { name } = createSchema.parse(req.body);
    const server = await prisma.server.create({
      data: {
        name,
        ownerId: req.userId!,
        channels: {
          create: [
            { name: "general", type: "text" },
            { name: "Voice", type: "voice" },
          ],
        },
        members: { create: { userId: req.userId! } },
      },
      include: { channels: true, members: { include: { user: { select: { id: true, username: true } } } } },
    });
    return res.json(server);
  } catch (err) {
    if (err instanceof z.ZodError) return res.status(400).json({ error: err.errors });
    return res.status(500).json({ error: "Server error" });
  }
});

router.get("/", authenticate, async (req: AuthRequest, res: Response) => {
  const servers = await prisma.server.findMany({
    where: { members: { some: { userId: req.userId! } } },
    include: { channels: true, members: { include: { user: { select: { id: true, username: true } } } } },
  });
  return res.json(servers);
});

router.get("/:id", authenticate, async (req: AuthRequest, res: Response) => {
  const server = await prisma.server.findFirst({
    where: { id: req.params.id, members: { some: { userId: req.userId! } } },
    include: {
      channels: true,
      members: { include: { user: { select: { id: true, username: true, avatarUrl: true } } } },
      owner: { select: { id: true, username: true } },
    },
  });
  if (!server) return res.status(404).json({ error: "Server not found" });
  return res.json(server);
});

router.post("/:id/join", authenticate, async (req: AuthRequest, res: Response) => {
  const server = await prisma.server.findUnique({ where: { id: req.params.id } });
  if (!server) return res.status(404).json({ error: "Server not found" });

  const existing = await prisma.serverMember.findUnique({
    where: { userId_serverId: { userId: req.userId!, serverId: req.params.id } },
  });
  if (existing) return res.status(400).json({ error: "Already a member" });

  await prisma.serverMember.create({ data: { userId: req.userId!, serverId: req.params.id } });
  return res.json({ message: "Joined server" });
});

export default router;
