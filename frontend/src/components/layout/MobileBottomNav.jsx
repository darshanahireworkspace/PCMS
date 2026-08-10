import { useEffect, useState } from "react";
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
  const [hidden, setHidden] = useState(false);
  const [showAddMenu, setShowAddMenu] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    let scrollTimer;

    const handleScroll = () => {
      setHidden(true);
      setShowAddMenu(false);

      clearTimeout(scrollTimer);
      scrollTimer = setTimeout(() => {
        setHidden(false);
      }, 600);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", handleScroll);
      clearTimeout(scrollTimer);
    };
  }, []);

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
              <span>Add Religious Place</span>
            </button>

            <button
              type="button"
              onClick={() => handleNavigate("/add-festival-permission")}
            >
              <div className="add-menu-icon purple">
                <CalendarCheck size={18} />
              </div>
              <span>Add Festival Permission</span>
            </button>

            <button
              type="button"
              onClick={() => handleNavigate("/other-places")}
            >
              <div className="add-menu-icon blue">
                <Store size={18} />
              </div>
              <span>Add Other Place</span>
            </button>
          </div>
        </div>
      )}

      <nav className={`mobile-bottom-nav ${hidden ? "hide-bottom-nav" : ""}`}>
        <NavLink to="/dashboard" onClick={() => setShowAddMenu(false)}>
          <Home size={19} />
          <span>Home</span>
        </NavLink>

        <NavLink to="/map-view" onClick={() => setShowAddMenu(false)}>
          <Map size={19} />
          <span>GIS Map</span>
        </NavLink>

        <button
          type="button"
          className={`bottom-add-btn ${showAddMenu ? "open" : ""}`}
          onClick={() => setShowAddMenu(!showAddMenu)}
          aria-label="Add new record"
        >
          {showAddMenu ? <X size={22} /> : <PlusCircle size={22} />}
          <span>Add</span>
        </button>

        <NavLink to="/reports" onClick={() => setShowAddMenu(false)}>
          <FileText size={19} />
          <span>Reports</span>
        </NavLink>

        <NavLink to="/settings" onClick={() => setShowAddMenu(false)}>
          <Settings size={19} />
          <span>Settings</span>
        </NavLink>
      </nav>
    </>
  );
}

export default MobileBottomNav;