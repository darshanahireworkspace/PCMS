import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import "leaflet/dist/leaflet.css";
import "./i18n";
import "./index.css";
import App from "./App";
import { AuthProvider } from "./context/AuthContext";
import { AdminAuthProvider } from "./context/AdminAuthContext";
import { syncOfflineQueue } from "./services/offlineQueue";

import { registerSW } from "virtual:pwa-register";

// Automatic PWA background update checker
const updateSW = registerSW({
  immediate: true,
  onNeedRefresh() {
    console.log("New PCMS build detected. Updating immediately...");
    updateSW(true);
  },
  onOfflineReady() {
    console.log("PCMS PWA is ready for offline operation.");
  },
  onRegisteredSW(swUrl, r) {
    if (r) {
      // Check for updates every 10 minutes
      setInterval(() => {
        r.update();
      }, 10 * 60 * 1000);

      // Check for update whenever user opens or resumes the app
      document.addEventListener("visibilitychange", () => {
        if (document.visibilityState === "visible") {
          r.update();
        }
      });
      window.addEventListener("focus", () => {
        r.update();
      });
    }
  },
});

window.addEventListener("online", () => {
  syncOfflineQueue();
});

ReactDOM.createRoot(document.getElementById("root")).render(
  <BrowserRouter>
    <AuthProvider>
      <AdminAuthProvider>
        <App />
        <Toaster position="top-right" />
      </AdminAuthProvider>
    </AuthProvider>
  </BrowserRouter>
);