const API_BASE_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:4000";

async function fetchJson(path, options = {}) {
  const headers = {};

  if (!(options.body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers,
    ...options,
  });

  const text = await response.text();
  const data = text ? JSON.parse(text) : null;
  if (!response.ok) {
    const error = new Error(data?.error || response.statusText || "API request failed");
    error.status = response.status;
    throw error;
  }
  return data;
}

export async function apiGet(path) {
  return fetchJson(path, { method: "GET" });
}

export async function apiPost(path, body, options = {}) {
  return fetchJson(path, { method: "POST", body: JSON.stringify(body), ...options });
}

export async function apiPut(path, body, options = {}) {
  return fetchJson(path, { method: "PUT", body: JSON.stringify(body), ...options });
}

export async function apiDelete(path, body, options = {}) {
  return fetchJson(path, { method: "DELETE", body: JSON.stringify(body), ...options });
}
