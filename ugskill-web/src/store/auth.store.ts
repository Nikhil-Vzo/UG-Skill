import { create } from 'zustand';
import api, { tokenStore } from '../lib/api';
export { tokenStore };

// ─── Types ────────────────────────────────────────────────────────────────────
export interface User {
  id: string;
  fullName: string;
  email: string;
  roles: string[];
  avatarUrl?: string;
  institution?: string;
  branch?: string;
  graduationYear?: number;
  status?: string;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  login: (credentials: { email: string; password: string }) => Promise<void>;
  register: (data: {
    email: string;
    password: string;
    fullName: string;
    role?: string;
    institution?: string;
    branch?: string;
    graduationYear?: number;
  }) => Promise<void>;
  logout: (refreshTokenOverride?: string) => Promise<void>;
  checkAuth: () => Promise<void>;
  clearError: () => void;
}

// ─── Store ────────────────────────────────────────────────────────────────────
export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,

  // ── Login ──────────────────────────────────────────────────────────────────
  login: async (credentials) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.post('/auth/login', credentials);
      const { user, accessToken, refreshToken } = response.data.data;

      tokenStore.setTokens(accessToken, refreshToken);

      set({
        user,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      });
    } catch (error: any) {
      set({
        error: error.response?.data?.error?.message || 'Login failed. Please check your credentials.',
        isLoading: false,
        isAuthenticated: false,
      });
    }
  },

  // ── Register ───────────────────────────────────────────────────────────────
  register: async (data) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.post('/auth/register', data);
      const { user, accessToken, refreshToken } = response.data.data;

      tokenStore.setTokens(accessToken, refreshToken);

      set({
        user,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      });
    } catch (error: any) {
      set({
        error: error.response?.data?.error?.message || 'Registration failed. Please try again.',
        isLoading: false,
        isAuthenticated: false,
      });
    }
  },

  // ── Logout ─────────────────────────────────────────────────────────────────
  logout: async (refreshTokenOverride?: string) => {
    const refreshToken = refreshTokenOverride !== undefined ? refreshTokenOverride : tokenStore.getRefreshToken();
    try {
      if (refreshToken) {
        // Tell backend to invalidate the refresh token session
        await api.post('/auth/logout', { refreshToken });
      }
    } catch {
      // Even if the API call fails, clear local state
    } finally {
      tokenStore.clearTokens();
      set({ user: null, isAuthenticated: false, isLoading: false, error: null });
    }
  },

  // ── Check Auth on App Mount ────────────────────────────────────────────────
  // Since tokens are in-memory, a page refresh will clear them.
  // checkAuth verifies the current state is valid (no rehydration needed).
  // If we want persistent sessions across page refreshes, we could use a
  // silent token refresh endpoint that requires an HTTP-only cookie — but
  // since the backend doesn't set cookies, we keep it simple.
  checkAuth: async () => {
    const accessToken = tokenStore.getAccessToken();
    if (!accessToken) {
      set({ isAuthenticated: false, isLoading: false });
      return;
    }

    set({ isLoading: true });
    try {
      const response = await api.get('/users/me');
      const user = response.data.data || response.data;
      set({ user, isAuthenticated: true, isLoading: false });
    } catch (error: any) {
      if (error.response?.status === 401) {
        tokenStore.clearTokens();
        set({ user: null, isAuthenticated: false, isLoading: false });
      } else {
        // Network error — don't forcibly log out
        set({ isLoading: false });
      }
    }
  },

  // ── Utility ────────────────────────────────────────────────────────────────
  clearError: () => set({ error: null }),
}));
