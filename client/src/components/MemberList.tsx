import { useServerStore, UserStatus } from "../store/useServerStore";
import { useAuthStore } from "../store/useAuthStore";

const statusColors: Record<UserStatus, string> = {
  online: "bg-green-500",
  idle: "bg-yellow-500",
  dnd: "bg-red-500",
  invisible: "bg-gray-500",
};

export default function MemberList() {
  const { selectedServer, onlineUsers, userStatuses } = useServerStore();
  const currentUser = useAuthStore((s) => s.user);
  if (!selectedServer) return null;

  const members = selectedServer.members || [];
  const sorted = [...members].sort((a, b) => {
    const aOnline = onlineUsers.has(a.user.id) ? -1 : 1;
    const bOnline = onlineUsers.has(b.user.id) ? -1 : 1;
    return aOnline - bOnline;
  });

  return (
    <div className="w-60 bg-[#2b2d31] flex flex-col">
      <div className="h-12 flex items-center px-4 border-b border-[#1e1f22] font-semibold text-white text-sm">
        Members — {members.length}
      </div>
      <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
        {sorted.map((m) => {
          const isOnline = onlineUsers.has(m.user.id);
          const status: UserStatus = userStatuses[m.user.id] || (isOnline ? "online" : "invisible");
          const isSelf = m.user.id === currentUser?.id;
          return (
            <div key={m.user.id} className="flex items-center gap-3 px-2 py-1.5 rounded hover:bg-[#35373c] group">
              <div className="relative shrink-0">
                <div className="w-8 h-8 rounded-full bg-[#5865f2] flex items-center justify-center text-white text-xs font-bold">
                  {m.user.username[0].toUpperCase()}
                </div>
                <span className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full ${statusColors[status]} border-2 border-[#2b2d31]`} />
              </div>
              <span className={`text-sm truncate ${isSelf ? "text-[#5865f2]" : isOnline ? "text-[#dbdee1]" : "text-[#949ba4]"}`}>
                {m.user.username}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
