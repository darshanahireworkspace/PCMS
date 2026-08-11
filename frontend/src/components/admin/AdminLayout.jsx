import { useState, useEffect } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import {
  Shield,
  Users,
  UserCheck,
  FileText,
  CopyCheck,
  LogOut,
  Menu,
  X,
  Building,
  Home,
  Sliders,
  Download,
  Smartphone,
  Share,
} from "lucide-react";
import toast from "react-hot-toast";
import { useAdminAuth } from "../../context/AdminAuthContext";
import policeLogo from "../../assets/police-logo.png";
import "../../pages/admin/AdminPortal.css";

function AdminLayout() {
  const { adminUser, adminLogout } = useAdminAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showIosModal, setShowIosModal] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  const isIOS =
    typeof navigator !== "undefined" &&
    (/iphone|ipad|ipod/i.test(navigator.userAgent) ||
      (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1));

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

  // Dynamic route-aware PWA manifest switcher for Admin console
  useEffect(() => {
    let link = document.getElementById("app-manifest");
    if (!link) {
      link = document.createElement("link");
      link.id = "app-manifest";
      link.rel = "manifest";
      document.head.appendChild(link);
    }
    link.setAttribute("href", "/admin-manifest.webmanifest");

    return () => {
      link.setAttribute("href", "/manifest.webmanifest");
    };
  }, []);

  const handleInstallApp = async () => {
    if (isInstalled) {
      toast.success("Chhavani Police Admin App आधीच इन्स्टॉल आहे.");
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
        toast.success("Chhavani Police Admin App यशस्वीरित्या इन्स्टॉल झाले!");
        setDeferredPrompt(null);
        setIsInstalled(true);
      }
    } else {
      toast("ब्राऊझर मेनू (⋮) वर जा आणि 'Install App' किंवा 'Add to Home screen' निवडा.", {
        icon: "📲",
      });
    }
  };

  const handleLogout = () => {
    adminLogout();
    navigate("/admin/login", { replace: true });
  };

  const navItems = [
    { to: "/admin/dashboard", label: "Admin Overview", icon: Home },
    { to: "/admin/officers", label: "Officers Directory", icon: Users },
    { to: "/admin/teams", label: "Teams & Sharing", icon: UserCheck },
    { to: "/admin/access-control", label: "Access Control", icon: Sliders },
    { to: "/admin/duplicate-review", label: "Duplicate Review", icon: CopyCheck },
    { to: "/admin/audit-logs", label: "System Audit Logs", icon: FileText },
  ];

  return (
    <div className="admin-app-layout">
      {/* MOBILE BACKDROP OVERLAY */}
      {sidebarOpen && (
        <div
          className="admin-sidebar-backdrop show"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* SIDEBAR NAVIGATION */}
      <aside className={`admin-sidebar ${sidebarOpen ? "open" : ""}`}>
        <div className="admin-sidebar-header">
          <img src={policeLogo} alt="Maharashtra Police Logo" className="admin-sidebar-logo" />
          <div>
            <h3>मालेगाव पोलीस</h3>
            <p>सुपर ॲडमिन पोर्टल</p>
          </div>
        </div>

        <nav className="admin-sidebar-nav">
          {navItems.map((item) => {
            const IconComp = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `admin-nav-item ${isActive ? "active" : ""}`
                }
                onClick={() => setSidebarOpen(false)}
              >
                <IconComp size={18} />
                <span>{item.label}</span>
              </NavLink>
            );
          })}

          {!isInstalled && (
            <button
              type="button"
              className="admin-nav-item install-link"
              onClick={handleInstallApp}
            >
              <Download size={18} />
              <span>Install Admin App</span>
            </button>
          )}

          <NavLink
            to="/dashboard"
            className="admin-nav-item command-link"
            onClick={() => setSidebarOpen(false)}
          >
            <Building size={18} />
            <span>Back to Command App</span>
          </NavLink>

          <button
            type="button"
            className="admin-nav-item logout-btn"
            onClick={handleLogout}
            style={{ marginTop: "auto" }}
          >
            <LogOut size={18} />
            <span>Sign Out</span>
          </button>
        </nav>
      </aside>

      {/* MAIN CONTENT WRAPPER */}
      <div className="admin-main-container">
        {/* TOPBAR */}
        <header className="admin-topbar">
          <div className="admin-topbar-left">
            <button
              type="button"
              className="admin-menu-toggle"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              aria-label="Toggle navigation menu"
            >
              {sidebarOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
            <div className="admin-brand-topbar">
              <img src={policeLogo} alt="Police Emblem" className="topbar-police-logo" />
              <span className="admin-brand-title-marathi">
                मालेगाव शहर पोलीस व्यवस्थापन प्रणाली
              </span>
            </div>
          </div>

          <div className="admin-user-profile">
            {!isInstalled && (
              <button
                type="button"
                className="admin-topbar-install-btn hidden-xs"
                onClick={handleInstallApp}
                title="Install Admin PWA App"
              >
                <Download size={14} />
                <span>Install App</span>
              </button>
            )}

            <div className="admin-user-avatar">
              {(adminUser?.full_name || "S").charAt(0)}
            </div>
            <div className="admin-user-info hidden-xs">
              <b>{adminUser?.full_name || "Superintendent of Police"}</b>
              <span>Role: {adminUser?.role || "SuperAdmin"}</span>
            </div>
          </div>
        </header>

        {/* MAIN PAGE OUTLET */}
        <main className="admin-main-content">
          <Outlet />
        </main>
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
                iPhone वर <b>Chhavani Police Admin App</b> इन्स्टॉल करण्यासाठी खालील सोप्या पायऱ्या वापरा:
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

export default AdminLayout;
