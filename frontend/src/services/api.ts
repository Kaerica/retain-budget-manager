
import axios from "axios";

// The API address comes from VITE_API_URL when deployed
// (e.g. https://retain-api.onrender.com/api/). Locally it falls back to Django's dev server.
const RAW_API_URL: string =
  import.meta.env.VITE_API_URL || "http://127.0.0.1:8000/api/";

// Accept the URL with or without "/api" at the end
// (e.g. https://retain-api.onrender.com or https://retain-api.onrender.com/api/).
function normalizeApiUrl(url: string): string {
  const trimmed = url.trim().replace(/\/+$/, "");
  return trimmed.endsWith("/api") ? `${trimmed}/` : `${trimmed}/api/`;
}

const API_URL = normalizeApiUrl(RAW_API_URL);

// Fired when the API rejects the saved token so AuthContext can sign the user out.
export const UNAUTHORIZED_EVENT = "retain:unauthorized";

const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Attach the saved Django token to protected API requests.
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("retain-token");

  if (token) {
    config.headers.Authorization = `Token ${token}`;
  }

  return config;
});

// If the token is no longer valid, tell the app to sign out.
api.interceptors.response.use(
  (response) => response,
  (error: unknown) => {
    if (
      axios.isAxiosError(error) &&
      error.response?.status === 401 &&
      localStorage.getItem("retain-token")
    ) {
      window.dispatchEvent(new Event(UNAUTHORIZED_EVENT));
    }

    return Promise.reject(error);
  }
);

// Turns an API error into a readable message for the UI.
export function getErrorMessage(error: unknown, fallback: string): string {
  if (axios.isAxiosError(error)) {
    const data: unknown = error.response?.data;

    if (typeof data === "object" && data !== null) {
      if ("detail" in data && typeof data.detail === "string") {
        return data.detail;
      }

      const firstValue = Object.values(data)[0];

      if (Array.isArray(firstValue) && typeof firstValue[0] === "string") {
        return firstValue[0];
      }
    }

    if (!error.response) {
      return "Cannot reach the server. Please check your connection.";
    }
  }

  return fallback;
}

export default api;
