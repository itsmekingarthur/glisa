import { useState } from "react";
import { useAuthStore } from "../store/useAuthStore";
import { api } from "../lib/api";

export default function Register({ onToggle }: { onToggle: () => void }) {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const login = useAuthStore((s) => s.login);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      const { token, user } = await api.auth.register({ username, email, password });
      login(user, token);
    } catch (err: any) {
      setError(err.message || "Registration failed");
    }
  };

  return (
    <div className="flex items-center justify-center h-screen bg-[#313338]">
      <form onSubmit={handleSubmit} className="bg-[#1e1f22] p-8 rounded-lg w-96 space-y-4">
        <h1 className="text-2xl font-bold text-center">Create an account</h1>
        {error && <div className="text-red-400 text-sm text-center">{error}</div>}
        <input className="w-full p-3 rounded bg-[#1e1f22] border border-[#3f4147] focus:border-[#5865f2] outline-none" placeholder="Username" value={username} onChange={e => setUsername(e.target.value)} required />
        <input className="w-full p-3 rounded bg-[#1e1f22] border border-[#3f4147] focus:border-[#5865f2] outline-none" placeholder="Email" type="email" value={email} onChange={e => setEmail(e.target.value)} required />
        <input className="w-full p-3 rounded bg-[#1e1f22] border border-[#3f4147] focus:border-[#5865f2] outline-none" placeholder="Password" type="password" value={password} onChange={e => setPassword(e.target.value)} required minLength={4} />
        <button type="submit" className="w-full p-3 bg-[#5865f2] hover:bg-[#4752c4] rounded font-semibold">Register</button>
        <p className="text-sm text-[#949ba4] text-center">Already have an account? <button type="button" onClick={onToggle} className="text-[#00a8fc] hover:underline">Login</button></p>
      </form>
    </div>
  );
}
