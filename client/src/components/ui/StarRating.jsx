import React from 'react'
import { Star } from 'lucide-react'

export default function StarRating({ rating = 0, max = 5, size = 'sm', interactive = false, onChange }) {
  const sizes = { sm: 'w-4 h-4', md: 'w-5 h-5', lg: 'w-6 h-6' }
  const sz = sizes[size] || sizes.sm

  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: max }).map((_, i) => (
        <Star
          key={i}
          className={`${sz} transition-all ${
            i < Math.round(rating)
              ? 'fill-amber-400 text-amber-400'
              : 'text-white/15'
          } ${interactive ? 'cursor-pointer hover:scale-110' : ''}`}
          onClick={() => interactive && onChange && onChange(i + 1)}
        />
      ))}
    </div>
  )
}
