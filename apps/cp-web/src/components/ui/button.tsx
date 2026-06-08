import * as React from 'react';
import { cn } from '@/lib/utils';

export function Button({ className, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      className={cn('inline-flex items-center rounded-md border px-3 py-1.5 text-sm font-medium hover:bg-gray-100 disabled:opacity-50', className)}
      {...props}
    />
  );
}
