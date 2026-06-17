import { useEffect, useRef, useState } from "react";
import { useServerStore, Message } from "../store/useServerStore";
import { useAuthStore } from "../store/useAuthStore";
import { api } from "../lib/api";
import { getSocket } from "../lib/socket";

const EMOJI_LIST = ["😀", "😂", "❤️", "🔥", "🎉", "👍", "👎", "😢", "😡", "💀"];

function formatMarkdown(text: string) {
  let html = text
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/\*\*\*(.+?)\*\*\*/g, "<strong><em>$1</em></strong>")
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    .replace(/```(.+?)```/gs, "<code class='block bg-[#1e1f22] p-2 rounded text-sm mt-1'>$1</code>")
    .replace(/`(.+?)`/g, "<code class='bg-[#1e1f22] px-1 rounded text-sm'>$1</code>");
  return html;
}

function sameDay(d1: string, d2: string) {
  const a = new Date(d1), b = new Date(d2);
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function timeSince(t: string) {
  const diff = Date.now() - new Date(t).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function ChatArea() {
  const { selectedChannel, messages, setMessages, addMessage, updateMessage, removeMessage, replyingTo, setReplyingTo, updateMessageReactions } = useServerStore();
  const user = useAuthStore((s) => s.user);
  const [input, setInput] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  const [showEmoji, setShowEmoji] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const editRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!selectedChannel) return;
    api.messages.list(selectedChannel.id).then(setMessages).catch(console.error);
  }, [selectedChannel?.id]);

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;
    const onNew = (msg: any) => { if (msg.channelId === selectedChannel?.id) addMessage(msg); };
    const onUpdate = (msg: any) => { if (msg.channelId === selectedChannel?.id) updateMessage(msg); };
    const onDelete = (data: any) => { if (data.channelId === selectedChannel?.id) removeMessage(data.id); };
    const onReact = (data: any) => { if (data.messageId) updateMessageReactions(data.messageId, data.reactions); };
    socket.on("message:new", onNew);
    socket.on("message:updated", onUpdate);
    socket.on("message:deleted", onDelete);
    socket.on("message:reacted", onReact);
    return () => { socket.off("message:new", onNew); socket.off("message:updated", onUpdate); socket.off("message:deleted", onDelete); socket.off("message:reacted", onReact); };
  }, [selectedChannel?.id]);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const sendMessage = () => {
    if (!input.trim() || !selectedChannel) return;
    const socket = getSocket();
    if (socket) {
      socket.emit("message:send", { channelId: selectedChannel.id, content: input, replyToId: replyingTo?.id });
      setInput("");
      setReplyingTo(null);
    }
  };

  const startEdit = (msg: Message) => {
    setEditingId(msg.id);
    setEditText(msg.content);
    setTimeout(() => editRef.current?.focus(), 0);
  };

  const saveEdit = () => {
    if (!editText.trim() || !editingId) return;
    const socket = getSocket();
    if (socket) { socket.emit("message:edit", { messageId: editingId, content: editText }); }
    setEditingId(null);
    setEditText("");
  };

  const deleteMsg = (msgId: string) => {
    const socket = getSocket();
    if (socket) { socket.emit("message:delete", { messageId: msgId }); }
  };

  const addReaction = (msgId: string, emoji: string) => {
    const socket = getSocket();
    if (socket) { socket.emit("message:react", { messageId: msgId, emoji }); }
    setShowEmoji(null);
  };

  if (!selectedChannel) {
    return (
      <div className="flex-1 flex items-center justify-center text-[#949ba4]">
        Select a channel to start chatting
      </div>
    );
  }

  const groupedMessages: { msg: Message; group: boolean; showNew: boolean }[] = [];
  for (let i = 0; i < messages.length; i++) {
    const msg = messages[i];
    const prev = messages[i - 1];
    const group = prev && prev.userId === msg.userId && sameDay(prev.createdAt, msg.createdAt) && new Date(msg.createdAt).getTime() - new Date(prev.createdAt).getTime() < 300000;
    const showNew = i > 0 && !sameDay(messages[i - 1].createdAt, msg.createdAt);
    groupedMessages.push({ msg, group: !!group, showNew });
  }

  return (
    <div className="flex-1 flex flex-col bg-[#313338]">
      <div className="h-12 flex items-center px-4 border-b border-[#1e1f22] font-semibold text-white text-sm">
        # {selectedChannel.name}
      </div>
      <div className="flex-1 overflow-y-auto px-4">
        {groupedMessages.map(({ msg, group, showNew }) => (
          <div key={msg.id}>
            {showNew && (
              <div className="flex items-center gap-2 my-3">
                <div className="h-px flex-1 bg-red-500/50" />
                <span className="text-xs font-semibold text-red-500">NEW</span>
                <div className="h-px flex-1 bg-red-500/50" />
              </div>
            )}
            <div className={`flex items-start gap-3 hover:bg-[#2b2d31] rounded group relative ${group ? "py-0.5" : "py-2"}`}>
              {!group && (
                <div className="w-10 h-10 rounded-full bg-[#5865f2] flex items-center justify-center text-white font-bold shrink-0 mt-0.5">
                  {msg.user?.username?.[0]?.toUpperCase() || "?"}
                </div>
              )}
              {group && (
                <div className="w-10 shrink-0 flex items-start justify-center pt-1">
                  <span className="text-[10px] text-[#949ba4] hover:text-white cursor-pointer" onClick={() => startEdit(msg)}>
                    {new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </span>
                </div>
              )}
              <div className="flex-1 min-w-0">
                {!group && (
                  <div className="flex items-baseline gap-2">
                    <span className="font-semibold text-white text-sm hover:underline cursor-pointer">
                      {msg.user?.username || "Unknown"}
                    </span>
                    <span className="text-[10px] text-[#949ba4]">{new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      {msg.editedAt && <span className="text-[#949ba4] ml-1">(edited)</span>}
                    </span>
                  </div>
                )}
                {group && msg.editedAt && (
                  <span className="text-[10px] text-[#949ba4]">(edited)</span>
                )}
                {editingId === msg.id ? (
                  <div className="flex gap-2 items-center mt-1">
                    <input ref={editRef} value={editText} onChange={(e) => setEditText(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") saveEdit(); if (e.key === "Escape") setEditingId(null); }} className="flex-1 bg-[#1e1f22] text-white px-2 py-1 rounded text-sm outline-none" />
                    <button onClick={saveEdit} className="text-xs text-green-400 hover:text-green-300">Save</button>
                    <button onClick={() => setEditingId(null)} className="text-xs text-red-400 hover:text-red-300">Esc</button>
                  </div>
                ) : (
                  <>
                    {msg.replyTo && (
                      <div className="flex items-center gap-1.5 text-xs text-[#949ba4] mt-0.5">
                        <span className="text-[#5865f2]">↪</span>
                        <span className="text-[#5865f2] font-medium">{msg.replyTo.user?.username}</span>
                        <span className="truncate max-w-[200px]">{msg.replyTo.content}</span>
                      </div>
                    )}
                    <p className="text-[#dbdee1] text-sm mt-0.5" dangerouslySetInnerHTML={{ __html: formatMarkdown(msg.content) }} />
                    {msg.reactions && msg.reactions.length > 0 && (
                      <div className="flex gap-1 mt-1 flex-wrap">
                        {Object.entries(
                          msg.reactions.reduce((acc: Record<string, { count: number; has: boolean }>, r) => {
                            if (!acc[r.emoji]) acc[r.emoji] = { count: 0, has: false };
                            acc[r.emoji].count++;
                            if (r.userId === user?.id) acc[r.emoji].has = true;
                            return acc;
                          }, {})
                        ).map(([emoji, info]) => (
                          <button key={emoji} onClick={() => addReaction(msg.id, emoji)}
                            className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-xs border ${info.has ? "bg-[#5865f2]/20 border-[#5865f2]/50" : "bg-[#2b2d31] border-[#404249] hover:border-[#5865f2]/50"}`}>
                            <span>{emoji}</span><span className="text-[#949ba4]">{info.count}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>
              <div className="absolute right-1 top-1 hidden group-hover:flex items-center gap-0.5 bg-[#313338] border border-[#404249] rounded">
                <button onClick={() => { setReplyingTo(msg); inputRef.current?.focus(); }} className="p-1 hover:text-white text-[#949ba4]" title="Reply">↩</button>
                <div className="relative">
                  <button onClick={() => setShowEmoji(showEmoji === msg.id ? null : msg.id)} className="p-1 hover:text-white text-[#949ba4]" title="React">😊</button>
                  {showEmoji === msg.id && (
                    <div className="absolute bottom-full right-0 mb-1 bg-[#1e1f22] border border-[#404249] rounded p-1.5 flex gap-1 shadow-lg z-10">
                      {EMOJI_LIST.map((e) => (
                        <button key={e} onClick={() => addReaction(msg.id, e)} className="hover:scale-125 transition text-lg">{e}</button>
                      ))}
                    </div>
                  )}
                </div>
                {msg.userId === user?.id && (
                  <>
                    <button onClick={() => startEdit(msg)} className="p-1 hover:text-white text-[#949ba4]" title="Edit">✏️</button>
                    <button onClick={() => deleteMsg(msg.id)} className="p-1 hover:text-red-400 text-[#949ba4]" title="Delete">🗑️</button>
                  </>
                )}
              </div>
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
      {replyingTo && (
        <div className="px-4 pt-2 flex items-center gap-2 text-xs text-[#949ba4] bg-[#2b2d31] border-t border-[#1e1f22]">
          <span className="text-[#5865f2]">↪ Replying to</span>
          <span className="text-white font-medium">{replyingTo.user?.username}</span>
          <span className="truncate flex-1">{replyingTo.content}</span>
          <button onClick={() => setReplyingTo(null)} className="text-red-400 hover:text-red-300">✕</button>
        </div>
      )}
      <div className="p-4">
        <div className="flex items-center bg-[#404249] rounded-lg px-4 py-2">
          <input ref={inputRef} value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) sendMessage(); }} placeholder={`Message #${selectedChannel.name}`} className="flex-1 bg-transparent text-white outline-none text-sm" />
          <button onClick={sendMessage} className="text-[#949ba4] hover:text-white ml-2">➤</button>
        </div>
      </div>
    </div>
  );
}
