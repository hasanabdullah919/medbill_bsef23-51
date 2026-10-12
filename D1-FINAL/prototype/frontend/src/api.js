const API_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000/api";

export async function request(path, options = {}) {
  const token = localStorage.getItem("medbill-token");
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      ...(options.body ? { "Content-Type": "application/json" } : {}),
      ...(token ? { Authorization: `Token ${token}` } : {}),
      ...options.headers,
    },
  });
  if (response.status === 204) return null;
  const payload = await response.json();
  if (!response.ok) throw new Error(payload.detail || "The request could not be completed.");
  return payload;
}
