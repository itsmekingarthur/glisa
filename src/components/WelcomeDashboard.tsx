import { useEffect, useState } from "react";
import { useServerStore } from "../store/useServerStore";

interface RecentMessage {
  id: string;
  content: string;
  created_at: string;
  user: { id: string; username: string };
  channel: { id: string; name: string };
}

export default function WelcomeDashboard() {
  const { currentServer, onlineUsers, selectChannel } = useServerStore();
  const [recent, setRecent] = useState<RecentMessage[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentServer) return;
    setLoading(true);
    fetch(`/api/servers/${currentServer.id}/recent-messages`, {
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
    })
      .then(r => r.ok ? r.json() : [])
      .then(data => setRecent(data || []))
      .finally(() => setLoading(false));
  }, [currentServer?.id]);

  if (!currentServer) return null;

  const textChannels = currentServer.channels.filter(c => c.type === "text");
  const onlineCount = onlineUsers.size;

  const initials = currentServer.name
    .split(" ")
    .map(w => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="flex-1 flex flex-col bg-[#313338] overflow-y-auto">
      {/* Banner */}
      <div className="h-48 bg-gradient-to-r from-[#5865f2] to-[#4752c4] relative shrink-0">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDM0di0yaDJ2MmgtMnptMCAwaDJ2MmgtMnptLTEwIDB2LTJoMnYyaC0yem0wIDB2MmgtMnYtMmgyek0yNiAyNHYtMmgydjJoLTJ6bTAgMGgydjJoLTJ6bTEwIDB2LTJoMnYyaC0yem0wIDB2MmgtMnYtMmgyeiIvPjwvZz48L2c+PC9zdmc+')] opacity-30" />
        <div className="absolute bottom-0 left-0 right-0 p-8">
          <div className="flex items-end gap-4">
            <div className="w-20 h-20 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center text-white text-3xl font-bold shadow-lg">
              {initials}
            </div>
            <div className="text-white">
              <h1 className="text-2xl font-bold">{currentServer.name}</h1>
              <p className="text-white/70 text-sm">{textChannels.length} text channels</p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 p-8 max-w-4xl mx-auto w-full space-y-8">
        {/* Greeting */}
        <div>
          <h2 className="text-3xl font-bold text-[#dbdee1]">
            Welcome to <span className="text-[#5865f2]">{currentServer.name}</span>!
          </h2>
          <p className="text-[#949ba4] mt-1">This is the beginning of this server.</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-[#1e1f22] rounded-lg p-5 space-y-1">
            <div className="text-2xl font-bold text-[#dbdee1]">{onlineCount}</div>
            <div className="text-sm text-[#949ba4]">Members Online</div>
            <div className="flex -space-x-2">
              {Array.from({ length: Math.min(onlineCount, 5) }).map((_, i) => (
                <div key={i} className="w-6 h-6 rounded-full bg-[#5865f2] border-2 border-[#1e1f22] flex items-center justify-center text-[10px] text-white font-medium">
                  U
                </div>
              ))}
            </div>
          </div>
          <div className="bg-[#1e1f22] rounded-lg p-5 space-y-1">
            <div className="text-2xl font-bold text-[#dbdee1]">{currentServer.channels.length}</div>
            <div className="text-sm text-[#949ba4]">Total Channels</div>
            <div className="flex gap-1 mt-1">
              {currentServer.channels.slice(0, 6).map(ch => (
                <span key={ch.id} className={`text-xs px-2 py-0.5 rounded ${ch.type === "voice" ? "bg-[#23a559]/20 text-[#23a559]" : "bg-[#5865f2]/20 text-[#5865f2]"}`}>
                  {ch.type === "voice" ? "🔊" : "#"}
                </span>
              ))}
              {currentServer.channels.length > 6 && (
                <span className="text-xs text-[#949ba4]">+{currentServer.channels.length - 6}</span>
              )}
            </div>
          </div>
          <div className="bg-[#1e1f22] rounded-lg p-5 space-y-1">
            <div className="text-2xl font-bold text-[#dbdee1]">{currentServer.members.length}</div>
            <div className="text-sm text-[#949ba4]">Total Members</div>
            <div className="flex -space-x-2">
              {currentServer.members.slice(0, 5).map(m => (
                <div key={m.id} className="w-6 h-6 rounded-full bg-[#3f4147] border-2 border-[#1e1f22] flex items-center justify-center text-[10px] text-white font-medium">
                  {m.user.username[0].toUpperCase()}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div>
          <h3 className="text-lg font-semibold text-[#dbdee1] mb-3">Recent Activity</h3>
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="bg-[#1e1f22] rounded-lg p-4 animate-pulse">
                  <div className="h-4 bg-[#35363c] rounded w-1/4 mb-2" />
                  <div className="h-3 bg-[#35363c] rounded w-3/4" />
                </div>
              ))}
            </div>
          ) : recent.length === 0 ? (
            <div className="bg-[#1e1f22] rounded-lg p-8 text-center text-[#949ba4]">
              <div className="text-4xl mb-2">📝</div>
              <p>No messages yet — be the first to chat!</p>
            </div>
          ) : (
            <div className="space-y-2">
              {recent.map(msg => (
                <button
                  key={msg.id}
                  onClick={() => {
                    const ch = currentServer.channels.find(c => c.id === msg.channel.id);
                    if (ch) selectChannel(ch);
                  }}
                  className="w-full bg-[#1e1f22] hover:bg-[#26272b] rounded-lg p-4 text-left transition-colors"
                >
                  <div className="flex items-center gap-2 text-xs text-[#949ba4] mb-1">
                    <span className="font-semibold text-[#5865f2]">#{msg.channel.name}</span>
                    <span>•</span>
                    <span>{msg.user.username}</span>
                    <span>•</span>
                    <span>{new Date(msg.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}</span>
                  </div>
                  <div className="text-sm text-[#dbdee1] truncate">{msg.content}</div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="flex gap-3">
          <button
            onClick={() => {
              if (textChannels.length > 0) selectChannel(textChannels[0]);
            }}
            className="flex items-center gap-2 px-5 py-3 bg-[#5865f2] hover:bg-[#4752c4] text-white rounded-lg font-medium transition-colors"
          >
            <span>📋</span>
            Browse Channels
          </button>
          {recent.length > 0 && (
            <button
              onClick={() => {
                const ch = currentServer.channels.find(c => c.id === recent[0].channel.id);
                if (ch) selectChannel(ch);
              }}
              className="flex items-center gap-2 px-5 py-3 bg-[#2b2d31] hover:bg-[#35363c] text-[#dbdee1] rounded-lg font-medium transition-colors"
            >
              <span>↗️</span>
              Jump to last message
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
