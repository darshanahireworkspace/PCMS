import { createContext, useContext, useEffect, useState } from "react";

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