import { create } from "zustand";
import { supabase } from "../lib/supabase";
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
}

export const useServerStore = create<ServerState>((set, get) => ({
  servers: [],
  currentServer: null,
  currentChannel: null,
  messages: [],
  loading: false,
  replyingTo: null,
  onlineUsers: new Set(),

  fetchServers: async () => {
    const data = await api.servers.list();
    set({ servers: data });
  },

  selectServer: (server) => {
    set({ currentServer: server, currentChannel: null, messages: [] });
  },

  selectChannel: (channel) => {
    set({ currentChannel: channel });
    get().fetchMessages(channel.id);
  },

  fetchMessages: async (channelId) => {
    if (!channelId) return;
    const data = await api.messages.list(channelId);
    set({ messages: data });
  },

  sendMessage: async (channelId, content, replyToId) => {
    // Saved via API call - Realtime will broadcast it back
    const token = localStorage.getItem("token");
    await fetch("/api/messages/send", {
      method: "POST",
      headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: JSON.stringify({ channelId, content, replyToId }),
    });
  },

  editMessage: async (messageId, content) => {
    const token = localStorage.getItem("token");
    await fetch("/api/messages", {
      method: "PATCH",
      headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: JSON.stringify({ messageId, content }),
    });
  },

  deleteMessage: async (messageId) => {
    const token = localStorage.getItem("token");
    await fetch(`/api/messages/${messageId}`, { method: "DELETE", headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) } });
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
  addMessage: (msg) => set((s) => ({ messages: [...s.messages, msg] })),
  updateMessage: (msg) => set((s) => ({ messages: s.messages.map(m => m.id === msg.id ? { ...m, ...msg } : m) })),
  removeMessage: (msgId) => set((s) => ({ messages: s.messages.filter(m => m.id !== msgId) })),
  setReactions: (messageId, reactions) => set((s) => ({ messages: s.messages.map(m => m.id === messageId ? { ...m, reactions } : m) })),
  setOnlineUsers: (ids) => set({ onlineUsers: new Set(ids) }),
}));
