"use client"
import React from "react"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import CopyButton from "./copy-button"

export default function Markdown({ content }: { content: string }) {
  return (
    <div className="prose prose-sm max-w-none dark:prose-invert prose-headings:font-semibold prose-h1:text-xl prose-h2:text-lg prose-h3:text-base prose-p:leading-relaxed prose-p:text-sm prose-strong:font-semibold prose-strong:text-foreground prose-em:text-muted-foreground prose-ul:my-2 prose-ol:my-2 prose-li:my-1">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          // Titres avec meilleur espacement
          h1: ({ children, ...props }) => (
            <h1 className="text-xl font-semibold text-foreground mt-6 mb-3 pb-2 border-b border-border" {...props}>
              {children}
            </h1>
          ),
          h2: ({ children, ...props }) => (
            <h2 className="text-lg font-semibold text-foreground mt-5 mb-2" {...props}>
              {children}
            </h2>
          ),
          h3: ({ children, ...props }) => (
            <h3 className="text-base font-semibold text-foreground mt-4 mb-2" {...props}>
              {children}
            </h3>
          ),
          
          // Paragraphes avec meilleur espacement
          p: ({ children, ...props }) => (
            <p className="text-sm leading-relaxed text-foreground mb-3 last:mb-0" {...props}>
              {children}
            </p>
          ),
          
          // Listes avec meilleur style
          ul: ({ children, ...props }) => (
            <ul className="my-3 space-y-1 list-disc list-inside text-sm text-foreground" {...props}>
              {children}
            </ul>
          ),
          ol: ({ children, ...props }) => (
            <ol className="my-3 space-y-1 list-decimal list-inside text-sm text-foreground" {...props}>
              {children}
            </ol>
          ),
          li: ({ children, ...props }) => (
            <li className="text-sm text-foreground leading-relaxed" {...props}>
              {children}
            </li>
          ),
          
          // Code inline avec meilleur style
          code({ inline, className, children, ...props }: any) {
            const text = String(children || "").replace(/\n$/, "")
            if (inline) {
              return (
                <code className="px-1.5 py-0.5 bg-muted text-foreground rounded text-xs font-mono border border-border" {...props}>
                  {children}
                </code>
              )
            }
            
            // Code block avec meilleur style et bouton de copie
            return (
              <div className="relative my-4 group">
                {/* Header du code block */}
                <div className="flex items-center justify-between px-4 py-2 bg-muted/50 border-b border-border rounded-t-lg">
                  <span className="text-xs font-medium text-muted-foreground">Code</span>
                  <CopyButton text={text} />
                </div>
                
                {/* Contenu du code */}
                <pre className={`${className} m-0 p-4 bg-muted/30 border border-border rounded-b-lg overflow-x-auto`} {...props}>
                  <code className="text-xs font-mono text-foreground leading-relaxed whitespace-pre">
                    {text}
                  </code>
                </pre>
              </div>
            )
          },
          
          // Blockquotes avec meilleur style
          blockquote: ({ children, ...props }) => (
            <blockquote className="my-4 pl-4 border-l-4 border-primary/30 bg-muted/20 py-2 rounded-r-lg" {...props}>
              <div className="text-sm text-muted-foreground italic">
                {children}
              </div>
            </blockquote>
          ),
          
          // Liens avec meilleur style
          a: ({ children, href, ...props }) => (
            <a 
              href={href} 
              className="text-primary hover:text-primary/80 underline underline-offset-2 transition-colors" 
              target="_blank" 
              rel="noopener noreferrer"
              {...props}
            >
              {children}
            </a>
          ),
          
          // Tableaux avec meilleur style
          table: ({ children, ...props }) => (
            <div className="my-4 overflow-x-auto">
              <table className="w-full border-collapse border border-border rounded-lg overflow-hidden" {...props}>
                {children}
              </table>
            </div>
          ),
          th: ({ children, ...props }) => (
            <th className="px-4 py-2 bg-muted/50 border border-border text-left text-sm font-semibold text-foreground" {...props}>
              {children}
            </th>
          ),
          td: ({ children, ...props }) => (
            <td className="px-4 py-2 border border-border text-sm text-foreground" {...props}>
              {children}
            </td>
          ),
          
          // Séparateurs horizontaux
          hr: () => (
            <hr className="my-6 border-t border-border" />
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  )
}


