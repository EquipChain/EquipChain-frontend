'use client';

import { useEffect, useState } from 'react';
import { useOnlineStatus } from '@/src/lib/hooks/useOnlineStatus';

export default function OfflinePage() {
  const { isOnline } = useOnlineStatus();
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);

  useEffect(() => {
    setLastUpdated(new Date().toLocaleString());
  }, []);

  const handleRetry = () => {
    window.location.href = '/';
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 text-center gap-4">
      <h1 className="text-2xl font-semibold">You&apos;re offline</h1>
      <p className="text-sm opacity-70 max-w-md">
        {isOnline
          ? "You're back online — you can return to the dashboard."
          : "We can't reach EquipChain right now. Showing your last cached data where available."}
      </p>
      {lastUpdated && (
        <p className="text-xs opacity-50">Last updated: {lastUpdated}</p>
      )}
      <button
        onClick={handleRetry}
        className="mt-2 px-4 py-2 rounded-md bg-black text-white dark:bg-white dark:text-black text-sm font-medium"
      >
        {isOnline ? 'Return to dashboard' : 'Retry'}
      </button>
    </div>
  );
}
