import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useAuthStore } from '../auth.store';
import api, { tokenStore } from '../../lib/api';

// Mock the API module
vi.mock('../../lib/api', () => {
  return {
    default: {
      post: vi.fn(),
      get: vi.fn(),
    },
    tokenStore: {
      getAccessToken: vi.fn(),
      getRefreshToken: vi.fn(),
      setTokens: vi.fn(),
      clearTokens: vi.fn(),
    },
  };
});

describe('auth.store', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAuthStore.setState({ user: null, isAuthenticated: false, isLoading: false, error: null });
  });

  describe('login', () => {
    it('sets user, tokens, and isAuthenticated to true on success', async () => {
      const mockUser = { id: '1', email: 'test@ugskill.edu', fullName: 'Test User', roles: ['student'] };
      (api.post as any).mockResolvedValueOnce({
        data: { data: { user: mockUser, accessToken: 'access-123', refreshToken: 'refresh-456' } },
      });

      await useAuthStore.getState().login({ email: 'test@ugskill.edu', password: 'password123' });

      expect(api.post).toHaveBeenCalledWith('/auth/login', { email: 'test@ugskill.edu', password: 'password123' });
      expect(tokenStore.setTokens).toHaveBeenCalledWith('access-123', 'refresh-456');

      const state = useAuthStore.getState();
      expect(state.user).toEqual(mockUser);
      expect(state.isAuthenticated).toBe(true);
      expect(state.error).toBeNull();
      expect(state.isLoading).toBe(false);
    });

    it('sets error and resets state on failure', async () => {
      (api.post as any).mockRejectedValueOnce({
        response: { data: { error: { message: 'Invalid credentials' } } },
      });

      await useAuthStore.getState().login({ email: 'test@ugskill.edu', password: 'wrong' });

      const state = useAuthStore.getState();
      expect(state.error).toBe('Invalid credentials');
      expect(state.isAuthenticated).toBe(false);
      expect(state.user).toBeNull();
      expect(state.isLoading).toBe(false);
      expect(tokenStore.setTokens).not.toHaveBeenCalled();
    });
  });

  describe('logout', () => {
    it('calls API and clears tokens and local state', async () => {
      (tokenStore.getRefreshToken as any).mockReturnValue('refresh-456');
      (api.post as any).mockResolvedValueOnce({});
      
      // Setup some intermediate state to ensure it resets
      useAuthStore.setState({ user: { id: '1' } as any, isAuthenticated: true });

      await useAuthStore.getState().logout();

      expect(api.post).toHaveBeenCalledWith('/auth/logout', { refreshToken: 'refresh-456' });
      expect(tokenStore.clearTokens).toHaveBeenCalled();

      const state = useAuthStore.getState();
      expect(state.user).toBeNull();
      expect(state.isAuthenticated).toBe(false);
    });
  });

  describe('checkAuth', () => {
    it('returns early if no access token', async () => {
      (tokenStore.getAccessToken as any).mockReturnValue(null);

      await useAuthStore.getState().checkAuth();

      expect(api.get).not.toHaveBeenCalled();
      const state = useAuthStore.getState();
      expect(state.isAuthenticated).toBe(false);
    });

    it('fetches user and authenticates if token exists', async () => {
      (tokenStore.getAccessToken as any).mockReturnValue('access-123');
      const mockUser = { id: '1', email: 'test@ugskill.edu', fullName: 'Test User', roles: ['student'] };
      (api.get as any).mockResolvedValueOnce({ data: { data: mockUser } });

      await useAuthStore.getState().checkAuth();

      expect(api.get).toHaveBeenCalledWith('/users/me');
      const state = useAuthStore.getState();
      expect(state.isAuthenticated).toBe(true);
      expect(state.user).toEqual(mockUser);
    });

    it('logs out and clears tokens on 401 response', async () => {
      (tokenStore.getAccessToken as any).mockReturnValue('access-123');
      (api.get as any).mockRejectedValueOnce({ response: { status: 401 } });

      useAuthStore.setState({ user: { id: '1' } as any, isAuthenticated: true });

      await useAuthStore.getState().checkAuth();

      expect(tokenStore.clearTokens).toHaveBeenCalled();
      const state = useAuthStore.getState();
      expect(state.user).toBeNull();
      expect(state.isAuthenticated).toBe(false);
    });
  });
});
