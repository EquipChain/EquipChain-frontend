'use client';

import { useEffect, useState, useCallback } from 'react';

export interface OnlineStatus {
  isOnline: boolean;
  wasOffline: boolean;
  lastOnlineTime: number | null;
}

export function useOnlineStatus(): OnlineStatus {
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [wasOffline, setWasOffline] = useState(false);
  const [lastOnlineTime, setLastOnlineTime] = useState<number | null>(null);

  // Initialize on mount (client-side only)
  useEffect(() => {
    requestAnimationFrame(() => {
      setIsOnline(navigator.onLine);
      if (navigator.onLine) {
        setLastOnlineTime(Date.now());
      }
    });
  }, []);

  const handleOnline = useCallback(() => {
    setIsOnline(true);
    setLastOnlineTime(Date.now());
    window.dispatchEvent(new CustomEvent('equipchain:online'));
  }, []);

  const handleOffline = useCallback(() => {
    setIsOnline(false);
    setWasOffline(true);
    window.dispatchEvent(new CustomEvent('equipchain:offline'));
  }, []);

  useEffect(() => {
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [handleOnline, handleOffline]);

  return { isOnline, wasOffline, lastOnlineTime };
}
