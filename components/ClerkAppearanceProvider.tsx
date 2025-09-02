"use client"
import { useMemo } from 'react'
import { ClerkProvider } from '@clerk/nextjs'
import { dark } from '@clerk/themes'

export default function ClerkAppearanceProvider({ children }: { children: React.ReactNode }) {
  // Detect app theme via data-theme or class
  const isDark = useMemo(() => {
    if (typeof document === 'undefined') return false
    const html = document.documentElement
    return html.classList.contains('dark') || html.dataset.theme === 'dark'
  }, [])

  const appearance: any = { baseTheme: isDark ? dark : undefined }

  return (
    <ClerkProvider appearance={appearance}>
      {children}
    </ClerkProvider>
  )
}


