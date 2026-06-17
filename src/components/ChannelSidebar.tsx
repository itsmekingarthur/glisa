import { useState } from "react";
import { useServerStore } from "../store/useServerStore";
import { useAuthStore } from "../store/useAuthStore";
import { api } from "../lib/api";

export default function ChannelSidebar() {
  const { currentServer, currentChannel, selectChannel } = useServerStore();
  const user = useAuthStore((s) => s.user);
  const [showCreate, setShowCreate] = useState(false);
  const [channelName, setChannelName] = useState("");

  if (!currentServer) return <div className="w-60 bg-[#2b2d31] shrink-0" />;

  const handleCreate = async () => {
    if (!channelName.trim()) return;
    const token = localStorage.getItem("token");
    await fetch("/api/channels", {
      method: "POST",
      headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: JSON.stringify({ serverId: currentServer.id, name: channelName, type: "text" }),
    });
    setShowCreate(false);
    setChannelName("");
    useServerStore.getState().fetchServers();
  };

  const textChannels = currentServer.channels.filter(c => c.type === "text");
  const voiceChannels = currentServer.channels.filter(c => c.type === "voice");

  return (
    <div className="w-60 bg-[#2b2d31] flex flex-col shrink-0">
      <div className="h-12 px-4 flex items-center border-b border-[#1e1f22] font-semibold text-sm shadow-sm">
        {currentServer.name}
      </div>
      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        <div className="flex items-center justify-between px-2 py-1">
          <span className="text-xs font-semibold text-[#949ba4] uppercase tracking-wider">Text Channels</span>
          {currentServer.owner_id === user?.id && (
            <button onClick={() => setShowCreate(true)} className="text-[#949ba4] hover:text-white text-lg leading-none">+</button>
          )}
        </div>
        {textChannels.map(c => (
          <button
            key={c.id}
            onClick={() => selectChannel(c)}
            className={`w-full flex items-center gap-1.5 px-2 py-1 rounded text-sm ${
              currentChannel?.id === c.id ? "bg-[#3f4147] text-white" : "text-[#949ba4] hover:bg-[#35363c] hover:text-[#dbdee1]"
            }`}
          >
            <span className="text-lg">#</span> {c.name}
          </button>
        ))}
        {voiceChannels.length > 0 && (
          <>
            <div className="text-xs font-semibold text-[#949ba4] uppercase tracking-wider px-2 pt-4 pb-1">Voice Channels</div>
            {voiceChannels.map(c => (
              <button
                key={c.id}
                onClick={() => selectChannel(c)}
                className={`w-full flex items-center gap-1.5 px-2 py-1 rounded text-sm ${
                  currentChannel?.id === c.id ? "bg-[#3f4147] text-white" : "text-[#949ba4] hover:bg-[#35363c] hover:text-[#dbdee1]"
                }`}
              >
                <span className="text-lg">🔊</span> {c.name}
              </button>
            ))}
          </>
        )}
      </div>
      {showCreate && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowCreate(false)}>
          <div className="bg-[#1e1f22] p-6 rounded-lg w-80 space-y-4" onClick={e => e.stopPropagation()}>
            <h2 className="font-bold text-lg">Create Channel</h2>
            <input className="w-full p-3 rounded bg-[#313338] border border-[#3f4147] outline-none focus:border-[#5865f2]" placeholder="channel-name" value={channelName} onChange={e => setChannelName(e.target.value)} autoFocus />
            <div className="flex gap-3 justify-end">
              <button onClick={() => setShowCreate(false)} className="px-4 py-2 hover:underline">Cancel</button>
              <button onClick={handleCreate} className="px-4 py-2 bg-[#5865f2] hover:bg-[#4752c4] rounded font-semibold">Create</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
