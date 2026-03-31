import { InputHTMLAttributes, forwardRef } from 'react';
import { cn } from '../../utils/cn';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, id, ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label htmlFor={id} className="block text-sm font-medium text-text-secondary mb-1">
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={id}
          className={cn(
            'w-full bg-surface-2 border border-glass-border rounded-lg px-4 py-2.5 text-text-primary',
            'focus:outline-none focus:ring-2 focus:ring-gold-primary/50 focus:border-gold-primary transition-all',
            'placeholder:text-text-muted',
            error && 'border-danger focus:ring-danger/50 focus:border-danger',
            className
          )}
          {...props}
        />
        {error && <p className="mt-1 text-sm text-danger">{error}</p>}
      </div>
    );
  }
);
Input.displayName = 'Input';

export { Input };
