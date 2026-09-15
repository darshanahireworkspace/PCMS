import { Menu, Languages, Shield, Activity, ShieldCheck } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useLocation } from "react-router-dom";
import useAuth from "../../hooks/useAuth";
import { isSuperAdminUser } from "../../utils/authUtils";
import policeLogo from "../../assets/police-logo.png";

const getPageMeta = (pathname) => {
  if (pathname.includes("/dashboard")) {
    return { title: "मुख्य नियंत्रण कक्ष (Dashboard)", section: "थेट नियंत्रण प्रणाली" };
  }
  if (pathname.includes("/religious-places")) {
    return { title: "धार्मिक स्थळे सूची", section: "शहर धार्मिक डेटाबेस" };
  }
  if (pathname.includes("/add-religious-place") || pathname.includes("/edit-religious-place")) {
    return { title: "धार्मिक स्थळ नोंदणी", section: "डेटाबेस नोंदणी" };
  }
  if (pathname.includes("/festival-permissions")) {
    return { title: "सण व उत्सव परवानग्या", section: "उत्सव परवानगी नियंत्रण" };
  }
  if (pathname.includes("/add-festival-permission") || pathname.includes("/edit-festival-permission")) {
    return { title: "उत्सव परवानगी अर्ज", section: "परवानगी नोंदणी" };
  }
  if (pathname.includes("/other-places") || pathname.includes("/edit-other-place")) {
    return { title: "इतर महत्त्वाची स्थळे", section: "व्यावसायिक व नागरी स्थळे" };
  }
  if (pathname.includes("/map-view")) {
    return { title: "जीआयएस थेट नकाशा (GIS Map)", section: "भौगोलिक नियंत्रण कक्ष" };
  }
  if (pathname.includes("/reports")) {
    return { title: "अहवाल व डेटा एक्सपोर्ट (Reports)", section: "पोलीस गुप्तचर अहवाल" };
  }
  if (pathname.includes("/analytics")) {
    return { title: "आकडेवारी व विश्लेषण (Analytics)", section: "सांख्यिकी विश्लेषण" };
  }
  if (pathname.includes("/officers")) {
    return { title: "पोलीस अधिकारी सूची", section: "कर्मचारी व्यवस्थापन" };
  }
  if (pathname.includes("/police-stations")) {
    return { title: "पोलीस ठाणी व्यवस्थापन", section: "पोलीस ठाणे नेटवर्क" };
  }
  if (pathname.includes("/settings")) {
    return { title: "सिस्टम सेटिंग्ज (Settings)", section: "कॉन्फिगरेशन" };
  }
  return { title: "मालेगाव शहर पोलीस नियंत्रण प्रणाली", section: "मालेगाव पोलीस" };
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