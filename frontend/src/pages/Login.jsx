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
import policeLogo from "../assets/police-logo.png";

function Login() {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const { login } = useAuth();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const [installPrompt, setInstallPrompt] = useState(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [showIosModal, setShowIosModal] = useState(false);

  const isIOS =
    /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;

  useEffect(() => {
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
  }, []);

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

    toast.error(
      "Tap browser menu (⋮) and select 'Install App' or 'Add to Home Screen'."
    );
  };

  const handleLogin = async (e) => {
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

      const officerData = res.data?.officer || res.data?.data;
      const token = res.data?.token;

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
              <div className="card-logo-container">
                <img src={policeLogo} alt="Police Crest" />
              </div>
            </div>

            <div className="card-title-block">
              <h3>{t("officerLogin") || "Officer Sign In"}</h3>
              <p>Chhavani Police Station, Malegaon</p>
            </div>

            <div className="login-language-bar">
              <Languages size={15} className="lang-icon" />
              <select
                value={i18n.language}
                onChange={(e) => i18n.changeLanguage(e.target.value)}
                aria-label="Select Language"
              >
                <option value="mr">मराठी</option>
                <option value="hi">हिंदी</option>
                <option value="en">English</option>
              </select>
            </div>

            <form onSubmit={handleLogin} className="login-form-v2">
              <div className="input-field-wrapper">
                <label htmlFor="login-username">{t("username") || "Username"}</label>
                <div className="input-inner">
                  <User size={18} className="field-icon" />
                  <input
                    id="login-username"
                    type="text"
                    placeholder="Enter officer username..."
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                    autoComplete="username"
                  />
                </div>
              </div>

              <div className="input-field-wrapper">
                <label htmlFor="login-password">{t("password") || "Password"}</label>
                <div className="input-inner">
                  <Lock size={18} className="field-icon" />
                  <input
                    id="login-password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter password..."
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    className="eye-toggle-btn"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <button
                className="submit-login-btn"
                type="submit"
                disabled={loading}
              >
                {loading ? "Verifying Credentials..." : t("signIn") || "Sign In to Command Center"}
              </button>

              {!isInstalled && (
                <button
                  type="button"
                  className="pwa-install-btn"
                  onClick={handleInstallApp}
                >
                  <Download size={17} />
                  Install PWA Application
                </button>
              )}
            </form>

            <div className="card-footer-notice">
              Authorized Police Personnel Only • Session Monitored
            </div>
          </div>
        </div>
      </div>

      {/* iOS SAFARI INSTALL INSTRUCTION MODAL */}
      {showIosModal && (
        <div
          className="ios-modal-overlay"
          onClick={() => setShowIosModal(false)}
        >
          <div
            className="ios-modal-card"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="ios-modal-header">
              <h3>Install on iPhone / iPad</h3>
              <button
                type="button"
                className="close-modal-btn"
                onClick={() => setShowIosModal(false)}
              >
                <X size={18} />
              </button>
            </div>

            <div className="ios-modal-body">
              <p className="ios-intro-text">
                iOS Safari requires a quick manual step to add the Police App to your Home Screen:
              </p>

              <div className="ios-step-row">
                <span className="step-number">1</span>
                <p>Ensure you are viewing this page in <b>Safari</b> browser.</p>
              </div>

              <div className="ios-step-row">
                <span className="step-number">2</span>
                <p>
                  Tap the <b>Share</b> button <Share size={15} className="inline-icon" /> at the bottom of Safari.
                </p>
              </div>

              <div className="ios-step-row">
                <span className="step-number">3</span>
                <p>
                  Scroll down and select <b>"Add to Home Screen"</b> <PlusSquare size={15} className="inline-icon" />.
                </p>
              </div>
            </div>

            <button
              type="button"
              className="primary-btn btn-full mt-4"
              onClick={() => setShowIosModal(false)}
            >
              Got It
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default Login;