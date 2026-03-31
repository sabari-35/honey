import { HTMLAttributes, forwardRef } from 'react';
import { cn } from '../../utils/cn';

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: 'gold' | 'success' | 'danger' | 'neutral';
}

const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant = 'neutral', ...props }, ref) => {
    const variants = {
      gold: 'bg-gold-glow text-gold-primary border-gold-primary/30',
      success: 'bg-success/10 text-success border-success/30',
      danger: 'bg-danger/10 text-danger border-danger/30',
      neutral: 'bg-surface-2 text-text-secondary border-glass-border',
    };

    return (
      <span
        ref={ref}
        className={cn(
          'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border',
          variants[variant],
          className
        )}
        {...props}
      />
    );
  }
);
Badge.displayName = 'Badge';

export { Badge };
