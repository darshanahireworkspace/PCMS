import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Lock,
  User,
  Eye,
  EyeOff,
  ShieldCheck,
  ArrowRight,
  Download,
  Smartphone,
  X,
  Share,
  Sun,
  Moon,
} from "lucide-react";
import toast from "react-hot-toast";
import { loginAdminApi } from "../../api/authApi";
import { useAdminAuth } from "../../context/AdminAuthContext";
import policeLogo from "../../assets/police-logo.png";
import "./admin-login.css";

function AdminLogin() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem("admin_theme") || "dark";
  });

  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showIosModal, setShowIosModal] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  const { adminUser, adminLogin } = useAdminAuth();
  const navigate = useNavigate();

  const isIOS =
    typeof navigator !== "undefined" &&
    (/iphone|ipad|ipod/i.test(navigator.userAgent) ||
      (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1));

  const toggleTheme = () => {
    const nextTheme = theme === "dark" ? "light" : "dark";
    setTheme(nextTheme);
    localStorage.setItem("admin_theme", nextTheme);
  };

  // Listen to beforeinstallprompt for Android & Desktop Chrome/Edge
  useEffect(() => {
    const installed =
      window.matchMedia("(display-mode: standalone)").matches ||
      window.navigator.standalone === true;
    setIsInstalled(installed);

    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    };
  }, []);

  // Dynamic route-aware PWA manifest & iOS Safari switcher for Admin console
  useEffect(() => {
    let link = document.getElementById("app-manifest");
    if (!link) {
      link = document.createElement("link");
      link.id = "app-manifest";
      link.rel = "manifest";
      document.head.appendChild(link);
    }
    link.setAttribute("href", "/admin-manifest.webmanifest");

    const prevTitle = document.title;
    document.title = "Super Admin | मालेगाव शहर पोलीस";

    let appleTitleMeta = document.querySelector('meta[name="apple-mobile-web-app-title"]');
    if (!appleTitleMeta) {
      appleTitleMeta = document.createElement("meta");
      appleTitleMeta.setAttribute("name", "apple-mobile-web-app-title");
      document.head.appendChild(appleTitleMeta);
    }
    const prevAppleTitle = appleTitleMeta.getAttribute("content");
    appleTitleMeta.setAttribute("content", "Super Admin");

    return () => {
      link.setAttribute("href", "/manifest.webmanifest");
      document.title = prevTitle || "मालेगाव शहर पोलीस व्यवस्थापन प्रणाली";
      if (prevAppleTitle) {
        appleTitleMeta.setAttribute("content", prevAppleTitle);
      } else {
        appleTitleMeta.setAttribute("content", "Malegaon Police");
      }
    };
  }, []);

  // If already authenticated as SuperAdmin SPMalegaon, redirect to dashboard
  useEffect(() => {
    if (adminUser && adminUser.username === "SPMalegaon") {
      navigate("/admin/dashboard", { replace: true });
    }
  }, [adminUser, navigate]);

  const handleInstallApp = async () => {
    if (isInstalled) {
      toast.success("मालेगाव शहर पोलीस Admin App आधीच इन्स्टॉल आहे.");
      return;
    }

    if (isIOS) {
      setShowIosModal(true);
      return;
    }

    if (deferredPrompt) {
      deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice.outcome === "accepted") {
        toast.success("मालेगाव शहर पोलीस Admin App यशस्वीरित्या इन्स्टॉल झाले!");
        setDeferredPrompt(null);
        setIsInstalled(true);
      }
    } else {
      toast("ब्राऊझर मेनू (⋮) वर जा आणि 'Add to Home screen' किंवा 'Install App' निवडा.", {
        icon: "📲",
      });
    }
  };

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
      const res = await loginAdminApi({ username: cleanUser, password: cleanPass });
      const { token, officer: authOfficer } = res.data.data;

      if (!authOfficer || authOfficer.username !== "SPMalegaon") {
        toast.error("Invalid admin credentials");
        return;
      }

      adminLogin(token, authOfficer);
      toast.success(`Welcome, ${authOfficer.full_name || "Super Admin"}`);
      navigate("/admin/dashboard", { replace: true });
    } catch (err) {
      console.error("Admin login error:", err);
      toast.error("Invalid admin credentials");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`admin-login-wrapper theme-${theme}`}>
      <div className="admin-login-stage-box">
        {/* LEFT BRAND PANEL (DESKTOP / LAPTOP) */}
        <div className="admin-login-brand-panel">
          <div className="admin-brand-header">
            <div className="admin-brand-logo-ring">
              <img src={policeLogo} alt="Maharashtra Police Emblem" />
            </div>
            <div className="admin-brand-titles">
              <h1>मालेगाव शहर पोलीस</h1>
              <p>सुपर ॲडमिन पोर्टल • Admin Console</p>
            </div>
          </div>

          <p className="admin-brand-desc">
            मालेगाव शहर पोलीस मुख्यालय — अधिकारी क्रिडेंशियल, पथक व्यवस्थापन व शहर सुरक्षा इंटेलिजन्स पोर्टल.
          </p>

          <div className="admin-brand-footer">
            <div className="admin-security-pill">
              <ShieldCheck size={14} />
              <span>Encrypted Authority Session</span>
            </div>
            <span className="admin-brand-copyright">
              © 2026 Maharashtra Police • All Rights Reserved
            </span>
          </div>
        </div>

        {/* RIGHT FORM PANEL (DESKTOP & MOBILE FORM) */}
        <div className="admin-login-card-panel">
          <div className="admin-card-header-bar">
            <div className="admin-card-titles">
              <h2>मालेगाव पोलीस ॲडमिन</h2>
              <p>Sign in to the Super Admin Console</p>
            </div>

            {/* LIGHT / DARK MODE TOGGLE */}
            <button
              type="button"
              className="admin-theme-toggle-btn"
              onClick={toggleTheme}
              title={theme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode"}
              aria-label={theme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode"}
            >
              {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
            </button>
          </div>

          <form onSubmit={handleSubmit} className="admin-login-form" autoComplete="off">
            <div className="admin-login-field-group">
              <label htmlFor="admin-username">Username</label>
              <div className="admin-input-icon-wrapper">
                <User size={18} className="field-icon" />
                <input
                  id="admin-username"
                  className="admin-login-input"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter admin username"
                  autoComplete="username"
                  required
                />
              </div>
            </div>

            <div className="admin-login-field-group">
              <label htmlFor="admin-password">Password</label>
              <div className="admin-input-icon-wrapper">
                <Lock size={18} className="field-icon" />
                <input
                  id="admin-password"
                  className="admin-login-input"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password"
                  autoComplete="current-password"
                  required
                />
                <button
                  type="button"
                  className="admin-password-toggle-btn"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="admin-login-submit-btn"
              disabled={loading}
            >
              {loading ? (
                "Signing in..."
              ) : (
                <>
                  <ShieldCheck size={18} />
                  <span>Sign In to Admin Console</span>
                  <ArrowRight size={16} />
                </>
              )}
            </button>

            {!isInstalled && (
              <button
                type="button"
                className="admin-login-pwa-btn"
                onClick={handleInstallApp}
              >
                <Download size={15} />
                <span>Install Admin App (ॲप इन्स्टॉल करा)</span>
              </button>
            )}
          </form>

          <div className="admin-card-footer">
            <p>मालेगाव पोलीस मुख्यालय • Authority Portal</p>
          </div>
        </div>
      </div>

      {/* IPHONE SAFARI INSTALL INSTRUCTION MODAL */}
      {showIosModal && (
        <div className="modal-overlay">
          <div className="admin-modal-card p-6" style={{ maxWidth: "420px" }}>
            <div className="modal-header">
              <h3 className="flex items-center gap-2">
                <Smartphone size={18} className="text-teal" />
                iPhone / Safari वर इन्स्टॉल करा
              </h3>
              <button
                type="button"
                className="close-btn"
                onClick={() => setShowIosModal(false)}
              >
                <X size={18} />
              </button>
            </div>

            <div className="py-3 text-left">
              <p className="text-sm text-slate-300 mb-3">
                iPhone वर <b>मालेगाव शहर पोलीस Admin App</b> इन्स्टॉल करण्यासाठी खालील सोप्या पायऱ्या वापरा:
              </p>

              <div className="ios-instructions-box">
                <div className="ios-step">
                  <span className="step-num">1</span>
                  <span>Safari ब्राऊझर मध्ये खालील <b>Share (शेअर) <Share size={14} className="inline text-teal" /></b> बटणावर क्लिक करा.</span>
                </div>

                <div className="ios-step">
                  <span className="step-num">2</span>
                  <span>खाली स्क्रोल करून <b>'Add to Home Screen' (होम स्क्रीनवर जोडा)</b> पर्याय निवडा.</span>
                </div>

                <div className="ios-step">
                  <span className="step-num">3</span>
                  <span>उजव्या कोपऱ्यात <b>'Add' (जोडा)</b> वर क्लिक करा.</span>
                </div>
              </div>
            </div>

            <button
              type="button"
              className="primary-btn w-full justify-center mt-2"
              onClick={() => setShowIosModal(false)}
            >
              समजले (Got it)
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminLogin;
