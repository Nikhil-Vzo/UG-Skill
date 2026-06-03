import { useState, useEffect } from 'react';
import { connectSocket } from '../lib/socket';

export const useExamTimer = (
  attemptId: string | null, 
  onExpire: () => void, 
  isPaused: boolean = false,
  initialSeconds: number = 0
) => {
  const [timeLeft, setTimeLeft] = useState(initialSeconds);

  // Sync timeLeft with initialSeconds when initialSeconds changes (e.g., when attemptData loads)
  useEffect(() => {
    if (initialSeconds > 0) {
      setTimeLeft(initialSeconds);
    }
  }, [initialSeconds]);

  useEffect(() => {
    if (!attemptId || isPaused) return;

    const examSocket = connectSocket('/exam');
    examSocket.emit('join:exam', { attemptId });

    const onTimerInit = ({ remainingSecs }: { remainingSecs: number }) => {
      setTimeLeft(remainingSecs);
    };

    const onTimerTick = ({ remainingSecs }: { remainingSecs: number }) => {
      setTimeLeft((prev) => {
        // If the server's time differs significantly (e.g. due to drift, tab suspend, or connection resumption),
        // we align with the server.
        const diff = Math.abs(prev - remainingSecs);
        if (diff > 2) {
          return remainingSecs;
        }
        // Otherwise, use the minimum of client and server time to prevent the clock from jumping backwards
        return Math.min(prev, remainingSecs);
      });
    };

    const onTimerExpired = () => onExpire();

    examSocket.on('timer:init', onTimerInit);
    examSocket.on('timer:tick', onTimerTick);
    examSocket.on('timer:expired', onTimerExpired);

    // Local tick decrement interval to make the timer count down smoothly and independently of socket latency
    const localInterval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(localInterval);
          if (prev === 1) {
            onExpire();
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      clearInterval(localInterval);
      examSocket.off('timer:init', onTimerInit);
      examSocket.off('timer:tick', onTimerTick);
      examSocket.off('timer:expired', onTimerExpired);
    };
  }, [attemptId, isPaused, onExpire]);

  return { timeLeft };
};
