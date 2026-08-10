import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";

const API = axios.create({
  baseURL: API_URL,
  timeout: 30000,
});

API.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("policeToken");

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    /*
     * FormData साठी Content-Type manually set करू नका.
     * Browser योग्य multipart boundary तयार करतो.
     */
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