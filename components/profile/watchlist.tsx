"use client"

import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { supabase } from '@/lib/supabase'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { MediaCard } from '@/components/media-card'

interface WatchlistProps {
  userId: string;
}

export function Watchlist({ userId }: WatchlistProps) {
  const { t } = useTranslation('common')
  const [mediaItems, setMediaItems] = useState<{
    watching: any[];
    planToWatch: any[];
    completed: any[];
  }>({
    watching: [],
    planToWatch: [],
    completed: []
  })

  useEffect(() => {
    async function fetchWatchlist() {
      if (!userId) return;

      try {
        const { data, error } = await supabase
          .from('user_media_statuses')
          .select(`
            status,
            media_items!inner (
              id,
              title,
              poster_url,
              type,
              year
            )
          `)
          .eq('user_id', userId);

        if (error) throw error;

        if (data) {
          setMediaItems({
            watching: data.filter(item => item.status === 'watching').map(item => item.media_items),
            planToWatch: data.filter(item => item.status === 'plan_to_watch').map(item => item.media_items),
            completed: data.filter(item => item.status === 'completed').map(item => item.media_items)
          });
        }
      } catch (error) {
        console.error('Error fetching watchlist:', error);
      }
    }

    fetchWatchlist();
  }, [userId]);

  return (
    <Tabs defaultValue="watching">
      <TabsList>
        <TabsTrigger value="watching">
          {t('profile.watchlist.watching')} ({mediaItems.watching.length})
        </TabsTrigger>
        <TabsTrigger value="plan_to_watch">
          {t('profile.watchlist.planToWatch')} ({mediaItems.planToWatch.length})
        </TabsTrigger>
        <TabsTrigger value="completed">
          {t('profile.watchlist.completed')} ({mediaItems.completed.length})
        </TabsTrigger>
      </TabsList>

      <TabsContent value="watching" className="mt-4">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {mediaItems.watching.map((item) => (
            <MediaCard key={item.id} media={item} compact />
          ))}
        </div>
      </TabsContent>

      <TabsContent value="plan_to_watch" className="mt-4">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {mediaItems.planToWatch.map((item) => (
            <MediaCard key={item.id} media={item} compact />
          ))}
        </div>
      </TabsContent>

      <TabsContent value="completed" className="mt-4">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {mediaItems.completed.map((item) => (
            <MediaCard key={item.id} media={item} compact />
          ))}
        </div>
      </TabsContent>
    </Tabs>
  )
}
