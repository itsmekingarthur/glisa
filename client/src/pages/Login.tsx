import { useState } from "react";
import { api } from "../lib/api";
import { useAuthStore } from "../store/useAuthStore";

interface Props {
  onToggle: () => void;
}

export default function Login({ onToggle }: Props) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const setAuth = useAuthStore((s) => s.setAuth);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      const res = await api.auth.login({ email, password });
      setAuth(res.user, res.token);
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="flex items-center justify-center h-screen bg-[#313338]">
      <form onSubmit={handleSubmit} className="bg-[#1e1f22] p-8 rounded-lg w-96 space-y-4">
        <h1 className="text-2xl font-bold text-center text-white">Welcome Back</h1>
        {error && <p className="text-red-400 text-sm text-center">{error}</p>}
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full p-3 rounded bg-[#1e1f22] border border-[#404249] text-white focus:border-[#5865f2] outline-none"
          required
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full p-3 rounded bg-[#1e1f22] border border-[#404249] text-white focus:border-[#5865f2] outline-none"
          required
        />
        <button
          type="submit"
          className="w-full p-3 rounded bg-[#5865f2] text-white font-semibold hover:bg-[#4752c4] transition"
        >
          Log In
        </button>
        <p className="text-sm text-[#949ba4] text-center">
          Need an account?{" "}
          <button type="button" onClick={onToggle} className="text-[#5865f2] hover:underline">
            Register
          </button>
        </p>
      </form>
    </div>
  );
}
