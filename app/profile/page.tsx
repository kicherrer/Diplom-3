"use client"

import { useState, useEffect, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { supabase } from "@/lib/supabase"
import { toast } from "sonner"
import { motion } from "framer-motion"
import { format } from "date-fns"
import { useDropzone } from 'react-dropzone'
import { 
  User, Edit, Save, Film, Tv, Star, Calendar, Award, 
  Upload, ImageIcon, BarChart, Activity, Clock, MessageSquare,
  Palette, Badge as BadgeIcon, Link as LinkIcon, Settings, 
  Sparkles, Zap, Brush, RefreshCw
} from "lucide-react"

export default function ProfilePage() {
  const { t, i18n } = useTranslation('common')
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const [uploadingBanner, setUploadingBanner] = useState(false)
  const [achievements, setAchievements] = useState<any[]>([])
  const [stats, setStats] = useState({
    watchedMovies: 0,
    watchedShows: 0,
    totalRatings: 0
  })
  
  const [formData, setFormData] = useState({
    username: '',
    displayName: '',
    bio: '',
    theme: 'default',
    animation: 'subtle',
    useGifAvatar: false,
    useGifBanner: false,
    publicProfile: true,
    showActivity: true,
    showStats: true,
    socialLinks: {
      twitter: '',
      instagram: '',
      website: ''
    }
  })

  const fetchProfile = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (error) throw error
      
      setProfile(data)
      setFormData({
        username: data?.username || '',
        displayName: data?.display_name || '',
        bio: data?.bio || '',
        theme: data?.theme || 'default',
        animation: data?.animation || 'subtle',
        useGifAvatar: data?.use_gif_avatar || false,
        useGifBanner: data?.use_gif_banner || false,
        publicProfile: data?.public_profile !== false, // Changed from public_profile
        showActivity: data?.show_activity !== false,   // Changed from show_activity
        showStats: data?.show_stats !== false,         // Changed from show_stats
        socialLinks: data?.social_links || {
          twitter: '',
          instagram: '',
          website: ''
        }
      })
    } catch (error) {
      console.error('Error fetching profile:', error)
    } finally {
      setLoading(false)
    }
  }, []) // Remove supabase from dependencies since it's a stable instance

  useEffect(() => {
    fetchProfile()
    fetchAchievements()
    fetchStats()
  }, [fetchProfile]) // Add fetchProfile to dependencies, remove t since it's not used directly

  const fetchAchievements = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data, error } = await supabase
        .from('user_achievements')
        .select(`
          *,
          achievement:achievements(*)
        `)
        .eq('user_id', user.id)

      if (error) throw error
      setAchievements(data || [])
    } catch (error) {
      console.error('Error fetching achievements:', error)
    }
  }

  const fetchStats = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Get movie IDs first
      const { data: movieIds } = await supabase
        .from('media_items')
        .select('id')
        .eq('type', 'movie')

      // Get show IDs
      const { data: showIds } = await supabase
        .from('media_items')
        .select('id')
        .eq('type', 'tv')

      if (!movieIds || !showIds) return

      // Now use these IDs to count watched items
      const [movieWatched, showWatched, ratings] = await Promise.all([
        supabase
          .from('user_media_items')
          .select('id', { count: 'exact' })
          .eq('user_id', user.id)
          .eq('status', 'watched')
          .in('media_item_id', movieIds.map(m => m.id)),
        
        supabase
          .from('user_media_items')
          .select('id', { count: 'exact' })
          .eq('user_id', user.id)
          .eq('status', 'watched')
          .in('media_item_id', showIds.map(s => s.id)),
        
        supabase
          .from('user_media_items')
          .select('id', { count: 'exact' })
          .eq('user_id', user.id)
          .not('rating', 'is', null)
      ])

      setStats({
        watchedMovies: movieWatched.count || 0,
        watchedShows: showWatched.count || 0,
        totalRatings: ratings.count || 0
      })
    } catch (error) {
      console.error('Error fetching stats:', error)
    }
  }

  const updateProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        toast.error(t('auth.errors.notAuthenticated'))
        return
      }

      // Проверяем, существует ли профиль
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', user.id)
        .single()

      const profileData = {
        id: user.id,
        username: formData.username,
        display_name: formData.displayName,
        bio: formData.bio,
        theme: formData.theme,
        animation: formData.animation,
        use_gif_avatar: formData.useGifAvatar,
        use_gif_banner: formData.useGifBanner,
        public_profile: formData.publicProfile,
        show_activity: formData.showActivity,
        show_stats: formData.showStats,
        social_links: formData.socialLinks,
        updated_at: new Date().toISOString()
      }

      let error

      if (existingProfile) {
        // Обновляем существующий профиль
        const { error: updateError } = await supabase
          .from('profiles')
          .update(profileData)
          .eq('id', user.id)
        error = updateError
      } else {
        // Создаем новый профиль
        const { error: insertError } = await supabase
          .from('profiles')
          .insert([{ ...profileData, created_at: new Date().toISOString() }])
        error = insertError
      }

      if (error) throw error

      toast.success(t('profile.messages.saveSuccess'))
      setEditing(false)
      await fetchProfile()
    } catch (error: any) {
      console.error('Error updating profile:', error)
      toast.error(error.message || t('profile.messages.saveError'))
    }
  }

  const onAvatarDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return
    
    try {
      setUploadingAvatar(true)
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const file = acceptedFiles[0]
      const fileExt = file.name.split('.').pop()
      const filePath = `avatars/${user.id}-${Date.now()}.${fileExt}`

      console.log('Uploading avatar to:', filePath)
      
      // Check bucket exists
      const { data: buckets } = await supabase
        .storage
        .listBuckets()
      
      console.log('Available buckets:', buckets)

      // Загружаем файл
      const { error: uploadError, data: uploadData } = await supabase.storage
        .from('media')
        .upload(filePath, file, { 
          upsert: true,
          contentType: file.type 
        })

      if (uploadError) {
        console.error('Upload error details:', uploadError)
        throw uploadError
      }

      console.log('Upload successful:', uploadData)

      // Получаем публичный URL
      const { data: urlData } = supabase.storage
        .from('media')
        .getPublicUrl(filePath)

      console.log('Public URL:', urlData)

      if (!urlData?.publicUrl) {
        throw new Error('Failed to get public URL')
      }

      // Обновляем профиль
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ 
          avatar_url: urlData.publicUrl,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id)

      if (updateError) throw updateError

      toast.success(t('profile.messages.avatarUpdated'))
      await fetchProfile()
    } catch (error: any) {
      console.error('Full error object:', error)
      toast.error(error.message || t('profile.messages.avatarError'))
    } finally {
      setUploadingAvatar(false)
    }
  }, [t, fetchProfile])

  const onBannerDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return
    
    try {
      setUploadingBanner(true)
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const file = acceptedFiles[0]
      const fileExt = file.name.split('.').pop()
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}`
      const filePath = `banners/${fileName}.${fileExt}`

      // Загружаем файл
      const { error: uploadError, data: uploadData } = await supabase.storage
        .from('media')
        .upload(filePath, file, { 
          upsert: false, // Изменено с true на false
          contentType: file.type 
        })

      if (uploadError) {
        console.error('Upload error:', uploadError)
        throw uploadError
      }

      // Получаем публичный URL
      const { data: { publicUrl } } = supabase.storage
        .from('media')
        .getPublicUrl(filePath)

      if (!publicUrl) {
        throw new Error('Failed to get public URL')
      }

      // Обновляем профиль
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ 
          banner_url: publicUrl,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id)

      if (updateError) throw updateError

      toast.success(t('profile.messages.bannerUpdated'))
      await fetchProfile()
    } catch (error: any) {
      console.error('Upload error:', error)
      toast.error(error.message || t('profile.messages.bannerError'))
    } finally {
      setUploadingBanner(false)
    }
  }, [t, fetchProfile])

  const avatarDropzone = useDropzone({
    onDrop: onAvatarDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.gif']
    },
    maxFiles: 1,
    maxSize: 5 * 1024 * 1024 // 5MB
  })

  const bannerDropzone = useDropzone({
    onDrop: onBannerDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.gif']
    },
    maxFiles: 1,
    maxSize: 10 * 1024 * 1024 // 10MB
  })

  const resetToDefaults = () => {
    setFormData({
      ...formData,
      theme: 'default',
      animation: 'subtle',
      useGifAvatar: false,
      useGifBanner: false,
      publicProfile: true,
      showActivity: true,
      showStats: true
    })
    toast.info("Settings reset to defaults")
  }

  // Get theme-specific classes for profile elements
  const getThemeClasses = () => {
    const themes = {
      default: {
        banner: "bg-gradient-to-r from-blue-500 to-purple-600",
        avatar: "border-4 border-background",
        card: "bg-card",
        highlight: "bg-primary/10",
        text: "text-primary"
      },
      dark: {
        banner: "bg-gradient-to-r from-gray-800 to-gray-900",
        avatar: "border-4 border-gray-700",
        card: "bg-gray-900",
        highlight: "bg-gray-800",
        text: "text-gray-300"
      },
      neon: {
        banner: "bg-gradient-to-r from-purple-600 via-pink-500 to-red-500",
        avatar: "border-4 border-pink-500",
        card: "bg-gray-900",
        highlight: "bg-pink-500/20",
        text: "text-pink-500"
      },
      minimal: {
        banner: "bg-gray-100 dark:bg-gray-800",
        avatar: "border-4 border-white dark:border-gray-900",
        card: "bg-white dark:bg-gray-900",
        highlight: "bg-gray-100 dark:bg-gray-800",
        text: "text-gray-900 dark:text-gray-100"
      },
      retro: {
        banner: "bg-gradient-to-r from-yellow-400 to-orange-500",
        avatar: "border-4 border-yellow-400",
        card: "bg-amber-50 dark:bg-amber-900",
        highlight: "bg-yellow-400/20",
        text: "text-amber-700 dark:text-amber-300"
      },
      nature: {
        banner: "bg-gradient-to-r from-green-400 to-emerald-500",
        avatar: "border-4 border-emerald-500",
        card: "bg-emerald-50 dark:bg-emerald-900",
        highlight: "bg-emerald-500/20",
        text: "text-emerald-700 dark:text-emerald-300"
      },
      space: {
        banner: "bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500",
        avatar: "border-4 border-indigo-500",
        card: "bg-indigo-50 dark:bg-indigo-900",
        highlight: "bg-indigo-500/20",
        text: "text-indigo-700 dark:text-indigo-300"
      }
    }
    
    return themes[formData.theme as keyof typeof themes] || themes.default
  }

  // Animation variants based on user preference
  const getAnimationVariants = () => {
    const animations = {
      none: {
        initial: {},
        animate: {},
        transition: { duration: 0 }
      },
      subtle: {
        initial: { opacity: 0, y: 20 },
        animate: { opacity: 1, y: 0 },
        transition: { duration: 0.5 }
      },
      moderate: {
        initial: { opacity: 0, y: 40, scale: 0.95 },
        animate: { opacity: 1, y: 0, scale: 1 },
        transition: { duration: 0.7, type: "spring", stiffness: 100 }
      },
      intense: {
        initial: { opacity: 0, y: 60, scale: 0.9, rotate: -2 },
        animate: { opacity: 1, y: 0, scale: 1, rotate: 0 },
        transition: { duration: 0.9, type: "spring", stiffness: 150, damping: 8 }
      }
    }
    
    return animations[formData.animation as keyof typeof animations] || animations.subtle
  }

  const themeClasses = getThemeClasses()
  const animationVariants = getAnimationVariants()

  const formatDate = useCallback((date: string) => {
    try {
      return new Intl.DateTimeFormat(i18n.language, {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      }).format(new Date(date))
    } catch (error) {
      return date
    }
  }, [i18n.language])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-pulse flex flex-col items-center">
          <div className="rounded-full bg-muted h-24 w-24 mb-4"></div>
          <div className="h-8 bg-muted rounded w-48 mb-4"></div>
          <div className="h-4 bg-muted rounded w-64"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <motion.div
        initial={animationVariants.initial}
        animate={animationVariants.animate}
        transition={animationVariants.transition}
      >
        <div className="relative mb-8">
          <div 
            className={`h-48 rounded-lg overflow-hidden ${themeClasses.banner}`}
            style={profile?.banner_url ? { 
              backgroundImage: `url(${profile.banner_url})`, 
              backgroundSize: 'cover', 
              backgroundPosition: 'center',
              ...(formData.animation === 'intense' ? { 
                animation: 'pulse 8s infinite alternate' 
              } : {})
            } : {}}
          >
            {editing && (
              <div 
                {...bannerDropzone.getRootProps()} 
                className="absolute inset-0 flex items-center justify-center bg-black/50 cursor-pointer"
              >
                <input {...bannerDropzone.getInputProps()} />
                {uploadingBanner ? (
                  <div className="text-white">{t('profile.actions.uploading')}</div>
                ) : (
                  <div className="text-white flex flex-col items-center">
                    <Upload className="h-8 w-8 mb-2" />
                    <span>{t('profile.actions.changeBanner')}</span>
                  </div>
                )}
              </div>
            )}
          </div>
          
          <div className="absolute -bottom-12 left-8 flex items-end">
            <div className="relative">
              <Avatar className={`h-24 w-24 ${themeClasses.avatar}`}>
                <AvatarImage src={profile?.avatar_url} />
                <AvatarFallback className="text-2xl">
                  {profile?.username?.charAt(0)?.toUpperCase() || 'U'}
                </AvatarFallback>
              </Avatar>
              
              {editing && (
                <div 
                  {...avatarDropzone.getRootProps()} 
                  className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full cursor-pointer"
                >
                  <input {...avatarDropzone.getInputProps()} />
                  {uploadingAvatar ? (
                    <div className="text-white text-xs">{t('common.profile.uploading')}</div>
                  ) : (
                    <ImageIcon className="h-6 w-6 text-white" />
                  )}
                </div>
              )}
            </div>
            
            <div className="ml-4 mb-2">
              <Badge variant="outline" className="bg-background">
                {profile?.points || 0} {t('profile.stats.points')}
              </Badge>
            </div>
          </div>
          
          <div className="absolute right-4 top-4">
            <Button
              variant="outline"
              size="sm"
              className="bg-background/80 backdrop-blur-sm"
              onClick={() => editing ? updateProfile() : setEditing(true)}
            >
              {editing ? (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  {t('profile.actions.save')}
                </>
              ) : (
                <>
                  <Edit className="h-4 w-4 mr-2" />
                  {t('profile.actions.edit')}
                </>
              )}
            </Button>
          </div>
        </div>
        
        <div className="mt-16 space-y-6">
          {editing ? (
            <Card>
              <CardHeader>
                <CardTitle>{t('profile.actions.edit')}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <Tabs defaultValue="basic">
                  <TabsList className="mb-4">
                    <TabsTrigger value="basic">
                      <User className="h-4 w-4 mr-2" />
                      {t('profile.sections.basic')}
                    </TabsTrigger>
                    <TabsTrigger value="customization">
                      <Palette className="h-4 w-4 mr-2" />
                      {t('profile.sections.customization')}
                    </TabsTrigger>
                    <TabsTrigger value="social">
                      <LinkIcon className="h-4 w-4 mr-2" />
                      {t('profile.sections.social')}
                    </TabsTrigger>
                    <TabsTrigger value="privacy">
                      <Settings className="h-4 w-4 mr-2" />
                      {t('profile.sections.privacy')}
                    </TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="basic" className="space-y-4">
                    <div className="space-y-2">
                      <Label>{t('profile.form.username')}</Label>
                      <Input
                        value={formData.username}
                        onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                        placeholder={t('profile.form.usernamePlaceholder')}
                      />
                      <p className="text-xs text-muted-foreground">{t('profile.form.usernameDescription')}</p>
                    </div>
                    
                    <div className="space-y-2">
                      <Label>{t('profile.form.displayName')}</Label>
                      <Input
                        value={formData.displayName}
                        onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                        placeholder={t('profile.form.displayNamePlaceholder')}
                      />
                      <p className="text-xs text-muted-foreground">{t('profile.form.displayNameDescription')}</p>
                    </div>
                    
                    <div className="space-y-2">
                      <Label>{t('profile.form.bio')}</Label>
                      <Textarea
                        value={formData.bio}
                        onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                        placeholder={t('profile.form.bioPlaceholder')}
                        rows={4}
                      />
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="customization" className="space-y-4">
                    <div className="space-y-2">
                      <Label>{t('profile.customization.themes')}</Label>
                      <Select 
                        value={formData.theme} 
                        onValueChange={(value) => setFormData({ ...formData, theme: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder={t('profile.form.themePlaceholder')} />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(t('profile.themes', { returnObjects: true })).map(([key, value]) => (
                            <SelectItem key={key} value={key}>{value}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label>{t('profile.animations.title')}</Label>
                      <Select 
                        value={formData.animation} 
                        onValueChange={(value) => setFormData({ ...formData, animation: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder={t('profile.form.animationPlaceholder')} />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(t('profile.animations', { returnObjects: true }))
                            .filter(([key]) => key !== 'title')
                            .map(([key, value]) => (
                              <SelectItem key={key} value={key}>{value}</SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-4 pt-2">
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label>{t('profile.features.gifAvatar')}</Label>
                          <p className="text-xs text-muted-foreground">{t('profile.features.gifAvatarDescription')}</p>
                        </div>
                        <Switch 
                          checked={formData.useGifAvatar}
                          onCheckedChange={(checked) => setFormData({ ...formData, useGifAvatar: checked })}
                        />
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label>{t('profile.features.gifBanner')}</Label>
                          <p className="text-xs text-muted-foreground">{t('profile.features.gifBannerDescription')}</p>
                        </div>
                        <Switch 
                          checked={formData.useGifBanner}
                          onCheckedChange={(checked) => setFormData({ ...formData, useGifBanner: checked })}
                        />
                      </div>
                    </div>
                    
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={resetToDefaults}
                      className="mt-4"
                    >
                      <RefreshCw className="h-4 w-4 mr-2" />
                      {t('profile.actions.resetDefaults')}
                    </Button>
                  </TabsContent>
                  
                  <TabsContent value="social" className="space-y-4">
                    <div className="space-y-2">
                      <Label>Twitter</Label>
                      <Input
                        value={formData.socialLinks.twitter}
                        onChange={(e) => setFormData({ 
                          ...formData, 
                          socialLinks: { 
                            ...formData.socialLinks, 
                            twitter: e.target.value 
                          } 
                        })}
                        placeholder="@username"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Instagram</Label>
                      <Input
                        value={formData.socialLinks.instagram}
                        onChange={(e) => setFormData({ 
                          ...formData, 
                          socialLinks: { 
                            ...formData.socialLinks, 
                            instagram: e.target.value 
                          } 
                        })}
                        placeholder="@username"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Website</Label>
                      <Input
                        value={formData.socialLinks.website}
                        onChange={(e) => setFormData({ 
                          ...formData, 
                          socialLinks: { 
                            ...formData.socialLinks, 
                            website: e.target.value 
                          } 
                        })}
                        placeholder="https://example.com"
                      />
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="privacy" className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>{t('profile.privacy.publicProfile')}</Label>
                        <p className="text-xs text-muted-foreground">{t('profile.privacy.publicProfileDescription')}</p>
                      </div>
                      <Switch 
                        checked={formData.publicProfile}
                        onCheckedChange={(checked) => setFormData({ ...formData, publicProfile: checked })}
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>{t('profile.privacy.showActivity')}</Label>
                        <p className="text-xs text-muted-foreground">{t('profile.privacy.showActivityDescription')}</p>
                      </div>
                      <Switch 
                        checked={formData.showActivity}
                        onCheckedChange={(checked) => setFormData({ ...formData, showActivity: checked })}
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>{t('profile.privacy.showStats')}</Label>
                        <p className="text-xs text-muted-foreground">{t('profile.privacy.showStatsDescription')}</p>
                      </div>
                      <Switch 
                        checked={formData.showStats}
                        onCheckedChange={(checked) => setFormData({ ...formData, showStats: checked })}
                      />
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          ) : (
            <div>
              <h1 className="text-3xl font-bold">
                {profile?.display_name || profile?.username}
                {profile?.social_links?.twitter && (
                  <a 
                    href={`https://twitter.com/${profile.social_links.twitter}`} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="ml-2 inline-flex items-center text-blue-500 hover:text-blue-600"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 0" fill="currentColor" className="h-5 w-5">
                      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"></path>
                    </svg>
                  </a>
                )}
              </h1>
              <p className="text-muted-foreground mt-2">
                {profile?.bio || t('profile.noBioText')}
              </p>
              <div className="flex items-center mt-4 text-sm text-muted-foreground">
                <Calendar className="h-4 w-4 mr-1" />
                <span>
                  {t('profile.memberSince', { 
                    date: profile?.created_at ? formatDate(profile.created_at) : '',
                    interpolation: { escapeValue: false }
                  })}
                </span>
              </div>
              
              {(profile?.social_links?.instagram || profile?.social_links?.website) && (
                <div className="flex gap-3 mt-3">
                  {profile?.social_links?.instagram && (
                    <a 
                      href={`https://instagram.com/${profile.social_links.instagram}`} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-pink-500 hover:text-pink-600"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
                        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                      </svg>
                    </a>
                  )}
                  
                  {profile?.social_links?.website && (
                    <a 
                      href={profile.social_links.website} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
                        <circle cx="12" cy="12" r="10"></circle>
                        <line x1="2" y1="12" x2="22" y2="12"></line>
                        <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
                      </svg>
                    </a>
                  )}
                </div>
              )}
            </div>
          )}
          
          <Tabs defaultValue="activity" className="mt-6">
            <TabsList>
              <TabsTrigger value="activity">
                <Activity className="h-4 w-4 mr-2" />
                {t('profile.tabs.activity')}
              </TabsTrigger>
              <TabsTrigger value="achievements">
                <Award className="h-4 w-4 mr-2" />
                {t('profile.tabs.achievements')}
              </TabsTrigger>
              <TabsTrigger value="stats">
                <BarChart className="h-4 w-4 mr-2" />
                {t('profile.tabs.stats')}
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="activity" className="mt-4 space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>{t('profile.activity.recent')}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* Sample activity items - would be populated from real data */}
                    <motion.div 
                      className="flex items-start gap-4 p-4 border rounded-lg"
                      whileHover={{ x: 5, backgroundColor: 'rgba(var(--primary), 0.05)' }}
                      transition={{ type: "spring", stiffness: 300 }}
                    >
                      <div className={`rounded-full p-2 ${themeClasses.highlight}`}>
                        <Star className={`h-4 w-4 ${themeClasses.text}`} />
                      </div>
                      <div>
                        <p className="font-medium">{t('profile.activity.rated')} &quot;Inception&quot;</p>
                        <p className="text-sm text-muted-foreground">{t('profile.activity.gaveIt')} 5 {t('profile.activity.stars')}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          <Clock className="h-3 w-3 inline mr-1" />
                           2 {t('profile.activity.daysAgo')}
                        </p>
                      </div>
                    </motion.div>
                    
                    <motion.div 
                      className="flex items-start gap-4 p-4 border rounded-lg"
                      whileHover={{ x: 5, backgroundColor: 'rgba(var(--primary), 0.05)' }}
                      transition={{ type: "spring", stiffness: 300 }}
                    >
                      <div className={`rounded-full p-2 ${themeClasses.highlight}`}>
                        <Film className={`h-4 w-4 ${themeClasses.text}`} />
                      </div>
                      <div>
                        <p className="font-medium">{t('profile.activity.watched')} &quot;The Dark Knight&quot;</p>
                        <p className="text-sm text-muted-foreground">{t('profile.activity.addedToWatchedList')}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          <Clock className="h-3 w-3 inline mr-1" />
                          5 {t('profile.activity.daysAgo')}
                        </p>
                      </div>
                    </motion.div>
                    
                    <motion.div 
                      className="flex items-start gap-4 p-4 border rounded-lg"
                      whileHover={{ x: 5, backgroundColor: 'rgba(var(--primary), 0.05)' }}
                      transition={{ type: "spring", stiffness: 300 }}
                    >
                      <div className={`rounded-full p-2 ${themeClasses.highlight}`}>
                        <MessageSquare className={`h-4 w-4 ${themeClasses.text}`} />
                      </div>
                      <div>
                        <p className="font-medium">{t('profile.activity.reviewed')} &quot;Breaking Bad&quot;</p>
                        <p className="text-sm text-muted-foreground">{t('profile.activity.addedAReview')}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          <Clock className="h-3 w-3 inline mr-1" />
                          1 {t('profile.activity.weekAgo')}
                        </p>
                      </div>
                    </motion.div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="achievements" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>{t('profile.tabs.achievements')}</CardTitle>
                  <CardDescription>
                    {achievements.filter(a => a.completed).length} {t('achievements.status.unlocked')}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
                    {achievements.map((item) => {
                      const achievementData = item.achievement;
                      const LucideIcon = (achievementData?.icon && achievementData.icon in require('lucide-react')) 
                        ? require('lucide-react')[achievementData.icon] 
                        : Award;
                      
                      return (
                        <motion.div 
                          key={item.id}
                          className={`p-4 border rounded-lg ${item.completed ? `${themeClasses.highlight}` : 'bg-muted/30'}`}
                          whileHover={{ scale: 1.02, y: -5 }}
                          transition={{ type: "spring", stiffness: 300 }}
                        >
                          <div className="flex items-start gap-4">
                            <div className={`rounded-full p-3 ${item.completed ? `${themeClasses.highlight}` : 'bg-muted'}`}>
                              <LucideIcon className={`h-6 w-6 ${item.completed ? themeClasses.text : 'text-muted-foreground'}`} />
                            </div>
                            <div className="flex-1">
                              <div className="flex justify-between items-start">
                                <h3 className="font-medium">{achievementData?.name}</h3>
                                <Badge variant={item.completed ? "default" : "outline"}>
                                  {achievementData?.points} {t('common.achievements.points')}
                                </Badge>
                              </div>
                              <p className="text-sm text-muted-foreground mt-1">{achievementData?.description}</p>
                              
                              {!item.completed && (
                                <div className="mt-2">
                                  <div className="flex justify-between text-xs mb-1">
                                    <span>{t('common.achievements.progress')}</span>
                                    <span>{item.progress} / {achievementData?.criteria_value}</span>
                                  </div>
                                  <Progress value={(item.progress / achievementData?.criteria_value) * 100} />
                                </div>
                              )}
                              
                              {item.completed && item.completed_at && (
                                <p className="text-xs text-muted-foreground mt-2">
                                  {t('common.achievements.earnedOn')} {format(new Date(item.completed_at), 'PP')}
                                </p>
                              )}
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="stats" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>{t('profile.stats.title')}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 grid-cols-1 md:grid-cols-3">
                    <motion.div 
                      className="p-4 border rounded-lg"
                      whileHover={{ y: -5 }}
                      transition={{ type: "spring", stiffness: 300 }}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`rounded-full p-2 ${themeClasses.highlight}`}>
                          <Film className={`h-5 w-5 ${themeClasses.text}`} />
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">{t('profile.stats.watchedMovies')}</p>
                          <p className="text-2xl font-bold">{stats.watchedMovies}</p>
                        </div>
                      </div>
                    </motion.div>
                    
                    <motion.div 
                      className="p-4 border rounded-lg"
                      whileHover={{ y: -5 }}
                      transition={{ type: "spring", stiffness: 300 }}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`rounded-full p-2 ${themeClasses.highlight}`}>
                          <Tv className={`h-5 w-5 ${themeClasses.text}`} />
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">{t('profile.stats.watchedShows')}</p>
                          <p className="text-2xl font-bold">{stats.watchedShows}</p>
                        </div>
                      </div>
                    </motion.div>
                    
                    <motion.div 
                      className="p-4 border rounded-lg"
                      whileHover={{ y: -5 }}
                      transition={{ type: "spring", stiffness: 300 }}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`rounded-full p-2 ${themeClasses.highlight}`}>
                          <Star className={`h-5 w-5 ${themeClasses.text}`} />
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">{t('profile.stats.totalRatings')}</p>
                          <p className="text-2xl font-bold">{stats.totalRatings}</p>
                        </div>
                      </div>
                    </motion.div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </motion.div>
    </div>
  )
}