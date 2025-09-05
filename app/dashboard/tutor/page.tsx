"use client"
import { useEffect, useMemo, useState } from "react"
import { useUser } from "@clerk/nextjs"
import { useMutation, useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import { aiChat, aiChatStream } from "@/lib/ai"
import Markdown from "@/components/markdown"
import CopyButton from "@/components/copy-button"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { ScrollArea } from "@/components/ui/scroll-area"
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable"
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { Send, StopCircle, Bot, User, MessageSquare, ChevronLeft, ChevronRight, Plus, Trash2, Edit, Loader2 } from "lucide-react"
import { toast } from 'sonner'
import { useAppStore } from '@/store/app-store'
import { MessageSkeleton } from '@/components/placeholders'
import { motion, AnimatePresence } from "framer-motion"
import { useRouter } from 'next/navigation'

function makeConciseTitle(raw: string): string {
  let s = (raw || "").replace(/\n+/g, " ").trim()
  // Retire quelques débuts verbeux fréquents (français)
  s = s
    .replace(/^explique(-|\s)?moi(\s(de|les|le))?\s+/i, "")
    .replace(/^peux-tu\s(expliquer|montrer)\s+/i, "")
    .replace(/^comment\s+(faire|utiliser|créer|configurer)\s+/i, "")
    .replace(/^aide(-|\s)?moi\s+à\s+/i, "")
    .replace(/^je\s+veux\s+(savoir|apprendre)\s+/i, "")
  const words = s.split(/\s+/).filter(Boolean).slice(0, 7)
  return words.join(" ").slice(0, 60)
}

export default function TutorPage() {
  const { user } = useUser()
  const router = useRouter()
  const userEmail = user?.primaryEmailAddress?.emailAddress || ""
  const userDoc = useQuery((api as any).users.getByEmail, userEmail ? { email: userEmail } : undefined)
  const upsertUser = useMutation((api as any).users.upsertFromClerk)
  const decrementCredits = useMutation((api as any).users.decrementCreditsByClerkId)

  const [conversationId, setConversationId] = useState<string | null>(null)
  const cachedLastConversationId = useAppStore((s) => s.lastConversationId)
  const setLastConversationId = useAppStore((s) => s.setLastConversationId)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [isNewConversation, setIsNewConversation] = useState(false)
  const [editingTitle, setEditingTitle] = useState<string | null>(null)
  const [editTitle, setEditTitle] = useState("")
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null)
  
  const conversations = useQuery(
    (api as any).conversations.list,
    userDoc?._id ? { userId: userDoc._id } : "skip"
  )

  const createConversation = useMutation((api as any).conversations.create)
  // Ensure sidebar is closed by default on mobile & tablet (<1024px) and closes on resize
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 1023px)')
    const apply = (e: MediaQueryListEvent | MediaQueryList) => {
      const isNarrow = 'matches' in e ? e.matches : (e as MediaQueryList).matches
      if (isNarrow) setSidebarOpen(false)
    }
    apply(mq)
    mq.addEventListener?.('change', apply as (ev: Event) => void)
    // @ts-ignore
    mq.addListener?.(apply)
    return () => {
      mq.removeEventListener?.('change', apply as (ev: Event) => void)
      // @ts-ignore
      mq.removeListener?.(apply)
    }
  }, [])
  const addMessage = useMutation((api as any).messages.add)
  const updateConversation = useMutation((api as any).conversations.update)
  const deleteConversation = useMutation((api as any).conversations.remove)
  const removeIfEmpty = useMutation((api as any).conversations.removeIfEmpty)

  // Ensure user exists in Convex and create initial conversation
  useEffect(() => {
    if (!user || !userEmail) return
    if (conversationId) return
    
    const run = async () => {
      let currentUserDoc = userDoc
      
      // If user doesn't exist in Convex, create them
      if (!currentUserDoc && userEmail) {
        try {
          await upsertUser({
            email: userEmail,
            firstName: user.firstName || "",
            lastName: user.lastName || "",
            image: user.imageUrl || undefined,
          })
          // The userDoc will be updated by the query after this mutation
          return // Let the effect re-run with the new userDoc
        } catch (error) {
          console.error("Failed to create user:", error)
          return
        }
      }
      
      if (!currentUserDoc?._id) return
      
      // Use last cached conversation if exists
      if (cachedLastConversationId) {
        setConversationId(cachedLastConversationId)
        return
      }
      // If user has at least one conversation, pick the first
      if (conversations && conversations.length > 0) {
        setConversationId(conversations[0]._id)
        return
      }
      // Otherwise create an initial empty conversation titled "New Chat"
      const newId = await createConversation({ userId: currentUserDoc._id, title: "New Chat" })
      setConversationId(newId)
      setIsNewConversation(true)
      setLastConversationId(newId || undefined)
      fetch('/api/conversations', { method: 'POST' }).catch(() => {})
    }
    run()
  }, [user, userEmail, userDoc, conversations, conversationId, cachedLastConversationId, createConversation, setLastConversationId, upsertUser])

  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const [streamingReply, setStreamingReply] = useState("")
  const [abortController, setAbortController] = useState<AbortController | null>(null)



  async function ask() {
    if (!input.trim() || !userDoc?._id) return
    setLoading(true)
    try {
      // Gate by plan/credits for FREE users
      try {
        const me = await fetch('/api/me', { cache: 'no-store' }).then(r => r.ok ? r.json() : null).catch(() => null)
        const plan = me?.plan || 'FREE'
        const credits = typeof me?.credits === 'number' ? me.credits : 0
        if (plan !== 'PRO') {
          if (credits <= 0) {
            toast.error('Crédits épuisés. Passez au plan Pro pour usage illimité.')
            router.push('/payments/moneroo?interval=month&trial=true')
            router.push('/payments/moneroo?interval=month&trial=true')
            setLoading(false)
            return
          }
          try {
            if (user?.id) await decrementCredits({ clerkId: user.id, amount: 1 })
          } catch {}
        }
      } catch {}

      let currentId = conversationId
      
      if (!currentId || isNewConversation) {
        // Titre local concis immédiat
        const firstLine = input.split('\n')[0]
        const initialTitle = makeConciseTitle(firstLine)
        currentId = await createConversation({ userId: userDoc._id, title: initialTitle })
        setConversationId(currentId)
        setIsNewConversation(false)
        setLastConversationId(currentId || undefined)
        // Invalidate conversations cache tag (Next revalidateTag)
        fetch('/api/conversations', { method: 'POST' }).catch(() => {})

        // Fire-and-forget: refine to a concise title using AI (<= 7 mots, clair)
        ;(async () => {
          try {
            const concise = await aiChat({
              system: "Tu es un assistant. Résume la demande de l'utilisateur en un titre très court, clair et non verbeux (≤ 7 mots). Sans guillemets, sans ponctuation finale.",
              messages: [{ role: 'user', content: input }],
              temperature: 0.2,
              max_tokens: 24,
            })
            const cleaned = (concise || initialTitle)
              .replace(/["'“”]+/g, '')
              .replace(/[\.\!\?]+$/g, '')
              .trim()
              .slice(0, 60)
            const limited = makeConciseTitle(cleaned)
            if (limited && limited !== initialTitle) {
              await updateConversation({ id: currentId!, title: limited })
              fetch('/api/conversations', { method: 'POST' }).catch(() => {})
            }
          } catch {}
        })()
      }
      
      await addMessage({ conversationId: currentId!, role: "user", content: input })

      setStreamingReply("")
      const ctrl = new AbortController()
      setAbortController(ctrl)
      
      let finalReply = ""
      await aiChatStream({
        system: "Tu es un tuteur d'Excel expert. Réponds avec:\n1) Explication brève\n2) Étapes numérotées\n3) Formule(s) Excel en blocs de code\n4) Pièges fréquents\n5) Exemple minimal.",
        messages: [{ role: "user", content: input }],
          temperature: 0.2,
        max_tokens: 1200,
        signal: ctrl.signal,
        onToken: (t) => {
          setStreamingReply((prev) => {
            const newReply = prev + t
            finalReply = newReply
            return newReply
          })
        },
        onDone: async () => {
          setTimeout(async () => {
            await addMessage({ conversationId: currentId!, role: "assistant", content: finalReply })
            setStreamingReply("")
          }, 1000)
        },
      })
      setInput("")
    } catch (error) {
      console.error("Error in ask function:", error)
      toast.error('Erreur lors de la génération')
    } finally {
      setLoading(false)
    }
  }

  function stopStreaming() {
    abortController?.abort()
    setAbortController(null)
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      ask()
    }
  }

  const startNewConversation = async () => {
    // Remove previous empty conversation if it is empty
    if (conversationId) {
      try { await removeIfEmpty({ id: conversationId }) } catch {}
    }
    setIsNewConversation(true)
    setSidebarOpen(false)
    if (userDoc?._id) {
      const newId = await createConversation({ userId: userDoc._id, title: "New Chat" })
      setConversationId(newId)
      setLastConversationId(newId || undefined)
      fetch('/api/conversations', { method: 'POST' }).catch(() => {})
    } else {
      setConversationId(null)
    }
  }

  const fillInputWithQuestion = (question: string) => {
    setInput(question)
  }

  const handleEditTitle = (conversationId: string, currentTitle: string) => {
    setEditingTitle(conversationId)
    setEditTitle(currentTitle)
  }

  const handleSaveTitle = async (conversationId: string) => {
    if (editTitle.trim()) {
      await updateConversation({ id: conversationId, title: editTitle.trim() })
      setEditingTitle(null)
      setEditTitle("")
      fetch('/api/conversations', { method: 'POST' }).catch(() => {})
    }
  }

  const handleDeleteConversation = (conversationIdToDelete: string) => {
    setPendingDeleteId(conversationIdToDelete)
    setConfirmOpen(true)
  }

  const confirmDelete = async () => {
    if (!pendingDeleteId) return
    await deleteConversation({ id: pendingDeleteId })
    if (conversationId === pendingDeleteId) {
      setConversationId(null)
      setIsNewConversation(true)
    }
    setPendingDeleteId(null)
    setConfirmOpen(false)
    fetch('/api/conversations', { method: 'POST' }).catch(() => {})
  }

  const sidebarWidth = useAppStore((s) => s.sidebarWidth ?? 22)
  const setSidebarWidth = useAppStore((s) => s.setSidebarWidth)

  return (
    <div className="h-[calc(100vh-8rem)]">
      <ResizablePanelGroup direction="horizontal" className="h-full" onLayout={(sizes) => {
        if (Array.isArray(sizes) && sizes.length > 0) {
          setSidebarWidth(Math.round(sizes[0]))
        }
      }}>
        {sidebarOpen && (
          <ResizablePanel defaultSize={sidebarWidth} minSize={16} maxSize={40} className="border-r bg-background overflow-hidden">
            <div className="p-4 border-b">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">Conversations</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={startNewConversation}
                  className="h-8 w-8 p-0"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <ScrollArea className="h-full">
              <div className="p-2 space-y-1">
                {conversations?.map((c: any) => (
                  <motion.div
                    key={c._id}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className={`group relative rounded-lg transition-colors ${
                      conversationId === c._id
                        ? 'bg-primary text-primary-foreground'
                        : 'hover:bg-muted'
                    }`}
                  >
                    {editingTitle === c._id ? (
                      // Mode édition du titre
                      <div className="p-3 space-y-2">
                        <input
                          type="text"
                          value={editTitle}
                          onChange={(e) => setEditTitle(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleSaveTitle(c._id)
                            if (e.key === 'Escape') {
                              setEditingTitle(null)
                              setEditTitle("")
                            }
                          }}
                          className="w-full px-2 py-1 text-sm bg-background border border-border rounded text-foreground"
                          autoFocus
                        />
                        <div className="flex gap-1">
                          <button
                            onClick={() => handleSaveTitle(c._id)}
                            className="px-2 py-1 text-xs bg-primary text-primary-foreground rounded hover:bg-primary/80"
                          >
                            Sauvegarder
                          </button>
                          <button
                            onClick={() => {
                              setEditingTitle(null)
                              setEditTitle("")
                            }}
                            className="px-2 py-1 text-xs bg-muted text-muted-foreground rounded hover:bg-muted/80"
                          >
                            Annuler
                          </button>
                        </div>
                      </div>
                    ) : (
                      // Affichage normal de la conversation
                      <div className="flex items-center gap-2 p-3">
                        <button
                          onClick={async () => {
                            // When switching, remove the previous conversation if it is empty
                            if (conversationId) {
                              try { await removeIfEmpty({ id: conversationId }) } catch {}
                            }
                            setConversationId(c._id)
                            setIsNewConversation(false)
                            setLastConversationId(c._id)
                            setSidebarOpen(false) // Close sidebar to show conversation content
                          }}
                          className="flex-1 text-left flex items-center gap-2 min-w-0"
                        >
                          <MessageSquare className="h-4 w-4 flex-shrink-0" />
                          <span className="text-sm truncate">{c.title}</span>
                        </button>
                        
                        {/* Boutons d'action (au survol) avec tooltips */}
                        <div className="hidden group-hover:flex items-center gap-1">
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <button
                                  onClick={() => handleEditTitle(c._id, c.title)}
                                  className={`${conversationId === c._id ? 'text-primary-foreground hover:bg-primary-foreground/10' : 'text-foreground hover:bg-muted/50'} p-1 rounded transition-colors`}
                                >
                                  <Edit className="h-3 w-3" />
                                </button>
                              </TooltipTrigger>
                              <TooltipContent>Renommer</TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
            <button
                                  onClick={() => handleDeleteConversation(c._id)}
                                  className={`${conversationId === c._id ? 'text-red-300 hover:bg-primary-foreground/10' : 'text-destructive hover:bg-muted/50'} p-1 rounded transition-colors`}
                                >
                                  <Trash2 className="h-3 w-3" />
                                </button>
                              </TooltipTrigger>
                              <TooltipContent>Supprimer</TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>
                      </div>
                    )}
                  </motion.div>
                ))}
              </div>
            </ScrollArea>
          </ResizablePanel>
        )}
        {sidebarOpen && <ResizableHandle withHandle />}
        {/* Main Chat Area */}
        <ResizablePanel minSize={45} className="flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="h-8 w-8 p-0"
            >
              {sidebarOpen ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            </Button>
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <Bot className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-lg font-semibold">Tuteur IA Excel</h1>
              <p className="text-sm text-muted-foreground">Posez vos questions sur Excel</p>
            </div>
          </div>
        </div>

        {/* Messages Area */}
        <ScrollArea className="flex-1 p-4 sm:p-6">
          <div className="space-y-4 sm:space-y-6 max-w-3xl sm:max-w-4xl lg:max-w-5xl mx-auto">
            {conversationId && !isNewConversation ? (
              <Messages conversationId={conversationId} onFillInput={fillInputWithQuestion} />
            ) : null}
            {isNewConversation && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center py-12"
              >
                <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                  <Bot className="w-8 h-8 text-muted-foreground" />
                </div>
                <h2 className="text-xl font-semibold mb-2">Nouvelle conversation</h2>
                <p className="text-muted-foreground mb-6">Commencez par poser une question sur Excel</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 sm:gap-3 max-w-xl sm:max-w-2xl mx-auto">
                  <button 
                    onClick={() => fillInputWithQuestion("Comment utiliser RECHERCHEV pour fusionner des données ?")}
                    className="w-full text-left hover:bg-muted/80 transition-colors rounded-lg p-3 text-sm text-muted-foreground border border-border hover:border-foreground/20"
                  >
                    "Comment utiliser RECHERCHEV pour fusionner des données ?"
                  </button>
                  <button 
                    onClick={() => fillInputWithQuestion("Explique-moi les tableaux croisés dynamiques")}
                    className="w-full text-left hover:bg-muted/80 transition-colors rounded-lg p-3 text-sm text-muted-foreground border border-border hover:border-foreground/20"
                  >
                    "Explique-moi les tableaux croisés dynamiques"
                  </button>
                  <button 
                    onClick={() => fillInputWithQuestion("Comment créer une formule conditionnelle avec SI ?")}
                    className="w-full text-left hover:bg-muted/80 transition-colors rounded-lg p-3 text-sm text-muted-foreground border border-border hover:border-foreground/20"
                  >
                    "Comment créer une formule conditionnelle avec SI ?"
                  </button>
                  <button 
                    onClick={() => fillInputWithQuestion("Optimise cette formule : =SOMME(A1:A100)")}
                    className="w-full text-left hover:bg-muted/80 transition-colors rounded-lg p-3 text-sm text-muted-foreground border border-border hover:border-foreground/20"
                  >
                    "Optimise cette formule : =SOMME(A1:A100)"
                  </button>
                </div>
              </motion.div>
            )}
            {!conversationId && !isNewConversation && conversations && conversations.length === 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center py-12"
              >
                <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                  <Bot className="w-8 h-8 text-muted-foreground" />
                </div>
                <h2 className="text-xl font-semibold mb-2">Bienvenue !</h2>
                <p className="text-muted-foreground mb-6">Commencez votre apprentissage Excel avec l'IA</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 sm:gap-3 max-w-xl sm:max-w-2xl mx-auto">
                  <button 
                    onClick={() => fillInputWithQuestion("Comment utiliser RECHERCHEV pour fusionner des données ?")}
                    className="w-full text-left hover:bg-muted/80 transition-colors rounded-lg p-3 text-sm text-muted-foreground border border-border hover:border-foreground/20"
                  >
                    "Comment utiliser RECHERCHEV pour fusionner des données ?"
                  </button>
                  <button 
                    onClick={() => fillInputWithQuestion("Explique-moi les tableaux croisés dynamiques")}
                    className="w-full text-left hover:bg-muted/80 transition-colors rounded-lg p-3 text-sm text-muted-foreground border border-border hover:border-foreground/20"
                  >
                    "Explique-moi les tableaux croisés dynamiques"
                  </button>
                  <button 
                    onClick={() => fillInputWithQuestion("Comment créer une formule conditionnelle avec SI ?")}
                    className="w-full text-left hover:bg-muted/80 transition-colors rounded-lg p-3 text-sm text-muted-foreground border border-border hover:border-foreground/20"
                  >
                    "Comment créer une formule conditionnelle avec SI ?"
                  </button>
                  <button 
                    onClick={() => fillInputWithQuestion("Optimise cette formule : =SOMME(A1:A100)")}
                    className="w-full text-left hover:bg-muted/80 transition-colors rounded-lg p-3 text-sm text-muted-foreground border border-border hover:border-foreground/20"
                  >
                    "Optimise cette formule : =SOMME(A1:A100)"
            </button>
                </div>
              </motion.div>
            )}
            {/* Messenger-like typing indicator while waiting first tokens */}
            {loading && !streamingReply && (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
                className="flex gap-2 sm:gap-3"
              >
                <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center flex-shrink-0">
                  <Bot className="w-5 h-5 text-primary-foreground" />
                </div>
                <div className="flex-1 max-w-[90%] sm:max-w-[80%]">
                  <div className="bg-muted border border-border rounded-xl px-3 sm:px-4 py-2 inline-flex items-center gap-2">
                    <motion.span
                      className="w-2 h-2 rounded-full bg-muted-foreground/70"
                      animate={{ opacity: [0.3, 1, 0.3], y: [0, -2, 0] }}
                      transition={{ duration: 0.9, repeat: Infinity, ease: 'easeInOut' }}
                    />
                    <motion.span
                      className="w-2 h-2 rounded-full bg-muted-foreground/70"
                      animate={{ opacity: [0.3, 1, 0.3], y: [0, -2, 0] }}
                      transition={{ duration: 0.9, repeat: Infinity, ease: 'easeInOut', delay: 0.15 }}
                    />
                    <motion.span
                      className="w-2 h-2 rounded-full bg-muted-foreground/70"
                      animate={{ opacity: [0.3, 1, 0.3], y: [0, -2, 0] }}
                      transition={{ duration: 0.9, repeat: Infinity, ease: 'easeInOut', delay: 0.3 }}
                    />
                  </div>
                </div>
              </motion.div>
            )}
            <AnimatePresence>
              {streamingReply && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                  className="flex gap-2 sm:gap-3"
                >
                  <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center flex-shrink-0">
                    <Bot className="w-5 h-5 text-primary-foreground" />
                  </div>
                  <div className="flex-1 space-y-2 sm:space-y-3">
                    <div className="bg-muted rounded-lg p-3 sm:p-4">
                      <Markdown content={streamingReply} />
                      <motion.div
                        className="inline-block w-2 h-4 bg-primary rounded-sm ml-1"
                        animate={{ opacity: [1, 0, 1] }}
                        transition={{ duration: 1, repeat: Infinity }}
                      />
                </div>
              </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </ScrollArea>

        {/* Input Bar */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className="border-t bg-background p-4"
        >
          <div className="max-w-3xl mx-auto">
            <div className="flex gap-3">
              <Textarea
                placeholder="Posez votre question sur Excel... (Shift+Enter pour nouvelle ligne)"
              value={input}
              onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyPress}
                className="min-h-[44px] max-h-[120px] resize-none"
                rows={1}
              />
              <div className="flex gap-2">
                <Button 
                  onClick={ask} 
                  disabled={loading || !input.trim() || !userDoc?._id}
                  size="icon"
                  className="h-[44px] w-[44px]"

                >
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                </Button>
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-2 text-center">
              Le tuteur IA peut faire des erreurs. Vérifiez toujours les informations importantes.
            </p>
          </div>
        </motion.div>
        </ResizablePanel>
        {/* Delete confirmation dialog */}
        <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Supprimer cette conversation ?</AlertDialogTitle>
              <AlertDialogDescription>
                Cette action est irréversible. Tous les messages associés seront définitivement supprimés.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Annuler</AlertDialogCancel>
              <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Supprimer</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </ResizablePanelGroup>
    </div>
  )
}

