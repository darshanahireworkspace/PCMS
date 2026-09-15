import { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import {
  Home,
  Map,
  PlusCircle,
  FileText,
  Settings,
  Landmark,
  CalendarCheck,
  Store,
  X,
} from "lucide-react";

function MobileBottomNav() {
  const [showAddMenu, setShowAddMenu] = useState(false);
  const navigate = useNavigate();

  const handleNavigate = (path) => {
    setShowAddMenu(false);
    navigate(path);
  };

  return (
    <>
      {showAddMenu && (
        <div
          className="bottom-add-overlay"
          onClick={() => setShowAddMenu(false)}
        >
          <div className="bottom-add-menu" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              onClick={() => handleNavigate("/add-religious-place")}
            >
              <div className="add-menu-icon teal">
                <Landmark size={18} />
              </div>
              <span>धार्मिक स्थळ जोडा</span>
            </button>

            <button
              type="button"
              onClick={() => handleNavigate("/add-festival-permission")}
            >
              <div className="add-menu-icon purple">
                <CalendarCheck size={18} />
              </div>
              <span>उत्सव परवानगी जोडा</span>
            </button>

            <button
              type="button"
              onClick={() => handleNavigate("/other-places")}
            >
              <div className="add-menu-icon blue">
                <Store size={18} />
              </div>
              <span>इतर स्थळ जोडा</span>
            </button>
          </div>
        </div>
      )}

      <nav className="mobile-bottom-nav">
        <NavLink to="/dashboard" onClick={() => setShowAddMenu(false)}>
          <Home size={19} />
          <span>होम</span>
        </NavLink>

        <NavLink to="/map-view" onClick={() => setShowAddMenu(false)}>
          <Map size={19} />
          <span>नकाशा</span>
        </NavLink>

        <button
          type="button"
          className={`bottom-add-btn ${showAddMenu ? "open" : ""}`}
          onClick={() => setShowAddMenu(!showAddMenu)}
          aria-label="नवीन जोडा"
        >
          {showAddMenu ? <X size={22} /> : <PlusCircle size={22} />}
          <span>नवीन +</span>
        </button>

        <NavLink to="/reports" onClick={() => setShowAddMenu(false)}>
          <FileText size={19} />
          <span>अहवाल</span>
        </NavLink>

        <NavLink to="/settings" onClick={() => setShowAddMenu(false)}>
          <Settings size={19} />
          <span>सेटिंग्ज</span>
        </NavLink>
      </nav>
    </>
  );
}

export default MobileBottomNav;