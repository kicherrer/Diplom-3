"use client"

import { Star } from 'lucide-react'

interface StarRatingProps {
  value: number;
  onChange?: (value: number) => void;
  readOnly?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export function StarRating({ value, onChange, readOnly = false, size = 'md' }: StarRatingProps) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-5 w-5',
    lg: 'h-6 w-6'
  }

  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => !readOnly && onChange?.(star)}
          className={`p-0.5 ${readOnly ? 'cursor-default' : 'cursor-pointer'}`}
          disabled={readOnly}
        >
          <Star
            className={`${sizeClasses[size]} ${
              star <= value
                ? 'fill-yellow-500 text-yellow-500'
                : 'text-muted-foreground'
            }`}
          />
        </button>
      ))}
      <span className="ml-2 text-sm text-muted-foreground">
        {value.toFixed(1)}
      </span>
    </div>
  )
}
