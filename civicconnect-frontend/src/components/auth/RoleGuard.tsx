import React from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useAuthStore } from "../../stores/authStore";
import { PageLoader } from "../ui/PageLoader";
import { UserRole } from "../../types/user.types";

interface RoleGuardProps {
  role: UserRole | UserRole[];
}

export const RoleGuard: React.FC<RoleGuardProps> = ({ role }) => {
  const { user, role: userRole, loading } = useAuthStore();

  if (loading) {
    return <PageLoader />;
  }

  if (!user) {
    return <Navigate to="/auth/signin" replace />;
  }

  const allowedRoles = Array.isArray(role) ? role : [role];

  if (!userRole || !allowedRoles.includes(userRole)) {
    const fallbackRedirect = userRole
      ? userRole === "citizen"
        ? "/"
        : "/dashboard"
      : "/onboarding";
    return <Navigate to={fallbackRedirect} replace />;
  }

  return <Outlet />;
};
export default RoleGuard;
