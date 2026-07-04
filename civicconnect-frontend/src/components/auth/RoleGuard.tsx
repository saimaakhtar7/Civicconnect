import React from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useAuthStore } from "../../stores/authStore";
import { PageLoader } from "../ui/PageLoader";
import { UserRole } from "../../types/user.types";

import AccessDenied from "./AccessDenied";

interface RoleGuardProps {
  role: UserRole | UserRole[];
}

export const RoleGuard: React.FC<RoleGuardProps> = ({ role }) => {
  const { user, role: userRole, loading } = useAuthStore();

  if (loading) {
    return <PageLoader />;
  }

  if (!user) {
    return <Navigate to="/landing" replace />;
  }

  const allowedRoles = Array.isArray(role) ? role : [role];

  if (!userRole || !allowedRoles.includes(userRole)) {
    return <AccessDenied />;
  }

  return <Outlet />;
};
export default RoleGuard;
