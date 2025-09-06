"use client"

import { Card, CardContent } from "@/components/ui/card"
import { MediaElement } from "./MediaElement"
import { PracticalExercise } from "./PracticalExercise"
import { KeyTakeaways } from "./KeyTakeaways"

interface RichLessonContentProps {
  lesson: {
    title: string
    content: string
    mediaElements?: Array<{
      type: "image" | "video" | "interactive" | "diagram"
      title: string
      description: string
      placement: string
      altText: string
    }>
    practicalExercise?: {
      title: string
      instructions: string
      expectedResult: string
      tips: string[]
    }
    keyTakeaways?: string[]
    duration: number
  }
}

export function RichLessonContent({ lesson }: RichLessonContentProps) {
  // Simple markdown-like rendering without external dependencies
  const renderContentWithMedia = () => {
    const content = lesson.content
    const mediaElements = lesson.mediaElements || []
    
    // Split content into sections
    const sections = content.split(/(?=##\s)/g)
    
    return sections.map((section, index) => {
      const sectionTitle = section.match(/##\s(.+)/)?.[1]
      const relevantMedia = mediaElements.filter(media => 
        sectionTitle && media.placement.toLowerCase().includes(sectionTitle.toLowerCase())
      )
      
      return (
        <div key={index}>
          <div className="prose prose-sm max-w-none dark:prose-invert">
            {renderMarkdownContent(section)}
          </div>
          
          {/* Insert relevant media elements after this section */}
          {relevantMedia.map((media, mediaIndex) => (
            <MediaElement key={`${index}-${mediaIndex}`} element={media} />
          ))}
        </div>
      )
    })
  }

  // Simple markdown renderer
  const renderMarkdownContent = (content: string) => {
    const lines = content.split('\n')
    const elements: JSX.Element[] = []
    let currentList: string[] = []
    let listType: 'ul' | 'ol' | null = null

    const flushList = () => {
      if (currentList.length > 0) {
        const ListComponent = listType === 'ol' ? 'ol' : 'ul'
        elements.push(
          <ListComponent key={elements.length} className="mb-4 space-y-2">
            {currentList.map((item, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="text-primary mt-1">{listType === 'ol' ? `${i + 1}.` : '•'}</span>
                <span>{item}</span>
              </li>
            ))}
          </ListComponent>
        )
        currentList = []
        listType = null
      }
    }

    lines.forEach((line, index) => {
      const trimmed = line.trim()
      
      if (trimmed.startsWith('# ')) {
        flushList()
        elements.push(
          <h1 key={elements.length} className="text-2xl font-bold mb-4 text-primary">
            {trimmed.slice(2)}
          </h1>
        )
      } else if (trimmed.startsWith('## ')) {
        flushList()
        elements.push(
          <h2 key={elements.length} className="text-xl font-semibold mb-3 mt-6 text-primary border-b border-border pb-2">
            {trimmed.slice(3)}
          </h2>
        )
      } else if (trimmed.startsWith('### ')) {
        flushList()
        elements.push(
          <h3 key={elements.length} className="text-lg font-semibold mb-2 mt-4">
            {trimmed.slice(4)}
          </h3>
        )
      } else if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
        if (listType !== 'ul') {
          flushList()
          listType = 'ul'
        }
        currentList.push(trimmed.slice(2))
      } else if (/^\d+\.\s/.test(trimmed)) {
        if (listType !== 'ol') {
          flushList()
          listType = 'ol'
        }
        currentList.push(trimmed.replace(/^\d+\.\s/, ''))
      } else if (trimmed.startsWith('**') && trimmed.endsWith('**')) {
        flushList()
        elements.push(
          <p key={elements.length} className="mb-4 leading-relaxed font-semibold">
            {trimmed.slice(2, -2)}
          </p>
        )
      } else if (trimmed.length > 0) {
        flushList()
        // Handle bold text within paragraphs
        const parts = trimmed.split(/(\*\*[^*]+\*\*)/g)
        const formattedParts = parts.map((part, i) => {
          if (part.startsWith('**') && part.endsWith('**')) {
            return <strong key={i}>{part.slice(2, -2)}</strong>
          }
          return part
        })
        
        elements.push(
          <p key={elements.length} className="mb-4 leading-relaxed">
            {formattedParts}
          </p>
        )
      }
    })

    flushList()
    return elements
  }

  return (
    <Card className="w-full">
      <CardContent className="p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold mb-2">{lesson.title}</h1>
          <div className="text-sm text-muted-foreground">
            Durée estimée : {lesson.duration} minutes
          </div>
        </div>

        <div className="space-y-4">
          {renderContentWithMedia()}
          
          {/* Insert media elements that don't have specific placements */}
          {lesson.mediaElements?.filter(media => 
            !media.placement || media.placement.toLowerCase() === 'end' || media.placement.toLowerCase() === 'fin'
          ).map((media, index) => (
            <MediaElement key={`end-${index}`} element={media} />
          ))}
          
          {/* Practical exercise */}
          {lesson.practicalExercise && (
            <PracticalExercise exercise={lesson.practicalExercise} />
          )}
          
          {/* Key takeaways */}
          {lesson.keyTakeaways && (
            <KeyTakeaways takeaways={lesson.keyTakeaways} />
          )}
        </div>
      </CardContent>
    </Card>
  )
}
