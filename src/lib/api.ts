const API = "/api";

function getToken() { return localStorage.getItem("token"); }

async function request(path: string, options: RequestInit = {}) {
  const token = getToken();
  const res = await fetch(`${API}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "Unable to read response");
    try {
      const err = JSON.parse(text);
      throw new Error(err.error || `HTTP ${res.status}`);
    } catch {
      throw new Error(`HTTP ${res.status}: ${text.slice(0, 200)}`);
    }
  }
  return res.json();
}

export const api = {
  auth: {
    register: (data: { username: string; email: string; password: string }) =>
      request("/auth/register", { method: "POST", body: JSON.stringify(data) }),
    login: (data: { email: string; password: string }) =>
      request("/auth/login", { method: "POST", body: JSON.stringify(data) }),
  },
  servers: {
    list: () => request("/servers"),
    create: (name: string) => request("/servers", { method: "POST", body: JSON.stringify({ name }) }),
    join: (id: string) => request(`/servers/${id}/join`, { method: "POST" }),
  },
  messages: {
    list: (channelId: string) => request(`/messages?channelId=${channelId}`),
  },
};
