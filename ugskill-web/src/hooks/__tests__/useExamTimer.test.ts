import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useExamTimer } from '../useExamTimer';
import * as socketLib from '../../lib/socket';

vi.mock('../../lib/socket', () => ({
  connectSocket: vi.fn(),
  disconnectSocket: vi.fn(),
}));

describe('useExamTimer', () => {
  let mockSocket: any;

  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();
    mockSocket = {
      emit: vi.fn(),
      on: vi.fn(),
      off: vi.fn(),
    };
    (socketLib.connectSocket as any).mockReturnValue(mockSocket);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('connects to /exam and joins attempt on mount', () => {
    renderHook(() => useExamTimer('attempt-123', vi.fn(), false, 120));
    expect(socketLib.connectSocket).toHaveBeenCalledWith('/exam');
    expect(mockSocket.emit).toHaveBeenCalledWith('join:exam', { attemptId: 'attempt-123' });
    expect(mockSocket.on).toHaveBeenCalledWith('timer:init', expect.any(Function));
    expect(mockSocket.on).toHaveBeenCalledWith('timer:tick', expect.any(Function));
    expect(mockSocket.on).toHaveBeenCalledWith('timer:expired', expect.any(Function));
  });

  it('updates time left on timer:init and timer:tick', () => {
    const { result } = renderHook(() => useExamTimer('attempt-123', vi.fn(), false, 3600));

    // Initially uses initialSeconds
    expect(result.current.timeLeft).toBe(3600);

    const initCallback = mockSocket.on.mock.calls.find((c: any) => c[0] === 'timer:init')[1];
    const tickCallback = mockSocket.on.mock.calls.find((c: any) => c[0] === 'timer:tick')[1];

    act(() => {
      initCallback({ remainingSecs: 3500 });
    });
    expect(result.current.timeLeft).toBe(3500);

    // If server tick is only slightly behind or matching, use min
    act(() => {
      tickCallback({ remainingSecs: 3500 }); // delayed tick
    });
    expect(result.current.timeLeft).toBe(3500);

    // If server tick is smaller, align
    act(() => {
      tickCallback({ remainingSecs: 3499 });
    });
    expect(result.current.timeLeft).toBe(3499);

    // If server tick deviates significantly, align
    act(() => {
      tickCallback({ remainingSecs: 3000 });
    });
    expect(result.current.timeLeft).toBe(3000);
  });

  it('decrements time left locally as time passes', () => {
    const { result } = renderHook(() => useExamTimer('attempt-123', vi.fn(), false, 10));
    expect(result.current.timeLeft).toBe(10);

    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(result.current.timeLeft).toBe(9);

    act(() => {
      vi.advanceTimersByTime(2000);
    });
    expect(result.current.timeLeft).toBe(7);
  });

  it('calls onExpire when local timer reaches 0', () => {
    const onExpireMock = vi.fn();
    renderHook(() => useExamTimer('attempt-123', onExpireMock, false, 2));

    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(onExpireMock).not.toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(onExpireMock).toHaveBeenCalledOnce();
  });

  it('calls onExpire when timer:expired is emitted', () => {
    const onExpireMock = vi.fn();
    renderHook(() => useExamTimer('attempt-123', onExpireMock));

    const expiredCallback = mockSocket.on.mock.calls.find((c: any) => c[0] === 'timer:expired')[1];

    act(() => {
      expiredCallback();
    });

    expect(onExpireMock).toHaveBeenCalledOnce();
  });

  it('cleans up event listeners and interval on unmount', () => {
    const { unmount } = renderHook(() => useExamTimer('attempt-123', vi.fn()));
    unmount();
    expect(mockSocket.off).toHaveBeenCalledWith('timer:init', expect.any(Function));
    expect(mockSocket.off).toHaveBeenCalledWith('timer:tick', expect.any(Function));
    expect(mockSocket.off).toHaveBeenCalledWith('timer:expired', expect.any(Function));
  });
});

