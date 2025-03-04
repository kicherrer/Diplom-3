"use client"

import Image from 'next/image'
import Link from 'next/link'
import { StarRating } from './star-rating'
import { Badge } from './ui/badge'
import { Eye } from 'lucide-react'
import { useState } from 'react'

interface MediaCardProps {
  media: any
  rating: number
  views: number
}

export function MediaCard({ media, rating, views }: MediaCardProps) {
  const [imageError, setImageError] = useState(false)

  return (
    <Link href={`/watch/${media.id}`}>
      <div className="group relative overflow-hidden rounded-lg">
        <div className="aspect-[2/3] relative">
          <Image
            src={imageError ? '/placeholder-image.jpg' : media.poster_url}
            alt={media.title}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            className="object-cover transition-transform group-hover:scale-105"
            priority={false}
            onError={() => setImageError(true)}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
            <div className="absolute bottom-0 p-4 text-white">
              <p className="text-sm line-clamp-2">{media.description}</p>
            </div>
          </div>
        </div>
        <div className="p-2">
          <h3 className="font-medium line-clamp-1">{media.title}</h3>
          <div className="flex items-center justify-between mt-1">
            <div className="flex items-center gap-2">
              <StarRating value={rating} readOnly size="sm" />
              <span className="text-sm text-muted-foreground">
                ({media.ratings.length})
              </span>
            </div>
            <div className="flex items-center gap-1 text-muted-foreground">
              <Eye className="h-4 w-4" />
              <span className="text-sm">{views}</span>
            </div>
          </div>
          <div className="flex items-center gap-2 mt-2">
            <Badge variant="secondary" className="text-xs">
              {media.year}
            </Badge>
            <Badge variant="outline" className="text-xs">
              {media.type}
            </Badge>
          </div>
        </div>
      </div>
    </Link>
  )
}