function Messages({ conversationId, onFillInput }: { conversationId: string; onFillInput: (question: string) => void }) {
  const messages = useQuery((api as any).messages.byConversation, { conversationId })
  const addMessage = useMutation((api as any).messages.add)
  const updateMessage = useMutation((api as any).messages.update)
  const removeMessage = useMutation((api as any).messages.remove)
  const removeMessageAfter = useMutation((api as any).messages.removeAfter)

  const [editingMessageId, setEditingMessageId] = useState<string | null>(null)
  const [editingValue, setEditingValue] = useState<string>("")
  const [regeneratingId, setRegeneratingId] = useState<string | null>(null)
  
  if (!messages) {
    return <MessageSkeleton />
  }

  if (messages.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center py-12"
      >
        <Bot className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-medium text-muted-foreground mb-2">
          Commencez une conversation
        </h3>
        <p className="text-sm text-muted-foreground mb-6">
          Posez votre première question sur Excel ci-dessous
        </p>
        <div className="max-w-2xl mx-auto">
          <p className="text-xs text-muted-foreground mb-3">Exemples de questions :</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-left">
            <button 
              onClick={() => onFillInput("Comment utiliser RECHERCHEV pour fusionner des données ?")}
              className="w-full text-left hover:bg-muted/80 transition-colors rounded p-2 text-xs text-muted-foreground"
            >
              "Comment utiliser RECHERCHEV pour fusionner des données ?"
            </button>
            <button 
              onClick={() => onFillInput("Explique-moi les tableaux croisés dynamiques")}
              className="w-full text-left hover:bg-muted/80 transition-colors rounded p-2 text-xs text-muted-foreground"
            >
              "Explique-moi les tableaux croisés dynamiques"
            </button>
            <button 
              onClick={() => onFillInput("Comment créer une formule conditionnelle avec SI ?")}
              className="w-full text-left hover:bg-muted/80 transition-colors rounded p-2 text-xs text-muted-foreground"
            >
              "Comment créer une formule conditionnelle avec SI ?"
            </button>
            <button 
              onClick={() => onFillInput("Optimise cette formule : =SOMME(A1:A100)")}
              className="w-full text-left hover:bg-muted/80 transition-colors rounded p-2 text-xs text-muted-foreground"
            >
              "Optimise cette formule : =SOMME(A1:A100)"
            </button>
          </div>
        </div>
      </motion.div>
    )
  }

  return (
    <AnimatePresence>
      {messages.map((m: any, index: number) => (
        <motion.div
          key={m._id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: index * 0.1 }}
          className={`flex gap-3 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
        >
          {m.role === 'assistant' && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.2, delay: index * 0.1 + 0.1 }}
              className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center flex-shrink-0"
            >
              <Bot className="w-5 h-5 text-primary-foreground" />
            </motion.div>
          )}
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.2, delay: index * 0.1 + 0.2 }}
            className={`flex-1 max-w-[80%] ${m.role === 'user' ? 'order-first' : ''}`}
          >
            <div className={`rounded-lg p-4 ${
              m.role === 'user'
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted border border-border'
            }`}>
              {m.role === 'user' ? (
                <div>
                  {editingMessageId === m._id ? (
                    <div className="space-y-2">
                      <Textarea
                        value={editingValue}
                        onChange={(e) => setEditingValue(e.target.value)}
                        className="min-h-[100px] bg-background text-foreground"
                      />
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => {
                            setEditingMessageId(null)
                            setEditingValue("")
                          }}
                          className="text-xs px-2 py-1 rounded border border-border text-foreground hover:bg-muted/70 transition-colors"
                        >
                          Annuler
                        </button>
                        <button
                          onClick={async () => {
                            const trimmed = editingValue.trim()
                            if (!trimmed) return
                            try {
                              // Update the user message content
                              await updateMessage({ id: m._id, content: trimmed })

                              // If next message is an assistant reply, remove it
                              const next = messages[index + 1]
                              if (next && next.role === 'assistant') {
                                await removeMessage({ id: next._id })
                              }

                              // Regenerate assistant reply using the conversation up to this point
                              const historyUpTo = messages
                                .slice(0, index) // messages before current
                                .concat([{ ...m, content: trimmed }]) // the edited message as latest
                                .map((mm: any) => ({ role: mm.role, content: mm.content }))

                              const reply = await aiChat({
                                system: "Tu es un tuteur d'Excel expert. Réponds avec:\n1) Explication brève\n2) Étapes numérotées\n3) Formule(s) Excel en blocs de code\n4) Pièges fréquents\n5) Exemple minimal.",
                                messages: historyUpTo,
                                temperature: 0.2,
                                max_tokens: 800,
                              })

                              await addMessage({ conversationId, role: 'assistant', content: reply || "" })
                              toast.success('Message mis à jour et réponse régénérée')
                            } catch (e) {
                              toast.error("Impossible de mettre à jour/regénérer la réponse")
                            } finally {
                              setEditingMessageId(null)
                              setEditingValue("")
                            }
                          }}
                          className="text-xs px-2 py-1 rounded bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
                        >
                          Enregistrer & régénérer
                        </button>
      </div>
    </div>
                  ) : (
                    <>
                      <p>{m.content}</p>
                      <div className="mt-2 flex justify-end gap-2">
                        <button
                          onClick={() => onFillInput(m.content)}
                          className="text-xs px-2 py-1 rounded border border-border text-foreground hover:bg-muted/70 transition-colors"
                        >
                          Modifier et réutiliser
                        </button>
                        <button
                          onClick={() => {
                            setEditingMessageId(m._id)
                            setEditingValue(m.content)
                          }}
                          className="text-xs px-2 py-1 rounded border border-border text-foreground hover:bg-muted/70 transition-colors"
                        >
                          Modifier sur place
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ) : (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Bot className="w-4 h-4 text-primary" />
                      <span className="text-sm font-medium text-primary">Tuteur IA</span>
                    </div>
                    <button
                      disabled={regeneratingId === m._id}
                      onClick={async () => {
                        try {
                          setRegeneratingId(m._id)
                          const historyUpTo = messages
                            .slice(0, index) // all messages before this assistant reply
                            .map((mm: any) => ({ role: mm.role, content: mm.content }))
                          const reply = await aiChat({
                            system: "Tu es un tuteur d'Excel expert. Réponds avec:\n1) Explication brève\n2) Étapes numérotées\n3) Formule(s) Excel en blocs de code\n4) Pièges fréquents\n5) Exemple minimal.",
                            messages: historyUpTo,
                            temperature: 0.2,
                            max_tokens: 800,
                          })
                          await updateMessage({ id: m._id, content: reply || '' })
                          toast.success('Réponse régénérée')
                        } catch (e) {
                          toast.error('Impossible de régénérer la réponse')
                        } finally {
                          setRegeneratingId(null)
                        }
                      }}
                      className="text-xs px-2 py-1 rounded border border-border text-foreground hover:bg-muted/70 transition-colors disabled:opacity-50"
                    >
                      {regeneratingId === m._id ? '…' : 'Régénérer'}
                    </button>
                    <button
                      disabled={regeneratingId === m._id}
                      onClick={async () => {
                        try {
                          setRegeneratingId(m._id)
                          // Delete all messages after this assistant message
                          await removeMessageAfter({ conversationId, cutoffCreatedAt: m.createdAt })

                          // Build history up to the previous user message (before this assistant)
                          const historyUpTo = messages
                            .filter((mm: any) => mm.createdAt <= m.createdAt)
                            .slice(0, index) // everything before current assistant
                            .map((mm: any) => ({ role: mm.role, content: mm.content }))

                          // Generate new assistant reply and add it as a new message
                          const reply = await aiChat({
                            system: "Tu es un tuteur d'Excel expert. Réponds avec:\n1) Explication brève\n2) Étapes numérotées\n3) Formule(s) Excel en blocs de code\n4) Pièges fréquents\n5) Exemple minimal.",
                            messages: historyUpTo,
                            temperature: 0.2,
                            max_tokens: 800,
                          })

                          await updateMessage({ id: m._id, content: reply || '' })
                          toast.success('Réponse régénérée depuis ce point')
                        } catch (e) {
                          toast.error('Impossible de régénérer depuis ce point')
                        } finally {
                          setRegeneratingId(null)
                        }
                      }}
                      className="ml-2 text-xs px-2 py-1 rounded border border-border text-foreground hover:bg-muted/70 transition-colors disabled:opacity-50"
                    >
                      {regeneratingId === m._id ? '…' : 'Régénérer depuis ici'}
                    </button>
                  </div>
                  <Markdown content={m.content} />
                </div>
              )}
            </div>
          </motion.div>
          {m.role === 'user' && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.2, delay: index * 0.1 + 0.1 }}
              className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center flex-shrink-0"
            >
              <User className="w-5 h-5 text-primary-foreground" />
            </motion.div>
          )}
        </motion.div>
      ))}
    </AnimatePresence>
  )
}


