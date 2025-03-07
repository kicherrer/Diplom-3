"use client"

import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { supabase } from '@/lib/supabase'
import { formatDistanceToNow } from 'date-fns'
import { toast } from 'sonner'
import { useUser } from '@/hooks/use-user'
import { ru } from 'date-fns/locale'

interface CommentType {
  id: string
  content: string
  created_at: string
  user_id: string
  profile?: {
    username: string
    avatar_url: string
  }
}

interface CommentSectionProps {
  mediaId: string
  comments?: CommentType[]
  onCommentAdded: () => void
}

export function CommentSection({ mediaId, comments = [], onCommentAdded }: CommentSectionProps) {
  const { t, i18n } = useTranslation('common')
  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(false)
  const { user } = useUser()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!content.trim()) return

    try {
      setLoading(true)
      if (!user) {
        toast.error(t('watch.login.requiredComment'))
        return
      }

      const { error } = await supabase
        .from('comments')
        .insert({
          media_id: mediaId,
          user_id: user.id,
          content: content.trim()
        })

      if (error) throw error

      setContent('')
      onCommentAdded()
      toast.success(t('watch.success.comment'))
    } catch (error) {
      console.error('Error adding comment:', error)
      toast.error(t('watch.error.comment'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">{t('watch.comments')}</h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        <Textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder={user ? t('watch.addComment') : t('watch.login.requiredComment')}
          rows={3}
          disabled={!user}
        />
        <Button type="submit" disabled={loading || !content.trim() || !user}>
          {loading ? t('common.loading') : t('watch.submit')}
        </Button>
      </form>

      <div className="space-y-4">
        {comments.map((comment) => (
          <div key={comment.id} className="flex gap-4">
            <Avatar>
              <AvatarImage src={comment.profile?.avatar_url} />
              <AvatarFallback>{comment.profile?.username?.[0] || '?'}</AvatarFallback>
            </Avatar>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-medium">{comment.profile?.username}</span>
                <span className="text-sm text-muted-foreground">
                  {formatDistanceToNow(new Date(comment.created_at), {
                    addSuffix: true,
                    locale: i18n.language === 'ru' ? ru : undefined
                  })}
                </span>
              </div>
              <p className="mt-1">{comment.content}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
