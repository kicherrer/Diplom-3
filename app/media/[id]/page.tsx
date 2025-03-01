"use client"

import { useState, useEffect, useCallback } from 'react'
import { useParams } from 'next/navigation'
import { useTranslation } from 'react-i18next'
import Image from 'next/image'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"
import { motion } from "framer-motion"
import { Star, MessageSquare, Clock, Film, PlayCircle } from "lucide-react"

export default function MediaPage() {
  const { id } = useParams()
  const { t } = useTranslation('common')
  const [media, setMedia] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [userRating, setUserRating] = useState<number | null>(null)
  const [comment, setComment] = useState('')
  const [comments, setComments] = useState<any[]>([])
  const [showVideo, setShowVideo] = useState(false)

  const fetchMedia = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('media_items')
        .select(`
          *,
          media_genres (
            genres (*)
          ),
          media_persons (
            persons (*),
            role,
            character_name
          )
        `)
        .eq('id', id)
        .single()

      if (error) throw error
      setMedia(data)
    } catch (error) {
      console.error('Error fetching media:', error)
      toast.error('Failed to load media')
    } finally {
      setLoading(false)
    }
  }, [id])

  const fetchComments = useCallback(async () => {
    const { data } = await supabase
      .from('comments')
      .select(`
        *,
        profiles (username, avatar_url)
      `)
      .eq('media_id', id)
      .order('created_at', { ascending: false })

    if (data) setComments(data)
  }, [id])

  const fetchUserRating = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data } = await supabase
      .from('ratings')
      .select('rating')
      .eq('media_id', id)
      .eq('user_id', user.id)
      .single()

    if (data) setUserRating(data.rating)
  }, [id])

  useEffect(() => {
    fetchMedia()
    fetchComments()
    fetchUserRating()
  }, [fetchMedia, fetchComments, fetchUserRating])

  const handleRate = async (rating: number) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        toast.error('Please sign in to rate')
        return
      }

      const { error } = await supabase
        .from('ratings')
        .upsert({
          media_id: id,
          user_id: user.id,
          rating
        })

      if (error) throw error

      setUserRating(rating)
      toast.success('Rating saved')
      fetchMedia()
    } catch (error) {
      console.error('Error rating:', error)
      toast.error('Failed to save rating')
    }
  }

  const handleComment = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        toast.error('Please sign in to comment')
        return
      }

      const { error } = await supabase
        .from('comments')
        .insert({
          media_id: id,
          user_id: user.id,
          content: comment
        })

      if (error) throw error

      setComment('')
      toast.success('Comment added')
      fetchComments()
    } catch (error) {
      console.error('Error commenting:', error)
      toast.error('Failed to add comment')
    }
  }

  if (loading) {
    return <div>Loading...</div>
  }

  if (!media) {
    return <div>Media not found</div>
  }

  return (
    <div className="max-w-6xl mx-auto px-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left column - Poster and basic info */}
        <div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Card>
              <CardContent className="p-0">
                <div className="relative aspect-[2/3] w-full">
                  <Image
                    src={media.poster_url}
                    alt={media.title}
                    fill
                    className="rounded-t-lg object-cover"
                    priority
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  />
                </div>
                <div className="p-4">
                  <div className="flex items-center gap-2 mb-4">
                    <Badge>{media.type}</Badge>
                    <Badge variant="outline">{media.year}</Badge>
                    <Badge variant="outline">{media.duration}m</Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <Star className="h-5 w-5 text-yellow-500" />
                    <span className="text-lg font-bold">{media.rating || 'No ratings'}</span>
                    <span className="text-sm text-muted-foreground">
                      ({media.ratings_count || 0} ratings)
                    </span>
                  </div>
                  <Button 
                    className="w-full mt-4 gap-2"
                    onClick={() => setShowVideo(true)}
                  >
                    <PlayCircle className="h-4 w-4" />
                    Watch Now
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Right column - Details, cast, comments */}
        <div className="md:col-span-2">
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className="text-3xl font-bold mb-2">{media.title}</h1>
            {media.original_title && (
              <p className="text-muted-foreground mb-4">{media.original_title}</p>
            )}
            
            {showVideo && (
              <div className="aspect-video w-full mb-6 rounded-lg overflow-hidden">
                <video 
                  src={media.video_url} 
                  controls 
                  className="w-full h-full"
                  autoPlay
                >
                  Your browser does not support the video tag.
                </video>
              </div>
            )}
            
            <Tabs defaultValue="overview" className="mt-6">
              <TabsList>
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="cast">Cast & Crew</TabsTrigger>
                <TabsTrigger value="comments">Comments</TabsTrigger>
              </TabsList>

              {/* Rest of the tabs content remains the same */}
              {/* ...existing code... */}
            </Tabs>
          </motion.div>
        </div>
      </div>
    </div>
  )
}
