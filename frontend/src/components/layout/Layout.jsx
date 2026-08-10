import { useEffect, useState } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";
import AIVoiceAssistant from "../common/AIVoiceAssistant";
import MobileBottomNav from "./MobileBottomNav";
import usePermissions from "../../hooks/usePermissions";

function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { runLoginOnboarding } = usePermissions();

  useEffect(() => {
    runLoginOnboarding();
  }, [runLoginOnboarding]);

  return (
    <div className="app-layout">
      <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

      {sidebarOpen && (
        <div
          className="mobile-overlay"
          onClick={() => setSidebarOpen(false)}
        ></div>
      )}

      <main className="main-content">
        <Topbar setSidebarOpen={setSidebarOpen} />

        <div className="page-content">
          <Outlet />
        </div>

        {/* AI Voice Assistant */}
        <AIVoiceAssistant />

        {/* Mobile Bottom Navigation */}
        <MobileBottomNav />
      </main>
    </div>
  );
}

export default Layout;