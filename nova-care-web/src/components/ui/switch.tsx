'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

interface SwitchProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  label?: string;
  description?: string;
}

export const Switch = React.forwardRef<HTMLButtonElement, SwitchProps>(
  ({ checked, onCheckedChange, className, label, description, disabled, ...props }, ref) => {
    return (
      <div className="flex items-center justify-between gap-4">
        {(label || description) && (
          <div className="space-y-0.5">
            {label && <p className="text-xs font-extrabold text-slate-900 dark:text-white">{label}</p>}
            {description && <p className="text-[11px] text-slate-500 font-medium">{description}</p>}
          </div>
        )}
        <button
          type="button"
          role="switch"
          aria-checked={checked}
          disabled={disabled}
          onClick={() => onCheckedChange(!checked)}
          ref={ref}
          className={cn(
            'relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-[#0c4b39] focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
            checked ? 'bg-emerald-600' : 'bg-slate-300 dark:bg-slate-700',
            className
          )}
          {...props}
        >
          <span
            className={cn(
              'pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out',
              checked ? 'translate-x-5' : 'translate-x-0'
            )}
          />
        </button>
      </div>
    );
  }
);

Switch.displayName = 'Switch';
