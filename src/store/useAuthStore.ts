import { create } from "zustand";

interface User { id: string; username: string; email: string; }

interface AuthState {
  user: User | null;
  token: string | null;
  login: (user: User, token: string) => void;
  logout: () => void;
  init: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  login: (user, token) => {
    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(user));
    set({ user, token });
  },
  logout: () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    set({ user: null, token: null });
  },
  init: () => {
    const token = localStorage.getItem("token");
    const user = localStorage.getItem("user");
    if (token && user) set({ token, user: JSON.parse(user) });
  },
}));
