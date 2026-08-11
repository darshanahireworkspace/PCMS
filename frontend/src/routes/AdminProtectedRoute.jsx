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

  const isAdmin =
    adminUser &&
    (adminUser.role === "SuperAdmin" || adminUser.role === "Admin");

  if (!isAdmin) {
    return <Navigate to="/admin/login" replace />;
  }

  return <Outlet />;
}

export default AdminProtectedRoute;
