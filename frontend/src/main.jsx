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