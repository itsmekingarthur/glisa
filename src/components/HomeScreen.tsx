import { useEffect, useState, useRef } from "react";
import { useServerStore } from "../store/useServerStore";
import { useAuthStore } from "../store/useAuthStore";

type FriendTab = "all" | "online" | "pending" | "blocked" | "add";

interface FriendEntry {
  id: string;
  user: { id: string; username: string };
  incoming?: boolean;
}

export default function HomeScreen() {
  const { onlineUsers } = useServerStore();
  const user = useAuthStore((s) => s.user);
  const [tab, setTab] = useState<FriendTab>("all");
  const [friends, setFriends] = useState<FriendEntry[]>([]);
  const [pending, setPending] = useState<FriendEntry[]>([]);
  const [searchQ, setSearchQ] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const searchRef = useRef<HTMLInputElement>(null);

  const fetchFriends = () => {
    const token = localStorage.getItem("token");
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    fetch("/api/friends", { headers }).then(r => r.ok ? r.json() : []).then(setFriends);
    fetch("/api/friends?type=pending", { headers }).then(r => r.ok ? r.json() : []).then(setPending);
  };

  useEffect(() => { fetchFriends(); }, []);

  useEffect(() => {
    if (searchQ.length < 1) { setSearchResults([]); return; }
    const t = setTimeout(async () => {
      const token = localStorage.getItem("token");
      const res = await fetch(`/api/users?q=${encodeURIComponent(searchQ)}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (res.ok) setSearchResults(await res.json());
    }, 300);
    return () => clearTimeout(t);
  }, [searchQ]);

  const sendRequest = async (targetId: string) => {
    const token = localStorage.getItem("token");
    await fetch("/api/friends", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ type: "request", targetId }),
    });
    setSearchQ("");
    setSearchResults([]);
  };

  const acceptRequest = async (targetId: string) => {
    const token = localStorage.getItem("token");
    await fetch("/api/friends", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ type: "accept", targetId }),
    });
    fetchFriends();
  };

  const friendIds = new Set(friends.map(f => f.user.id));
  const pendingIds = new Set(pending.map(p => p.user.id));

  const filtered = (() => {
    switch (tab) {
      case "online":
        return friends.filter(f => onlineUsers.has(f.user.id));
      case "pending":
        return pending.filter(p => p.incoming);
      default:
        return friends;
    }
  })();

  const tabs: { id: FriendTab; label: string }[] = [
    { id: "all", label: "All" },
    { id: "online", label: "Online" },
    { id: "pending", label: "Pending" },
    { id: "blocked", label: "Blocked" },
    { id: "add", label: "Add Friend" },
  ];

  return (
    <div className="flex-1 flex flex-col bg-[#313338]">
      {/* Top Header */}
      <div className="h-12 px-4 flex items-center justify-between border-b border-[#1e1f22] shrink-0">
        <div className="flex items-center gap-2">
          <img src="/favicon.png" className="w-5 h-5" alt="" />
          <span className="font-semibold text-sm text-[#dbdee1]">Home</span>
        </div>
        <div className="relative">
          <input
            ref={searchRef}
            value={searchQ}
            onChange={e => setSearchQ(e.target.value)}
            placeholder="Search or start a new conversation"
            className="w-56 px-3 py-1.5 rounded bg-[#1e1f22] text-sm text-[#dbdee1] placeholder-[#949ba4] outline-none focus:ring-1 focus:ring-[#5865f2]"
          />
          {searchResults.length > 0 && (
            <div className="absolute top-full right-0 mt-1 w-72 bg-[#111214] rounded-lg shadow-2xl border border-[#35363c] overflow-hidden z-50">
              {searchResults.map(u => (
                <div key={u.id} className="flex items-center justify-between px-3 py-2 hover:bg-[#1e1f22]">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-[#5865f2] flex items-center justify-center text-white text-[10px] font-bold">
                      {u.username[0].toUpperCase()}
                    </div>
                    <span className="text-sm text-[#dbdee1]">{u.username}</span>
                  </div>
                  {friendIds.has(u.id) ? (
                    <span className="text-xs text-[#23a559]">Friends</span>
                  ) : pendingIds.has(u.id) ? (
                    <span className="text-xs text-[#faa61a]">Pending</span>
                  ) : (
                    <button
                      onClick={() => sendRequest(u.id)}
                      className="text-xs px-3 py-1 bg-[#5865f2] hover:bg-[#4752c4] rounded text-white"
                    >
                      Add Friend
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 px-4 py-2 border-b border-[#1e1f22] shrink-0">
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
              tab === t.id
                ? "bg-[#3f4147] text-white"
                : "text-[#949ba4] hover:text-[#dbdee1] hover:bg-[#35363c]"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Add Friend Bar */}
      {tab === "add" && (
        <div className="px-6 py-4 border-b border-[#1e1f22] shrink-0">
          <h3 className="text-lg font-bold text-[#dbdee1] mb-1">Add Friend</h3>
          <p className="text-sm text-[#949ba4] mb-3">You can add friends with their username.</p>
          <div className="flex gap-3">
            <div className="flex-1 relative">
              <input
                value={searchQ}
                onChange={e => setSearchQ(e.target.value)}
                placeholder="Enter a username..."
                className="w-full px-4 py-2.5 rounded-lg bg-[#1e1f22] text-sm text-[#dbdee1] placeholder-[#949ba4] outline-none focus:ring-1 focus:ring-[#5865f2]"
                autoFocus
              />
              {tab === "add" && searchResults.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-[#111214] rounded-lg shadow-2xl border border-[#35363c] overflow-hidden z-50">
                  {searchResults.map(u => (
                    <div key={u.id} className="flex items-center justify-between px-3 py-2 hover:bg-[#1e1f22]">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-[#5865f2] flex items-center justify-center text-white text-[10px] font-bold">
                          {u.username[0].toUpperCase()}
                        </div>
                        <span className="text-sm text-[#dbdee1]">{u.username}</span>
                      </div>
                      {friendIds.has(u.id) ? (
                        <span className="text-xs text-[#23a559]">Already friends</span>
                      ) : pendingIds.has(u.id) ? (
                        <span className="text-xs text-[#faa61a]">Request pending</span>
                      ) : (
                        <button
                          onClick={() => sendRequest(u.id)}
                          className="text-xs px-3 py-1 bg-[#5865f2] hover:bg-[#4752c4] rounded text-white"
                        >
                          Send Friend Request
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-5xl mx-auto w-full p-6">
          {tab === "blocked" && (
            <div className="text-center py-16 text-[#949ba4]">
              <div className="text-5xl mb-4">🚫</div>
              <p className="text-lg font-semibold text-[#dbdee1]">No Blocked Users</p>
              <p className="text-sm mt-1">You haven't blocked anyone.</p>
            </div>
          )}

          {tab !== "add" && tab !== "blocked" && filtered.length === 0 && (
            <div className="text-center py-16">
              <div className="text-5xl mb-4">👥</div>
              <p className="text-lg font-semibold text-[#dbdee1]">
                {tab === "pending" ? "No Pending Requests" : tab === "online" ? "No Friends Online" : "No Friends Yet"}
              </p>
              <p className="text-sm text-[#949ba4] mt-1">
                {tab === "pending" ? "All caught up!" : tab === "online" ? "Friends will appear here when they come online." : "Use the Add Friend tab to find and add friends."}
                {tab === "all" && (
                  <button onClick={() => setTab("add")} className="ml-1 text-[#5865f2] hover:underline">Add Friend</button>
                )}
              </p>
            </div>
          )}

          {/* Friends list */}
          {filtered.length > 0 && (
            <div className="space-y-0.5">
              {filtered.map(f => {
                const isOnline = onlineUsers.has(f.user.id);
                return (
                  <div key={f.id} className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-[#2b2d31] group">
                    <div className="relative shrink-0">
                      <div className="w-10 h-10 rounded-full bg-[#5865f2] flex items-center justify-center text-white font-bold text-sm">
                        {f.user.username[0].toUpperCase()}
                      </div>
                      <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-[#313338] group-hover:border-[#2b2d31] ${isOnline ? "bg-green-500" : "bg-[#80848e]"}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-semibold ${isOnline ? "text-[#dbdee1]" : "text-[#949ba4]"}`}>
                        {f.user.username}
                      </p>
                      <p className="text-xs text-[#949ba4]">{isOnline ? "Online" : "Offline"}</p>
                    </div>
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                      <button className="w-8 h-8 rounded-full bg-[#35363c] hover:bg-[#3f4147] flex items-center justify-center text-sm text-[#dbdee1]" title="Message">
                        💬
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Pending incoming requests (in pending tab) */}
          {tab === "pending" && pending.filter(p => p.incoming).length > 0 && (
            <div className="mt-4">
              <p className="text-xs font-semibold text-[#949ba4] uppercase tracking-wider mb-2 px-3">Incoming Requests</p>
              <div className="space-y-0.5">
                {pending.filter(p => p.incoming).map(p => (
                  <div key={p.id} className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-[#2b2d31]">
                    <div className="w-10 h-10 rounded-full bg-[#faa61a] flex items-center justify-center text-white font-bold text-sm shrink-0">
                      {p.user.username[0].toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-[#dbdee1]">{p.user.username}</p>
                      <p className="text-xs text-[#faa61a]">Incoming Friend Request</p>
                    </div>
                    <button
                      onClick={() => acceptRequest(p.user.id)}
                      className="px-4 py-1.5 bg-[#23a559] hover:bg-green-500 rounded text-sm text-white font-medium"
                    >
                      Accept
                    </button>
                    <button className="px-4 py-1.5 bg-[#35363c] hover:bg-[#3f4147] rounded text-sm text-[#dbdee1] font-medium">
                      Ignore
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
