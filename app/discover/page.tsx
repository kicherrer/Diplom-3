"use client"

import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { SearchIcon, FilterIcon } from "lucide-react"
import { supabase } from "@/lib/supabase"

export default function DiscoverPage() {
  const { t } = useTranslation()
  const [searchQuery, setSearchQuery] = useState('')
  const [mediaItems, setMediaItems] = useState([])
  const [loading, setLoading] = useState(false)

  const searchMedia = async () => {
    if (!searchQuery.trim()) return
    
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('media_items')
        .select('*')
        .ilike('title', `%${searchQuery}%`)
        .limit(20)

      if (error) throw error
      setMediaItems(data || [])
    } catch (error) {
      console.error('Error searching media:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <div className="flex-1">
          <Input
            placeholder="Search movies, TV shows..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && searchMedia()}
          />
        </div>
        <Button onClick={searchMedia} className="gap-2">
          <SearchIcon className="h-4 w-4" />
          Search
        </Button>
        <Button variant="outline" className="gap-2">
          <FilterIcon className="h-4 w-4" />
          Filters
        </Button>
      </div>

      <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        {mediaItems.map((item: any) => (
          <Card key={item.id}>
            <CardHeader>
              <CardTitle>{item.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">{item.overview}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {loading && (
        <div className="text-center">
          <p>Loading...</p>
        </div>
      )}
    </div>
  )
}