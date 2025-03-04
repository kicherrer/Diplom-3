"use client"

import { useCallback, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useTranslation } from 'react-i18next'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { supabase } from "@/lib/supabase"
import { MediaForm } from '@/components/admin/media-form'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'

export default function EditMediaPage() {
  const { t } = useTranslation('common')
  const router = useRouter()
  const params = useParams()
  const id = Array.isArray(params?.id) ? params.id[0] : params?.id

  // Move console.log here for debugging
  console.log('Edit Media ID:', id)

  const checkAdminAccess = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/')
        return
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('is_admin')
        .eq('id', user.id)
        .single()

      if (!profile?.is_admin) {
        router.push('/')
        return
      }

      // If we have an ID, verify the media item exists
      if (id) {
        const { data: mediaItem } = await supabase
          .from('media_items')
          .select('id')
          .eq('id', id)
          .single()

        if (!mediaItem) {
          router.push('/admin')
          return
        }
      }

    } catch (error) {
      console.error('Error checking access:', error)
      router.push('/')
    }
  }, [router, id])

  useEffect(() => {
    checkAdminAccess()
  }, [checkAdminAccess])

  if (!id) {
    return <div className="p-4">Invalid media ID</div>
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center gap-4 mb-6">
        <Button 
          variant="outline" 
          onClick={() => router.back()}
          className="gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          {t('admin.media.backToAdmin')}
        </Button>
        <h1 className="text-2xl font-bold">{t('admin.media.edit')}</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t('admin.media.edit')}</CardTitle>
        </CardHeader>
        <CardContent>
          <MediaForm isEditing id={id as string} />
        </CardContent>
      </Card>
    </div>
  )
}
