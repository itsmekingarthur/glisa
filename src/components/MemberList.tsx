import { useServerStore } from "../store/useServerStore";

export default function MemberList() {
  const { currentServer, onlineUsers } = useServerStore();

  if (!currentServer) return null;

  const online = currentServer.members.filter(m => onlineUsers.has(m.user_id));
  const offline = currentServer.members.filter(m => !onlineUsers.has(m.user_id));

  return (
    <div className="w-60 bg-[#2b2d31] shrink-0 flex flex-col">
      <div className="h-12 border-b border-[#1e1f22]" />
      <div className="flex-1 overflow-y-auto p-3 space-y-4">
        <div>
          <div className="text-xs font-semibold text-[#949ba4] uppercase tracking-wider mb-1">Online — {online.length}</div>
          {online.map(m => (
            <div key={m.user_id} className="flex items-center gap-2 px-2 py-1 rounded hover:bg-[#35363c] cursor-pointer">
              <div className="relative">
                <div className="w-8 h-8 rounded-full bg-[#5865f2] flex items-center justify-center text-white text-xs font-bold">{m.user.username[0].toUpperCase()}</div>
                <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-green-500 border-2 border-[#2b2d31]" />
              </div>
              <span className="text-sm font-semibold">{m.user.username}</span>
            </div>
          ))}
        </div>
        {offline.length > 0 && (
          <div>
            <div className="text-xs font-semibold text-[#949ba4] uppercase tracking-wider mb-1">Offline — {offline.length}</div>
            {offline.map(m => (
              <div key={m.user_id} className="flex items-center gap-2 px-2 py-1 rounded hover:bg-[#35363c] cursor-pointer opacity-50">
                <div className="w-8 h-8 rounded-full bg-[#5865f2] flex items-center justify-center text-white text-xs font-bold">{m.user.username[0].toUpperCase()}</div>
                <span className="text-sm">{m.user.username}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
