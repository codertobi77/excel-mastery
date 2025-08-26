"use client"
import { useEffect, useMemo } from 'react'
import { ClerkProvider } from '@clerk/nextjs'
import { dark } from '@clerk/themes'

export default function ClerkAppearanceProvider({ children }: { children: React.ReactNode }) {
  // Detect app theme via data-theme or class
  const isDark = useMemo(() => {
    if (typeof document === 'undefined') return false
    const html = document.documentElement
    return html.classList.contains('dark') || html.dataset.theme === 'dark'
  }, [])

  // Appearance config maps to shadcn tokens
  const appearance: any = {
    baseTheme: isDark ? dark : undefined,
    // Global layout settings
    layout: {
      shimmer: true,
      logoPlacement: 'inside',
      socialButtonsVariant: 'blockButton',
      showOptionalFields: true,
      helpPageUrl: 'https://excel-mastery.ai',
      privacyPageUrl: 'https://excel-mastery.ai/privacy',
      termsPageUrl: 'https://excel-mastery.ai/terms',
    },
    // CSS variables for colors and spacing
    variables: {
      colorPrimary: 'hsl(var(--primary))',
      colorText: 'hsl(var(--foreground))',
      colorBackground: 'hsl(var(--background))',
      colorInputBackground: 'hsl(var(--background))',
      colorInputText: 'hsl(var(--foreground))',
      colorAlphaShade: 'hsl(var(--muted))',
      colorSuccess: 'hsl(var(--success))',
      colorDanger: 'hsl(var(--destructive))',
      colorWarning: 'hsl(var(--warning))',
      colorNeutral: 'hsl(var(--muted))',
      borderRadius: '0.5rem',
      fontFamily: 'var(--font-sans)',
      fontSize: '0.875rem',
      fontWeight: {
        normal: '400',
        medium: '500',
        semibold: '600',
        bold: '700',
      },
      spacingUnit: '0.25rem',
    },
    // Component-specific styling
    elements: {
      // Main containers
      card: 'bg-background border border-border rounded-lg shadow-sm',
      pageScrollBox: 'bg-background',
      
      // Headers
      headerTitle: 'text-foreground text-xl font-semibold',
      headerSubtitle: 'text-muted-foreground text-sm',
      
      // Form elements
      formButtonPrimary: 'bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 rounded-md font-medium transition-colors',
      formButtonSecondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80 px-4 py-2 rounded-md font-medium transition-colors',
      formFieldInput: 'bg-background text-foreground border border-input rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-ring focus:ring-offset-2',
      formFieldLabel: 'text-foreground text-sm font-medium mb-2 block',
      formFieldError: 'text-destructive text-sm mt-1',
      formFieldSuccess: 'text-success text-sm mt-1',
      
      // Social buttons
      socialButtonsBlockButton: 'bg-background border border-border text-foreground hover:bg-muted px-4 py-2 rounded-md font-medium transition-colors',
      socialButtonsBlockButtonText: 'text-foreground',
      socialButtonsBlockButtonArrow: 'text-muted-foreground',
      
      // Dividers and separators
      dividerLine: 'bg-border',
      dividerText: 'text-muted-foreground text-xs font-medium',
      
      // Footer
      footer: 'text-muted-foreground text-sm',
      footerAction: 'text-primary hover:text-primary/80',
      
      // Modals and overlays
      modalBackdrop: 'bg-background/80 backdrop-blur-sm',
      modalContent: 'bg-background border border-border rounded-lg shadow-lg',
      
      // User button and profile
      userButtonBox: 'bg-background border border-border rounded-md',
      userButtonTrigger: 'hover:bg-muted',
      userButtonPopoverCard: 'bg-background border border-border rounded-lg shadow-lg',
      
      // Navigation
      navbar: 'bg-background border-b border-border',
      navbarButton: 'text-foreground hover:bg-muted',
      
      // Alerts and notifications
      alert: 'bg-muted border border-border rounded-md p-3',
      alertText: 'text-foreground text-sm',
      
      // Loading states
      spinner: 'text-primary',
      shimmer: 'bg-muted',
    },
  }

  return (
    <ClerkProvider appearance={appearance}>
      {children}
    </ClerkProvider>
  )
}


