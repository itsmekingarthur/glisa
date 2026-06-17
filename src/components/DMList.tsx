import { useEffect, useState } from "react";
import { useServerStore } from "../store/useServerStore";
import { useAuthStore } from "../store/useAuthStore";

interface FriendEntry {
  id: string;
  user: { id: string; username: string };
  incoming?: boolean;
}

export default function DMList() {
  const { onlineUsers } = useServerStore();
  const user = useAuthStore((s) => s.user);
  const [friends, setFriends] = useState<FriendEntry[]>([]);
  const [pending, setPending] = useState<FriendEntry[]>([]);

  const fetchFriends = () => {
    const token = localStorage.getItem("token");
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    fetch("/api/friends", { headers }).then(r => r.ok ? r.json() : []).then(setFriends);
    fetch("/api/friends?type=pending", { headers }).then(r => r.ok ? r.json() : []).then(setPending);
  };

  useEffect(() => { fetchFriends(); }, []);

  const acceptRequest = async (targetId: string) => {
    const token = localStorage.getItem("token");
    await fetch("/api/friends", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ type: "accept", targetId }),
    });
    fetchFriends();
  };

  return (
    <div className="w-60 bg-[#2b2d31] flex flex-col shrink-0">
      <div className="h-12 px-4 flex items-center border-b border-[#1e1f22] font-semibold text-sm shadow-sm shrink-0">
        <img src="/favicon.png" className="w-5 h-5 mr-2" alt="" />
        Home
      </div>
      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        <div className="flex items-center justify-between px-2 py-1">
          <span className="text-xs font-semibold text-[#949ba4] uppercase tracking-wider">Direct Messages</span>
          <button className="text-[#949ba4] hover:text-white text-lg leading-none">+</button>
        </div>

        {/* Pending requests */}
        {pending.filter(p => p.incoming).map(p => (
          <div key={p.id} className="flex items-center gap-2 px-2 py-1.5 rounded bg-[#1e1f22]">
            <div className="w-7 h-7 rounded-full bg-[#faa61a] flex items-center justify-center text-white text-[10px] font-bold shrink-0">
              {p.user.username[0].toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-[#dbdee1] truncate">{p.user.username}</p>
              <p className="text-[10px] text-[#faa61a]">Incoming Request</p>
            </div>
            <button
              onClick={() => acceptRequest(p.user.id)}
              className="text-xs px-2 py-1 bg-[#23a559] hover:bg-green-500 rounded text-white shrink-0"
            >
              Accept
            </button>
          </div>
        ))}

        {/* Friends list */}
        {friends.length === 0 && pending.length === 0 && (
          <div className="px-2 py-4 text-center text-[#949ba4] text-xs">
            No friends yet
          </div>
        )}
        {friends.map(f => {
          const isOnline = onlineUsers.has(f.user.id);
          return (
            <div
              key={f.id}
              className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-[#35363c] cursor-pointer group"
            >
              <div className="relative shrink-0">
                <div className="w-7 h-7 rounded-full bg-[#5865f2] flex items-center justify-center text-white text-[10px] font-bold">
                  {f.user.username[0].toUpperCase()}
                </div>
                <div className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-[#2b2d31] ${isOnline ? "bg-green-500" : "bg-[#80848e]"}`} />
              </div>
              <span className={`text-xs font-medium truncate ${isOnline ? "text-[#dbdee1]" : "text-[#949ba4]"}`}>
                {f.user.username}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
