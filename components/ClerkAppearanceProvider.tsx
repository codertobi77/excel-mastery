"use client"
import { useMemo } from 'react'
import { ClerkProvider } from '@clerk/nextjs'
import { dark } from '@clerk/themes'
import { useTheme } from 'next-themes'

export default function ClerkAppearanceProvider({ children }: { children: React.ReactNode }) {
  const { resolvedTheme } = useTheme()
  const isDark = resolvedTheme === 'dark'

  const appearance: any = useMemo(
    () => ({
      baseTheme: isDark ? dark : undefined,
      variables: {
        colorPrimary: 'hsl(var(--primary))',
      },
    }),
    [isDark]
  )

  return (
    <ClerkProvider appearance={appearance}>
      {children}
    </ClerkProvider>
  )
}


