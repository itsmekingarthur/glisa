import { Server as SocketServer, Socket } from "socket.io";
import jwt from "jsonwebtoken";
import { prisma } from "../index";
import { setupMediasoup } from "../mediasoup";

const JWT_SECRET = process.env.JWT_SECRET || "super-secret-key-change-in-production-12345";

interface AuthSocket extends Socket {
  userId?: string;
}

const onlineUsers = new Set<string>();

export function setupSocket(io: SocketServer) {
  io.use((socket: AuthSocket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) return next(new Error("No token"));
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
      socket.userId = decoded.userId;
      next();
    } catch {
      next(new Error("Invalid token"));
    }
  });

  io.on("connection", (socket: AuthSocket) => {
    const userId = socket.userId!;
    console.log(`User connected: ${userId}`);

    onlineUsers.add(userId);
    socket.broadcast.emit("user:online", userId);
    socket.emit("users:online", Array.from(onlineUsers));

    socket.on("status:update", (status: string) => {
      io.emit("user:status", { userId, status });
    });

    socket.on("server:join", (serverId: string) => {
      socket.join(`server:${serverId}`);
    });

    socket.on("server:leave", (serverId: string) => {
      socket.leave(`server:${serverId}`);
    });

    socket.on("message:send", async (data: { channelId: string; content: string; replyToId?: string }) => {
      const message = await prisma.message.create({
        data: { content: data.content, userId, channelId: data.channelId, replyToId: data.replyToId || null },
        include: {
          user: { select: { id: true, username: true, avatarUrl: true } },
          replyTo: { select: { id: true, content: true, userId: true, user: { select: { id: true, username: true } } } },
          reactions: { include: { user: { select: { id: true, username: true } } } },
        },
      });
      io.to(`server:${data.channelId}`).emit("message:new", message);
    });

    socket.on("message:edit", async (data: { messageId: string; content: string }) => {
      const msg = await prisma.message.findFirst({ where: { id: data.messageId, userId } });
      if (!msg) return;
      const updated = await prisma.message.update({
        where: { id: data.messageId },
        data: { content: data.content, editedAt: new Date() },
        include: {
          user: { select: { id: true, username: true, avatarUrl: true } },
          reactions: { include: { user: { select: { id: true, username: true } } } },
        },
      });
      io.to(`server:${msg.channelId}`).emit("message:updated", updated);
    });

    socket.on("message:delete", async (data: { messageId: string }) => {
      const msg = await prisma.message.findFirst({ where: { id: data.messageId, userId } });
      if (!msg) return;
      await prisma.reaction.deleteMany({ where: { messageId: data.messageId } });
      await prisma.message.delete({ where: { id: data.messageId } });
      io.to(`server:${msg.channelId}`).emit("message:deleted", { id: data.messageId, channelId: msg.channelId });
    });

    socket.on("message:react", async (data: { messageId: string; emoji: string }) => {
      const msg = await prisma.message.findUnique({ where: { id: data.messageId } });
      if (!msg) return;
      const existing = await prisma.reaction.findUnique({
        where: { userId_messageId_emoji: { userId, messageId: data.messageId, emoji: data.emoji } },
      });
      if (existing) {
        await prisma.reaction.delete({ where: { id: existing.id } });
      } else {
        await prisma.reaction.create({ data: { userId, messageId: data.messageId, emoji: data.emoji } });
      }
      const reactions = await prisma.reaction.findMany({
        where: { messageId: data.messageId },
        include: { user: { select: { id: true, username: true } } },
      });
      io.to(`server:${msg.channelId}`).emit("message:reacted", { messageId: data.messageId, reactions });
    });

    setupMediasoup(socket, io);

    socket.on("disconnect", () => {
      console.log(`User disconnected: ${userId}`);
      onlineUsers.delete(userId);
      socket.broadcast.emit("user:offline", userId);
    });
  });
}
