import { create } from "zustand";

export interface User {
  id: string;
  username: string;
  avatarUrl?: string;
}

export interface Channel {
  id: string;
  name: string;
  type: string;
  serverId: string;
}

export interface Server {
  id: string;
  name: string;
  ownerId: string;
  channels: Channel[];
  members: { user: User }[];
}

export interface Reaction {
  id: string;
  emoji: string;
  userId: string;
  messageId: string;
  user: User;
}

export interface Message {
  id: string;
  content: string;
  userId: string;
  channelId: string;
  createdAt: string;
  editedAt?: string;
  replyToId?: string;
  user: User;
  replyTo?: { id: string; content: string; userId: string; user: User } | null;
  reactions?: Reaction[];
}

export type UserStatus = "online" | "idle" | "dnd" | "invisible";

interface ServerStore {
  servers: Server[];
  selectedServer: Server | null;
  selectedChannel: Channel | null;
  messages: Message[];
  onlineUsers: Set<string>;
  userStatuses: Record<string, UserStatus>;
  replyingTo: Message | null;
  setServers: (servers: Server[]) => void;
  addServer: (server: Server) => void;
  selectServer: (server: Server | null) => void;
  selectChannel: (channel: Channel | null) => void;
  setMessages: (messages: Message[]) => void;
  addMessage: (message: Message) => void;
  updateMessage: (msg: Message) => void;
  removeMessage: (id: string) => void;
  setOnlineUsers: (users: string[]) => void;
  addOnlineUser: (userId: string) => void;
  removeOnlineUser: (userId: string) => void;
  setUserStatus: (userId: string, status: UserStatus) => void;
  setReplyingTo: (msg: Message | null) => void;
  updateMessageReactions: (messageId: string, reactions: Reaction[]) => void;
}

export const useServerStore = create<ServerStore>((set) => ({
  servers: [],
  selectedServer: null,
  selectedChannel: null,
  messages: [],
  onlineUsers: new Set(),
  userStatuses: {},
  replyingTo: null,
  setServers: (servers) => set({ servers }),
  addServer: (server) => set((s) => ({ servers: [...s.servers, server] })),
  selectServer: (server) => set({ selectedServer: server, selectedChannel: null, messages: [] }),
  selectChannel: (channel) => set({ selectedChannel: channel, messages: [] }),
  setMessages: (messages) => set({ messages }),
  addMessage: (message) => set((s) => ({ messages: [...s.messages, message] })),
  updateMessage: (msg) => set((s) => ({ messages: s.messages.map((m) => (m.id === msg.id ? msg : m)) })),
  removeMessage: (id) => set((s) => ({ messages: s.messages.filter((m) => m.id !== id) })),
  setOnlineUsers: (users) => set({ onlineUsers: new Set(users) }),
  addOnlineUser: (userId) => set((s) => { const u = new Set(s.onlineUsers); u.add(userId); return { onlineUsers: u }; }),
  removeOnlineUser: (userId) => set((s) => { const u = new Set(s.onlineUsers); u.delete(userId); return { onlineUsers: u }; }),
  setUserStatus: (userId, status) => set((s) => ({ userStatuses: { ...s.userStatuses, [userId]: status } })),
  setReplyingTo: (msg) => set({ replyingTo: msg }),
  updateMessageReactions: (messageId, reactions) => set((s) => ({
    messages: s.messages.map((m) => (m.id === messageId ? { ...m, reactions } : m)),
  })),
}));
