import { useRef, useEffect, useState } from "react";
import { useServerStore } from "../store/useServerStore";
import { useAuthStore } from "../store/useAuthStore";

const EMOJIS = ["😀","😂","❤️","🔥","👍","🎉","😢","😡"];

export default function ChatArea() {
  const { currentChannel, messages, sendMessage, editMessage, deleteMessage, toggleReaction, replyingTo, setReplyingTo } = useServerStore();
  const user = useAuthStore((s) => s.user);
  const [input, setInput] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages.length, currentChannel?.id]);

  if (!currentChannel) {
    return (
      <div className="flex-1 flex items-center justify-center text-[#949ba4]">
        <div className="text-center space-y-2">
          <div className="text-6xl mb-4">💬</div>
          <p className="text-2xl font-semibold text-[#dbdee1]">Select a channel</p>
          <p>Choose a channel from the sidebar to start chatting</p>
        </div>
      </div>
    );
  }

  if (currentChannel.type === "voice") {
    return (
      <div className="flex-1 flex items-center justify-center text-[#949ba4]">
        <div className="text-center space-y-2">
          <div className="text-6xl mb-4">🔊</div>
          <p className="text-2xl font-semibold text-[#dbdee1]">{currentChannel.name}</p>
          <p>Voice channel selected (P2P WebRTC)</p>
        </div>
      </div>
    );
  }

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    await sendMessage(currentChannel.id, input, replyingTo?.id);
    setInput("");
    setReplyingTo(null);
  };

  const handleEdit = async (messageId: string) => {
    if (!editContent.trim()) return;
    await editMessage(messageId, editContent);
    setEditingId(null);
    setEditContent("");
  };

  const handleReact = async (messageId: string, emoji: string) => {
    await toggleReaction(messageId, emoji);
  };

  const today = new Date();
  const todayStr = today.toDateString();

  const groupedMessages = messages.reduce<{ date: string; msgs: typeof messages }[]>((acc, msg) => {
    const d = new Date(msg.created_at).toDateString();
    const last = acc[acc.length - 1];
    if (last && last.date === d) last.msgs.push(msg);
    else acc.push({ date: d, msgs: [msg] });
    return acc;
  }, []);

  return (
    <div className="flex-1 flex flex-col bg-[#313338] min-w-0">
      <div className="h-12 px-4 flex items-center border-b border-[#1e1f22] font-semibold text-sm shadow-sm shrink-0">
        <span className="text-lg mr-1.5">#</span> {currentChannel.name}
      </div>

      <div className="flex-1 overflow-y-auto px-4">
        {groupedMessages.map((group) => (
          <div key={group.date}>
            <div className="flex items-center gap-2 py-3">
              <div className="flex-1 h-[1px] bg-[#3f4147]" />
              <span className="text-xs font-semibold text-[#949ba4] uppercase px-2">
                {group.date === todayStr ? "Today" : new Date(group.date).toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric", year: "numeric" })}
              </span>
              <div className="flex-1 h-[1px] bg-[#3f4147]" />
            </div>
            {group.msgs.map((msg, idx) => {
              const prevMsg = idx > 0 ? group.msgs[idx - 1] : null;
              const sameUser = prevMsg?.user_id === msg.user_id;
              const timeDiff = sameUser && prevMsg ? new Date(msg.created_at).getTime() - new Date(prevMsg.created_at).getTime() < 300000 : false;

              return (
                <div key={msg.id} className="group hover:bg-[#2e3035] px-2 py-0.5 rounded relative">
                  {!sameUser || !timeDiff ? (
                    <div className="flex gap-3 pt-1">
                      <div className="w-10 h-10 rounded-full bg-[#5865f2] flex items-center justify-center text-white font-bold text-sm shrink-0 mt-0.5">
                        {msg.user.username[0].toUpperCase()}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-baseline gap-2">
                          <span className="font-semibold text-sm hover:underline cursor-pointer text-[#f2f3f5]">{msg.user.username}</span>
                          <span className="text-[10px] text-[#949ba4]">{new Date(msg.created_at).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}</span>
                          {msg.edited_at && <span className="text-[10px] text-[#949ba4]">(edited)</span>}
                        </div>
                        {renderMessageContent(msg, user?.id, editingId, editContent, setEditingId, setEditContent, handleEdit, handleReact)}
                      </div>
                    </div>
                  ) : (
                    <div className="pl-[52px]">
                      <div className="flex items-baseline gap-2">
                        <span className="text-[10px] text-[#949ba4] invisible">{new Date(msg.created_at).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}</span>
                        {msg.edited_at && <span className="text-[10px] text-[#949ba4]">(edited)</span>}
                      </div>
                      {renderMessageContent(msg, user?.id, editingId, editContent, setEditingId, setEditContent, handleEdit, handleReact)}
                    </div>
                  )}
                  <div className="absolute right-2 top-0 hidden group-hover:flex bg-[#2b2d31] border border-[#1e1f22] rounded shadow-md">
                    {msg.user_id === user?.id && (
                      <>
                        <button onClick={() => { setEditingId(msg.id); setEditContent(msg.content); }} className="px-2 py-1 hover:bg-[#3f4147] text-xs rounded-l">✏️</button>
                        <button onClick={() => deleteMessage(msg.id)} className="px-2 py-1 hover:bg-[#3f4147] text-xs">🗑️</button>
                      </>
                    )}
                    <button onClick={() => setReplyingTo(msg)} className="px-2 py-1 hover:bg-[#3f4147] text-xs rounded-r">↩️</button>
                  </div>
                </div>
              );
            })}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {replyingTo && (
        <div className="px-4 py-1 bg-[#2b2d31] border-t border-[#1e1f22] flex items-center gap-2 text-sm text-[#949ba4]">
          <span className="text-xs">↩️ Replying to <span className="text-white font-semibold">{replyingTo.user.username}</span></span>
          <span className="truncate flex-1">{replyingTo.content}</span>
          <button onClick={() => setReplyingTo(null)} className="text-[#949ba4] hover:text-white text-lg leading-none">✕</button>
        </div>
      )}

      <form onSubmit={handleSend} className="p-4 shrink-0">
        <div className="flex items-center gap-2 bg-[#383a40] rounded-lg px-4 py-2.5">
          <input
            ref={inputRef}
            className="flex-1 bg-transparent outline-none text-sm placeholder-[#949ba4]"
            placeholder={`Message #${currentChannel.name}`}
            value={input}
            onChange={e => setInput(e.target.value)}
          />
          <button type="submit" className="text-[#949ba4] hover:text-white text-lg">➤</button>
        </div>
      </form>
    </div>
  );
}

function renderMessageContent(
  msg: any,
  userId: string | undefined,
  editingId: string | null,
  editContent: string,
  setEditingId: (id: string | null) => void,
  setEditContent: (c: string) => void,
  handleEdit: (id: string) => void,
  handleReact: (id: string, emoji: string) => void,
) {
  return (
    <div>
      {msg.reply_to_id && msg.reply_to && (
        <div className="flex items-center gap-2 text-xs text-[#949ba4] mb-1 border-l-2 border-[#3f4147] pl-2">
          <span className="font-semibold text-[#dbdee1]">↩ {msg.reply_to.user.username}</span>
          <span className="truncate">{msg.reply_to.content}</span>
        </div>
      )}
      {editingId === msg.id ? (
        <div className="flex gap-2 items-center">
          <input className="flex-1 bg-[#383a40] rounded px-3 py-1 text-sm outline-none" value={editContent} onChange={e => setEditContent(e.target.value)} autoFocus onKeyDown={e => { if (e.key === "Enter") handleEdit(msg.id); if (e.key === "Escape") setEditingId(null); }} />
          <button onClick={() => handleEdit(msg.id)} className="text-xs text-[#00a8fc] hover:underline">Save</button>
          <button onClick={() => setEditingId(null)} className="text-xs text-[#949ba4] hover:underline">Cancel</button>
        </div>
      ) : (
        <div className="text-sm whitespace-pre-wrap break-words">{renderMarkdown(msg.content)}</div>
      )}
      {msg.reactions && msg.reactions.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-1">
          {msg.reactions.reduce((acc: any[], r: any) => {
            const existing = acc.find(e => e.emoji === r.emoji);
            if (existing) existing.count++;
            else acc.push({ emoji: r.emoji, count: 1, users: [r.user] });
            return acc;
          }, []).map((group: any) => (
            <button key={group.emoji} onClick={() => handleReact(msg.id, group.emoji)} className="flex items-center gap-1 bg-[#2b2d31] hover:bg-[#35363c] border border-[#3f4147] rounded px-1.5 py-0.5 text-xs">
              <span>{group.emoji}</span>
              <span className="text-[#949ba4]">{group.count}</span>
            </button>
          ))}
          <div className="relative group/reaction">
            <button className="flex items-center gap-1 bg-[#2b2d31] hover:bg-[#35363c] border border-[#3f4147] rounded px-1.5 py-0.5 text-xs text-[#949ba4]">+</button>
            <div className="absolute bottom-full left-0 mb-1 hidden group-hover/reaction:flex bg-[#1e1f22] border border-[#3f4147] rounded-lg p-1.5 gap-1 shadow-xl z-10">
              {EMOJIS.map(e => (
                <button key={e} onClick={() => handleReact(msg.id, e)} className="hover:bg-[#35363c] rounded px-1 py-0.5 text-lg">{e}</button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function renderMarkdown(text: string) {
  const parts = text.split(/(\*\*.*?\*\*|`.*?`|~~.*?~~)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) return <strong key={i}>{part.slice(2, -2)}</strong>;
    if (part.startsWith("`") && part.endsWith("`")) return <code key={i} className="bg-[#1e1f22] px-1 rounded text-[#00b8f5] text-xs">{part.slice(1, -1)}</code>;
    if (part.startsWith("~~") && part.endsWith("~~")) return <del key={i} className="text-[#949ba4]">{part.slice(2, -2)}</del>;
    return <span key={i}>{part}</span>;
  });
}
