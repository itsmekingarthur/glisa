import { Socket } from "socket.io";
import { Server as SocketServer } from "socket.io";
import { prisma } from "../index";

let mediasoupModule: any = null;
let worker: any = null;
let router: any = null;

const transports: Map<string, any> = new Map();
const producers: Map<string, any> = new Map();
const consumers: Map<string, any[]> = new Map();
const channelPeers: Map<string, Set<string>> = new Map();

function loadMediasoup() {
  if (mediasoupModule !== undefined) return mediasoupModule;
  try {
    mediasoupModule = require("mediasoup");
    console.log("Mediasoup module loaded");
  } catch (e: any) {
    console.warn("Mediasoup not available:", e.message);
    mediasoupModule = null;
  }
  return mediasoupModule;
}

async function createWorker() {
  const m = loadMediasoup();
  if (!m) return false;
  try {
    worker = await m.createWorker({ logLevel: "warn", rtcMinPort: 40000, rtcMaxPort: 49999 });
    router = await worker.createRouter({
      mediaCodecs: [{ kind: "audio", mimeType: "audio/opus", clockRate: 48000, channels: 2 }],
    });
    console.log("Mediasoup worker & router created");
    return true;
  } catch (e) {
    console.error("Mediasoup init failed:", e);
    return false;
  }
}

export async function setupMediasoup(socket: Socket, io: SocketServer) {
  const m = loadMediasoup();
  if (!m) return;
  if (!router) {
    const ok = await createWorker();
    if (!ok) return;
  }

  socket.on("voice:getRtpCapabilities", (callback) => {
    if (router) callback(router.rtpCapabilities);
  });

  socket.on("voice:createTransport", async (callback) => {
    if (!router) return callback({ error: "Router not ready" });
    const transport = await router.createWebRtcTransport({
      listenIps: [{ ip: "0.0.0.0", announcedIp: process.env.ANNOUNCED_IP || "127.0.0.1" }],
      enableUdp: true, enableTcp: true, preferUdp: true,
    });
    transports.set(socket.id, transport);
    callback({ id: transport.id, iceParameters: transport.iceParameters, iceCandidates: transport.iceCandidates, dtlsParameters: transport.dtlsParameters });
    transport.on("routerclose", () => transports.delete(socket.id));
  });

  socket.on("voice:connectTransport", async (dtlsParameters) => {
    const transport = transports.get(socket.id);
    if (!transport) return;
    await transport.connect({ dtlsParameters });
  });

  socket.on("voice:produce", async ({ kind, rtpParameters, channelId }, callback) => {
    const transport = transports.get(socket.id);
    if (!transport) return;
    const producer = await transport.produce({ kind, rtpParameters });
    producers.set(producer.id, producer);
    if (!channelPeers.has(channelId)) channelPeers.set(channelId, new Set());
    channelPeers.get(channelId)!.add(socket.id);
    await prisma.voiceState.upsert({
      where: { userId: socket.userId! },
      update: { channelId },
      create: { userId: socket.userId!, channelId },
    });
    socket.to(`server:${channelId}`).emit("voice:peerJoined", socket.userId);
    callback({ id: producer.id });
    producer.on("transportclose", () => { producers.delete(producer.id); channelPeers.get(channelId)?.delete(socket.id); });
  });

  socket.on("voice:consume", async ({ producerId, rtpCapabilities }, callback) => {
    if (!router || !router.canConsume({ producerId, rtpCapabilities })) return callback({ error: "Cannot consume" });
    const transport = transports.get(socket.id);
    if (!transport) return;
    const consumer = await transport.consume({ producerId, rtpCapabilities, paused: false });
    if (!consumers.has(socket.id)) consumers.set(socket.id, []);
    consumers.get(socket.id)!.push(consumer);
    callback({ id: consumer.id, producerId: consumer.producerId, kind: consumer.kind, rtpParameters: consumer.rtpParameters });
    consumer.on("transportclose", () => { const list = consumers.get(socket.id); if (list) { const idx = list.indexOf(consumer); if (idx !== -1) list.splice(idx, 1); } });
  });

  socket.on("voice:resumeConsumer", async (consumerId) => {
    for (const c of consumers.get(socket.id) || []) { if (c.id === consumerId) { await c.resume(); break; } }
  });

  socket.on("voice:leave", async (channelId) => {
    channelPeers.get(channelId)?.delete(socket.id);
    const transport = transports.get(socket.id);
    if (transport) { transport.close(); transports.delete(socket.id); }
    await prisma.voiceState.deleteMany({ where: { userId: socket.userId! } });
    socket.to(`server:${channelId}`).emit("voice:peerLeft", socket.userId);
  });

  socket.on("voice:getPeers", async (channelId, callback) => {
    const peers = channelPeers.get(channelId) || new Set();
    const users: string[] = [];
    for (const peerSocketId of peers) {
      const peerSocket = io.sockets.sockets.get(peerSocketId);
      if (peerSocket?.userId) users.push(peerSocket.userId);
    }
    callback(users);
  });
}
