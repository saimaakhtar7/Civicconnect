import { create } from "zustand";
import { UserDocument, UserRole } from "../types/user.types";

interface AuthState {
  user: UserDocument | null;
  role: UserRole | null;
  loading: boolean;
  setUser: (user: UserDocument | null) => void;
  setRole: (role: UserRole | null) => void;
  setLoading: (loading: boolean) => void;
  clearUser: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  role: null,
  loading: false,
  setUser: (user) => set({ user, role: user ? user.role : null }),
  setRole: (role) => set({ role }),
  setLoading: (loading) => set({ loading }),
  clearUser: () => set({ user: null, role: null, loading: false }),
}));
