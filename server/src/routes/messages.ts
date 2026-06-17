import { Router, Response } from "express";
import { z } from "zod";
import { prisma } from "../index";
import { authenticate, AuthRequest } from "../middleware/auth";

const router = Router();

const createSchema = z.object({
  content: z.string().min(1).max(2000),
  channelId: z.string().uuid(),
});

router.get("/:channelId", authenticate, async (req: AuthRequest, res: Response) => {
  const messages = await prisma.message.findMany({
    where: { channelId: req.params.channelId },
    include: {
      user: { select: { id: true, username: true, avatarUrl: true } },
      replyTo: { select: { id: true, content: true, userId: true, user: { select: { id: true, username: true } } } },
      reactions: { include: { user: { select: { id: true, username: true } } } },
    },
    orderBy: { createdAt: "asc" },
    take: 100,
  });
  return res.json(messages);
});

export default router;
