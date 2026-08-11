import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Lock, User, Eye, EyeOff, ShieldCheck, ArrowRight } from "lucide-react";
import toast from "react-hot-toast";
import { loginOfficer } from "../../api/authApi";
import { useAdminAuth } from "../../context/AdminAuthContext";
import policeLogo from "../../assets/police-logo.png";
import "./AdminPortal.css";

function AdminLogin() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { adminUser, adminLogin } = useAdminAuth();
  const navigate = useNavigate();

  // Dynamic route-aware PWA manifest switcher for Admin console
  useEffect(() => {
    let link = document.querySelector('link[rel="manifest"]');
    if (!link) {
      link = document.createElement("link");
      link.rel = "manifest";
      document.head.appendChild(link);
    }
    link.href = "/admin-manifest.webmanifest";

    return () => {
      link.href = "/manifest.webmanifest";
    };
  }, []);

  // If already authenticated as SuperAdmin or Admin, redirect to dashboard
  useEffect(() => {
    if (adminUser && (adminUser.role === "SuperAdmin" || adminUser.role === "Admin")) {
      navigate("/admin/dashboard", { replace: true });
    }
  }, [adminUser, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const cleanUser = username.trim();
    const cleanPass = password.trim();

    if (!cleanUser || !cleanPass) {
      toast.error("Please enter admin username and password");
      return;
    }

    try {
      setLoading(true);
      const res = await loginOfficer({ username: cleanUser, password: cleanPass });
      const { token, officer: authOfficer } = res.data.data;

      if (authOfficer.role !== "SuperAdmin" && authOfficer.role !== "Admin") {
        toast.error("Access denied: Not an administrator account");
        return;
      }

      adminLogin(token, authOfficer);
      toast.success(`Welcome, ${authOfficer.full_name || "Super Admin"}`);
      navigate("/admin/dashboard", { replace: true });
    } catch (err) {
      console.error("Admin login error:", err);
      const errMsg =
        err.response?.data?.message ||
        err.response?.data?.error ||
        "Invalid administrator credentials";
      toast.error(errMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-portal-stage">
      <div className="admin-portal-card">
        <div className="admin-portal-header">
          <div className="admin-portal-logo">
            <img src={policeLogo} alt="Maharashtra Police Logo" />
          </div>
          <h2>मालेगाव शहर पोलीस व्यवस्थापन</h2>
          <p>सुपर ॲडमिन पोर्टल • Malegaon City Police Console</p>
        </div>

        <form onSubmit={handleSubmit} className="admin-portal-form" autoComplete="off">
          <div className="admin-portal-group">
            <label htmlFor="admin-username">Admin Username</label>
            <div className="admin-portal-input-wrapper">
              <User size={18} className="field-icon" />
              <input
                id="admin-username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="e.g. SPMalegaon"
                autoComplete="off"
                required
              />
            </div>
          </div>

          <div className="admin-portal-group">
            <label htmlFor="admin-password">Master Password</label>
            <div className="admin-portal-input-wrapper">
              <Lock size={18} className="field-icon" />
              <input
                id="admin-password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter admin password..."
                autoComplete="off"
                required
              />
              <button
                type="button"
                className="admin-portal-eye-btn"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="admin-portal-submit-btn"
            disabled={loading}
          >
            {loading ? (
              "Authenticating..."
            ) : (
              <>
                <ShieldCheck size={18} />
                Sign In to Admin Console
                <ArrowRight size={16} />
              </>
            )}
          </button>
        </form>

        <div className="admin-portal-footer">
          <p>मालेगाव पोलीस मुख्यालय • Maharashtra Police Authority Console</p>
        </div>
      </div>
    </div>
  );
}

export default AdminLogin;
