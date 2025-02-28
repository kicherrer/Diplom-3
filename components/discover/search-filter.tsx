import { useTranslation } from "react-i18next"
import { Search, Filter } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu"

export function SearchFilter() {
  const { t } = useTranslation('common')
  
  return (
    <div>
      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <label htmlFor="search" className="sr-only">
            {t('discover.search')}
          </label>
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            id="search"
            type="search"
            placeholder={t('discover.searchPlaceholder')}
            aria-label={t('discover.search')}
            className="pl-9"
          />
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline">
              <Filter className="mr-2 h-4 w-4" />
              {t('discover.filters')}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-[200px]">
            <DropdownMenuLabel>{t('discover.filter.title')}</DropdownMenuLabel>
            {/* ...rest of menu content... */}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  )
}
