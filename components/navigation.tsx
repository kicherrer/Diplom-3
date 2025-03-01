"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"
import { FilmIcon, HomeIcon, TrendingUpIcon, UserIcon, Settings, Award, Plus } from "lucide-react"
import { ModeToggle } from "./mode-toggle"
import { LanguageToggle } from "./language-toggle"
import { AuthButton } from "./auth/auth-button"
import { useTranslation } from 'react-i18next'
import { supabase } from "@/lib/supabase"
import { motion } from "framer-motion"

export default function Navigation() {
  const pathname = usePathname()
  const router = useRouter()
  const { t } = useTranslation('common')
  const [isAdmin, setIsAdmin] = React.useState(false)
  const [isScrolled, setIsScrolled] = React.useState(false)

  React.useEffect(() => {
    const checkAdminStatus = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data } = await supabase
          .from('profiles')
          .select('is_admin')
          .eq('id', user.id)
          .single()
        setIsAdmin(data?.is_admin || false)
      }
    }
    checkAdminStatus()
  }, [])

  React.useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const navItems = [
    { href: "/", label: t('navigation.home'), icon: HomeIcon },
    { href: "/discover", label: t('navigation.discover'), icon: TrendingUpIcon },
    { href: "/profile", label: t('navigation.profile'), icon: UserIcon },
    { href: "/achievements", label: t('navigation.achievements'), icon: Award },
  ]

  if (isAdmin) {
    navItems.push({ href: "/admin", label: t('navigation.admin'), icon: Settings })
  }

  return (
    <nav className="border-b">
      <div className="container mx-auto px-4 flex items-center justify-between h-14">
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center space-x-2">
            <motion.div
              whileHover={{ rotate: 10 }}
              transition={{ duration: 0.2 }}
            >
              <FilmIcon className="h-6 w-6 text-primary" />
            </motion.div>
            <span className="text-lg font-bold">MediaVault</span>
          </Link>
          <ScrollArea className="max-w-[600px] lg:max-w-none mx-6">
            <div className="flex items-center gap-1 md:gap-2">
              {navItems.map((item) => {
                const Icon = item.icon
                return (
                  <Link href={item.href} key={item.href}>
                    <Button
                      variant={pathname === item.href ? "default" : "ghost"}
                      className="gap-2"
                      size="sm"
                    >
                      <Icon className="h-4 w-4" />
                      <span className="hidden md:inline">{item.label}</span>
                    </Button>
                  </Link>
                )
              })}
            </div>
            <ScrollBar orientation="horizontal" className="invisible" />
          </ScrollArea>
          {isAdmin && (
            <Link 
              href="/admin"
              className={cn(
                "text-sm hover:text-primary transition-colors",
                pathname === "/admin" && "text-primary"
              )}
            >
              {t('navigation.admin')}
            </Link>
          )}
        </div>
        
        <div className="ml-auto flex items-center space-x-2">
          <LanguageToggle />
          <AuthButton />
          <ModeToggle />
        </div>
      </div>
    </nav>
  )
}