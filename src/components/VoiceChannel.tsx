import { useServerStore } from "../store/useServerStore";
import { useAuthStore } from "../store/useAuthStore";

export default function VoiceChannel() {
  const { currentChannel, connectedVoiceChannel, voiceParticipants, isMuted, isDeafened, joinVoice, leaveVoice, toggleMute, toggleDeafen } = useServerStore();
  const user = useAuthStore((s) => s.user);

  if (!currentChannel || currentChannel.type !== "voice") return null;

  const isConnected = connectedVoiceChannel === currentChannel.id;

  return (
    <div className="flex-1 flex flex-col bg-[#313338]">
      <div className="h-12 px-4 flex items-center border-b border-[#1e1f22] font-semibold text-sm shadow-sm shrink-0">
        <span className="text-lg mr-1.5">🔊</span> {currentChannel.name}
      </div>
      <div className="flex-1 flex flex-col items-center justify-center p-8">
        <div className="text-center space-y-6">
          <div className="text-6xl">🔊</div>
          <p className="text-xl font-semibold text-[#dbdee1]">{currentChannel.name}</p>
          <p className="text-[#949ba4] text-sm">Voice channel</p>

          {!isConnected ? (
            <button
              onClick={() => joinVoice(currentChannel.id, { id: user!.id, username: user!.username })}
              className="px-8 py-3 bg-green-600 hover:bg-green-500 rounded-full font-semibold text-sm transition-colors"
            >
              Join Voice
            </button>
          ) : (
            <div className="space-y-4">
              <div className="bg-[#1e1f22] rounded-lg p-4 space-y-2">
                <p className="text-xs font-semibold text-[#949ba4] uppercase tracking-wider">Connected</p>
                {voiceParticipants.map((p) => (
                  <div key={p.id} className="flex items-center gap-3 px-2 py-1.5 rounded bg-[#2b2d31]">
                    <div className="relative">
                      <div className="w-10 h-10 rounded-full bg-[#5865f2] flex items-center justify-center text-white font-bold text-sm">
                        {p.username[0].toUpperCase()}
                      </div>
                      <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-green-500 border-2 border-[#2b2d31]" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold">{p.username}</p>
                      <p className="text-xs text-green-400">Voice Connected</p>
                    </div>
                    <div className="flex gap-1 ml-auto">
                      <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                      <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" style={{ animationDelay: "0.2s" }} />
                      <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" style={{ animationDelay: "0.4s" }} />
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex items-center justify-center gap-3">
                <button
                  onClick={toggleMute}
                  className={`w-12 h-12 rounded-full flex items-center justify-center text-lg transition-colors ${
                    isMuted ? "bg-red-600 text-white" : "bg-[#2b2d31] hover:bg-[#35363c] text-[#dbdee1]"
                  }`}
                  title={isMuted ? "Unmute" : "Mute Mic"}
                >
                  {isMuted ? "🔇" : "🎤"}
                </button>
                <button
                  onClick={toggleDeafen}
                  className={`w-12 h-12 rounded-full flex items-center justify-center text-lg transition-colors ${
                    isDeafened ? "bg-red-600 text-white" : "bg-[#2b2d31] hover:bg-[#35363c] text-[#dbdee1]"
                  }`}
                  title={isDeafened ? "Undeafen" : "Deafen"}
                >
                  {isDeafened ? "🔇" : "🎧"}
                </button>
                <button
                  onClick={leaveVoice}
                  className="w-12 h-12 rounded-full bg-red-600 hover:bg-red-500 flex items-center justify-center text-lg text-white transition-colors"
                  title="Leave Voice"
                >
                  📞
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
