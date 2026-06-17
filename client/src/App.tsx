import { useEffect, useState } from "react";
import { useAuthStore } from "./store/useAuthStore";
import { useServerStore } from "./store/useServerStore";
import { connectSocket, disconnectSocket, getSocket } from "./lib/socket";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ServerSidebar from "./components/ServerSidebar";
import ChannelSidebar from "./components/ChannelSidebar";
import ChatArea from "./components/ChatArea";
import MemberList from "./components/MemberList";

export default function App() {
  const { user, token, logout } = useAuthStore();
  const { addOnlineUser, removeOnlineUser, setOnlineUsers, setUserStatus } = useServerStore();
  const [isLogin, setIsLogin] = useState(true);

  useEffect(() => {
    if (token) {
      const socket = connectSocket(token);
      socket.on("user:online", (uid: string) => addOnlineUser(uid));
      socket.on("user:offline", (uid: string) => removeOnlineUser(uid));
      socket.on("users:online", (users: string[]) => setOnlineUsers(users));
      socket.on("user:status", (data: { userId: string; status: string }) => setUserStatus(data.userId, data.status as any));
    }
    return () => { disconnectSocket(); };
  }, [token]);

  if (!user || !token) {
    return isLogin ? (
      <Login onToggle={() => setIsLogin(false)} />
    ) : (
      <Register onToggle={() => setIsLogin(true)} />
    );
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
        <button onClick={logout} className="text-red-400 hover:text-red-300 ml-2">
          Logout
        </button>
      </div>
    </div>
  );
}
