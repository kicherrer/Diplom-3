"use client"

import { useState, useEffect, useCallback } from 'react'
import { useParams } from 'next/navigation'
import { useTranslation } from 'react-i18next'
import Image from 'next/image'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { supabase } from '@/lib/supabase'
import { StarRating } from '@/components/star-rating'
import { CommentSection } from '@/components/comment-section'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import { Clock, Calendar, Users } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { useUser } from '@/hooks/use-user'
import { toast } from 'sonner'

export default function WatchPage() {
  const { t } = useTranslation('common')
  const params = useParams()
  const id = Array.isArray(params?.id) ? params.id[0] : params?.id
  const [media, setMedia] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const { user } = useUser()
  const [userRating, setUserRating] = useState<number | null>(null)

  const getBunnyVideoUrl = (url: string) => {
    if (!url) return '';
    const libraryId = process.env.NEXT_PUBLIC_BUNNY_LIBRARY_ID;
    const videoId = url.split('/').pop()?.split('.')[0];
    return `https://iframe.mediadelivery.net/embed/${libraryId}/${videoId}`;
  };

  const fetchMediaData = useCallback(async () => {
    try {
      const { data, error } = await supabase
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
          media_persons!left (
            role,
            character_name,
            persons (
              id,
              name,
              photo_url
            )
          ),
          ratings!left (
            rating,
            user_id
          ),
          comments!left (
            id,
            content,
            created_at,
            user_id
          )
        `)
        .eq('id', id)
        .single()

      if (error) throw error

      // Если есть комментарии, получаем информацию о пользователях отдельно
      if (data?.comments && data.comments.length > 0) {
        const userIds = data.comments.map((c: any) => c.user_id)
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, username, avatar_url')
          .in('id', userIds)

        // Добавляем информацию о пользователях к комментариям
        data.comments = data.comments.map((comment: any) => ({
          ...comment,
          profile: profiles?.find((p: any) => p.id === comment.user_id)
        }))
      }

      console.log('Fetched media data:', data)
      setMedia(data)
    } catch (error) {
      console.error('Error fetching media:', error)
    } finally {
      setLoading(false)
    }
  }, [id])

  const handleRate = async (rating: number) => {
    try {
      if (!user) {
        toast.error(t('watch.login.required'))
        return
      }

      const { error } = await supabase
        .from('ratings')
        .upsert({
          media_id: id,
          user_id: user.id,
          rating
        }, {
          onConflict: 'media_id,user_id'
        })

      if (error) throw error

      setUserRating(rating)
      toast.success(t('watch.success.rating'))
      fetchMediaData()
    } catch (error) {
      console.error('Error rating:', error)
      toast.error(t('watch.error.rating'))
    }
  }

  useEffect(() => {
    fetchMediaData();
  }, [id, fetchMediaData]);

  if (loading) {
    return <div>Loading...</div>
  }

  if (!media) {
    return <div>Media not found</div>
  }

  const actors = media.media_persons?.filter((mp: any) => mp?.role === 'actor') || []
  const directors = media.media_persons?.filter((mp: any) => mp?.role === 'director') || []
  const genres = media.media_genres || []
  const ratings = media.ratings || []

  const averageRating = ratings.length > 0
    ? ratings.reduce((acc: number, curr: any) => acc + (curr?.rating || 0), 0) / ratings.length
    : 0

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section with Backdrop */}
      <div className="relative h-[70vh] w-full">
        {/* Backdrop Image */}
        <div className="absolute inset-0">
          <Image
            src={media.poster_url || '/placeholder-image.jpg'}
            alt={media.title}
            fill
            className="object-cover blur-sm opacity-30"
            sizes="100vw"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-background/20" />
        </div>

        {/* Content */}
        <div className="container relative h-full">
          <div className="flex items-end h-full pb-12 gap-8">
            {/* Poster */}
            <div className="hidden md:block w-64 flex-shrink-0">
              <div className="aspect-[2/3] relative rounded-lg overflow-hidden shadow-2xl">
                <Image
                  src={media.poster_url || '/placeholder-image.jpg'}
                  alt={media.title}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 256px"
                  priority
                />
              </div>
            </div>

            {/* Info */}
            <div className="flex-1 space-y-4">
              <h1 className="text-4xl md:text-5xl font-bold">{media.title}</h1>
              {media.original_title && (
                <p className="text-xl text-muted-foreground">{media.original_title}</p>
              )}

              <div className="flex flex-wrap items-center gap-4 text-sm">
                <Badge variant="secondary">{media.type}</Badge>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  <span>{media.duration} min</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  <span>{media.year}</span>
                </div>
                <StarRating value={averageRating} readOnly />
                <span className="text-muted-foreground">({ratings.length} ratings)</span>
              </div>

              <div className="flex flex-wrap gap-2">
                {genres.map((mg: any) => (
                  <Badge key={mg.genres?.id} variant="outline">
                    {mg.genres?.name}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-8">
            {/* Description */}
            <div className="prose dark:prose-invert max-w-none">
              <h2 className="text-2xl font-bold mb-4">{t('watch.about')}</h2>
              <p className="text-lg leading-relaxed">{media.description}</p>
            </div>

            {/* Video Player */}
            <div>
              <h2 className="text-2xl font-bold mb-4">{t('watch.watch')}</h2>
              <div className="aspect-video w-full rounded-lg overflow-hidden bg-muted shadow-lg">
                <iframe
                  src={getBunnyVideoUrl(media.video_url)}
                  className="w-full h-full"
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            </div>

            {/* Comments */}
            <div>
              <CommentSection
                mediaId={id || ''}
                comments={media.comments || []}
                onCommentAdded={fetchMediaData}
              />
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-8">
            {/* Rating Card */}
            <Card>
              <CardHeader>
                <CardTitle>{t('watch.rating')}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4">
                  <div className="text-4xl font-bold">{averageRating.toFixed(1)}</div>
                  <StarRating
                    value={userRating || 0}
                    onChange={handleRate}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Cast & Crew */}
            <Card>
              <CardHeader>
                <CardTitle>{t('watch.castAndCrew')}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Directors */}
                <div>
                  <h3 className="font-medium mb-3">{t('watch.directors')}</h3>
                  <div className="space-y-3">
                    {directors.map((director: any) => (
                      <div key={director.persons?.id} className="flex items-center gap-3">
                        <Avatar>
                          <AvatarImage src={director.persons?.photo_url} />
                          <AvatarFallback>{director.persons?.name?.[0]}</AvatarFallback>
                        </Avatar>
                        <span>{director.persons?.name}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Actors */}
                <div>
                  <h3 className="font-medium mb-3">{t('watch.cast')}</h3>
                  <div className="space-y-3">
                    {actors.map((actor: any) => (
                      <div key={actor.persons?.id} className="flex items-center gap-3">
                        <Avatar>
                          <AvatarImage src={actor.persons?.photo_url} />
                          <AvatarFallback>{actor.persons?.name?.[0]}</AvatarFallback>
                        </Avatar>
                        <div>
                          <div>{actor.persons?.name}</div>
                          <div className="text-sm text-muted-foreground">{actor.character_name}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
