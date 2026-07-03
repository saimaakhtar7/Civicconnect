import React from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useAuthStore } from "../../stores/authStore";
import { PageLoader } from "../ui/PageLoader";

export const AuthGuard: React.FC = () => {
  const { user, loading } = useAuthStore();

  if (loading) {
    return <PageLoader />;
  }

  if (!user) {
    return <Navigate to="/landing" replace />;
  }

  return <Outlet />;
};
export default AuthGuard;
