import { useState } from "react";
import { useServerStore } from "../store/useServerStore";
import { useAuthStore } from "../store/useAuthStore";

export default function ChannelSidebar() {
  const { currentServer, currentChannel, selectChannel, connectedVoiceChannel, voiceParticipants, isMuted, isDeafened, toggleMute, toggleDeafen, leaveVoice } = useServerStore();
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

  const channels = currentServer.channels || [];
  const textChannels = channels.filter((c: any) => c.type === "text");
  const voiceChannels = channels.filter((c: any) => c.type === "voice");

  return (
    <div className="w-60 bg-[#2b2d31] flex flex-col shrink-0">
      <div className="h-12 px-4 flex items-center border-b border-[#1e1f22] font-semibold text-sm shadow-sm shrink-0">
        {currentServer.name}
      </div>
      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        <div className="flex items-center justify-between px-2 py-1">
          <span className="text-xs font-semibold text-[#949ba4] uppercase tracking-wider">Text Channels</span>
          {currentServer.owner_id === user?.id && (
            <button onClick={() => setShowCreate(true)} className="text-[#949ba4] hover:text-white text-lg leading-none">+</button>
          )}
        </div>
        {textChannels.map((c: any) => (
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
            {voiceChannels.map((c: any) => {
              const isConnected = connectedVoiceChannel === c.id;
              return (
                <div key={c.id}>
                  <button
                    onClick={() => selectChannel(c)}
                    className={`w-full flex items-center gap-1.5 px-2 py-1 rounded text-sm border ${
                      isConnected
                        ? "bg-[#1f3d2e] text-white border-green-500"
                        : currentChannel?.id === c.id
                          ? "bg-[#3f4147] text-white border-transparent"
                          : "text-[#949ba4] hover:bg-[#35363c] hover:text-[#dbdee1] border-transparent"
                    }`}
                  >
                    <span className="text-lg">{isConnected ? "🔊" : "🔇"}</span>
                    {c.name}
                    {isConnected && <span className="ml-auto w-2 h-2 rounded-full bg-green-500 animate-pulse" />}
                  </button>
                  {/* Connected user avatar below the voice channel */}
                  {isConnected && voiceParticipants.map((p) => (
                    <div key={p.id} className="flex items-center gap-2 pl-8 pr-2 py-1 mt-0.5 rounded bg-[#1a2b1f] mx-1">
                      <div className="relative">
                        <div className="w-7 h-7 rounded-full bg-[#5865f2] flex items-center justify-center text-white text-[10px] font-bold">
                          {p.username[0].toUpperCase()}
                        </div>
                        <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-green-500 border-2 border-[#1a2b1f] animate-pulse" />
                      </div>
                      <span className="text-xs font-medium text-[#dbdee1]">{p.username}</span>
                      <div className="flex gap-0.5 ml-auto">
                        <div className="w-1 h-1 rounded-full bg-green-400 animate-pulse" />
                        <div className="w-1 h-1 rounded-full bg-green-400 animate-pulse" style={{ animationDelay: "0.15s" }} />
                        <div className="w-1 h-1 rounded-full bg-green-400 animate-pulse" style={{ animationDelay: "0.3s" }} />
                      </div>
                    </div>
                  ))}
                </div>
              );
            })}
          </>
        )}
      </div>

      {/* Voice Connection Bar */}
      {connectedVoiceChannel && (
        <div className="shrink-0 bg-[#1e1f22] border-t border-[#35363c] px-3 py-2.5 space-y-2">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-xs font-semibold text-green-400">Voice Connected</span>
          </div>
          <div className="text-[11px] text-[#949ba4] pl-4 truncate">
            {voiceChannels.find((c: any) => c.id === connectedVoiceChannel)?.name || "Voice Channel"}
          </div>
          <div className="flex items-center justify-center gap-2 pt-1">
            <button
              onClick={toggleMute}
              className={`w-9 h-9 rounded-lg flex items-center justify-center text-sm transition-colors ${
                isMuted ? "bg-red-600 text-white" : "bg-[#35363c] hover:bg-[#3f4147] text-[#dbdee1]"
              }`}
              title={isMuted ? "Unmute" : "Mute"}
            >
              {isMuted ? "🔇" : "🎤"}
            </button>
            <button
              onClick={toggleDeafen}
              className={`w-9 h-9 rounded-lg flex items-center justify-center text-sm transition-colors ${
                isDeafened ? "bg-red-600 text-white" : "bg-[#35363c] hover:bg-[#3f4147] text-[#dbdee1]"
              }`}
              title={isDeafened ? "Undeafen" : "Deafen"}
            >
              {isDeafened ? "🔇" : "🎧"}
            </button>
            <button
              onClick={leaveVoice}
              className="w-9 h-9 rounded-lg bg-[#35363c] hover:bg-red-600 flex items-center justify-center text-sm text-[#dbdee1] hover:text-white transition-colors"
              title="Disconnect"
            >
              📞
            </button>
          </div>
        </div>
      )}

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
