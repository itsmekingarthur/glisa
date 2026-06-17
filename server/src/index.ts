import express from "express";
import cors from "cors";
import http from "http";
import path from "path";
import { Server as SocketServer } from "socket.io";
import { PrismaClient } from "@prisma/client";
import authRoutes from "./routes/auth";
import serverRoutes from "./routes/servers";
import channelRoutes from "./routes/channels";
import messageRoutes from "./routes/messages";
import { setupSocket } from "./socket";

export const prisma = new PrismaClient();

const app = express();
const server = http.createServer(app);

const io = new SocketServer(server, {
  cors: { origin: "*", methods: ["GET", "POST"] },
});

app.use(cors());
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/servers", serverRoutes);
app.use("/api/channels", channelRoutes);
app.use("/api/messages", messageRoutes);

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok" });
});

// Serve built frontend in production
const clientDist = path.join(__dirname, "../../client/dist");
app.use(express.static(clientDist));
app.get("*", (_req, res) => {
  res.sendFile(path.join(clientDist, "index.html"));
});

setupSocket(io);

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
