"use client"
import * as React from "react"

export function Progress({ value }: { value: number }) {
  return (
    <div className="w-full h-2 bg-muted rounded">
      <div className="h-2 bg-primary rounded" style={{ width: `${Math.min(100, Math.max(0, value))}%` }} />
    </div>
  )
}
