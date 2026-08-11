import axios from "axios";

const getSanitizedApiUrl = () => {
  let rawUrl =
    import.meta.env.VITE_API_BASE_URL ||
    import.meta.env.VITE_API_URL ||
    "http://localhost:5000/api";

  rawUrl = String(rawUrl).trim();

  if (rawUrl.includes("supabase.co")) {
    if (rawUrl.includes("/rest/v1")) {
      return rawUrl.replace(/\/rest\/v1\/?$/, "/functions/v1");
    }
    if (rawUrl.includes("/rest")) {
      return rawUrl.replace(/\/rest\/?$/, "/functions/v1");
    }
    if (!rawUrl.includes("/functions/v1")) {
      return rawUrl.replace(/\/+$/, "") + "/functions/v1";
    }
    return rawUrl;
  }

  return rawUrl;
};

const API_URL = getSanitizedApiUrl();

const API = axios.create({
  baseURL: API_URL,
  timeout: 30000,
});

API.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("policeToken");
    const anonKey =
      import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
      import.meta.env.VITE_SUPABASE_ANON_KEY;

    if (anonKey && (config.baseURL?.includes("supabase.co") || config.url?.includes("supabase.co"))) {
      config.headers["apikey"] = anonKey;
    }

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    if (config.data instanceof FormData) {
      delete config.headers["Content-Type"];
      delete config.headers["content-type"];
    } else {
      config.headers["Content-Type"] = "application/json";
    }

    return config;
  },
  (error) => Promise.reject(error)
);

API.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error("API Error:", {
      baseURL: error.config?.baseURL,
      url: error.config?.url,
      method: error.config?.method,
      status: error.response?.status,
      message:
        error.response?.data?.message ||
        error.response?.data?.error ||
        error.message,
      data: error.response?.data,
    });

    if (error.response?.status === 401) {
      const requestUrl = error.config?.url || "";

      if (!requestUrl.includes("/auth/login")) {
        localStorage.removeItem("policeToken");
        localStorage.removeItem("policeOfficer");
      }
    }

    return Promise.reject(error);
  }
);

export default API;