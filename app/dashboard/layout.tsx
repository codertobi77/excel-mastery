"use client"
import { ReactNode, useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { SignedIn, SignedOut, RedirectToSignIn, UserButton } from '@clerk/nextjs'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useUser } from '@clerk/nextjs'
import { 
  Bot, 
  BookOpen, 
  Target, 
  Lightbulb, 
  Search,
  MessageSquare,
  Settings,
  HelpCircle,
  ChevronLeft,
  ChevronRight
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { ThemeToggle } from '@/components/theme-toggle'
import { useAppStore } from '@/store/app-store'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname?.() || ''
  const router = useRouter()
  const sidebarOpenCached = useAppStore((s) => s.sidebarOpen ?? true)
  const setSidebarOpenCached = useAppStore((s) => s.setSidebarOpen)
  const [sidebarOpen, setSidebarOpen] = useState(sidebarOpenCached)
  const [feedbackOpen, setFeedbackOpen] = useState(false)
  const { user } = useUser()
  const defaultName = user ? `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim() : ''
  const defaultEmail = user?.primaryEmailAddress?.emailAddress || ''
  const [name, setName] = useState(defaultName)
  const [email, setEmail] = useState(defaultEmail)
  const [description, setDescription] = useState('')
  const [sending, setSending] = useState(false)

  const lastVisitedRoute = useAppStore((s) => s.lastVisitedRoute)
  const setLastVisitedRoute = useAppStore((s) => s.setLastVisitedRoute)

  useEffect(() => {
    if (!pathname.startsWith('/dashboard')) return
    if (pathname !== '/dashboard') setLastVisitedRoute(pathname)
  }, [pathname, setLastVisitedRoute])

  useEffect(() => {
    if (pathname === '/dashboard' && lastVisitedRoute && lastVisitedRoute !== '/dashboard') {
      router.replace(lastVisitedRoute)
    }
  }, [pathname, lastVisitedRoute, router])

  const NavLink = ({ href, label, icon: Icon }: { href: string; label: string; icon: any }) => (
    <Link
      href={href}
      className={`w-full px-3 py-3 rounded-lg text-sm transition-colors flex items-center gap-3 ${
        pathname.startsWith(href)
          ? 'bg-primary text-primary-foreground'
          : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground'
      }`}
    >
      <Icon className="w-4 h-4" />
      {label}
    </Link>
  )

  const NavSection = ({ title, children }: { title: string; children: ReactNode }) => (
    <div>
      <div className="px-3 mb-2 text-xs font-medium text-muted-foreground uppercase tracking-wide">
        {title}
      </div>
      <div className="flex flex-col gap-1">
        {children}
      </div>
    </div>
  )

  return (
    <>
      <SignedIn>
        <div className="min-h-screen flex">
          {/* Collapsible Sidebar */}
          <AnimatePresence>
            {sidebarOpen && (
              <motion.aside
                initial={{ width: 0, opacity: 0 }}
                animate={{ width: 280, opacity: 1 }}
                exit={{ width: 0, opacity: 0 }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
                className="border-r bg-background overflow-hidden flex-shrink-0"
              >
                {/* Header */}
                <div className="h-14 px-4 flex items-center text-lg font-semibold border-b">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                      <Bot className="w-5 h-5 text-primary-foreground" />
                    </div>
                    <span>Excel Mastery AI</span>
                  </div>
                </div>
                
                {/* Search */}
                <div className="p-3 border-b">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input 
                      placeholder="Rechercher..." 
                      className="pl-9 h-9 text-sm"
                    />
                  </div>
                </div>

                {/* Navigation */}
                <ScrollArea className="h-[calc(100vh-7rem)]">
                  <div className="p-3 space-y-6">
                    <NavSection title="Assistant IA">
                      <NavLink href="/dashboard/tutor" label="Tuteur IA" icon={Bot} />
                      <NavLink href="/dashboard/practice" label="Exercices" icon={Target} />
                    </NavSection>

                    <NavSection title="Apprentissage">
                      <NavLink href="/dashboard/courses" label="Cours" icon={BookOpen} />
                      <NavLink href="/dashboard/tips" label="Astuces" icon={Lightbulb} />
                    </NavSection>

                    <NavSection title="Support">
                      <NavLink href="/dashboard/help" label="Aide" icon={HelpCircle} />
                      <NavLink href="/dashboard/settings" label="Paramètres" icon={Settings} />
                    </NavSection>
                  </div>
                </ScrollArea>
              </motion.aside>
            )}
          </AnimatePresence>

          {/* Main Content Area */}
          <div className="flex-1 flex flex-col">
            <header className="sticky top-0 z-10 h-14 border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
              <div className="h-full px-6 flex items-center gap-3">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    const next = !sidebarOpen
                    setSidebarOpen(next)
                    setSidebarOpenCached(next)
                  }}
                  className="h-8 w-8 p-0"
                >
                  {sidebarOpen ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                </Button>
                <div className="flex-1">
                  <h1 className="text-lg font-semibold">
                    {pathname.includes('/tutor') && 'Tuteur IA'}
                    {pathname.includes('/courses') && 'Cours'}
                    {pathname.includes('/practice') && 'Exercices'}
                    {pathname.includes('/tips') && 'Astuces'}
                    {pathname.includes('/help') && 'Aide'}
                    {pathname.includes('/settings') && 'Paramètres'}
                    {!pathname.includes('/tutor') && !pathname.includes('/courses') && !pathname.includes('/practice') && !pathname.includes('/tips') && !pathname.includes('/help') && !pathname.includes('/settings') && 'Tableau de bord'}
                  </h1>
                </div>
                <ThemeToggle />
                <Button variant="ghost" size="sm" onClick={() => setFeedbackOpen(true)}>Feedback</Button>
                <UserButton 
                  afterSignOutUrl="/"
                  userProfileMode="modal"
                />
              </div>
            </header>
            <main className="p-6">
            {children}
          </main>
          <Dialog open={feedbackOpen} onOpenChange={setFeedbackOpen}>
            <DialogContent className="sm:max-w-lg">
              <DialogHeader>
                <DialogTitle>Envoyer un feedback</DialogTitle>
                <DialogDescription>
                  Décrivez votre suggestion, un bug, ou une idée d'amélioration. Nous le lirons avec attention.
                </DialogDescription>
              </DialogHeader>
              <form
                onSubmit={async (e) => {
                  e.preventDefault()
                  setSending(true)
                  try {
                    const res = await fetch('/api/feedback', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ name, email, description }),
                    })
                    if (!res.ok) {
                      throw new Error('Erreur lors de l\'envoi du feedback')
                    }
                    setFeedbackOpen(false)
                    setDescription('')
                  } finally {
                    setSending(false)
                  }
                }}
                className="space-y-4"
              >
                <div className="grid gap-2">
                  <Label htmlFor="fb-name">Nom</Label>
                  <Input id="fb-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Votre nom" required />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="fb-email">Email</Label>
                  <Input id="fb-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="vous@exemple.com" required />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="fb-desc">Description</Label>
                  <Textarea id="fb-desc" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Décrivez votre feedback..." rows={5} required />
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <Button type="button" variant="outline" onClick={() => setFeedbackOpen(false)}>Annuler</Button>
                  <Button type="submit" disabled={sending}>{sending ? 'Envoi...' : 'Envoyer'}</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
          </div>
        </div>
      </SignedIn>
      <SignedOut>
        <RedirectToSignIn />
      </SignedOut>
    </>
  )
}


