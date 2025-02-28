"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { TrendingUpIcon, PlayCircleIcon, UserIcon, StarIcon, Award, Film } from "lucide-react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { useTranslation } from "react-i18next"

export default function Home() {
  const router = useRouter()
  const { t } = useTranslation('common')

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  }

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  }

  const features = [
    {
      icon: PlayCircleIcon,
      title: t('home.features.catalog.title'),
      description: t('home.features.catalog.description'),
      action: () => router.push('/discover')
    },
    {
      icon: TrendingUpIcon,
      title: t('home.features.recommendations.title'),
      description: t('home.features.recommendations.description'),
      action: () => router.push('/discover')
    },
    {
      icon: UserIcon,
      title: t('home.features.profiles.title'),
      description: t('home.features.profiles.description'),
      action: () => router.push('/profile')
    },
    {
      icon: StarIcon,
      title: t('home.features.ratings.title'),
      description: t('home.features.ratings.description'),
      action: () => router.push('/discover')
    }
  ]

  return (
    <div className="space-y-12">
      <motion.section 
        className="text-center py-16"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <motion.h1 
          className="text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl bg-clip-text text-transparent bg-gradient-to-r from-primary to-blue-500 dark:from-blue-400 dark:to-purple-500"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
        >
          {t('home.title')}
        </motion.h1>
        <motion.p 
          className="mx-auto max-w-[700px] text-gray-500 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed dark:text-gray-400 mt-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.5 }}
        >
          {t('home.subtitle')}
        </motion.p>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.5 }}
          className="mt-8"
        >
          <Button 
            size="lg" 
            className="gap-2 rounded-full px-8"
            onClick={() => router.push('/discover')}
          >
            <PlayCircleIcon className="h-5 w-5" />
            {t('home.startExploring')}
          </Button>
        </motion.div>
      </motion.section>

      <motion.section 
        className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4"
        variants={container}
        initial="hidden"
        animate="show"
      >
        {features.map((feature, index) => {
          const Icon = feature.icon
          return (
            <motion.div key={index} variants={item} whileHover={{ y: -5 }}>
              <Card 
                className="h-full transition-all hover:shadow-lg cursor-pointer"
                onClick={feature.action}
              >
                <CardHeader>
                  <div className="rounded-full bg-primary/10 w-12 h-12 flex items-center justify-center mb-4">
                    <Icon className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle>{feature.title}</CardTitle>
                  <CardDescription>{feature.description}</CardDescription>
                </CardHeader>
              </Card>
            </motion.div>
          )
        })}
      </motion.section>

      <motion.section 
        className="py-16 bg-muted/50 rounded-lg"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8, duration: 0.5 }}
      >
        <div className="container mx-auto text-center">
          <h2 className="text-3xl font-bold mb-8">{t('home.discoverTitle')}</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <motion.div 
              className="bg-card rounded-lg p-6 shadow-sm"
              whileHover={{ scale: 1.03 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <h3 className="text-xl font-semibold mb-2">{t('home.movies')}</h3>
              <p className="text-muted-foreground mb-4">{t('home.moviesDescription')}</p>
              <Button variant="outline" onClick={() => router.push('/discover?type=movie')}>{t('home.browseMovies')}</Button>
            </motion.div>
            <motion.div 
              className="bg-card rounded-lg p-6 shadow-sm"
              whileHover={{ scale: 1.03 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <h3 className="text-xl font-semibold mb-2">{t('home.tvShows')}</h3>
              <p className="text-muted-foreground mb-4">{t('home.tvShowsDescription')}</p>
              <Button variant="outline" onClick={() => router.push('/discover?type=tv')}>{t('home.browseTVShows')}</Button>
            </motion.div>
            <motion.div 
              className="bg-card rounded-lg p-6 shadow-sm"
              whileHover={{ scale: 1.03 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <h3 className="text-xl font-semibold mb-2">{t('home.documentaries')}</h3>
              <p className="text-muted-foreground mb-4">{t('home.documentariesDescription')}</p>
              <Button variant="outline" onClick={() => router.push('/discover?type=documentary')}>{t('home.browseDocumentaries')}</Button>
            </motion.div>
          </div>
        </div>
      </motion.section>

      <motion.section 
        className="py-12"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1, duration: 0.5 }}
      >
        <div className="container mx-auto">
          <div className="flex flex-col md:flex-row items-center gap-8">
            <div className="md:w-1/2">
              <h2 className="text-3xl font-bold mb-4">{t('home.trackProgress')}</h2>
              <p className="text-muted-foreground mb-6">
                {t('home.trackProgressDescription')}
              </p>
              <Button onClick={() => router.push('/achievements')} className="gap-2">
                <Award className="h-4 w-4" />
                {t('home.viewAchievements')}
              </Button>
            </div>
            <div className="md:w-1/2 grid grid-cols-2 gap-4">
              <motion.div 
                className="bg-primary/10 rounded-lg p-4 flex flex-col items-center justify-center text-center"
                whileHover={{ y: -5 }}
              >
                <Film className="h-8 w-8 mb-2 text-primary" />
                <h3 className="font-medium">{t('home.trackMovies')}</h3>
              </motion.div>
              <motion.div 
                className="bg-primary/10 rounded-lg p-4 flex flex-col items-center justify-center text-center"
                whileHover={{ y: -5 }}
              >
                <TrendingUpIcon className="h-8 w-8 mb-2 text-primary" />
                <h3 className="font-medium">{t('home.getRecommendations')}</h3>
              </motion.div>
              <motion.div 
                className="bg-primary/10 rounded-lg p-4 flex flex-col items-center justify-center text-center"
                whileHover={{ y: -5 }}
              >
                <StarIcon className="h-8 w-8 mb-2 text-primary" />
                <h3 className="font-medium">{t('home.rateContent')}</h3>
              </motion.div>
              <motion.div 
                className="bg-primary/10 rounded-lg p-4 flex flex-col items-center justify-center text-center"
                whileHover={{ y: -5 }}
              >
                <Award className="h-8 w-8 mb-2 text-primary" />
                <h3 className="font-medium">{t('home.earnAchievements')}</h3>
              </motion.div>
            </div>
          </div>
        </div>
      </motion.section>
      <div className="flex items-center justify-center">
        <h3 className="text-2xl font-bold">
          {t('home.notStartedWatching')}
        </h3>
      </div>
    </div>
  )
}