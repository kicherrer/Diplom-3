"use client"

import Image from 'next/image'
import Link from 'next/link'
import { StarRating } from './star-rating'
import { Badge } from './ui/badge'
import { Eye } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'

interface Genre {
  id: string
  name: string
  name_ru: string
}

interface MediaGenre {
  id: string
  genres: {
    id: string
    name: string
    name_ru: string
  }
}

interface Media {
  id: string
  title: string
  description: string
  poster_url: string
  type: 'movie' | 'tv'
  year: number
  categories?: {
    id: string
    name: string
    name_ru: string
  }
  media_genres?: MediaGenre[]
  ratings?: Array<{
    rating: number
  }>
}

interface MediaCardProps {
  media: Media
  rating: number
  views: number
}

export function MediaCard({ media, rating, views }: MediaCardProps) {
  const { t, i18n } = useTranslation('common')
  const [imageError, setImageError] = useState(false)

  const genres = media.media_genres?.map(mg => ({
    id: mg.genres.id,
    name: i18n.language === 'ru' ? mg.genres.name_ru : mg.genres.name
  })) || []

  return (
    <Link href={`/watch/${media.id}`}>
      <div className="group relative rounded-lg overflow-hidden hover:ring-2 hover:ring-primary/50 transition-all">
        <div className="aspect-[2/3] relative">
          <Image
            src={imageError ? '/placeholder-image.jpg' : media.poster_url}
            alt={media.title}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 20vw"
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            onError={() => setImageError(true)}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/0 opacity-0 group-hover:opacity-100 transition-opacity">
            <div className="absolute bottom-0 p-3">
              <p className="text-xs text-white/90 line-clamp-3">{media.description}</p>
            </div>
          </div>
        </div>
        <div className="p-2">
          <h3 className="font-medium text-sm line-clamp-1">{media.title}</h3>
          <div className="flex items-center justify-between mt-1">
            <div className="flex items-center gap-1 text-xs">
              <StarRating value={rating} readOnly size="sm" />
              <span className="text-muted-foreground whitespace-nowrap">
                ({media.ratings?.length || 0})
              </span>
            </div>
            <div className="flex items-center gap-1 text-muted-foreground">
              <Eye className="h-3 w-3" />
              <span className="text-xs">{views}</span>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-1 mt-2">
            <Badge variant="secondary" className="text-xs px-1">
              {media.year}
            </Badge>
            <Badge variant="outline" className="text-xs px-1">
              {t(`media.types.${media.type}`)}
            </Badge>
            {media.categories && (
              <Badge variant="default" className="text-xs px-1 bg-primary/10">
                {i18n.language === 'ru' ? media.categories.name_ru : media.categories.name}
              </Badge>
            )}
            {media.media_genres?.slice(0, 1).map((mg) => (
              <Badge key={mg.genres.id} variant="outline" className="text-xs px-1">
                {i18n.language === 'ru' ? mg.genres.name_ru : mg.genres.name}
              </Badge>
            ))}
          </div>
        </div>
      </div>
    </Link>
  )
}
