import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Eye,
  EyeOff,
  Lock,
  User,
  ShieldCheck,
  Download,
  Share,
  PlusSquare,
  X,
  RefreshCw,
  CheckCircle2,
  LockKeyhole,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import toast from "react-hot-toast";

import { loginOfficerApi } from "../api/authApi";
import useAuth from "../hooks/useAuth";
import policeLogo from "../assets/police-logo.png";
import "./Login.css";

function Login() {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const { login } = useAuth();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // PWA Install / Update state
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [showIosModal, setShowIosModal] = useState(false);
  const [isCheckingUpdate, setIsCheckingUpdate] = useState(false);

  const isIOS =
    typeof navigator !== "undefined" &&
    (/iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream);

  useEffect(() => {
    // Dynamic route-aware PWA manifest for Officer App
    let link = document.getElementById("app-manifest");
    if (!link) {
      link = document.createElement("link");
      link.id = "app-manifest";
      link.rel = "manifest";
      document.head.appendChild(link);
    }
    link.setAttribute("href", "/manifest.webmanifest");

    document.title = "मालेगाव शहर पोलीस व्यवस्थापन प्रणाली | Malegaon Police";

    let appleTitleMeta = document.querySelector('meta[name="apple-mobile-web-app-title"]');
    if (!appleTitleMeta) {
      appleTitleMeta = document.createElement("meta");
      appleTitleMeta.setAttribute("name", "apple-mobile-web-app-title");
      document.head.appendChild(appleTitleMeta);
    }
    appleTitleMeta.setAttribute("content", "Malegaon Police");

    // Clean any old temporary session items
    localStorage.removeItem("username");
    localStorage.removeItem("password");
    localStorage.removeItem("loginUsername");
    localStorage.removeItem("loginPassword");
    sessionStorage.removeItem("username");
    sessionStorage.removeItem("password");

    // Check if running in standalone PWA mode
    const installed =
      window.matchMedia("(display-mode: standalone)").matches ||
      window.navigator.standalone === true;

    setIsInstalled(installed);

    // Capture PWA install prompt event on Android/Chrome
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
      toast.success("पोलीस ॲप यशस्वीरीत्या इन्स्टॉल झाले!");
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  // Handle PWA Install on Android / iOS / Desktop
  const handleInstallApp = async () => {
    if (isInstalled) {
      toast.success("ॲप आधीच आपल्या मोबाईलमध्ये इन्स्टॉल आहे.");
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
        toast.success("ॲप इन्स्टॉल प्रक्रिया सुरू झाली आहे!");
        setDeferredPrompt(null);
        setIsInstalled(true);
      }
      return;
    }

    // Fallback if browser prompt event hasn't fired yet
    toast("ॲप इन्स्टॉल करण्यासाठी ब्राउझर मेनू (⋮) वरून 'Install app' किंवा 'Add to Home screen' निवडा.", {
      icon: "📲",
      duration: 5000,
    });
  };

  // Handle PWA Update Check when installed
  const handleCheckUpdate = async () => {
    if (!("serviceWorker" in navigator)) {
      toast.error("Service Worker या ब्राउझरमध्ये उपलब्ध नाही");
      return;
    }

    setIsCheckingUpdate(true);
    try {
      const reg = await navigator.serviceWorker.getRegistration();
      if (!reg) {
        toast.success("ॲप अद्ययावत आहे (Latest Version)");
        setIsCheckingUpdate(false);
        return;
      }

      await reg.update();

      if (reg.waiting) {
        reg.waiting.postMessage({ type: "SKIP_WAITING" });
        toast.success("नवीन अपडेट इन्स्टॉल होत आहे...");
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      } else {
        toast.success("✓ ॲप पूर्णपणे अद्ययावत आहे!");
      }
    } catch (err) {
      console.warn("Update check notice:", err);
      toast.success("✓ ॲप अद्ययावत आहे!");
    } finally {
      setIsCheckingUpdate(false);
    }
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
      toast.error("कृपया युझरनेम आणि पासवर्ड प्रविष्ट करा");
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
        toast.success("लॉगिन यशस्वी झाले!");
        navigate("/dashboard", { replace: true });
      } else {
        toast.error("सर्व्हरकडून अवैध प्रतिसाद आला");
      }
    } catch (error) {
      console.error("Login Error:", error);
      if (error.response?.data?.message) {
        toast.error(error.response.data.message);
      } else if (error.code === "ERR_NETWORK" || !error.response) {
        toast.error("सर्व्हरशी संपर्क होत नाही. कृपया इंटरनेट तपासा.");
      } else {
        toast.error("चुकीचे युझरनेम किंवा पासवर्ड.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="officer-login-wrapper">
      <div className="officer-login-card">
        {/* TOP BAR: GOV BADGE & LANGUAGE TOGGLE */}
        <div className="officer-login-topbar">
          <div className="official-gov-pill">
            <span className="pulse-indicator"></span>
            <span>महाराष्ट्र शासन</span>
          </div>

          <div className="login-lang-switch">
            <button
              type="button"
              className={`login-lang-btn ${i18n.language === "mr" ? "active" : ""}`}
              onClick={() => handleLanguageChange("mr")}
            >
              मराठी
            </button>
            <button
              type="button"
              className={`login-lang-btn ${i18n.language === "en" ? "active" : ""}`}
              onClick={() => handleLanguageChange("en")}
            >
              ENG
            </button>
          </div>
        </div>

        {/* POLICE LOGO & HEADING */}
        <div className="officer-login-header">
          <div className="officer-logo-badge">
            <img src={policeLogo} alt="Maharashtra Police Logo" />
          </div>
          <span className="officer-subheading-pill">महाराष्ट्र पोलीस • मालेगाव विभाग</span>
          <h1 className="officer-title">पोलीस सिटी मॅनेजमेंट सिस्टीम</h1>
          <p className="officer-tagline">पोलीस अधिकारी लॉगिन पोर्टल (PCMS)</p>
          <div className="officer-header-divider"></div>
        </div>

        {/* LOGIN FORM */}
        <form onSubmit={handleSubmit} className="officer-login-form" autoComplete="off">
          <div className="officer-field-group">
            <label htmlFor="username">
              युझरनेम / मोबाईल नंबर <span className="required-star">*</span>
            </label>
            <div className="officer-input-box">
              <User size={18} className="officer-field-icon" />
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="युझरनेम प्रविष्ट करा..."
                autoComplete="off"
                required
              />
            </div>
          </div>

          <div className="officer-field-group">
            <label htmlFor="password">
              पासवर्ड <span className="required-star">*</span>
            </label>
            <div className="officer-input-box">
              <Lock size={18} className="officer-field-icon" />
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="पासवर्ड प्रविष्ट करा..."
                autoComplete="off"
                required
              />
              <button
                type="button"
                className="officer-eye-btn"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="officer-submit-btn"
            disabled={loading}
          >
            {loading ? (
              <span>लॉगिन होत आहे...</span>
            ) : (
              <>
                <ShieldCheck size={19} />
                <span>लॉगिन करा (Sign In)</span>
              </>
            )}
          </button>
        </form>

        {/* PWA INSTALL / UPDATE SECTION */}
        <div className="officer-pwa-action-box">
          {!isInstalled ? (
            <button
              type="button"
              className="pwa-install-trigger-btn"
              onClick={handleInstallApp}
            >
              <Download size={17} />
              <span>मोबाईल ॲप इन्स्टॉल करा (PWA)</span>
            </button>
          ) : (
            <div>
              <div className="pwa-status-badge">
                <CheckCircle2 size={14} />
                <span>ॲप मोबाईलमध्ये इन्स्टॉल आहे</span>
              </div>
              <button
                type="button"
                className="pwa-update-trigger-btn"
                onClick={handleCheckUpdate}
                disabled={isCheckingUpdate}
              >
                <RefreshCw size={15} className={isCheckingUpdate ? "spin-icon" : ""} />
                <span>{isCheckingUpdate ? "तपासत आहे..." : "ॲप अपडेट तपासा (Check Update)"}</span>
              </button>
            </div>
          )}
        </div>

        {/* FOOTER & SECURITY */}
        <div className="officer-login-footer">
          <div className="security-tag">
            <LockKeyhole size={13} />
            <span>सुरक्षित व अधिकृत शासकीय पोर्टल</span>
          </div>
          <p className="copyright-tag">© २०२६ महाराष्ट्र पोलीस • सर्व हक्क राखीव</p>
        </div>
      </div>

      {/* iOS SAFARI INSTALL INSTRUCTIONS MODAL */}
      {showIosModal && (
        <div className="ios-modal-overlay" onClick={() => setShowIosModal(false)}>
          <div className="ios-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="ios-modal-header">
              <h3>iPhone वर ॲप कसे इन्स्टॉल करावे?</h3>
              <button
                type="button"
                className="ios-modal-close"
                onClick={() => setShowIosModal(false)}
              >
                <X size={18} />
              </button>
            </div>

            <div className="ios-modal-steps">
              <div className="ios-step">
                <div className="ios-step-num">१</div>
                <div className="ios-step-text">
                  खालील Safari मेनूमध्ये <strong>शेअर (Share)</strong> <Share size={15} className="ios-step-icon" /> बटणावर क्लिक करा.
                </div>
              </div>

              <div className="ios-step">
                <div className="ios-step-num">२</div>
                <div className="ios-step-text">
                  खाली स्क्रोल करून <strong>'Add to Home Screen' (होम स्क्रीनवर जोडा)</strong> <PlusSquare size={15} className="ios-step-icon" /> निवडा.
                </div>
              </div>

              <div className="ios-step">
                <div className="ios-step-num">३</div>
                <div className="ios-step-text">
                  उजव्या कोपऱ्यातील <strong>'Add' (जोडा)</strong> वर क्लिक करा. ॲप होम स्क्रीनवर सेव्ह होईल.
                </div>
              </div>
            </div>

            <button
              type="button"
              className="ios-modal-btn"
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

export default Login;