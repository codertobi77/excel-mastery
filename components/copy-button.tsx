"use client"
import { useState } from "react"
import { Copy, Check } from "lucide-react"

export default function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)
  
  async function onCopy() {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error("Failed to copy text:", err)
    }
  }
  
  return (
    <button 
      onClick={onCopy} 
      className={`
        flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-200
        ${copied 
          ? 'bg-green-500/20 text-green-600 border border-green-500/30 hover:bg-green-500/30' 
          : 'bg-background/80 text-muted-foreground border border-border hover:bg-background hover:text-foreground hover:border-foreground/20'
        }
        hover:scale-105 active:scale-95
      `}
      title={copied ? "Copié !" : "Copier le code"}
    >
      {copied ? (
        <>
          <Check className="w-3 h-3" />
          Copié
        </>
      ) : (
        <>
          <Copy className="w-3 h-3" />
          Copier
        </>
      )}
    </button>
  )
}


