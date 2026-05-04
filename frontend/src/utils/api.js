const REMOTE_API_BASE_URL = "https://queryx1.onrender.com";
const LOCAL_API_BASE_URL = "http://localhost:5000";

export const getApiBaseUrl = () => {
  const configuredBaseUrl = import.meta.env.VITE_API_BASE_URL;

  const baseUrl =
    configuredBaseUrl ||
    (window.location.hostname === "localhost"
      ? LOCAL_API_BASE_URL
      : REMOTE_API_BASE_URL);

  return baseUrl.replace(/\/$/, "");
};

export const getApiUrl = (path) => `${getApiBaseUrl()}${path}`;

export const clearSavedAuth = () => {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
};

export const getAuthHeaders = () => {
  const token = localStorage.getItem("token");

  if (!token || token === "null" || token === "undefined") {
    clearSavedAuth();
    return {};
  }

  const parts = token.split(".");
  if (parts.length !== 3) {
    clearSavedAuth();
    return {};
  }

  return { Authorization: `Bearer ${token}` };
};
