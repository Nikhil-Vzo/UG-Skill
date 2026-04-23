import { describe, it, expect, vi, beforeEach } from 'vitest';
import api, { tokenStore } from '../../lib/api';
import axios from 'axios';

// Mock the core axios methods used inside the interceptor
vi.mock('axios', async (importOriginal) => {
  const actual = await importOriginal<typeof import('axios')>();
  const mockAxiosInstance = {
    interceptors: {
      request: { use: vi.fn(), eject: vi.fn() },
      response: { use: vi.fn(), eject: vi.fn() },
    },
    get: vi.fn(),
    post: vi.fn(),
  };
  
  return {
    default: {
      ...actual.default,
      create: vi.fn(() => mockAxiosInstance),
      post: vi.fn(),
    },
  };
});

describe('api.ts (tokenStore & interceptors)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    tokenStore.clearTokens();
  });

  describe('tokenStore', () => {
    it('sets, gets, and clears tokens safely in memory', () => {
      expect(tokenStore.getAccessToken()).toBeNull();
      expect(tokenStore.getRefreshToken()).toBeNull();

      tokenStore.setTokens('access-token', 'refresh-token');
      expect(tokenStore.getAccessToken()).toBe('access-token');
      expect(tokenStore.getRefreshToken()).toBe('refresh-token');

      tokenStore.clearTokens();
      expect(tokenStore.getAccessToken()).toBeNull();
      expect(tokenStore.getRefreshToken()).toBeNull();
    });
  });

  // Note: Testing axios interceptors directly via unit tests usually requires accessing the mounted
  // interceptor handlers or using axios-mock-adapter. Here we primarily ensure the token store is tested
  // and the instance is created.
  describe('api instance', () => {
    it('is configured successfully', () => {
      expect(api).toBeDefined();
      expect(api.interceptors.request).toBeDefined();
      expect(api.interceptors.response).toBeDefined();
    });
  });
});
