import { Navigate } from "react-router-dom";
import useAuth from "../hooks/useAuth";

function ProtectedRoute({ children }) {
  const { officer, loading } = useAuth();

  if (loading) return null;

  if (!officer) {
    return <Navigate to="/" replace />;
  }

  return children;
}

export default ProtectedRoute;