"use client"

import { useCallback, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslation } from 'react-i18next'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { supabase } from "@/lib/supabase"
import { MediaForm } from '@/components/admin/media-form'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'

export default function AddMediaPage() {
  const { t } = useTranslation('common')
  const router = useRouter()

  const checkAdminAccess = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/')
        return
      }

      const { data } = await supabase
        .from('profiles')
        .select('is_admin')
        .eq('id', user.id)
        .single()

      if (!data?.is_admin) {
        router.push('/')
        return
      }
    } catch (error) {
      console.error('Error checking admin access:', error)
      router.push('/')
    }
  }, [router])

  useEffect(() => {
    checkAdminAccess()
  }, [checkAdminAccess])

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
        <h1 className="text-2xl font-bold">{t('admin.media.addNew')}</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t('admin.media.addNew')}</CardTitle>
        </CardHeader>
        <CardContent>
          <MediaForm />
        </CardContent>
      </Card>
    </div>
  )
}
