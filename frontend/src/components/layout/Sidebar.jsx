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
            <h2>मालेगाव पोलीस</h2>
            <span>Malegaon City System</span>
          </div>
        </div>

        <div className="system-online-badge">
          <Activity size={12} className="pulse-dot" />
          <span>प्रणाली कार्यरत (Online)</span>
        </div>
      </div>

      <nav className="nav-menu">
        <div className="nav-section-label">मुख्य मेनू</div>

        <NavLink to="/dashboard" onClick={() => setSidebarOpen(false)}>
          <div className="nav-icon-box">
            <LayoutDashboard size={18} />
          </div>
          <span>डॅशबोर्ड (Dashboard)</span>
        </NavLink>

        <div className="nav-section-label">शहर डेटाबेस</div>

        <NavLink to="/religious-places" onClick={() => setSidebarOpen(false)}>
          <div className="nav-icon-box">
            <Landmark size={18} />
          </div>
          <span>धार्मिक स्थळे</span>
        </NavLink>

        <NavLink to="/festival-permissions" onClick={() => setSidebarOpen(false)}>
          <div className="nav-icon-box">
            <CalendarCheck size={18} />
          </div>
          <span>उत्सव परवानग्या</span>
        </NavLink>

        <NavLink to="/other-places" onClick={() => setSidebarOpen(false)}>
          <div className="nav-icon-box">
            <Store size={18} />
          </div>
          <span>इतर महत्त्वाची स्थळे</span>
        </NavLink>

        <div className="nav-section-label">नकाशा व अहवाल</div>

        <NavLink to="/map-view" onClick={() => setSidebarOpen(false)}>
          <div className="nav-icon-box">
            <Map size={18} />
          </div>
          <span>जीआयएस नकाशा (GIS Map)</span>
        </NavLink>

        <NavLink to="/reports" onClick={() => setSidebarOpen(false)}>
          <div className="nav-icon-box">
            <FileText size={18} />
          </div>
          <span>अहवाल (Reports)</span>
        </NavLink>

        <NavLink to="/analytics" onClick={() => setSidebarOpen(false)}>
          <div className="nav-icon-box">
            <BarChart3 size={18} />
          </div>
          <span>आकडेवारी व विश्लेषण</span>
        </NavLink>

        <div className="nav-section-label">प्रशासकीय विभाग</div>

        <NavLink to="/officers" onClick={() => setSidebarOpen(false)}>
          <div className="nav-icon-box">
            <Users size={18} />
          </div>
          <span>पोलीस अधिकारी सूची</span>
        </NavLink>

        <NavLink to="/police-stations" onClick={() => setSidebarOpen(false)}>
          <div className="nav-icon-box">
            <Building2 size={18} />
          </div>
          <span>पोलीस ठाणी</span>
        </NavLink>

        <NavLink to="/settings" onClick={() => setSidebarOpen(false)}>
          <div className="nav-icon-box">
            <Settings size={18} />
          </div>
          <span>सेटिंग्ज (Settings)</span>
        </NavLink>
      </nav>

      <div className="sidebar-footer">
        <div className="officer-profile-card">
          <div className="officer-avatar">
            <Shield size={18} />
          </div>
          <div className="officer-info">
            <b className="officer-name">{officer?.full_name || "पोलीस अधिकारी"}</b>
            <span className="officer-role">
              {isSuperAdmin ? "सुपर अ‍ॅडमिन • संपूर्ण नियंत्रण" : (officer?.role || "ड्युटी ऑफिसर")}
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
          title="लॉगआउट"
        >
          <LogOut size={18} />
          <span>लॉगआउट</span>
        </button>
      </div>
    </aside>
  );
}

export default Sidebar;