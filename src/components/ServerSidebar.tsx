import { useEffect, useState } from "react";
import { useServerStore } from "../store/useServerStore";
import { useAuthStore } from "../store/useAuthStore";
import { api } from "../lib/api";

export default function ServerSidebar() {
  const { servers, currentServer, selectServer, fetchServers } = useServerStore();
  const token = useAuthStore((s) => s.token);
  const [showCreate, setShowCreate] = useState(false);
  const [name, setName] = useState("");

  useEffect(() => { if (token) fetchServers(); }, [token]);

  const handleCreate = async () => {
    if (!name.trim()) return;
    const server = await api.servers.create(name);
    setShowCreate(false);
    setName("");
    fetchServers();
    selectServer(server);
  };

  return (
    <div className="w-[72px] bg-[#1e1f22] flex flex-col items-center py-3 gap-2 shrink-0 overflow-y-auto">
      <button
        onClick={() => { selectServer(null as any); }}
        className="w-12 h-12 rounded-2xl bg-[#5865f2] hover:rounded-xl hover:bg-[#4752c4] transition-all duration-200 flex items-center justify-center text-white font-bold text-lg shrink-0"
        title="Home"
      >
        G
      </button>
      <div className="w-8 h-[2px] bg-[#35363c] rounded" />
      {servers.map((s) => (
        <button
          key={s.id}
          onClick={() => selectServer(s)}
          className={`w-12 h-12 rounded-2xl hover:rounded-xl transition-all duration-200 flex items-center justify-center font-bold text-lg shrink-0 ${
            currentServer?.id === s.id ? "bg-[#5865f2] rounded-xl text-white" : "bg-[#35363c] hover:bg-[#5865f2] text-[#dbdee1]"
          }`}
          title={s.name}
        >
          {s.name[0].toUpperCase()}
        </button>
      ))}
      <button
        onClick={() => setShowCreate(true)}
        className="w-12 h-12 rounded-2xl hover:rounded-xl hover:bg-[#23a559] transition-all duration-200 bg-[#35363c] text-[#23a559] hover:text-white flex items-center justify-center text-2xl shrink-0"
        title="Add Server"
      >
        +
      </button>
      {showCreate && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowCreate(false)}>
          <div className="bg-[#1e1f22] p-6 rounded-lg w-80 space-y-4" onClick={e => e.stopPropagation()}>
            <h2 className="font-bold text-lg">Create Server</h2>
            <input className="w-full p-3 rounded bg-[#313338] border border-[#3f4147] outline-none focus:border-[#5865f2]" placeholder="Server name" value={name} onChange={e => setName(e.target.value)} autoFocus />
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
