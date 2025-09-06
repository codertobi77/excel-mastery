"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Play, Image as ImageIcon, FileText, BarChart3 } from "lucide-react"

interface MediaElementProps {
  element: {
    type: "image" | "video" | "interactive" | "diagram"
    title: string
    description: string
    placement: string
    altText: string
  }
}

export function MediaElement({ element }: MediaElementProps) {
  const getIcon = () => {
    switch (element.type) {
      case "video":
        return <Play className="h-5 w-5" />
      case "image":
        return <ImageIcon className="h-5 w-5" />
      case "interactive":
        return <FileText className="h-5 w-5" />
      case "diagram":
        return <BarChart3 className="h-5 w-5" />
      default:
        return <FileText className="h-5 w-5" />
    }
  }

  const getTypeLabel = () => {
    switch (element.type) {
      case "video":
        return "Vidéo explicative"
      case "image":
        return "Capture d'écran"
      case "interactive":
        return "Exercice interactif"
      case "diagram":
        return "Diagramme"
      default:
        return "Média"
    }
  }

  const getBgColor = () => {
    switch (element.type) {
      case "video":
        return "bg-blue-50 border-blue-200 dark:bg-blue-950 dark:border-blue-800"
      case "image":
        return "bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-800"
      case "interactive":
        return "bg-purple-50 border-purple-200 dark:bg-purple-950 dark:border-purple-800"
      case "diagram":
        return "bg-orange-50 border-orange-200 dark:bg-orange-950 dark:border-orange-800"
      default:
        return "bg-gray-50 border-gray-200 dark:bg-gray-950 dark:border-gray-800"
    }
  }

  return (
    <Card className={`my-4 ${getBgColor()}`}>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 p-2 rounded-lg bg-white dark:bg-gray-800 shadow-sm">
            {getIcon()}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="secondary" className="text-xs">
                {getTypeLabel()}
              </Badge>
              <h4 className="font-semibold text-sm">{element.title}</h4>
            </div>
            <p className="text-sm text-muted-foreground mb-2">
              {element.description}
            </p>
            <div className="text-xs text-muted-foreground">
              <strong>Placement :</strong> {element.placement}
            </div>
          </div>
        </div>
        
        {/* Placeholder pour le contenu média réel */}
        <div className="mt-3 p-4 bg-white dark:bg-gray-800 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600">
          <div className="text-center text-sm text-muted-foreground">
            <div className="mb-2">{getIcon()}</div>
            <p className="font-medium">{element.title}</p>
            <p className="text-xs mt-1">{element.altText}</p>
            <p className="text-xs mt-2 italic">
              Contenu multimédia à intégrer : {element.description}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
