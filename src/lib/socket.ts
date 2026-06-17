import { RealtimeChannel } from "@supabase/supabase-js";
import { supabase } from "./supabase";

let channel: RealtimeChannel | null = null;
let messageCb: ((msg: any) => void) | null = null;
let updateCb: ((msg: any) => void) | null = null;
let deleteCb: ((data: any) => void) | null = null;
let reactCb: ((data: any) => void) | null = null;

async function fetchMessage(id: string) {
  const token = localStorage.getItem("token");
  const res = await fetch(`/api/messages?id=${id}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (res.ok) return res.json();
  return null;
}

async function fetchReactions(messageId: string) {
  const token = localStorage.getItem("token");
  const res = await fetch(`/api/reactions?messageId=${messageId}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (res.ok) return res.json();
  return [];
}

export function connectSocket(token: string) {
  channel = supabase
    .channel("messages")
    .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages" }, async (payload) => {
      const msg = await fetchMessage(payload.new.id);
      if (msg && messageCb) messageCb(msg);
    })
    .on("postgres_changes", { event: "UPDATE", schema: "public", table: "messages" }, async (payload) => {
      const msg = await fetchMessage(payload.new.id);
      if (msg && updateCb) updateCb(msg);
    })
    .on("postgres_changes", { event: "DELETE", schema: "public", table: "messages" }, (payload) => {
      if (deleteCb) deleteCb(payload.old.id);
    })
    .on("postgres_changes", { event: "*", schema: "public", table: "reactions" }, async (payload) => {
      const msgId = payload.new?.message_id || payload.old?.message_id;
      if (msgId && reactCb) {
        const reactions = await fetchReactions(msgId);
        reactCb({ messageId: msgId, reactions });
      }
    })
    .subscribe();

  return {
    on: (event: string, cb: (data: any) => void) => {
      if (event === "message:new") messageCb = cb;
      else if (event === "message:updated") updateCb = cb;
      else if (event === "message:deleted") deleteCb = cb;
      else if (event === "message:reacted") reactCb = cb;
    },
    emit: (event: string, data: any) => {
      if (event === "message:send") apiCall("POST", "/api/messages/send", data);
      else if (event === "message:edit") apiCall("PATCH", `/api/messages?id=${data.messageId}`, { content: data.content });
      else if (event === "message:delete") apiCall("DELETE", `/api/messages?id=${data.messageId}`);
      else if (event === "message:react") apiCall("POST", "/api/reactions", data);
    },
  };
}

async function apiCall(method: string, url: string, body?: any) {
  const token = localStorage.getItem("token");
  try {
    await fetch(url, {
      method,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch {}
}

export function getSocket() {
  return channel ? {
    on: (event: string, cb: (data: any) => void) => {
      if (event === "message:new") messageCb = cb;
      else if (event === "message:updated") updateCb = cb;
      else if (event === "message:deleted") deleteCb = cb;
      else if (event === "message:reacted") reactCb = cb;
    },
    emit: (event: string, data: any) => {
      if (event === "message:send") apiCall("POST", "/api/messages/send", data);
      else if (event === "message:edit") apiCall("PATCH", `/api/messages?id=${data.messageId}`, { content: data.content });
      else if (event === "message:delete") apiCall("DELETE", `/api/messages?id=${data.messageId}`);
      else if (event === "message:react") apiCall("POST", "/api/reactions", data);
    },
    off: () => {},
  } : null;
}

export function disconnectSocket() {
  if (channel) {
    supabase.removeChannel(channel);
    channel = null;
  }
  messageCb = null;
  updateCb = null;
  deleteCb = null;
  reactCb = null;
}
