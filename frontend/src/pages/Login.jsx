import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Eye,
  EyeOff,
  Lock,
  User,
  Languages,
  ShieldCheck,
  Download,
  Share,
  PlusSquare,
  X,
  Radio,
  LockKeyhole,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import toast from "react-hot-toast";

import { loginOfficerApi } from "../api/authApi";
import useAuth from "../hooks/useAuth";
import { useAdminAuth } from "../context/AdminAuthContext";
import policeLogo from "../assets/police-logo.png";

function Login() {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const { login } = useAuth();
  const { adminLogin } = useAdminAuth();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const [installPrompt, setInstallPrompt] = useState(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [showIosModal, setShowIosModal] = useState(false);

  const isIOS =
    typeof navigator !== "undefined" &&
    (/iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream);

  useEffect(() => {
    // Dynamic route-aware PWA manifest & iOS Safari title for Normal Officer App
    let link = document.getElementById("app-manifest");
    if (!link) {
      link = document.createElement("link");
      link.id = "app-manifest";
      link.rel = "manifest";
      document.head.appendChild(link);
    }
    link.setAttribute("href", "/manifest.webmanifest");

    document.title = "Malegaon Police | छावणी पोलिस स्टेशन";

    let appleTitleMeta = document.querySelector('meta[name="apple-mobile-web-app-title"]');
    if (!appleTitleMeta) {
      appleTitleMeta = document.createElement("meta");
      appleTitleMeta.setAttribute("name", "apple-mobile-web-app-title");
      document.head.appendChild(appleTitleMeta);
    }
    appleTitleMeta.setAttribute("content", "Malegaon Police");

    localStorage.removeItem("username");
    localStorage.removeItem("password");
    localStorage.removeItem("loginUsername");
    localStorage.removeItem("loginPassword");
    sessionStorage.removeItem("username");
    sessionStorage.removeItem("password");

    const installed =
      window.matchMedia("(display-mode: standalone)").matches ||
      window.navigator.standalone === true;

    setIsInstalled(installed);

    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setInstallPrompt(e);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener(
        "beforeinstallprompt",
        handleBeforeInstallPrompt
      );
    };
  }, [navigate]);

  const handleInstallApp = async () => {
    if (isInstalled) {
      toast.success("Application is already installed on your device");
      return;
    }

    if (isIOS) {
      setShowIosModal(true);
      return;
    }

    if (installPrompt) {
      installPrompt.prompt();
      const choice = await installPrompt.userChoice;
      if (choice.outcome === "accepted") {
        toast.success("Application installed successfully!");
        setInstallPrompt(null);
        setIsInstalled(true);
      }
      return;
    }

    toast("To install app, open browser menu and select 'Add to Home screen'", {
      icon: "ℹ️",
    });
  };

  const handleLanguageChange = (lang) => {
    i18n.changeLanguage(lang);
    toast.success(
      lang === "mr" ? "भाषा मराठी निवडली" : "Language set to English"
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const cleanUsername = username.trim();
    const cleanPassword = password.trim();

    if (!cleanUsername || !cleanPassword) {
      toast.error("Please enter username and password");
      return;
    }

    try {
      setLoading(true);

      const res = await loginOfficerApi({
        username: cleanUsername,
        password: cleanPassword,
      });

      const responsePayload = res.data?.data || res.data;
      const officerData = responsePayload?.officer || responsePayload;
      const token = responsePayload?.token || res.data?.token;

      if (token && officerData) {
        login(token, officerData);
        toast.success("Login successful");
        navigate("/dashboard", { replace: true });
      } else {
        toast.error("Invalid login response from server");
      }
    } catch (error) {
      console.error("Login Error:", error);
      if (error.response?.data?.message) {
        toast.error(error.response.data.message);
      } else if (error.code === "ERR_NETWORK" || !error.response) {
        toast.error("Unable to connect to the server. Please try again.");
      } else {
        toast.error("Invalid username or password.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page-v2">
      <div className="login-v2-container">
        {/* LEFT COLUMN: BRANDING & POLICE IDENTITY */}
        <div className="login-hero-panel">
          <div className="hero-kicker-pill">
            <Radio size={12} className="pulse-dot" />
            <span>MAHARASHTRA POLICE • MALEGAON DIVISION</span>
          </div>

          <div className="hero-logo-box">
            <img src={policeLogo} alt="Maharashtra Police" />
          </div>

          <h1 className="hero-heading">Police City Management System</h1>
          <h2 className="hero-subheading">छावणी पोलिस स्टेशन, मालेगाव</h2>

          <p className="hero-description">
            Official command & intelligence system for live monitoring of religious places, festival permissions, and city security infrastructure.
          </p>

          <div className="hero-security-chips">
            <div className="security-chip">
              <ShieldCheck size={14} />
              <span>Encrypted Session</span>
            </div>
            <div className="security-chip">
              <LockKeyhole size={14} />
              <span>Restricted Access</span>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: LOGIN CARD */}
        <div className="login-card-panel">
          <div className="login-card-box">
            <div className="card-top-header">
              <div className="secure-portal-badge">
                <ShieldCheck size={14} />
                <span>SECURE OFFICER PORTAL</span>
              </div>

              {/* Language Switcher */}
              <div className="lang-toggle-group">
                <Languages size={14} className="lang-icon" />
                <button
                  type="button"
                  className={`lang-btn ${i18n.language === "mr" ? "active" : ""}`}
                  onClick={() => handleLanguageChange("mr")}
                >
                  मराठी
                </button>
                <span className="lang-divider">|</span>
                <button
                  type="button"
                  className={`lang-btn ${i18n.language === "en" ? "active" : ""}`}
                  onClick={() => handleLanguageChange("en")}
                >
                  ENG
                </button>
              </div>
            </div>

            <div className="card-header-block">
              <div className="card-logo-container">
                <img src={policeLogo} alt="Logo" />
              </div>
              <div className="card-title-block">
                <h3>छावणी पोलिस स्टेशन</h3>
                <p>पोलीस अधिकारी लॉगिन सिस्टीम</p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="login-form-v2" autoComplete="off">
              <div className="form-group-v2">
                <label htmlFor="username">
                  {i18n.language === "mr" ? "युझरनेम (Username)" : "Username"} *
                </label>
                <div className="input-with-icon-v2">
                  <User size={18} className="field-icon-v2" />
                  <input
                    id="username"
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Enter mobile or username..."
                    autoComplete="off"
                    required
                  />
                </div>
              </div>

              <div className="form-group-v2">
                <label htmlFor="password">
                  {i18n.language === "mr" ? "पासवर्ड (Password)" : "Password"} *
                </label>
                <div className="input-with-icon-v2">
                  <Lock size={18} className="field-icon-v2" />
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter password..."
                    autoComplete="off"
                    required
                  />
                  <button
                    type="button"
                    className="password-toggle-v2"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                className="login-submit-btn-v2"
                disabled={loading}
              >
                {loading ? (
                  t("login.logging_in", "Logging in...")
                ) : (
                  <>
                    <ShieldCheck size={18} />
                    {t("login.sign_in", "Sign In")}
                  </>
                )}
              </button>
            </form>

            {/* INSTALL PWA BUTTON */}
            {!isInstalled && (
              <div className="install-banner-v2">
                <button
                  type="button"
                  className="install-pwa-btn-v2"
                  onClick={handleInstallApp}
                >
                  <Download size={16} />
                  <span>
                    {i18n.language === "mr"
                      ? "ॲप मोबाईलमध्ये इन्स्टॉल करा (PWA)"
                      : "Install Officer App (PWA)"}
                  </span>
                </button>
              </div>
            )}

            <div className="login-card-footer">
              <p>© 2026 Maharashtra Police • All Rights Reserved</p>
            </div>
          </div>
        </div>
      </div>

      {/* iOS INSTALL INSTRUCTIONS MODAL */}
      {showIosModal && (
        <div className="modal-overlay">
          <div className="ios-install-modal">
            <div className="ios-modal-header">
              <h3>
                {i18n.language === "mr"
                  ? "iPhone वर इन्स्टॉल करा"
                  : "Install on iPhone"}
              </h3>
              <button
                type="button"
                className="close-btn"
                onClick={() => setShowIosModal(false)}
              >
                <X size={18} />
              </button>
            </div>

            <div className="ios-modal-body">
              <p className="ios-intro">
                {i18n.language === "mr"
                  ? "ॲप इन्स्टॉल करण्यासाठी खालील पायऱ्या वापरा:"
                  : "Follow these steps to install the app:"}
              </p>

              <div className="ios-step-item">
                <div className="step-badge">1</div>
                <div className="step-text">
                  <span>
                    {i18n.language === "mr"
                      ? "खालील Safari मेनूमध्ये "
                      : "Tap the "}
                  </span>
                  <strong>
                    {i18n.language === "mr" ? "शेअर (Share)" : "Share"}
                  </strong>
                  <Share size={16} className="inline-icon" />
                  <span>
                    {i18n.language === "mr"
                      ? " बटणावर क्लिक करा."
                      : " button in Safari."}
                  </span>
                </div>
              </div>

              <div className="ios-step-item">
                <div className="step-badge">2</div>
                <div className="step-text">
                  <span>
                    {i18n.language === "mr" ? "मेनूमध्ये " : "Select "}
                  </span>
                  <strong>
                    {i18n.language === "mr"
                      ? "'Add to Home Screen' (होम स्क्रीनवर जोडा)"
                      : "'Add to Home Screen'"}
                  </strong>
                  <PlusSquare size={16} className="inline-icon" />
                  <span>
                    {i18n.language === "mr"
                      ? " पर्याय निवडा."
                      : " option."}
                  </span>
                </div>
              </div>

              <div className="ios-step-item">
                <div className="step-badge">3</div>
                <div className="step-text">
                  <span>
                    {i18n.language === "mr"
                      ? "उजव्या कोपऱ्यातील "
                      : "Tap "}
                  </span>
                  <strong>{i18n.language === "mr" ? "'Add' (जोडा)" : "'Add'"}</strong>
                  <span>
                    {i18n.language === "mr"
                      ? " बटणावर क्लिक करा."
                      : " in the top right."}
                  </span>
                </div>
              </div>
            </div>

            <button
              type="button"
              className="ios-modal-confirm-btn"
              onClick={() => setShowIosModal(false)}
            >
              {i18n.language === "mr" ? "समजले (Got it)" : "Got it"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default Login;