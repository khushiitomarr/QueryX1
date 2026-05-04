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
