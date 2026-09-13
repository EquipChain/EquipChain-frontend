"use client";

import { useEffect, useState } from "react";
import { formatRelativeTime } from "@/src/lib/utils/format";

// ============================================================================
// LiveRelativeTime — relative timestamp that re-renders itself
// ============================================================================
// "5 minutes ago" went stale the moment it rendered: the streams table
// claims to be live but its Last Data Point column froze at whatever the
// page-mount time was. This component re-formats on a fixed interval so
// relative labels track the clock without waiting for a data refetch.

export interface LiveRelativeTimeProps {
  /** ISO datetime, epoch ms, or Date to render */
  datetime: string | number | Date;
  /** Re-render cadence in ms (default 30_000) */
  tickMs?: number;
  className?: string;
}

export function LiveRelativeTime({
  datetime,
  tickMs = 30_000,
  className,
}: LiveRelativeTimeProps) {
  const [, setTick] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => setTick((t) => t + 1), tickMs);
    return () => clearInterval(interval);
  }, [tickMs]);

  // dateTime carries the machine-readable value for assistive tech; the
  // formatted text is the human-readable relative label.
  const iso =
    typeof datetime === "string"
      ? datetime
      : new Date(datetime).toISOString();

  return (
    <time dateTime={iso} className={className} title={iso}>
      {formatRelativeTime(datetime)}
    </time>
  );
}
