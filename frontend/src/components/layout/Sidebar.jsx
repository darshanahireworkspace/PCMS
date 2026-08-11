import { NavLink, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Landmark,
  CalendarCheck,
  Map,
  BarChart3,
  FileText,
  Users,
  Settings,
  LogOut,
  Building2,
  Store,
  Shield,
  Activity,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import useAuth from "../../hooks/useAuth";
import policeLogo from "../../assets/police-logo.png";

import { isSuperAdminUser } from "../../utils/authUtils";

function Sidebar({ sidebarOpen, setSidebarOpen }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { officer, logout } = useAuth();
  const isSuperAdmin = isSuperAdminUser(officer);

  return (
    <aside className={`sidebar ${sidebarOpen ? "show-sidebar" : ""}`}>
      <div className="sidebar-header">
        <div className="sidebar-brand">
          <img
            src={policeLogo}
            alt="Maharashtra Police"
            className="sidebar-logo"
          />
          <div className="sidebar-brand-text">
            <h2>Chhavani Police</h2>
            <span>Malegaon City System</span>
          </div>
        </div>

        <div className="system-online-badge">
          <Activity size={12} className="pulse-dot" />
          <span>System Online</span>
        </div>
      </div>

      <nav className="nav-menu">
        <div className="nav-section-label">OVERVIEW</div>

        <NavLink to="/dashboard" onClick={() => setSidebarOpen(false)}>
          <div className="nav-icon-box">
            <LayoutDashboard size={18} />
          </div>
          <span>{t("dashboard")}</span>
        </NavLink>

        <div className="nav-section-label">CITY DATABASE</div>

        <NavLink to="/religious-places" onClick={() => setSidebarOpen(false)}>
          <div className="nav-icon-box">
            <Landmark size={18} />
          </div>
          <span>Religious Places</span>
        </NavLink>

        <NavLink to="/festival-permissions" onClick={() => setSidebarOpen(false)}>
          <div className="nav-icon-box">
            <CalendarCheck size={18} />
          </div>
          <span>Festival Permissions</span>
        </NavLink>

        <NavLink to="/other-places" onClick={() => setSidebarOpen(false)}>
          <div className="nav-icon-box">
            <Store size={18} />
          </div>
          <span>Other City Data</span>
        </NavLink>

        <div className="nav-section-label">MONITORING & GIS</div>

        <NavLink to="/map-view" onClick={() => setSidebarOpen(false)}>
          <div className="nav-icon-box">
            <Map size={18} />
          </div>
          <span>Live GIS Map</span>
        </NavLink>

        <NavLink to="/reports" onClick={() => setSidebarOpen(false)}>
          <div className="nav-icon-box">
            <FileText size={18} />
          </div>
          <span>Reports & Export</span>
        </NavLink>

        <NavLink to="/analytics" onClick={() => setSidebarOpen(false)}>
          <div className="nav-icon-box">
            <BarChart3 size={18} />
          </div>
          <span>Analytics</span>
        </NavLink>

        <div className="nav-section-label">ADMINISTRATION</div>

        <NavLink to="/officers" onClick={() => setSidebarOpen(false)}>
          <div className="nav-icon-box">
            <Users size={18} />
          </div>
          <span>Officers Directory</span>
        </NavLink>

        <NavLink to="/police-stations" onClick={() => setSidebarOpen(false)}>
          <div className="nav-icon-box">
            <Building2 size={18} />
          </div>
          <span>Police Stations</span>
        </NavLink>

        <NavLink to="/settings" onClick={() => setSidebarOpen(false)}>
          <div className="nav-icon-box">
            <Settings size={18} />
          </div>
          <span>System Settings</span>
        </NavLink>
      </nav>

      <div className="sidebar-footer">
        <div className="officer-profile-card">
          <div className="officer-avatar">
            <Shield size={18} />
          </div>
          <div className="officer-info">
            <b className="officer-name">{officer?.full_name || "Police Officer"}</b>
            <span className="officer-role">
              {isSuperAdmin ? "Super Admin • Global View" : (officer?.role || "Duty Officer")}
            </span>
          </div>
        </div>

        <button
          type="button"
          className="logout-btn"
          onClick={() => {
            logout();
            setSidebarOpen(false);
            navigate("/");
          }}
          title="Logout"
        >
          <LogOut size={18} />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
}

export default Sidebar;