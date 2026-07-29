'use client';

import { useEffect, useState } from 'react';
import { useOnlineStatus } from '@/src/lib/hooks/useOnlineStatus';
import { getQueueCount } from '@/src/lib/storage/db';

export function OfflineBanner() {
  const { isOnline, wasOffline } = useOnlineStatus();
  const [queueCount, setQueueCount] = useState(0);
  const [showReconnected, setShowReconnected] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function refreshCount() {
      try {
        const count = await getQueueCount();
        if (!cancelled) setQueueCount(count);
      } catch {
        // IndexedDB unavailable (e.g. private browsing) — fail silently
      }
    }

    refreshCount();
    const interval = setInterval(refreshCount, 5000);

    const onQueueChange = () => refreshCount();
    window.addEventListener('equipchain:queue-changed', onQueueChange);

    return () => {
      cancelled = true;
      clearInterval(interval);
      window.removeEventListener('equipchain:queue-changed', onQueueChange);
    };
  }, []);

  useEffect(() => {
    if (isOnline && wasOffline) {
      const timer = setTimeout(() => {
        setShowReconnected(true);
        const hideTimer = setTimeout(() => setShowReconnected(false), 3000);
        return () => clearTimeout(hideTimer);
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [isOnline, wasOffline]);

  if (isOnline && !showReconnected) return null;

  if (isOnline && showReconnected) {
    return (
      <div
        role="status"
        className="w-full bg-green-600 text-white text-sm text-center py-2 px-4 transition-all"
      >
        Back online — syncing data…
      </div>
    );
  }

  return (
    <div
      role="alert"
      className="w-full bg-yellow-500 text-black text-sm text-center py-2 px-4 flex items-center justify-center gap-3 flex-wrap"
    >
      <span>You&apos;re offline. Some features may be unavailable.</span>
      {queueCount > 0 && (
        <span className="font-semibold bg-black/10 rounded-full px-2 py-0.5">
          {queueCount} pending operation{queueCount === 1 ? '' : 's'}
        </span>
      )}
    </div>
  );
}
