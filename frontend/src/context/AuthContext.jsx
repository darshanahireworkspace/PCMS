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

  // Multi-device force logout session validation
  useEffect(() => {
    if (!officer?.id || officer.username === "SPMalegaon" || officer.role === "SuperAdmin") {
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

        if (error || !dbOfficer || dbOfficer.status !== "Active") {
          console.warn(`Session for officer ${officerId} is inactive or deleted. Triggering force logout.`);
          logout();
          window.location.href = "/login";
        }
      } catch (err) {
        console.warn("Session status verification notice:", err);
      }
    };

    // 1. Initial verification on mount
    verifySessionActive();

    // 2. Periodic poll every 5 seconds
    const intervalId = setInterval(verifySessionActive, 5000);

    // 3. Tab focus & visibility change verification
    const handleFocus = () => verifySessionActive();
    window.addEventListener("focus", handleFocus);
    document.addEventListener("visibilitychange", handleFocus);

    // 4. Supabase Realtime event listener for immediate multi-device invalidation
    let channel;
    try {
      channel = supabase
        .channel(`officer-force-logout-${officerId}`)
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "officers", filter: `id=eq.${officerId}` },
          (payload) => {
            if (payload.eventType === "DELETE" || payload.new?.status !== "Active") {
              console.warn("Real-time deletion event received for officer. Logging out immediately.");
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
  }, [officer?.id, officer?.username, officer?.role]);

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