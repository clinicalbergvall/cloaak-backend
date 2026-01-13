import React from 'react'

// Workaround for React import issues
const forwardRef = (React as any).forwardRef;
const InputHTMLAttributes: any = null;
import { nanoid } from 'nanoid'

interface InputProps {
  label?: string
  error?: string
  helperText?: string
  icon?: any
}

export const Input = forwardRef(
  ({ label, error, helperText, icon, className = '', id, ...props }: any, ref: any) => {
    const generatedId = id || nanoid();
    
    return (
      <div className="w-full">
        {label && (
          <label 
            htmlFor={generatedId}
            className="block text-sm font-semibold text-gray-700 mb-1.5">
            {label}
          </label>
        )}
        <div className="relative">
          {icon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
              {icon}
            </div>
          )}
          <input
            id={generatedId}
            ref={ref}
            className={`
              w-full rounded-lg border px-3 py-2.5 text-base
              ${icon ? 'pl-10' : ''}
              ${error ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-black'}
              focus:outline-none focus:ring-2 focus:border-transparent
              disabled:bg-gray-50 disabled:cursor-not-allowed
              transition-all
              ${className}
            `}
            {...props}
          />
        </div>
        {error && (
          <p className="mt-1.5 text-sm text-red-600 flex items-center gap-1">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            {error}
          </p>
        )}
        {helperText && !error && (
          <p className="mt-1.5 text-sm text-gray-500">{helperText}</p>
        )}
      </div>
    )
  }
)

Input.displayName = 'Input'
