import { useState } from "react";
import { useServerStore } from "../store/useServerStore";
import { getSocket } from "../lib/socket";
import VoiceChannel from "./VoiceChannel";

export default function ChannelSidebar() {
  const { selectedServer, selectChannel, selectedChannel } = useServerStore();
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  if (!selectedServer) return <div className="w-60 bg-[#2b2d31] flex flex-col" />;

  const textChannels = selectedServer.channels.filter((c) => c.type === "text");
  const voiceChannels = selectedServer.channels.filter((c) => c.type === "voice");

  return (
    <div className="w-60 bg-[#2b2d31] flex flex-col">
      <div className="h-12 flex items-center px-4 font-bold text-white border-b border-[#1e1f22] text-sm">
        {selectedServer.name}
      </div>
      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        <div>
          <button onClick={() => setCollapsed((c) => ({ ...c, text: !c.text }))}
            className="flex items-center gap-1 text-xs text-[#949ba4] font-semibold px-2 py-1 uppercase tracking-wide hover:text-white w-full">
            <span className="text-[10px]">{collapsed.text ? "▶" : "▼"}</span>
            Text Channels
          </button>
          {!collapsed.text && textChannels.map((ch) => (
            <button key={ch.id} onClick={() => { selectChannel(ch); const s = getSocket(); if (s) s.emit("server:join", ch.id); }}
              className={`w-full flex items-center gap-2 px-2 py-1.5 rounded text-sm ${selectedChannel?.id === ch.id ? "bg-[#404249] text-white" : "text-[#949ba4] hover:bg-[#35373c] hover:text-white"}`}>
              <span>#</span>
              <span className="flex-1 text-left truncate">{ch.name}</span>
            </button>
          ))}
        </div>

        <div className="mt-2">
          <button onClick={() => setCollapsed((c) => ({ ...c, voice: !c.voice }))}
            className="flex items-center gap-1 text-xs text-[#949ba4] font-semibold px-2 py-1 uppercase tracking-wide hover:text-white w-full">
            <span className="text-[10px]">{collapsed.voice ? "▶" : "▼"}</span>
            Voice Channels
          </button>
          {!collapsed.voice && voiceChannels.map((ch) => (
            <VoiceChannel key={ch.id} channel={ch} />
          ))}
        </div>
      </div>

      <div className="p-3 border-t border-[#1e1f22]">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-[#5865f2] flex items-center justify-center text-white font-bold text-xs shrink-0">
            {selectedServer.name[0].toUpperCase()}
          </div>
          <div className="text-xs text-[#949ba4]">
            {selectedServer.members?.length || 0} members
          </div>
        </div>
      </div>
    </div>
  );
}
