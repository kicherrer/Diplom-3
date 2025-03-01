"use client"

import { ChangeEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils'

interface FileInputProps {
  onChange: (files: FileList | null) => void
  accept: string
  label: string
}

export function FileInput({ onChange, accept, label }: FileInputProps) {
  const { t } = useTranslation('common')

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    onChange(event.target.files)
  }

  return (
    <div className="relative group cursor-pointer">
      <div className="flex items-center gap-2 p-2 rounded-lg border border-input bg-background">
        <button
          type="button"
          className="px-4 py-2 rounded-full text-sm font-semibold bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
          onClick={() => document.getElementById(label)?.click()}
        >
          {t('admin.media.form.fileInputLabels.browse')}
        </button>
        <span className="text-sm text-muted-foreground">
          {t('admin.media.form.fileInputLabels.chooseFile')}
        </span>
      </div>
      <input
        id={label}
        type="file"
        accept={accept}
        onChange={handleChange}
        className="sr-only"
        aria-label={label}
      />
    </div>
  )
}
