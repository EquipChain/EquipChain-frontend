"use client";

import { useId, useMemo } from "react";
import { cn } from "@/src/lib/utils/cn";

// ============================================================================
// Sparkline — inline trend visualization
// ============================================================================
// Usage trends were previously conveyed only by text ("+5.3%"), which hides
// the shape of the change (spiky? steady? recovering?). This tiny SVG
// component renders a trend line without pulling a chart library into the
// client bundle — the full chart experience (recharts) is reserved for the
// dashboard page via dynamic import.

export interface SparklineProps {
  /** Series values, in order (oldest first) */
  data: number[];
  /** Stroke color class, e.g. text-success */
  className?: string;
  /** Accessible description of what the trend shows */
  ariaLabel: string;
  /** Fill under the line */
  fill?: boolean;
  width?: number;
  height?: number;
}

export function Sparkline({
  data,
  className = "text-brand-500",
  ariaLabel,
  fill = true,
  width = 120,
  height = 36,
}: SparklineProps) {
  const gradientId = useId();

  const path = useMemo(() => {
    if (data.length < 2) return { line: "", area: "" };
    const min = Math.min(...data);
    const max = Math.max(...data);
    const range = max - min || 1; // avoid divide-by-zero on flat series
    const pad = 2;
    const usableHeight = height - pad * 2;
    const step = width / (data.length - 1);

    const points = data.map((value, index) => {
      const x = index * step;
      const y = pad + usableHeight - ((value - min) / range) * usableHeight;
      return [x, y] as const;
    });

    const line = points
      .map(([x, y], i) => `${i === 0 ? "M" : "L"}${x.toFixed(2)},${y.toFixed(2)}`)
      .join(" ");
    const area = `${line} L${width},${height} L0,${height} Z`;
    return { line, area };
  }, [data, width, height]);

  if (data.length < 2) {
    return (
      <span className="inline-block text-xs text-text-muted" aria-label={ariaLabel}>
        Not enough data
      </span>
    );
  }

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className={cn("inline-block", className)}
      role="img"
      aria-label={ariaLabel}
    >
      {fill && (
        <>
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="currentColor" stopOpacity="0.25" />
              <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
            </linearGradient>
          </defs>
          <path d={path.area} fill={`url(#${gradientId})`} stroke="none" />
        </>
      )}
      <path
        d={path.line}
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
