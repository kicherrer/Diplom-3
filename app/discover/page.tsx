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
  const [genres, setGenres] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  
  const debouncedSearch = useDebounce(filters.search, 300)

  // Fetch genres
  const fetchGenres = useCallback(async () => {
    const { data } = await supabase
      .from('genres')
      .select('id, name, name_ru')
    if (data) {
      const processedGenres = data.map(genre => ({
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
          media_genres!left (
            genres (
              id,
              name,
              name_ru
            )
          ),
          ratings!left (
            rating,
            user_id
          ),
          media_persons!left (
            role,
            character_name,
            persons (
              id,
              name,
              photo_url
            )
          ),
          media_views!left (
            count
          )
        `)

      // Улучшенный поиск с учетом частичных совпадений
      if (debouncedSearch) {
        const searchTerms = debouncedSearch.toLowerCase().trim().split(' ')
        const searchConditions = searchTerms.map(term => `
          or(
            title.ilike.%${term}%,
            original_title.ilike.%${term}%,
            description.ilike.%${term}%
          )
        `).join(',')
        
        query = query.or(searchConditions)
      }

      // Фильтр по типу
      if (filters.type !== 'all') {
        query = query.eq('type', filters.type)
      }

      // Фильтр по жанрам (исправленный)
      if (filters.genres.length > 0) {
        query = query.in('media_genres.genre_id', filters.genres)
      }

      // Фильтр по годам
      query = query
        .gte('year', filters.year[0])
        .lte('year', filters.year[1])

      console.log('Executing query...') // Заменяем проблемную строку на простой лог
      
      let { data, error } = await query

      if (error) {
        console.error('Query error:', error)
        throw error
      }

      console.log('Raw data:', data) // Для отладки

      // Обработка данных
      const processedData = (data || []).map(item => ({
        ...item,
        genres: item.media_genres?.map((mg: any) => ({
          id: mg.genres.id,
          name: i18n.language === 'ru' ? mg.genres.name_ru : mg.genres.name
        })).filter(Boolean) || [],
        averageRating: item.ratings?.length > 0
          ? item.ratings.reduce((acc: number, curr: any) => acc + (curr.rating || 0), 0) / item.ratings.length
          : 0,
        viewCount: item.media_views?.[0]?.count || 0,
        actors: item.media_persons?.filter((mp: any) => mp.role === 'actor').map((mp: any) => ({
          name: mp.persons.name,
          photo: mp.persons.photo_url,
          character: mp.character_name
        })) || [],
        directors: item.media_persons?.filter((mp: any) => mp.role === 'director').map((mp: any) => ({
          name: mp.persons.name,
          photo: mp.persons.photo_url
        })) || []
      }))

      // Фильтрация по рейтингу и сортировка
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

      console.log('Filtered data:', filteredAndSortedData) // Для отладки
      setMedia(filteredAndSortedData)
    } catch (error) {
      console.error('Error fetching media:', error)
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
    <div className="container py-8">
      {/* Search and Filters */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 pb-6">
        <div className="flex flex-col gap-4">
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
              <SelectTrigger className="w-[150px]">
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
              <SelectTrigger className="w-[150px]">
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
              <SelectTrigger className="w-[150px]">
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
              <span className="text-sm">{t('discover.filter.minRating')}:</span>
              <Slider
                value={[filters.rating]}
                min={0}
                max={5}
                step={0.5}
                onValueChange={([value]) => setFilters(f => ({ ...f, rating: value }))}
                className="w-[200px]"
              />
              <span className="text-sm">{filters.rating}</span>
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
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {[...Array(8)].map((_, i) => (
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
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {media.map((item) => (
            <MediaCard
              key={item.id}
              media={item}
              rating={item.averageRating}
              views={item.viewCount}
            />
          ))}
        </div>
      )}
    </div>
  )
}