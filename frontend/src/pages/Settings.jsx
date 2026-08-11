import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Settings as SettingsIcon,
  User,
  Bell,
  Languages,
  Moon,
  Database,
  Lock,
  MapPin,
  Save,
  Camera,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
  Smartphone,
  Info,
  ExternalLink,
  ShieldCheck,
  Zap,
  LogOut,
} from "lucide-react";
import toast from "react-hot-toast";
import { useTranslation } from "react-i18next";
import useAuth from "../hooks/useAuth";
import { useAdminAuth } from "../context/AdminAuthContext";
import usePermissions from "../hooks/usePermissions";
import policeLogo from "../assets/police-logo.png";

const DEFAULT_SETTINGS = {
  systemName: "Police City Religious & Festival Intelligence Management System",
  cityName: "Malegaon",
  district: "Nashik",
  state: "Maharashtra",
  defaultLanguage: "mr",
  themeMode: "light",
  enableNotifications: "Yes",
  enableGpsTracking: "Yes",
  enableDuplicateCheck: "Yes",
  enableAuditLogs: "Yes",
  autoLogout: "30",
};

function Settings() {
  const { officer, logout } = useAuth();
  const { adminLogout } = useAdminAuth();
  const navigate = useNavigate();
  const { i18n } = useTranslation();
  const {
    locationStatus,
    cameraStatus,
    loading: permLoading,
    checkPermissions,
    requestLocationAccess,
    requestCameraAccess,
    requestAllPermissions,
  } = usePermissions();

  const [settings, setSettings] = useState(() => {
    const saved = localStorage.getItem("policeAppSettings");
    return saved ? JSON.parse(saved) : DEFAULT_SETTINGS;
  });

  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showIosGuide, setShowIosGuide] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  useEffect(() => {
    applyTheme(settings.themeMode);
    i18n.changeLanguage(settings.defaultLanguage);

    const handleBeforeInstall = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstall);
    return () => window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
  }, []);

  const applyTheme = (mode) => {
    const root = document.documentElement;
    if (mode === "dark") {
      root.setAttribute("data-theme", "dark");
    } else if (mode === "light") {
      root.setAttribute("data-theme", "light");
    } else {
      const dark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      root.setAttribute("data-theme", dark ? "dark" : "light");
    }
    localStorage.setItem("theme", mode);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    const updated = { ...settings, [name]: value };
    setSettings(updated);

    if (name === "themeMode") {
      applyTheme(value);
      toast.success("Theme updated");
    }
    if (name === "defaultLanguage") {
      i18n.changeLanguage(value);
      toast.success("Language updated");
    }
    localStorage.setItem("policeAppSettings", JSON.stringify(updated));
  };

  const handleSave = (e) => {
    e.preventDefault();
    localStorage.setItem("policeAppSettings", JSON.stringify(settings));
    toast.success("Settings saved successfully");
  };

  const handleConfirmLogout = () => {
    logout();
    if (adminLogout) adminLogout();
    toast.success("Logged out successfully");
    setShowLogoutModal(false);
    navigate("/", { replace: true });
  };

  const handleInstallApp = async () => {
    const isIos = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;

    if (deferredPrompt && typeof deferredPrompt.prompt === "function") {
      try {
        await deferredPrompt.prompt();
        const choice = await deferredPrompt.userChoice;
        if (choice?.outcome === "accepted") {
          toast.success("PWA App installed successfully");
        }
      } catch (err) {
        console.warn("PWA install prompt skipped:", err);
      } finally {
        setDeferredPrompt(null);
      }
    } else if (isIos) {
      setShowIosGuide(true);
    } else {
      toast("Add to Home Screen from your browser menu to install.", { icon: "📱" });
    }
  };

  const renderStatusBadge = (status) => {
    if (status === "granted") {
      return (
        <span className="permission-badge granted">
          <CheckCircle2 size={14} />
          <span>✓ Access Granted</span>
        </span>
      );
    }
    if (status === "denied") {
      return (
        <span className="permission-badge denied">
          <AlertTriangle size={14} />
          <span>⚠ Access Denied</span>
        </span>
      );
    }
    if (status === "prompt") {
      return (
        <span className="permission-badge prompt">
          <Info size={14} />
          <span>○ Permission Required</span>
        </span>
      );
    }
    return (
      <span className="permission-badge unsupported">
        <HelpCircle size={14} />
        <span>— Not Supported</span>
      </span>
    );
  };

  return (
    <div className="settings-v2-container mb-12">
      <div className="page-header">
        <div>
          <h2 className="page-title">System Settings & Device Permissions</h2>
          <p className="page-subtitle">
            Configure application preferences, security, location & camera permissions for PWA.
          </p>
        </div>

        <button
          type="button"
          className="secondary-btn"
          onClick={handleInstallApp}
        >
          <Smartphone size={18} />
          Install App / PWA
        </button>
      </div>

      <form className="settings-layout" onSubmit={handleSave}>
        {/* OFFICER PROFILE CARD */}
        <section className="settings-profile-card">
          <div className="settings-avatar">
            <img src={policeLogo} alt="Maharashtra Police" style={{ width: "42px", height: "42px", objectFit: "contain" }} />
          </div>

          <h3>{officer?.full_name || "Police Officer"}</h3>
          <p className="officer-role-badge">{officer?.role || "Officer"}</p>

          <div className="settings-profile-info">
            <span>Username</span>
            <b>{officer?.username || "-"}</b>
          </div>

          <div className="settings-profile-info">
            <span>Police Station</span>
            <b>{officer?.police_station || "-"}</b>
          </div>

          <div className="settings-profile-info">
            <span>Environment</span>
            <b>Production (V2)</b>
          </div>
        </section>

        <div className="settings-main">
          {/* PERMISSIONS & DEVICE ACCESS SECTION */}
          <section className="form-section permissions-section-card">
            <div className="section-title-wrap">
              <div className="section-title">
                <ShieldCheck size={22} className="teal-icon" />
                <div>
                  <h3>PERMISSIONS & DEVICE ACCESS</h3>
                  <p>Manage hardware access for GPS tracking and direct photo captures</p>
                </div>
              </div>

              <div className="permission-top-actions">
                <button
                  type="button"
                  className="primary-btn btn-sm"
                  onClick={requestAllPermissions}
                  disabled={permLoading}
                >
                  <Zap size={15} />
                  Check & Request All Permissions
                </button>

                <button
                  type="button"
                  className="secondary-btn btn-sm"
                  onClick={checkPermissions}
                  disabled={permLoading}
                >
                  <RefreshCw size={15} className={permLoading ? "spin-icon" : ""} />
                  Refresh Status
                </button>
              </div>
            </div>

            <div className="permission-cards-grid">
              {/* LOCATION PERMISSION CARD */}
              <div className="perm-card">
                <div className="perm-card-header">
                  <div className="perm-card-icon location-icon">
                    <MapPin size={22} />
                  </div>
                  <div>
                    <h4>Location Access (GPS)</h4>
                    <p>Real-time location detection, GIS positioning & reverse geocoding</p>
                  </div>
                </div>

                <div className="perm-card-body">
                  <div className="perm-status-row">
                    <label>Status</label>
                    {renderStatusBadge(locationStatus)}
                  </div>

                  <ul className="perm-uses-list">
                    <li>• Auto-detect GPS coordinates for religious places</li>
                    <li>• Position festival mandal locations on Live GIS Map</li>
                    <li>• Reverse-geocode street address and area details</li>
                  </ul>

                  {locationStatus === "denied" && (
                    <div className="perm-denied-guide">
                      <AlertTriangle size={15} />
                      <span>
                        Location permission is blocked in browser settings. Enable location permissions for Chrome/Safari to use GPS auto-detect.
                      </span>
                    </div>
                  )}

                  <button
                    type="button"
                    className={`perm-action-btn ${locationStatus === "granted" ? "btn-outline" : "btn-primary"}`}
                    onClick={() => requestLocationAccess(false)}
                    disabled={permLoading}
                  >
                    <MapPin size={16} />
                    {locationStatus === "granted"
                      ? "Re-verify Location Access"
                      : locationStatus === "denied"
                      ? "Try Requesting Location Again"
                      : "Request Location Access"}
                  </button>
                </div>
              </div>

              {/* CAMERA PERMISSION CARD */}
              <div className="perm-card">
                <div className="perm-card-header">
                  <div className="perm-card-icon camera-icon">
                    <Camera size={22} />
                  </div>
                  <div>
                    <h4>Camera Access</h4>
                    <p>Direct device camera capture for building & festival photos</p>
                  </div>
                </div>

                <div className="perm-card-body">
                  <div className="perm-status-row">
                    <label>Status</label>
                    {renderStatusBadge(cameraStatus)}
                  </div>

                  <ul className="perm-uses-list">
                    <li>• Capture live photos when registering religious places</li>
                    <li>• Capture mandal pandal photos for festival permits</li>
                    <li>• Capture storefront images for other city data</li>
                  </ul>

                  {cameraStatus === "denied" && (
                    <div className="perm-denied-guide">
                      <AlertTriangle size={15} />
                      <span>
                        Camera access is blocked. You can still upload photos from gallery, or unblock camera in browser site settings.
                      </span>
                    </div>
                  )}

                  <button
                    type="button"
                    className={`perm-action-btn ${cameraStatus === "granted" ? "btn-outline" : "btn-primary"}`}
                    onClick={() => requestCameraAccess(false)}
                    disabled={permLoading}
                  >
                    <Camera size={16} />
                    {cameraStatus === "granted"
                      ? "Re-verify Camera Access"
                      : cameraStatus === "denied"
                      ? "Try Requesting Camera Again"
                      : "Request Camera Access"}
                  </button>
                </div>
              </div>
            </div>

            {/* PERMISSION HELP CARD */}
            <div className="permission-help-card">
              <div className="help-card-header">
                <HelpCircle size={20} className="help-icon" />
                <h4>How to Enable Blocked Permissions on Your Device</h4>
              </div>

              <div className="help-platforms-grid">
                <div className="help-platform-box">
                  <b>🤖 Android Chrome / PWA</b>
                  <p>1. Tap lock/tune icon next to web address.</p>
                  <p>2. Select <b>Permissions</b> ➔ Enable <b>Location</b> & <b>Camera</b>.</p>
                  <p>3. Refresh the page.</p>
                </div>

                <div className="help-platform-box">
                  <b>🍎 iPhone Safari / PWA</b>
                  <p>1. Open iOS <b>Settings</b> ➔ <b>Safari</b> ➔ <b>Camera / Location</b>.</p>
                  <p>2. Change setting to <b>Allow</b> or <b>Ask</b>.</p>
                  <p>3. Reload app in Safari.</p>
                </div>

                <div className="help-platform-box">
                  <b>💻 Desktop Chrome / Edge</b>
                  <p>1. Click pad lock icon in address bar.</p>
                  <p>2. Toggle <b>Location</b> and <b>Camera</b> to <b>On</b>.</p>
                  <p>3. Refresh browser tab.</p>
                </div>
              </div>
            </div>
          </section>

          {/* APPLICATION SETTINGS SECTION */}
          <section className="form-section">
            <div className="section-title">
              <SettingsIcon size={20} />
              <h3>Application System Settings</h3>
            </div>

            <div className="form-grid">
              <div className="form-group full-width">
                <label>System Name</label>
                <input name="systemName" value={settings.systemName} onChange={handleChange} />
              </div>

              <div className="form-group">
                <label>City</label>
                <input name="cityName" value={settings.cityName} onChange={handleChange} />
              </div>

              <div className="form-group">
                <label>District</label>
                <input name="district" value={settings.district} onChange={handleChange} />
              </div>

              <div className="form-group">
                <label>State</label>
                <input name="state" value={settings.state} onChange={handleChange} />
              </div>

              <div className="form-group">
                <label>Auto Logout Time</label>
                <select name="autoLogout" value={settings.autoLogout} onChange={handleChange}>
                  <option value="15">15 Minutes</option>
                  <option value="30">30 Minutes</option>
                  <option value="60">1 Hour</option>
                  <option value="120">2 Hours</option>
                </select>
              </div>
            </div>
          </section>

          {/* PREFERENCES GRID */}
          <section className="settings-grid">
            <div className="settings-card">
              <Languages size={22} />
              <div>
                <h4>Language</h4>
                <select name="defaultLanguage" value={settings.defaultLanguage} onChange={handleChange}>
                  <option value="mr">मराठी</option>
                  <option value="hi">हिंदी</option>
                  <option value="en">English</option>
                </select>
              </div>
            </div>

            <div className="settings-card">
              <Moon size={22} />
              <div>
                <h4>Theme Mode</h4>
                <select name="themeMode" value={settings.themeMode} onChange={handleChange}>
                  <option value="light">Light</option>
                  <option value="dark">Dark</option>
                  <option value="system">System Default</option>
                </select>
              </div>
            </div>

            <div className="settings-card">
              <Bell size={22} />
              <div>
                <h4>Notifications</h4>
                <select name="enableNotifications" value={settings.enableNotifications} onChange={handleChange}>
                  <option>Yes</option>
                  <option>No</option>
                </select>
              </div>
            </div>

            <div className="settings-card">
              <MapPin size={22} />
              <div>
                <h4>GPS Tracking</h4>
                <select name="enableGpsTracking" value={settings.enableGpsTracking} onChange={handleChange}>
                  <option>Yes</option>
                  <option>No</option>
                </select>
              </div>
            </div>

            <div className="settings-card">
              <Database size={22} />
              <div>
                <h4>Duplicate Check</h4>
                <select name="enableDuplicateCheck" value={settings.enableDuplicateCheck} onChange={handleChange}>
                  <option>Yes</option>
                  <option>No</option>
                </select>
              </div>
            </div>

            <div className="settings-card">
              <Lock size={22} />
              <div>
                <h4>Audit Logs</h4>
                <select name="enableAuditLogs" value={settings.enableAuditLogs} onChange={handleChange}>
                  <option>Yes</option>
                  <option>No</option>
                </select>
              </div>
            </div>
          </section>

          <section className="form-section">
            <div className="section-title">
              <User size={20} />
              <h3>Security Preferences</h3>
            </div>

            <div className="settings-security-list">
              <div><b>JWT Login Security</b><span>Enabled</span></div>
              <div><b>Role Based Access</b><span>Enabled</span></div>
              <div><b>Password Encryption</b><span>Enabled</span></div>
              <div><b>Protected Routes</b><span>Enabled</span></div>
            </div>
          </section>

          {/* OFFICER LOGOUT SECTION */}
          <section className="form-section settings-logout-card">
            <div className="section-title text-rose">
              <LogOut size={20} style={{ color: "#ef4444" }} />
              <div>
                <h3 style={{ color: "#ef4444" }}>ACCOUNT SESSION & LOGOUT</h3>
                <p>Sign out of your Chhavani Police officer session on this device</p>
              </div>
            </div>

            <div className="logout-action-box">
              <div className="logout-info">
                <b>Currently Signed In Officer</b>
                <p>{officer?.full_name || "Police Officer"} ({officer?.username || "-"})</p>
              </div>

              <button
                type="button"
                className="logout-trigger-btn"
                onClick={() => setShowLogoutModal(true)}
              >
                <LogOut size={18} />
                <span>Logout from Device</span>
              </button>
            </div>
          </section>

          <div className="form-actions mb-6">
            <button type="submit" className="primary-btn">
              <Save size={18} />
              Save Settings
            </button>
          </div>
        </div>
      </form>

      {/* LOGOUT CONFIRMATION MODAL */}
      {showLogoutModal && (
        <div className="record-modal-overlay" onClick={() => setShowLogoutModal(false)}>
          <div className="record-modal logout-confirm-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "420px" }}>
            <div className="record-modal-header">
              <div className="record-modal-heading">
                <span style={{ color: "#ef4444" }}>Confirm Officer Logout</span>
                <h2>Logout?</h2>
              </div>
              <button
                type="button"
                className="record-modal-close"
                onClick={() => setShowLogoutModal(false)}
              >
                ✕
              </button>
            </div>

            <div className="p-5 text-left">
              <p className="text-sm text-slate-300">
                Are you sure you want to sign out of your <b>Chhavani Police</b> account?
              </p>
              <p className="text-xs text-slate-400 mt-2">
                Your saved records remain secure in the database. You can log back in anytime using your officer credentials.
              </p>
            </div>

            <div className="modal-buttons p-4" style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
              <button
                type="button"
                className="secondary-btn"
                onClick={() => setShowLogoutModal(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="danger-btn"
                onClick={handleConfirmLogout}
              >
                <LogOut size={16} />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* iOS Safari PWA Install Modal */}
      {showIosGuide && (
        <div className="record-modal-overlay" onClick={() => setShowIosGuide(false)}>
          <div className="record-modal ios-install-modal" onClick={(e) => e.stopPropagation()}>
            <div className="record-modal-header">
              <div className="record-modal-heading">
                <span>iPhone PWA Installation</span>
                <h2>Install on iOS Safari</h2>
              </div>
              <button
                type="button"
                className="record-modal-close"
                onClick={() => setShowIosGuide(false)}
              >
                ✕
              </button>
            </div>

            <div className="ios-guide-steps">
              <p>Follow these steps to add Police City Management System to your Home Screen:</p>
              <div className="ios-step">1. Open this website in <b>Safari</b> browser.</div>
              <div className="ios-step">2. Tap the <b>Share</b> button <ExternalLink size={16} /> at the bottom menu.</div>
              <div className="ios-step">3. Scroll down and select <b>Add to Home Screen</b>.</div>
              <div className="ios-step">4. Tap <b>Add</b> at the top right.</div>
            </div>

            <div className="modal-buttons">
              <button type="button" className="modal-btn btn-close" onClick={() => setShowIosGuide(false)}>
                Got it
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Settings;