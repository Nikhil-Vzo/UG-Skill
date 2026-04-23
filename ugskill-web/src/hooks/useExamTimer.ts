import { useState, useEffect } from 'react';
import { connectSocket, disconnectSocket } from '../lib/socket';

export const useExamTimer = (
  attemptId: string | null, 
  onExpire: () => void, 
  isPaused: boolean = false,
  initialSeconds: number = 0
) => {
  const [timeLeft, setTimeLeft] = useState(initialSeconds);

  useEffect(() => {
    if (!attemptId || isPaused) return;

    const examSocket = connectSocket('/exam');
    examSocket.emit('join:exam', { attemptId });

    const onTimerInit = ({ remainingSecs }: { remainingSecs: number }) => setTimeLeft(remainingSecs);
    const onTimerTick = ({ remainingSecs }: { remainingSecs: number }) => setTimeLeft(remainingSecs);
    const onTimerExpired = () => onExpire();

    examSocket.on('timer:init', onTimerInit);
    examSocket.on('timer:tick', onTimerTick);
    examSocket.on('timer:expired', onTimerExpired);

    return () => {
      examSocket.off('timer:init', onTimerInit);
      examSocket.off('timer:tick', onTimerTick);
      examSocket.off('timer:expired', onTimerExpired);
    };
  }, [attemptId, isPaused, onExpire]);

  return { timeLeft };
};
