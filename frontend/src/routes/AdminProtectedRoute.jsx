import { Navigate, Outlet } from "react-router-dom";
import { useAdminAuth } from "../context/AdminAuthContext";

function AdminProtectedRoute() {
  const { adminUser, adminLoading } = useAdminAuth();

  if (adminLoading) {
    return (
      <div className="admin-loading-screen">
        <p>Verifying Super Admin Authority...</p>
      </div>
    );
  }

  // EXCLUSIVE CHECK: ONLY THE DESIGNATED SUPER ADMIN (SPMalegaon) SATISFIES ADMIN ROUTE GUARD
  const isSuperAdmin =
    adminUser &&
    adminUser.username === "SPMalegaon" &&
    (adminUser.role === "SuperAdmin" || adminUser.role === "Admin");

  if (!isSuperAdmin) {
    return <Navigate to="/admin/login" replace />;
  }

  return <Outlet />;
}

export default AdminProtectedRoute;
