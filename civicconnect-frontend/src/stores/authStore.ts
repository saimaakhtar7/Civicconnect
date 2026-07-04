import { create } from "zustand";
import { UserDocument, UserRole } from "../types/user.types";
import { ROLE_PERMISSIONS, Permission } from "../utils/permissions";

interface AuthState {
  user: UserDocument | null;
  role: UserRole | null;
  loading: boolean;
  
  // Extended fields as requested
  department: string | null;
  permissions: Permission[];
  profile: UserDocument | null;
  isAuthenticated: boolean;

  setUser: (user: UserDocument | null) => void;
  setRole: (role: UserRole | null) => void;
  setLoading: (loading: boolean) => void;
  clearUser: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  role: null,
  loading: true,
  department: null,
  permissions: [],
  profile: null,
  isAuthenticated: false,

  setUser: (user) => set({
    user,
    role: user ? user.role : null,
    department: user ? user.department || null : null,
    permissions: user ? ROLE_PERMISSIONS[user.role] || [] : [],
    profile: user,
    isAuthenticated: !!user
  }),
  setRole: (role) => set((state) => {
    const updatedUser = state.user ? { ...state.user, role } as UserDocument : null;
    return {
      role,
      user: updatedUser,
      profile: updatedUser,
      permissions: role ? ROLE_PERMISSIONS[role] || [] : []
    };
  }),
  setLoading: (loading) => set({ loading }),
  clearUser: () => set({
    user: null,
    role: null,
    loading: false,
    department: null,
    permissions: [],
    profile: null,
    isAuthenticated: false
  }),
}));
