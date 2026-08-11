import { useEffect, useState } from "react";
import { Routes, Route, Navigate } from "react-router-dom";

import OfflinePage from "./components/OfflinePage";

import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import AddReligiousPlace from "./pages/AddReligiousPlace";
import ReligiousPlaces from "./pages/ReligiousPlaces";
import AddFestivalPermission from "./pages/AddFestivalPermission";
import FestivalPermissions from "./pages/FestivalPermissions";
import MapView from "./pages/MapView";
import Reports from "./pages/Reports";
import Analytics from "./pages/Analytics";
import Officers from "./pages/Officers";
import Settings from "./pages/Settings";
import PoliceStations from "./pages/PoliceStations";
import OtherPlaces from "./pages/OtherPlaces";

import AdminLogin from "./pages/admin/AdminLogin";
import AdminDashboard from "./pages/admin/AdminDashboard";
import OfficersManagement from "./pages/admin/OfficersManagement";
import TeamsManagement from "./pages/admin/TeamsManagement";
import AccessControl from "./pages/admin/AccessControl";
import DuplicateReview from "./pages/admin/DuplicateReview";
import AuditLogs from "./pages/admin/AuditLogs";
import AdminLayout from "./components/admin/AdminLayout";
import AdminProtectedRoute from "./routes/AdminProtectedRoute";

import Layout from "./components/layout/Layout";
import ProtectedRoute from "./routes/ProtectedRoute";
import useAuth from "./hooks/useAuth";

function PublicOnlyRoute({ children }) {
  const { officer, loading } = useAuth();
  if (loading) return null;
  if (officer) {
    return <Navigate to="/dashboard" replace />;
  }
  return children;
}

function App() {
  const [online, setOnline] = useState(navigator.onLine);

  useEffect(() => {
    const goOnline = () => setOnline(true);
    const goOffline = () => setOnline(false);

    window.addEventListener("online", goOnline);
    window.addEventListener("offline", goOffline);

    return () => {
      window.removeEventListener("online", goOnline);
      window.removeEventListener("offline", goOffline);
    };
  }, []);

  if (!online) {
    return <OfflinePage />;
  }

  return (
    <Routes>
      <Route
        path="/"
        element={
          <PublicOnlyRoute>
            <Login />
          </PublicOnlyRoute>
        }
      />

      {/* ADMIN ROUTES */}
      <Route path="/admin/login" element={<AdminLogin />} />
      <Route element={<AdminProtectedRoute />}>
        <Route element={<AdminLayout />}>
          <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
          <Route path="/admin/officers" element={<OfficersManagement />} />
          <Route path="/admin/teams" element={<TeamsManagement />} />
          <Route path="/admin/access-control" element={<AccessControl />} />
          <Route path="/admin/duplicate-review" element={<DuplicateReview />} />
          <Route path="/admin/audit-logs" element={<AuditLogs />} />
        </Route>
      </Route>

      {/* OFFICER COMMAND ROUTES */}
      <Route
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route path="/dashboard" element={<Dashboard />} />

        <Route path="/add-religious-place" element={<AddReligiousPlace />} />
        <Route
          path="/edit-religious-place/:id"
          element={<AddReligiousPlace />}
        />

        <Route path="/religious-places" element={<ReligiousPlaces />} />

        <Route
          path="/add-festival-permission"
          element={<AddFestivalPermission />}
        />

        <Route
          path="/edit-festival-permission/:id"
          element={<AddFestivalPermission />}
        />

        <Route
          path="/festival-permissions"
          element={<FestivalPermissions />}
        />

        <Route path="/map-view" element={<MapView />} />
        <Route path="/reports" element={<Reports />} />
        <Route path="/analytics" element={<Analytics />} />
        <Route path="/officers" element={<Officers />} />
        <Route path="/police-stations" element={<PoliceStations />} />

        <Route path="/other-places" element={<OtherPlaces />} />
        <Route path="/edit-other-place/:id" element={<OtherPlaces />} />

        <Route path="/settings" element={<Settings />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;