const RAW_API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  import.meta.env.VITE_API_URL ||
  "http://localhost:4000";

const NORMALIZED_API_BASE = String(RAW_API_BASE_URL).replace(/\/$/, "");
const API_BASE_URL = NORMALIZED_API_BASE.endsWith("/api/v1")
  ? NORMALIZED_API_BASE
  : `${NORMALIZED_API_BASE}/api/v1`;

async function parseResponseBody(response) {
  const text = await response.text();
  if (!text) return null;

  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

export async function apiRequest(path, { method = "GET", token, body, signal, headers: extraHeaders } = {}) {
  const headers = {
    "Content-Type": "application/json",
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  if (extraHeaders && typeof extraHeaders === "object") {
    Object.assign(headers, extraHeaders);
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
    signal,
  });

  const payload = await parseResponseBody(response);

  if (!response.ok) {
    const message =
      (payload && typeof payload === "object" && (payload.error || payload.message)) ||
      `Request failed with status ${response.status}`;
    const error = new Error(message);
    error.status = response.status;
    error.payload = payload;
    throw error;
  }

  return payload;
}

export function unwrapData(response) {
  if (response && typeof response === 'object' && 'data' in response) {
    return response.data;
  }
  return response;
}

export async function syncProfile(token, profile) {
  return apiRequest("/auth/sync", {
    method: "POST",
    token,
    body: profile,
  });
}

export async function getProfile(token) {
  return apiRequest("/auth/me", {
    method: "GET",
    token,
  });
}
