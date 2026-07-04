import { useCallback } from "react";
import { useAuthStore } from "../stores/authStore";
import { can as verifyCan, hasRole as verifyHasRole, Permission } from "../utils/permissions";
import { UserRole } from "../types/user.types";

export const usePermissions = () => {
  const { user } = useAuthStore();

  const can = useCallback(
    (permission: Permission) => {
      return verifyCan(user, permission);
    },
    [user]
  );

  const hasRole = useCallback(
    (...roles: UserRole[]) => {
      return verifyHasRole(user, ...roles);
    },
    [user]
  );

  return {
    user,
    role: user?.role || null,
    can,
    hasRole,
    isAuthenticated: !!user,
    isVisitor: !user
  };
};
