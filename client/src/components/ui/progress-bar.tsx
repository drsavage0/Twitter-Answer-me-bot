import React from 'react';
import { cn } from '@/lib/utils';

interface ProgressSegment {
  label: string;
  value: number;
  color: string;
}

interface ProgressBarProps {
  segments: ProgressSegment[];
  height?: string;
  className?: string;
}

export function ProgressBar({
  segments,
  height = "h-8",
  className,
}: ProgressBarProps) {
  // Ensure all segments add up to 100%
  const total = segments.reduce((sum, segment) => sum + segment.value, 0);
  const normalizedSegments = segments.map(segment => ({
    ...segment,
    value: total > 0 ? (segment.value / total) * 100 : 0
  }));

  return (
    <div className={cn("w-full bg-gray-800 rounded-full overflow-hidden", height, className)}>
      <div className="flex h-full text-xs text-center text-white">
        {normalizedSegments.map((segment, index) => (
          <div
            key={index}
            className={cn(segment.color, "h-full flex items-center justify-center")}
            style={{ width: `${segment.value}%` }}
          >
            {segment.value >= 8 && (
              <span className="px-2">
                {segment.label} ({Math.round(segment.value)}%)
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
