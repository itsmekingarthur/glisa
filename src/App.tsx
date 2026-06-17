import { useEffect, useState } from "react";
import { useAuthStore } from "./store/useAuthStore";
import { useServerStore } from "./store/useServerStore";
import { connectSocket, disconnectSocket } from "./lib/socket";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ServerSidebar from "./components/ServerSidebar";
import ChannelSidebar from "./components/ChannelSidebar";
import ChatArea from "./components/ChatArea";
import MemberList from "./components/MemberList";

export default function App() {
  const { user, token, logout, init } = useAuthStore();
  const { addMessage, updateMessage, removeMessage, setReactions, currentChannel, setOnlineUsers } = useServerStore();
  const [isLogin, setIsLogin] = useState(true);

  useEffect(() => { init(); }, []);

  useEffect(() => {
    if (user) {
      setOnlineUsers([user.id]);
    }
  }, [user?.id]);

  useEffect(() => {
    if (token) {
      const s = connectSocket(token);
      s.on("message:new", (msg: any) => {
        addMessage(msg);
      });
      s.on("message:updated", (msg: any) => updateMessage(msg));
      s.on("message:deleted", (msgId: string) => removeMessage(msgId));
      s.on("message:reacted", (data: any) => setReactions(data.messageId, data.reactions));
    }
    return () => { disconnectSocket(); };
  }, [token]);

  if (!user || !token) {
    return isLogin ? <Login onToggle={() => setIsLogin(false)} /> : <Register onToggle={() => setIsLogin(true)} />;
  }

  return (
    <div className="flex h-screen">
      <ServerSidebar />
      <ChannelSidebar />
      <ChatArea />
      <MemberList />
      <div className="fixed bottom-0 right-0 p-3 text-xs text-[#949ba4] bg-[#1e1f22] px-4 rounded-tl-lg flex items-center gap-2 z-10">
        <span className="w-2 h-2 rounded-full bg-green-500" />
        {user.username}
        <button onClick={logout} className="text-red-400 hover:text-red-300 ml-2">Logout</button>
      </div>
    </div>
  );
}
