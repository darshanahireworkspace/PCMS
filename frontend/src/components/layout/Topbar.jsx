import { Menu, Languages, Shield, Activity, ShieldCheck } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useLocation } from "react-router-dom";
import useAuth from "../../hooks/useAuth";
import { isSuperAdminUser } from "../../utils/authUtils";
import policeLogo from "../../assets/police-logo.png";

const getPageMeta = (pathname) => {
  if (pathname.includes("/dashboard")) {
    return { title: "City Operations Command", section: "Real-time Monitoring" };
  }
  if (pathname.includes("/religious-places")) {
    return { title: "Religious Places Directory", section: "City Infrastructure" };
  }
  if (pathname.includes("/add-religious-place") || pathname.includes("/edit-religious-place")) {
    return { title: "Manage Religious Place", section: "Database Registry" };
  }
  if (pathname.includes("/festival-permissions")) {
    return { title: "Festival Permissions Master", section: "Permit Control" };
  }
  if (pathname.includes("/add-festival-permission") || pathname.includes("/edit-festival-permission")) {
    return { title: "Manage Festival Permit", section: "Permit Application" };
  }
  if (pathname.includes("/other-places") || pathname.includes("/edit-other-place")) {
    return { title: "Other City Data", section: "Civic & Commercial" };
  }
  if (pathname.includes("/map-view")) {
    return { title: "GIS Command Center", section: "Spatial Intelligence" };
  }
  if (pathname.includes("/reports")) {
    return { title: "Reports & Export", section: "Intelligence Reports" };
  }
  if (pathname.includes("/analytics")) {
    return { title: "Analytics Dashboard", section: "Statistical Data" };
  }
  if (pathname.includes("/officers")) {
    return { title: "Officers Directory", section: "Personnel Management" };
  }
  if (pathname.includes("/police-stations")) {
    return { title: "Police Stations Master", section: "Station Network" };
  }
  if (pathname.includes("/settings")) {
    return { title: "System Settings", section: "Configuration" };
  }
  return { title: "Malegaon Police Command", section: "Malegaon City" };
};

function Topbar({ setSidebarOpen }) {
  const { i18n } = useTranslation();
  const location = useLocation();
  const { officer } = useAuth();
  const pageMeta = getPageMeta(location.pathname);
  const isSuperAdmin = isSuperAdminUser(officer);

  return (
    <header className="topbar">
      <div className="topbar-left">
        <button
          type="button"
          className="hamburger-btn"
          aria-label="Open navigation menu"
          onClick={() => setSidebarOpen(true)}
        >
          <Menu size={20} />
        </button>

        <div className="topbar-brand-mobile">
          <img src={policeLogo} alt="Police" className="topbar-mobile-logo" />
        </div>

        <div className="topbar-page-info">
          <span className="topbar-breadcrumb">{pageMeta.section}</span>
          <h1 className="topbar-page-title">{pageMeta.title}</h1>
        </div>
      </div>

      <div className="topbar-right">
        {isSuperAdmin ? (
          <div className="topbar-status-chip global-admin">
            <ShieldCheck size={14} className="text-teal" />
            <span>Super Admin • Global View</span>
          </div>
        ) : (
          <div className="topbar-status-chip">
            <Activity size={12} className="pulse-dot" />
            <span>Live Database</span>
          </div>
        )}

        <div className="language-selector-chip">
          <Languages size={15} />
          <select
            value={i18n.language}
            onChange={(e) => i18n.changeLanguage(e.target.value)}
          >
            <option value="mr">मराठी</option>
            <option value="hi">हिंदी</option>
            <option value="en">English</option>
          </select>
        </div>

        <div className="topbar-user-badge">
          <div className="topbar-user-avatar">
            <Shield size={16} />
          </div>
          <div className="topbar-user-details">
            <span className="topbar-user-name">{officer?.full_name || "Officer"}</span>
            <span className="topbar-user-station">
              {isSuperAdmin ? "Global Data Access" : (officer?.police_station || "Malegaon PS")}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}

export default Topbar;