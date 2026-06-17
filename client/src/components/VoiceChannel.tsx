import { useEffect, useRef, useState } from "react";
import { getSocket } from "../lib/socket";
import { useAuthStore } from "../store/useAuthStore";

interface Channel {
  id: string;
  name: string;
  type: string;
  serverId: string;
}

interface Props {
  channel: Channel;
}

export default function VoiceChannel({ channel }: Props) {
  const [connected, setConnected] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [peers, setPeers] = useState<string[]>([]);
  const user = useAuthStore((s) => s.user);
  const audioContextRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const producerRef = useRef<any>(null);
  const transportRef = useRef<any>(null);

  const getRtpCapabilities = () => {
    return new Promise<any>((resolve) => {
      const socket = getSocket();
      if (!socket) return;
      socket.emit("voice:getRtpCapabilities", resolve);
    });
  };

  const createTransport = () => {
    return new Promise<any>((resolve) => {
      const socket = getSocket();
      if (!socket) return;
      socket.emit("voice:createTransport", resolve);
    });
  };

  const connectTransport = (dtlsParameters: any) => {
    const socket = getSocket();
    if (!socket) return;
    socket.emit("voice:connectTransport", dtlsParameters);
  };

  const produce = (kind: string, rtpParameters: any, channelId: string) => {
    return new Promise<any>((resolve) => {
      const socket = getSocket();
      if (!socket) return;
      socket.emit("voice:produce", { kind, rtpParameters, channelId }, resolve);
    });
  };

  const consume = (producerId: string, rtpCapabilities: any) => {
    return new Promise<any>((resolve) => {
      const socket = getSocket();
      if (!socket) return;
      socket.emit("voice:consume", { producerId, rtpCapabilities }, resolve);
    });
  };

  const resumeConsumer = (consumerId: string) => {
    const socket = getSocket();
    if (!socket) return;
    socket.emit("voice:resumeConsumer", consumerId);
  };

  const getPeers = (channelId: string) => {
    return new Promise<string[]>((resolve) => {
      const socket = getSocket();
      if (!socket) return resolve([]);
      socket.emit("voice:getPeers", channelId, resolve);
    });
  };

  const joinVoice = async () => {
    try {
      const socket = getSocket();
      if (!socket) return;

      // Get audio stream
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      // Get router capabilities
      const rtpCapabilities = await getRtpCapabilities();

      // Create send transport
      const transportParams = await createTransport();
      transportRef.current = transportParams;
      connectTransport(transportParams.dtlsParameters);

      // Create a simple RTCPeerConnection-like send
      // For a real implementation, use a WebRTC library or raw PeerConnection
      // Here we simulate via the signaling
      const audioTrack = stream.getAudioTracks()[0];

      // In production: create actual WebRTC connection using the transport params
      // and produce audio via mediasoup-client library

      setConnected(true);
      socket.emit("server:join", channel.serverId);

      // Get current peers
      const currentPeers = await getPeers(channel.id);
      setPeers(currentPeers);

      // Listen for new peers
      socket.on("voice:peerJoined", (peerId: string) => {
        setPeers((prev) => [...prev.filter((p) => p !== peerId), peerId]);
      });
      socket.on("voice:peerLeft", (peerId: string) => {
        setPeers((prev) => prev.filter((p) => p !== peerId));
      });

      // Voice activity detection
      audioContextRef.current = new AudioContext();
      const source = audioContextRef.current.createMediaStreamSource(stream);
      const analyser = audioContextRef.current.createAnalyser();
      source.connect(analyser);
      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      const checkSpeaking = () => {
        analyser.getByteFrequencyData(dataArray);
        const avg = dataArray.reduce((a, b) => a + b, 0) / bufferLength;
        const isSpeaking = avg > 20;
        if (isSpeaking !== speaking) {
          setSpeaking(isSpeaking);
        }
        requestAnimationFrame(checkSpeaking);
      };
      checkSpeaking();

    } catch (err) {
      console.error("Failed to join voice:", err);
    }
  };

  const leaveVoice = () => {
    const socket = getSocket();
    if (socket) {
      socket.emit("voice:leave", channel.id);
      socket.off("voice:peerJoined");
      socket.off("voice:peerLeft");
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
    }
    setConnected(false);
    setPeers([]);
  };

  useEffect(() => {
    return () => {
      if (connected) leaveVoice();
    };
  }, []);

  return (
    <div>
      <button
        onClick={connected ? leaveVoice : joinVoice}
        className={`w-full flex items-center gap-2 px-2 py-1.5 rounded text-sm ${
          connected
            ? "bg-green-500/20 text-green-400"
            : "text-[#949ba4] hover:bg-[#35373c] hover:text-white"
        }`}
      >
        <span className="text-lg">{connected ? "🔊" : "🔇"}</span>
        <div className="flex-1 text-left">
          <div>{channel.name}</div>
          {connected && <div className="text-xs text-green-400">{speaking ? "🔴 Speaking..." : "Connected"}</div>}
        </div>
        {connected && peers.length > 0 && (
          <div className="text-xs text-[#949ba4]">{peers.length + 1} in voice</div>
        )}
      </button>
    </div>
  );
}
