import { createContext, useContext, useEffect, useState } from "react";

const AdminAuthContext = createContext();

export function AdminAuthProvider({ children }) {
  const [adminUser, setAdminUser] = useState(null);
  const [adminToken, setAdminToken] = useState(null);
  const [adminLoading, setAdminLoading] = useState(true);

  useEffect(() => {
    try {
      const token = localStorage.getItem("pcms_admin_token");
      const userStr = localStorage.getItem("pcms_admin_user");

      if (token && userStr && userStr !== "undefined" && userStr !== "null") {
        const parsedUser = JSON.parse(userStr);
        if (
          parsedUser &&
          typeof parsedUser === "object" &&
          (parsedUser.role === "SuperAdmin" || parsedUser.role === "Admin")
        ) {
          setAdminUser(parsedUser);
          setAdminToken(token);
        } else {
          localStorage.removeItem("pcms_admin_token");
          localStorage.removeItem("pcms_admin_user");
        }
      } else {
        localStorage.removeItem("pcms_admin_token");
        localStorage.removeItem("pcms_admin_user");
      }
    } catch {
      localStorage.removeItem("pcms_admin_token");
      localStorage.removeItem("pcms_admin_user");
      setAdminUser(null);
      setAdminToken(null);
    } finally {
      setAdminLoading(false);
    }
  }, []);

  const adminLogin = (token, user) => {
    if (!token || !user) return;
    localStorage.setItem("pcms_admin_token", token);
    localStorage.setItem("pcms_admin_user", JSON.stringify(user));
    setAdminToken(token);
    setAdminUser(user);
  };

  const adminLogout = () => {
    localStorage.removeItem("pcms_admin_token");
    localStorage.removeItem("pcms_admin_user");
    setAdminToken(null);
    setAdminUser(null);
  };

  return (
    <AdminAuthContext.Provider
      value={{ adminUser, adminToken, adminLoading, adminLogin, adminLogout }}
    >
      {children}
    </AdminAuthContext.Provider>
  );
}

export const useAdminAuth = () => useContext(AdminAuthContext);
