 import React from 'react';
 
 // Workaround for React import issues
 const forwardRef = (React as any).forwardRef;
import { useState } from 'react'
import toast from 'react-hot-toast'
import { saveUserSession } from '@/lib/storage'
import { Button } from './Button'

interface CardProps {
  variant?: 'default' | 'elevated' | 'outlined'
  hoverable?: boolean
  selected?: boolean
}

export const Card = forwardRef(
  ({ variant = 'default', hoverable, selected, className = '', children, ...props }: any, ref: any) => {
    const baseStyles = 'rounded-2xl transition-all'
    
    const variants = {
      default: 'bg-white border border-gray-200',
      elevated: 'bg-white shadow-lg border border-yellow-200',
      outlined: 'bg-white border-2 border-gray-300'
    }
    
    const hoverStyles = hoverable ? 'hover:shadow-md hover:border-yellow-300 cursor-pointer' : ''
    const selectedStyles = selected ? 'border-yellow-400 ring-2 ring-yellow-400/40 bg-yellow-50' : ''
    
    return (
      <div
        ref={ref}
        className={`${baseStyles} ${(variants as any)[variant]} ${hoverStyles} ${selectedStyles} ${className}`}
        {...props}
      >
        {children}
      </div>
    )
  }
)

Card.displayName = 'Card'
