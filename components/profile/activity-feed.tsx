"use client"

import { useEffect, useState, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { supabase } from '@/lib/supabase'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { Star, Play, MessageSquare, Book, CheckCircle } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { ru } from 'date-fns/locale'

interface ActivityFeedProps {
  userId: string;
}

export function ActivityFeed({ userId }: ActivityFeedProps) {
  const [activities, setActivities] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const { t, i18n } = useTranslation('common')

  const fetchActivities = useCallback(async () => {
    try {
      const { data: activities, error } = await supabase
        .from('user_activities')
        .select(`
          id,
          activity_type,
          status,
          rating,
          content,
          created_at,
          media:media_items (
            id,
            title,
            poster_url
          )
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(3)

      if (error) throw error
      console.log('Fetched activities:', activities) // для отладки
      setActivities(activities || [])
    } catch (error) {
      console.error('Error fetching activities:', error)
    } finally {
      setLoading(false)
    }
  }, [userId])

  useEffect(() => {
    fetchActivities()

    // Подписка на обновления
    const channel = supabase
      .channel('activities_channel')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'user_activities',
          filter: `user_id=eq.${userId}`
        },
        async (payload) => {
          // Получаем полные данные о новой активности
          const { data: activityData } = await supabase
            .from('user_activities')
            .select(`
              *,
              media:media_items (
                id,
                title,
                poster_url
              ),
              user:profiles!user_id(
                id,
                username,
                avatar_url
              )
            `)
            .eq('id', payload.new.id)
            .single()

          if (activityData) {
            setActivities(prev => [activityData, ...prev.slice(0, 2)])
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [fetchActivities, userId])

  if (loading) return <div>{t('loading')}</div>

  if (!activities || activities.length === 0) {
    return (
      <div className="text-center p-4 text-muted-foreground">
        {t('profile.activity.noActivity')}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {activities.map((activity) => (
        <div key={activity.id} className="flex items-start gap-4 p-4 rounded-lg border bg-card">
          <Avatar>
            <AvatarImage src={activity.media.poster_url} />
            <AvatarFallback>{activity.media.title[0]}</AvatarFallback>
          </Avatar>

          <div className="flex-1">
            <div className="flex items-center gap-2">
              {activity.activity_type === 'rating' && (
                <>
                  <Star className="h-4 w-4 text-yellow-500" />
                  <span dangerouslySetInnerHTML={{
                    __html: t('profile.activity.ratedMedia', {
                      title: activity.media.title,
                      rating: activity.rating
                    })
                  }} />
                </>
              )}

              {activity.activity_type === 'comment' && (
                <>
                  <MessageSquare className="h-4 w-4 text-green-500" />
                  <span dangerouslySetInnerHTML={{
                    __html: t('profile.activity.commentedMedia', {
                      title: activity.media.title
                    })
                  }} />
                </>
              )}

              {activity.activity_type === 'status_update' && (
                <>
                  {activity.status === 'watching' && (
                    <Play className="h-4 w-4 text-blue-500" />
                  )}
                  {activity.status === 'plan_to_watch' && (
                    <Book className="h-4 w-4 text-purple-500" />
                  )}
                  {activity.status === 'completed' && (
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  )}
                  <span dangerouslySetInnerHTML={{
                    __html: t(`profile.activity.statusUpdate.${activity.status}`, {
                      title: activity.media.title
                    })
                  }} />
                </>
              )}
            </div>

            {activity.activity_type === 'comment' && activity.comments && (
              <p className="mt-2 text-sm text-muted-foreground">
                &ldquo;{activity.comments.content}&rdquo;
              </p>
            )}

            <p className="text-xs text-muted-foreground mt-1">
              {formatDistanceToNow(new Date(activity.created_at), {
                addSuffix: true,
                locale: i18n.language === 'ru' ? ru : undefined
              })}
            </p>
          </div>
        </div>
      ))}
    </div>
  )
}
