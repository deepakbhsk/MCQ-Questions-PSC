import React, { useState, useEffect } from 'react';

interface TimerProps {
  startTime: number;
}

const Timer: React.FC<TimerProps> = ({ startTime }) => {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    // Initial sync
    setElapsed(Math.floor((Date.now() - startTime) / 1000));

    const interval = window.setInterval(() => {
      setElapsed(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);

    return () => clearInterval(interval);
  }, [startTime]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="px-3 py-1 bg-white dark:bg-stone-900 rounded-lg border border-stone-200 dark:border-stone-800 text-xs font-mono font-bold text-stone-600 dark:text-stone-400 tabular-nums shadow-sm">
      {formatTime(elapsed)}
    </div>
  );
};

export default React.memo(Timer);
