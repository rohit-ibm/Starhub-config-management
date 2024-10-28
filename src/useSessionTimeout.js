import { useEffect } from 'react';

export function useSessionTimeout(timeoutDuration, onTimeout) {
  useEffect(() => {
    let timeoutId;

    const resetTimeout = () => {
      if (timeoutId) clearTimeout(timeoutId);
      timeoutId = setTimeout(onTimeout, timeoutDuration);
    };

    const handleActivity = () => {
      resetTimeout();
    };

    // Listen for mouse and keyboard activity
    window.addEventListener('mousemove', handleActivity);
    window.addEventListener('keydown', handleActivity);

    // Start the timeout
    resetTimeout();

    return () => {
      window.removeEventListener('mousemove', handleActivity);
      window.removeEventListener('keydown', handleActivity);
      clearTimeout(timeoutId);
    };
  }, [timeoutDuration, onTimeout]);
}
