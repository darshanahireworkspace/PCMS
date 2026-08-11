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
} from "lucide-react";
import { useAdminAuth } from "../../context/AdminAuthContext";
import policeLogo from "../../assets/police-logo.png";
import "../../pages/admin/AdminPortal.css";

function AdminLayout() {
  const { adminUser, adminLogout } = useAdminAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

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
    </div>
  );
}

export default AdminLayout;
