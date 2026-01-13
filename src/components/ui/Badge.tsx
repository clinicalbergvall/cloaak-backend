import React from 'react';

type BadgeProps = any & {
  variant?: 'default' | 'success' | 'warning' | 'error' | 'secondary' | 'outline'
};

export function Badge({ variant = 'default', className = '', children, ...props }: BadgeProps) {
  const variants: Record<NonNullable<BadgeProps['variant']>, string> = {
    default: 'bg-gray-100 text-gray-800 border-gray-200',
    success: 'bg-green-100 text-green-800 border-green-200',
    warning: 'bg-yellow-100 text-yellow-900 border-yellow-300',
    error: 'bg-red-100 text-red-800 border-red-200',
    secondary: 'bg-yellow-50 text-yellow-800 border-yellow-200',
    outline: 'bg-transparent text-gray-700 border-gray-300'
  }
  
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </span>
  )
}
