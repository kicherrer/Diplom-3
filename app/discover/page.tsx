"use client"

import { useState, useEffect, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { useDebounce } from '@/lib/hooks/use-debounce'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Slider } from '@/components/ui/slider'
import { MediaCard } from '@/components/media-card'
import { supabase } from '@/lib/supabase'
import { Search, Filter, SortDesc } from 'lucide-react'

type SortOption = 'rating' | 'views' | 'newest' | 'oldest'
type MediaType = 'all' | 'movie' | 'tv'

interface FilterState {
  search: string
  type: MediaType
  genres: string[]
  year: [number, number]
  rating: number
  sort: SortOption
}

interface Genre {
  id: string
  name: string
  name_ru: string
  displayName?: string
}

interface MediaGenre {
  id: string;
  genre: {
    id: string;
    name: string;
    name_ru: string;
  }
}

interface MediaItem {
  id: string;
  title: string;
  type: string;
  year: number;
  media_genres: MediaGenre[];
  ratings: Array<{ rating: number }>;
  media_views: Array<{ count: number }>;
}

interface ProcessedMediaItem extends MediaItem {
  genres: { id: string; name: string; }[];
  averageRating: number;
  viewCount: number;
}

export default function DiscoverPage() {
  const { t, i18n } = useTranslation('common')
  const [filters, setFilters] = useState<FilterState>({
    search: '',
    type: 'all',
    genres: [],
    year: [1900, new Date().getFullYear()],
    rating: 0,
    sort: 'rating'
  })
  const [media, setMedia] = useState<any[]>([])
  const [genres, setGenres] = useState<Genre[]>([])
  const [loading, setLoading] = useState(true)
  
  const debouncedSearch = useDebounce(filters.search, 300)

  // Fetch genres
  const fetchGenres = useCallback(async () => {
    const { data } = await supabase
      .from('genres')
      .select('id, name, name_ru')
    if (data) {
      const processedGenres: Genre[] = data.map(genre => ({
        ...genre,
        displayName: i18n.language === 'ru' ? genre.name_ru : genre.name
      }));
      setGenres(processedGenres);
    }
  }, [i18n.language])

  // Fetch media with filters
  const fetchMedia = useCallback(async () => {
    try {
      setLoading(true)
      let query = supabase
        .from('media_items')
        .select(`
          *,
          media_genres (
            genres (
              id,
              name,
              name_ru
            )
          ),
          ratings (
            rating,
            user_id
          ),
          media_views (
            count
          )
        `)

      // Search filter
      if (debouncedSearch) {
        const searchTerm = debouncedSearch.toLowerCase().trim()
        query = query.or(
          `title.ilike.%${searchTerm}%,original_title.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`
        )
      }

      // Type filter
      if (filters.type !== 'all') {
        query = query.eq('type', filters.type)
      }

      // Year range - исправленная версия
      query = query
        .gte('year', filters.year[0])
        .lte('year', filters.year[1])

      const { data, error } = await query

      if (error) {
        console.error('Query error details:', error)
        throw error
      }

      // Process data with corrected property access
      const processedData = (data || []).map((item: MediaItem) => ({
        ...item,
        genres: item.media_genres
          ?.map(mg => ({
            id: mg.genre.id,
            name: i18n.language === 'ru' ? mg.genre.name_ru : mg.genre.name
          }))
          .filter(Boolean) || [],
        averageRating: item.ratings?.length > 0
          ? item.ratings.reduce((acc, curr) => acc + (curr.rating || 0), 0) / item.ratings.length
          : 0,
        viewCount: item.media_views?.[0]?.count || 0
      }))

      // Фильтрация и сортировка
      const filteredAndSortedData = processedData
        .filter(item => item.averageRating >= filters.rating)
        .sort((a, b) => {
          switch (filters.sort) {
            case 'rating':
              return b.averageRating - a.averageRating
            case 'views':
              return (b.viewCount || 0) - (a.viewCount || 0)
            case 'newest':
              return b.year - a.year
            case 'oldest':
              return a.year - b.year
            default:
              return 0
          }
        })

      setMedia(filteredAndSortedData)
    } catch (error) {
      console.error('Supabase query error:', error)
      setMedia([])
    } finally {
      setLoading(false)
    }
  }, [debouncedSearch, filters, i18n.language])

  useEffect(() => {
    fetchGenres()
  }, [fetchGenres])

  useEffect(() => {
    fetchMedia()
  }, [fetchMedia])

  return (
    <div className="container py-6">
      {/* Search and Filters */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 pb-4 mb-6">
        <div className="flex flex-col gap-4 max-w-5xl mx-auto">
          <div className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={t('discover.searchPlaceholder')}
                value={filters.search}
                onChange={(e) => setFilters(f => ({ ...f, search: e.target.value }))}
                className="pl-9"
              />
            </div>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setFilters(f => ({
                ...f,
                search: '',
                type: 'all',
                genres: [],
                rating: 0,
                sort: 'rating'
              }))}
            >
              {t('discover.filter.clear')}
            </Button>
          </div>

          <div className="flex flex-wrap gap-4">
            <Select
              value={filters.type}
              onValueChange={(value: MediaType) => setFilters(f => ({ ...f, type: value }))}
            >
              <SelectTrigger className="w-[130px]">
                <SelectValue placeholder={t('discover.filter.category')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('discover.filter.all')}</SelectItem>
                <SelectItem value="movie">{t('discover.filter.movies')}</SelectItem>
                <SelectItem value="tv">{t('discover.filter.tvShows')}</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={filters.sort}
              onValueChange={(value: SortOption) => setFilters(f => ({ ...f, sort: value }))}
            >
              <SelectTrigger className="w-[130px]">
                <SelectValue placeholder={t('discover.filter.sort')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="rating">{t('discover.sort.rating')}</SelectItem>
                <SelectItem value="views">{t('discover.sort.views')}</SelectItem>
                <SelectItem value="newest">{t('discover.sort.newest')}</SelectItem>
                <SelectItem value="oldest">{t('discover.sort.oldest')}</SelectItem>
              </SelectContent>
            </Select>

            <Select>
              <SelectTrigger className="w-[130px]">
                <SelectValue placeholder={t('discover.filter.genre')} />
              </SelectTrigger>
              <SelectContent>
                {genres.map(genre => (
                  <SelectItem
                    key={genre.id}
                    value={genre.id}
                    onSelect={() => setFilters(f => ({
                      ...f,
                      genres: [...f.genres, genre.id]
                    }))}
                  >
                    {genre.displayName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="flex items-center gap-2">
              <span className="text-sm whitespace-nowrap">
                {t('discover.filter.minRating')}:
              </span>
              <Slider
                value={[filters.rating]}
                min={0}
                max={5}
                step={0.5}
                onValueChange={([value]) => setFilters(f => ({ ...f, rating: value }))}
                className="w-[150px]"
              />
              <span className="text-sm min-w-[2ch]">{filters.rating}</span>
            </div>
          </div>

          {filters.genres.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {filters.genres.map(genreId => {
                const genre = genres.find(g => g.id === genreId)
                return (
                  <Button
                    key={genreId}
                    variant="secondary"
                    size="sm"
                    onClick={() => setFilters(f => ({
                      ...f,
                      genres: f.genres.filter(id => id !== genreId)
                    }))}
                  >
                    {genre?.displayName} ×
                  </Button>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Results */}
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 max-w-7xl mx-auto">
          {[...Array(10)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="aspect-[2/3] bg-muted rounded-lg" />
              <div className="space-y-2 mt-2">
                <div className="h-4 bg-muted rounded w-3/4" />
                <div className="h-4 bg-muted rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <>
          {media.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 max-w-7xl mx-auto">
              {media.map((item) => (
                <MediaCard
                  key={item.id}
                  media={item}
                  rating={item.averageRating}
                  views={item.viewCount}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-lg text-muted-foreground">
                {t('discover.empty.description')}
              </p>
            </div>
          )}
        </>
      )}
    </div>
  )
}