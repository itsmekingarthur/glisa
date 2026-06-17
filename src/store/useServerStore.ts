import { create } from "zustand";
import { api } from "../lib/api";

interface User { id: string; username: string; }
interface Reaction { id: string; emoji: string; user_id: string; user: User; message_id: string; }
interface Message { id: string; content: string; user_id: string; user: User; channel_id: string; created_at: string; edited_at?: string; reply_to_id?: string; reply_to?: { id: string; content: string; user: User; }; reactions: Reaction[]; }
interface Channel { id: string; name: string; type: string; server_id: string; }
interface ServerMember { id: string; user_id: string; user: User; }
interface Server { id: string; name: string; owner_id: string; channels: Channel[]; members: ServerMember[]; }

interface ServerState {
  servers: Server[];
  currentServer: Server | null;
  currentChannel: Channel | null;
  messages: Message[];
  loading: boolean;
  replyingTo: Message | null;
  onlineUsers: Set<string>;
  connectedVoiceChannel: string | null;
  voiceParticipants: { id: string; username: string }[];
  isMuted: boolean;
  isDeafened: boolean;
  isSpeaking: boolean;
  setSpeaking: (v: boolean) => void;
  fetchServers: () => Promise<void>;
  selectServer: (server: Server) => void;
  selectChannel: (channel: Channel) => void;
  fetchMessages: (channelId: string) => Promise<void>;
  sendMessage: (channelId: string, content: string, replyToId?: string) => Promise<void>;
  editMessage: (messageId: string, content: string) => Promise<void>;
  deleteMessage: (messageId: string) => Promise<void>;
  toggleReaction: (messageId: string, emoji: string) => Promise<void>;
  setReplyingTo: (msg: Message | null) => void;
  addMessage: (msg: Message) => void;
  updateMessage: (msg: Message) => void;
  removeMessage: (msgId: string) => void;
  setReactions: (messageId: string, reactions: Reaction[]) => void;
  setOnlineUsers: (ids: string[]) => void;
  addOnlineUser: (id: string) => void;
  joinVoice: (channelId: string, user: { id: string; username: string }) => void;
  leaveVoice: () => void;
  toggleMute: () => void;
  toggleDeafen: () => void;
}

export const useServerStore = create<ServerState>((set, get) => ({
  servers: [],
  currentServer: null,
  currentChannel: null,
  messages: [],
  loading: false,
  replyingTo: null,
  onlineUsers: new Set(),
  connectedVoiceChannel: null,
  voiceParticipants: [],
  isMuted: false,
  isDeafened: false,
  isSpeaking: false,

  fetchServers: async () => {
    try {
      const data = await api.servers.list();
      set({ servers: data || [] });
    } catch { set({ servers: [] }); }
  },

  selectServer: (server) => {
    set({ currentServer: server, currentChannel: null, messages: [] });
  },

  selectChannel: (channel) => {
    set({ currentChannel: channel });
    if (channel.type !== "voice") {
      get().fetchMessages(channel.id);
    }
  },

  fetchMessages: async (channelId) => {
    if (!channelId) return;
    try {
      const data = await api.messages.list(channelId);
      set({ messages: data || [] });
    } catch {}
  },

  sendMessage: async (channelId, content, replyToId) => {
    const token = localStorage.getItem("token");
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    const tempId = "temp-" + Date.now();
    const tempMsg: any = {
      id: tempId,
      content,
      user_id: user.id,
      user: { id: user.id, username: user.username },
      channel_id: channelId,
      created_at: new Date().toISOString(),
      reply_to_id: replyToId || null,
      reactions: [],
    };
    if (replyToId) {
      tempMsg.reply_to = get().messages.find(m => m.id === replyToId);
    }
    set((s) => ({ messages: [...s.messages, tempMsg] }));

    try {
      const res = await fetch("/api/messages/send", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ channelId, content, replyToId }),
      });
      if (res.ok) {
        const saved = await res.json();
        set((s) => ({ messages: s.messages.map(m => m.id === tempId ? { ...saved, reactions: m.reactions } : m) }));
      }
    } catch {}
  },

  editMessage: async (messageId, content) => {
    const token = localStorage.getItem("token");
    const res = await fetch("/api/messages?messageId=" + messageId, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: JSON.stringify({ content }),
    });
    if (res.ok) {
      const updated = await res.json();
      get().updateMessage(updated);
    }
  },

  deleteMessage: async (messageId) => {
    const token = localStorage.getItem("token");
    await fetch("/api/messages?messageId=" + messageId, { method: "DELETE", headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) } });
    get().removeMessage(messageId);
  },

  toggleReaction: async (messageId, emoji) => {
    const token = localStorage.getItem("token");
    await fetch("/api/reactions", {
      method: "POST",
      headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: JSON.stringify({ messageId, emoji }),
    });
  },

  setReplyingTo: (msg) => set({ replyingTo: msg }),
  addMessage: (msg) => set((s) => ({
    messages: s.messages.some(m => m.id === msg.id) ? s.messages : [...s.messages, msg],
  })),
  updateMessage: (msg) => set((s) => ({ messages: s.messages.map(m => m.id === msg.id ? { ...m, ...msg } : m) })),
  removeMessage: (msgId) => set((s) => ({ messages: s.messages.filter(m => m.id !== msgId) })),
  setReactions: (messageId, reactions) => set((s) => ({ messages: s.messages.map(m => m.id === messageId ? { ...m, reactions } : m) })),
  setOnlineUsers: (ids) => set({ onlineUsers: new Set(ids) }),
  addOnlineUser: (id) => set((s) => { const set = new Set(s.onlineUsers); set.add(id); return { onlineUsers: set }; }),

  joinVoice: (channelId, user) => {
    set({ connectedVoiceChannel: channelId, voiceParticipants: [{ id: user.id, username: user.username }], isMuted: false, isDeafened: false });
  },

  leaveVoice: () => {
    set({ connectedVoiceChannel: null, voiceParticipants: [], isMuted: false, isDeafened: false });
  },

  toggleMute: () => set((s) => ({ isMuted: !s.isMuted })),
  toggleDeafen: () => set((s) => ({ isDeafened: !s.isDeafened })),
  setSpeaking: (v) => set({ isSpeaking: v }),
}));
