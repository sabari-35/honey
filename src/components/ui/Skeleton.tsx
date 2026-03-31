import { HTMLAttributes } from 'react';
import { cn } from '../../utils/cn';

export function Skeleton({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'animate-pulse rounded-lg bg-surface-2/50 border border-glass-border',
        className
      )}
      {...props}
    />
  );
}
