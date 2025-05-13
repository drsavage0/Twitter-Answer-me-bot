import React from 'react';
import { cn } from '@/lib/utils';

interface StatisticProps {
  value: string | number;
  label: string;
  valueClassName?: string;
  labelClassName?: string;
  className?: string;
}

export function Statistic({
  value,
  label,
  valueClassName,
  labelClassName,
  className,
}: StatisticProps) {
  return (
    <div className={cn("text-center", className)}>
      <div className={cn("text-3xl font-bold text-twitter-blue", valueClassName)}>
        {value}
      </div>
      <div className={cn("text-twitter-text-secondary text-sm", labelClassName)}>
        {label}
      </div>
    </div>
  );
}
