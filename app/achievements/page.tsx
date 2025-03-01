"use client"

import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { supabase } from "@/lib/supabase"
import { format } from "date-fns"
import { motion } from "framer-motion"
import { Award, Lock, Trophy, Medal, Star, Film, Tv, MessageSquare, List, UserPlus } from "lucide-react"

export default function AchievementsPage() {
  const { t } = useTranslation('common')
  const [achievements, setAchievements] = useState<any[]>([])
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Fetch profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (profileError) throw profileError
      setProfile(profileData)

      // Fetch user achievements
      const { data: userAchievements, error: userAchievementsError } = await supabase
        .from('user_achievements')
        .select(`
          *,
          achievement:achievements(*)
        `)
        .eq('user_id', user.id)

      if (userAchievementsError) throw userAchievementsError

      // Fetch all achievements to show locked ones too
      const { data: allAchievements, error: allAchievementsError } = await supabase
        .from('achievements')
        .select('*')
        .order('points', { ascending: false })

      if (allAchievementsError) throw allAchievementsError

      // Combine the data
      const userAchievementMap = new Map(
        userAchievements.map((ua) => [ua.achievement_id, ua])
      )

      const combinedAchievements = allAchievements.map((achievement) => {
        const userAchievement = userAchievementMap.get(achievement.id)
        if (userAchievement) {
          return userAchievement
        } else {
          // Create a placeholder for achievements the user doesn't have yet
          return {
            id: `placeholder-${achievement.id}`,
            user_id: user.id,
            achievement_id: achievement.id,
            progress: 0,
            completed: false,
            completed_at: null,
            achievement
          }
        }
      })

      setAchievements(combinedAchievements)
    } catch (error) {
      console.error('Error fetching achievements:', error)
    } finally {
      setLoading(false)
    }
  }

  // Helper function to get the appropriate icon component
  const getIconComponent = (iconName: string) => {
    const iconMap: Record<string, any> = {
      'Award': Award,
      'Trophy': Trophy,
      'Medal': Medal,
      'Star': Star,
      'Film': Film,
      'Tv': Tv,
      'MessageSquare': MessageSquare,
      'List': List,
      'UserPlus': UserPlus
    }
    
    return iconMap[iconName] || Award
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-pulse flex flex-col items-center">
          <div className="rounded-full bg-muted h-16 w-16 mb-4"></div>
          <div className="h-8 bg-muted rounded w-48 mb-4"></div>
          <div className="h-4 bg-muted rounded w-64"></div>
        </div>
      </div>
    )
  }

  const unlockedAchievements = achievements.filter(a => a.completed)
  const lockedAchievements = achievements.filter(a => !a.completed)

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center"
      >
        <h1 className="text-3xl font-bold">{t('achievements.title')}</h1>
        <p className="text-muted-foreground mt-2">
          {t('achievements.trackProgress')}
        </p>
        
        <div className="mt-6 inline-flex items-center justify-center gap-2 bg-muted/50 px-4 py-2 rounded-full">
          <Trophy className="h-5 w-5 text-yellow-500" />
          <span className="font-medium">{profile?.points || 0} {t('achievements.points')}</span>
        </div>
      </motion.div>

      <Tabs defaultValue="all" className="mt-8">
        <TabsList className="grid w-full grid-cols-3 mb-8">
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="unlocked">
            {t('achievements.unlocked')} ({unlockedAchievements.length})
          </TabsTrigger>
          <TabsTrigger value="locked">
            {t('achievements.locked')} ({lockedAchievements.length})
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="all">
          <div className="grid gap-6 grid-cols-1 md:grid-cols-2">
            {achievements.map((item) => {
              const achievementData = item.achievement || item;
              const IconComponent = getIconComponent(achievementData.icon);
              
              return (
                <motion.div 
                  key={item.id}
                  className={`border rounded-lg overflow-hidden ${item.completed ? 'bg-primary/5' : 'bg-muted/30'}`}
                  whileHover={{ y: -5 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  <div className="p-5">
                    <div className="flex items-start gap-4">
                      <div className={`rounded-full p-3 ${item.completed ? 'bg-primary/20' : 'bg-muted'}`}>
                        <IconComponent className={`h-6 w-6 ${item.completed ? 'text-primary' : 'text-muted-foreground'}`} />
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between items-start">
                          <h3 className="font-medium">{achievementData.name}</h3>
                          <Badge variant={item.completed ? "default" : "outline"}>
                            {achievementData.points} {t('achievements.points')}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">{achievementData.description}</p>
                        
                        {!item.completed && (
                          <div className="mt-3">
                            <div className="flex justify-between text-xs mb-1">
                              <span>{t('achievements.progress')}</span>
                              <span>{item.progress} / {achievementData.criteria_value}</span>
                            </div>
                            <Progress value={(item.progress / achievementData.criteria_value) * 100} />
                          </div>
                        )}
                        
                        {item.completed && item.completed_at && (
                          <p className="text-xs text-muted-foreground mt-2">
                            {t('achievements.earnedOn')} {format(new Date(item.completed_at), 'PP')}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </TabsContent>
        
        <TabsContent value="unlocked">
          <div className="grid gap-6 grid-cols-1 md:grid-cols-2">
            {unlockedAchievements.length > 0 ? (
              unlockedAchievements.map((item) => {
                const achievementData = item.achievement || item;
                const IconComponent = getIconComponent(achievementData.icon);
                
                return (
                  <motion.div 
                    key={item.id}
                    className="border rounded-lg overflow-hidden bg-primary/5"
                    whileHover={{ y: -5 }}
                    transition={{ type: "spring", stiffness: 300 }}
                  >
                    <div className="p-5">
                      <div className="flex items-start gap-4">
                        <div className="rounded-full p-3 bg-primary/20">
                          <IconComponent className="h-6 w-6 text-primary" />
                        </div>
                        <div className="flex-1">
                          <div className="flex justify-between items-start">
                            <h3 className="font-medium">{achievementData.name}</h3>
                            <Badge>
                              {achievementData.points} {t('achievements.points')}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">{achievementData.description}</p>
                          
                          {item.completed_at && (
                            <p className="text-xs text-muted-foreground mt-2">
                              {t('achievements.earnedOn')} {format(new Date(item.completed_at), 'PP')}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })
            ) : (
              <div className="col-span-2 text-center py-12">
                <Lock className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium">You haven&apos;t unlocked any achievements yet</h3>
                <p className="text-muted-foreground mt-2">
                  Continue using MediaVault to earn achievements and rewards
                </p>
              </div>
            )}
          </div>
        </TabsContent>
        
        <TabsContent value="locked">
          <div className="grid gap-6 grid-cols-1 md:grid-cols-2">
            {lockedAchievements.length > 0 ? (
              lockedAchievements.map((item) => {
                const achievementData = item.achievement || item;
                const IconComponent = getIconComponent(achievementData.icon);
                
                return (
                  <motion.div 
                    key={item.id}
                    className="border rounded-lg overflow-hidden bg-muted/30"
                    whileHover={{ y: -5 }}
                    transition={{ type: "spring", stiffness: 300 }}
                  >
                    <div className="p-5">
                      <div className="flex items-start gap-4">
                        <div className="rounded-full p-3 bg-muted">
                          <IconComponent className="h-6 w-6 text-muted-foreground" />
                        </div>
                        <div className="flex-1">
                          <div className="flex justify-between items-start">
                            <h3 className="font-medium">{achievementData.name}</h3>
                            <Badge variant="outline">
                              {achievementData.points} {t('achievements.points')}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">{achievementData.description}</p>
                          
                          <div className="mt-3">
                            <div className="flex justify-between text-xs mb-1">
                              <span>{t('achievements.progress')}</span>
                              <span>{item.progress} / {achievementData.criteria_value}</span>
                            </div>
                            <Progress value={(item.progress / achievementData.criteria_value) * 100} />
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })
            ) : (
              <div className="col-span-2 text-center py-12">
                <Trophy className="h-12 w-12 mx-auto text-yellow-500 mb-4" />
                <h3 className="text-lg font-medium">All achievements unlocked!</h3>
                <p className="text-muted-foreground mt-2">
                  Congratulations! You&apos;ve unlocked all available achievements.
                </p>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}