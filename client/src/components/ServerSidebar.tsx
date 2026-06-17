import { useEffect, useState } from "react";
import { api } from "../lib/api";
import { useServerStore } from "../store/useServerStore";

export default function ServerSidebar() {
  const { servers, setServers, addServer, selectServer, selectedServer } = useServerStore();
  const [showCreate, setShowCreate] = useState(false);
  const [serverName, setServerName] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    api.servers.list().then(setServers).catch(console.error);
  }, []);

  const createServer = async () => {
    if (!serverName.trim()) return;
    setError("");
    try {
      const server = await api.servers.create(serverName);
      addServer(server);
      selectServer(server);
      setServerName("");
      setShowCreate(false);
    } catch (err: any) {
      setError(err.message || "Failed to create server");
    }
  };

  return (
    <div className="w-[72px] bg-[#1e1f22] flex flex-col items-center py-3 gap-2 overflow-y-auto">
      {servers.map((s) => (
        <button
          key={s.id}
          onClick={() => selectServer(s)}
          className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white font-bold text-lg transition-all hover:rounded-xl ${
            selectedServer?.id === s.id
              ? "bg-[#5865f2] rounded-xl"
              : "bg-[#313338] hover:bg-[#5865f2]"
          }`}
          title={s.name}
        >
          {s.name[0].toUpperCase()}
        </button>
      ))}
      <button
        onClick={() => setShowCreate(!showCreate)}
        className="w-12 h-12 rounded-2xl bg-[#313338] text-green-500 text-2xl hover:bg-green-500 hover:text-white hover:rounded-xl transition-all"
        title="Add Server"
      >
        +
      </button>

      {showCreate && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-[#313338] p-6 rounded-lg space-y-3 w-80">
            <h2 className="text-white font-bold text-lg">Create Server</h2>
            {error && <p className="text-red-400 text-sm">{error}</p>}
            <input
              autoFocus
              value={serverName}
              onChange={(e) => setServerName(e.target.value)}
              placeholder="Server name"
              className="w-full p-3 rounded bg-[#1e1f22] border border-[#404249] text-white outline-none"
              onKeyDown={(e) => e.key === "Enter" && createServer()}
            />
            <div className="flex gap-2 justify-end">
              <button onClick={() => setShowCreate(false)} className="px-4 py-2 text-[#949ba4] hover:text-white">
                Cancel
              </button>
              <button onClick={createServer} className="px-4 py-2 bg-[#5865f2] text-white rounded hover:bg-[#4752c4]">
                Create
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
