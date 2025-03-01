"use client"

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { useTranslation } from 'react-i18next'  // Add this import

const mediaSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  original_title: z.string().optional(),
  type: z.enum(['movie', 'tv']),
  description: z.string().min(1, 'Description is required'),
  year: z.number().min(1900).max(new Date().getFullYear()),
  duration: z.number().min(1, 'Duration is required'),
  genres: z.array(z.string()).min(1, 'Select at least one genre'),
  poster: z.any(),
  video: z.any(),
  actors: z.array(z.object({
    name: z.string(),
    character: z.string(),
    photo: z.any().optional()
  })),
  directors: z.array(z.object({
    name: z.string(),
    photo: z.any().optional()
  }))
})

// Определяем типы для формы
type MediaFormValues = z.infer<typeof mediaSchema>

interface Actor {
  name: string;
  character: string;
  photo: FileList | null;
}

interface Director {
  name: string;
  photo: FileList | null;
}

export function MediaForm() {
  const { t } = useTranslation('common')  // Add this line
  const [loading, setLoading] = useState(false)
  const [genres, setGenres] = useState<any[]>([])
  const router = useRouter()

  useEffect(() => {
    fetchGenres()
  }, [])

  const fetchGenres = async () => {
    const { data } = await supabase.from('genres').select('*')
    if (data) setGenres(data)
  }

  const form = useForm<MediaFormValues>({
    resolver: zodResolver(mediaSchema),
    defaultValues: {
      title: '',
      original_title: '',
      type: 'movie' as const, // Явно указываем тип
      description: '',
      year: new Date().getFullYear(),
      duration: 0,
      genres: [],
      actors: [{ name: '', character: '', photo: null }],
      directors: [{ name: '', photo: null }],
      poster: null,
      video: null
    }
  })

  const onSubmit = async (data: MediaFormValues) => {
    try {
      setLoading(true)

      // Upload poster
      const posterFile = data.poster[0]
      const posterPath = `posters/${Date.now()}-${posterFile.name}`
      await supabase.storage.from('media').upload(posterPath, posterFile)
      const { data: { publicUrl: posterUrl } } = supabase.storage
        .from('media')
        .getPublicUrl(posterPath)

      // Upload video
      const videoFile = data.video[0]
      const videoPath = `videos/${Date.now()}-${videoFile.name}`
      await supabase.storage.from('media').upload(videoPath, videoFile)
      const { data: { publicUrl: videoUrl } } = supabase.storage
        .from('media')
        .getPublicUrl(videoPath)

      // Create media item
      const { data: mediaItem } = await supabase
        .from('media_items')
        .insert({
          title: data.title,
          original_title: data.original_title,
          type: data.type,
          description: data.description,
          year: data.year,
          duration: data.duration,
          poster_url: posterUrl,
          video_url: videoUrl
        })
        .select()
        .single()

      // Add genres
      await Promise.all(
        data.genres.map(genreId =>
          supabase
            .from('media_genres')
            .insert({ media_id: mediaItem.id, genre_id: genreId })
        )
      )

      // Add persons (actors and directors)
      for (const actor of data.actors) {
        // Upload actor photo if exists
        let photoUrl = null
        if (actor.photo?.[0]) {
          const photoPath = `persons/${Date.now()}-${actor.photo[0].name}`
          await supabase.storage.from('media').upload(photoPath, actor.photo[0])
          const { data: { publicUrl } } = supabase.storage
            .from('media')
            .getPublicUrl(photoPath)
          photoUrl = publicUrl
        }

        // Create or find person
        const { data: person } = await supabase
          .from('persons')
          .insert({
            name: actor.name,
            photo_url: photoUrl
          })
          .select()
          .single()

        // Add relation
        await supabase
          .from('media_persons')
          .insert({
            media_id: mediaItem.id,
            person_id: person.id,
            role: 'actor',
            character_name: actor.character
          })
      }

      // Similar process for directors
      for (const director of data.directors) {
        let photoUrl = null
        if (director.photo?.[0]) {
          const photoPath = `persons/${Date.now()}-${director.photo[0].name}`
          await supabase.storage.from('media').upload(photoPath, director.photo[0])
          const { data: { publicUrl } } = supabase.storage
            .from('media')
            .getPublicUrl(photoPath)
          photoUrl = publicUrl
        }

        const { data: person } = await supabase
          .from('persons')
          .insert({
            name: director.name,
            photo_url: photoUrl
          })
          .select()
          .single()

        await supabase
          .from('media_persons')
          .insert({
            media_id: mediaItem.id,
            person_id: person.id,
            role: 'director'
          })
      }

      toast.success('Media added successfully')
      router.push('/admin')
    } catch (error) {
      console.error('Error adding media:', error)
      toast.error('Failed to add media')
    } finally {
      setLoading(false)
    }
  }

  // Добавляем состояния для актёров и режиссёров
  const [actors, setActors] = useState<Actor[]>([{ name: '', character: '', photo: null }])
  const [directors, setDirectors] = useState<Director[]>([{ name: '', photo: null }])

  // Добавляем функции для управления актёрами и режиссёрами
  const addActor = () => {
    setActors([...actors, { name: '', character: '', photo: null }])
  }

  const removeActor = (index: number) => {
    setActors(actors.filter((_, i) => i !== index))
  }

  const addDirector = () => {
    setDirectors([...directors, { name: '', photo: null }])
  }

  const removeDirector = (index: number) => {
    setDirectors(directors.filter((_, i) => i !== index))
  }

  // Обновляем форму
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Title field */}
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('admin.media.form.title')}</FormLabel>
              <FormControl>
                <Input {...field} placeholder={t('admin.media.form.titlePlaceholder')} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="original_title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('admin.media.form.originalTitle')}</FormLabel>
              <FormControl>
                <Input {...field} placeholder={t('admin.media.form.originalTitlePlaceholder')} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('admin.media.form.type')}</FormLabel>
              <Select
                onValueChange={field.onChange}
                defaultValue={field.value}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder={t('admin.media.form.type')} />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="movie">{t('admin.media.form.movie')}</SelectItem>
                  <SelectItem value="tv">{t('admin.media.form.tv')}</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('admin.media.form.description')}</FormLabel>
              <FormControl>
                <Textarea {...field} placeholder={t('admin.media.form.descriptionPlaceholder')} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="year"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('admin.media.form.year')}</FormLabel>
                <FormControl>
                  <Input type="number" {...field} onChange={e => field.onChange(parseInt(e.target.value))} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="duration"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('admin.media.form.duration')}</FormLabel>
                <FormControl>
                  <Input 
                    type="number" 
                    {...field} 
                    onChange={e => field.onChange(parseInt(e.target.value))}
                    placeholder={t('admin.media.form.durationPlaceholder')}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="poster"
            render={({ field: { onChange } }) => (
              <FormItem>
                <FormLabel>{t('admin.media.form.poster')}</FormLabel>
                <FormControl>
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={(e) => onChange(e.target.files)}
                    className="file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="video"
            render={({ field: { onChange } }) => (
              <FormItem>
                <FormLabel>{t('admin.media.form.video')}</FormLabel>
                <FormControl>
                  <Input
                    type="file"
                    accept="video/*"
                    onChange={(e) => onChange(e.target.files)}
                    className="file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Добавляем секции для актёров и режиссёров */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium">{t('admin.media.form.actors')}</h3>
          {actors.map((_, index) => (
            <div key={index} className="grid grid-cols-2 gap-4 border p-4 rounded">
              <FormField
                control={form.control}
                name={`actors.${index}.name`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('admin.media.form.actorName')}</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder={t('admin.media.form.actorNamePlaceholder')} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name={`actors.${index}.character`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Character</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name={`actors.${index}.photo`}
                render={({ field: { onChange } }) => (
                  <FormItem className="col-span-2">
                    <FormLabel>Photo</FormLabel>
                    <FormControl>
                      <Input
                        type="file"
                        accept="image/*"
                        onChange={(e) => onChange(e.target.files)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <Button
                type="button"
                variant="destructive"
                onClick={() => removeActor(index)}
                className="col-span-2"
              >
                {t('admin.media.form.removeActor')}
              </Button>
            </div>
          ))}
          
          <Button type="button" variant="outline" onClick={addActor}>
            {t('admin.media.form.addActor')}
          </Button>
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-medium">{t('admin.media.form.directors')}</h3>
          {directors.map((_, index) => (
            <div key={index} className="grid grid-cols-2 gap-4 border p-4 rounded">
              <FormField
                control={form.control}
                name={`directors.${index}.name`}
                render={({ field }) => (
                  <FormItem className="col-span-2">
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name={`directors.${index}.photo`}
                render={({ field: { onChange } }) => (
                  <FormItem className="col-span-2">
                    <FormLabel>Photo</FormLabel>
                    <FormControl>
                      <Input
                        type="file"
                        accept="image/*"
                        onChange={(e) => onChange(e.target.files)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <Button
                type="button"
                variant="destructive"
                onClick={() => removeDirector(index)}
                className="col-span-2"
              >
                {t('admin.media.form.removeDirector')}
              </Button>
            </div>
          ))}
          
          <Button type="button" variant="outline" onClick={addDirector}>
            {t('admin.media.form.addDirector')}
          </Button>
        </div>

        <Button type="submit" disabled={loading}>
          {loading ? t('admin.media.form.submitting') : t('admin.media.form.submit')}
        </Button>
      </form>
    </Form>
  )
}
