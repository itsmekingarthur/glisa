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
import DMList from "./components/DMList";
import HomeScreen from "./components/HomeScreen";

export default function App() {
  const { user, token, logout, init } = useAuthStore();
  const { addMessage, updateMessage, removeMessage, setReactions, currentChannel, currentServer, addOnlineUser } = useServerStore();
  const [isLogin, setIsLogin] = useState(true);

  useEffect(() => { init(); }, []);

  useEffect(() => {
    if (user) {
      addOnlineUser(user.id);
    }
  }, [user?.id]);

  useEffect(() => {
    if (token) {
      const s = connectSocket(token);
      s.on("message:new", (msg: any) => {
        if (msg && msg.id) addMessage(msg);
      });
      s.on("message:updated", (msg: any) => {
        if (msg && msg.id) updateMessage(msg);
      });
      s.on("message:deleted", (msgId: string) => {
        if (msgId) removeMessage(msgId);
      });
      s.on("message:reacted", (data: any) => {
        if (data && data.messageId) setReactions(data.messageId, data.reactions);
      });
    }
    return () => { disconnectSocket(); };
  }, [token]);

  if (!user || !token) {
    return isLogin ? <Login onToggle={() => setIsLogin(false)} /> : <Register onToggle={() => setIsLogin(true)} />;
  }

  const showHome = !currentServer;

  return (
    <div className="flex h-screen">
      <ServerSidebar />
      {showHome ? (
        <>
          <DMList />
          <HomeScreen />
          <div className="w-0" />
        </>
      ) : (
        <>
          <ChannelSidebar />
          <ChatArea />
          <MemberList />
        </>
      )}
      <div className="fixed bottom-0 right-0 p-3 text-xs text-[#949ba4] bg-[#1e1f22] px-4 rounded-tl-lg flex items-center gap-2 z-10">
        <span className="w-2 h-2 rounded-full bg-green-500" />
        {user.username}
        <button onClick={logout} className="text-red-400 hover:text-red-300 ml-2">Logout</button>
      </div>
    </div>
  );
}
