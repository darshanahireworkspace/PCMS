import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [officer, setOfficer] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const token = localStorage.getItem("policeToken");
      const userStr = localStorage.getItem("policeOfficer");

      if (token && userStr && userStr !== "undefined" && userStr !== "null") {
        const parsedUser = JSON.parse(userStr);
        if (parsedUser && typeof parsedUser === "object") {
          setOfficer(parsedUser);
        } else {
          localStorage.removeItem("policeToken");
          localStorage.removeItem("policeOfficer");
        }
      } else {
        localStorage.removeItem("policeToken");
        localStorage.removeItem("policeOfficer");
      }
    } catch {
      localStorage.removeItem("policeToken");
      localStorage.removeItem("policeOfficer");
      setOfficer(null);
    } finally {
      setLoading(false);
    }
  }, []);

  // Account-scoped session invalidation (Triggers ONLY when specific officer status is strictly Inactive)
  useEffect(() => {
    if (
      !officer?.id ||
      officer.username === "SPMalegaon" ||
      officer.role === "SuperAdmin" ||
      officer.role === "Admin" ||
      officer.access_scope === "ALL"
    ) {
      return undefined;
    }

    const officerId = officer.id;

    const verifySessionActive = async () => {
      try {
        const { data: dbOfficer, error } = await supabase
          .from("officers")
          .select("id, status")
          .eq("id", officerId)
          .maybeSingle();

        // ONLY force logout if database explicitly responds AND status is strictly 'Inactive'
        // Network errors or missing responses MUST NEVER trigger logout for active users
        if (!error && dbOfficer && dbOfficer.status === "Inactive") {
          console.warn(`Account for officer ${officerId} has been deactivated. Logging out.`);
          logout();
          window.location.href = "/login";
        }
      } catch (err) {
        console.warn("Session status verification notice:", err);
      }
    };

    // 1. Verification on mount
    verifySessionActive();

    // 2. Periodic poll every 10 seconds
    const intervalId = setInterval(verifySessionActive, 10000);

    // 3. Tab focus & visibility change verification
    const handleFocus = () => verifySessionActive();
    window.addEventListener("focus", handleFocus);
    document.addEventListener("visibilitychange", handleFocus);

    // 4. Supabase Realtime event listener scoped strictly to this officer's UUID
    let channel;
    try {
      channel = supabase
        .channel(`officer-force-logout-${officerId}`)
        .on(
          "postgres_changes",
          { event: "UPDATE", schema: "public", table: "officers", filter: `id=eq.${officerId}` },
          (payload) => {
            if (payload.new && payload.new.status === "Inactive") {
              console.warn(`Real-time deactivation event for officer ${officerId}. Logging out.`);
              logout();
              window.location.href = "/login";
            }
          }
        )
        .subscribe();
    } catch (realtimeErr) {
      console.warn("Realtime subscription notice:", realtimeErr);
    }

    return () => {
      clearInterval(intervalId);
      window.removeEventListener("focus", handleFocus);
      document.removeEventListener("visibilitychange", handleFocus);
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [officer?.id, officer?.username, officer?.role, officer?.access_scope]);

  const login = (token, user) => {
    if (!token || !user) return;
    if (user.username !== "SPMalegaon" && user.role !== "SuperAdmin") {
      localStorage.removeItem("pcms_admin_token");
      localStorage.removeItem("pcms_admin_user");
    }
    localStorage.setItem("policeToken", token);
    localStorage.setItem("policeOfficer", JSON.stringify(user));
    setOfficer(user);
  };

  const logout = () => {
    localStorage.removeItem("policeToken");
    localStorage.removeItem("policeOfficer");
    localStorage.removeItem("pcms_admin_token");
    localStorage.removeItem("pcms_admin_user");
    setOfficer(null);
  };

  return (
    <AuthContext.Provider value={{ officer, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);