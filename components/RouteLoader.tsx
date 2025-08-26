"use client"
import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'

export default function RouteLoader() {
  const pathname = usePathname()
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    // trigger loader briefly on route change
    setLoading(true)
    const t = setTimeout(() => setLoading(false), 400)
    return () => clearTimeout(t)
  }, [pathname])

  return (
    <div
      aria-hidden
      className={`fixed top-0 left-0 right-0 z-[60] h-0.5 transition-opacity ${loading ? 'opacity-100' : 'opacity-0'}`}
    >
      <div className="h-full w-full bg-primary animate-[routebar_0.4s_ease-out]" />
      <style jsx global>{`
        @keyframes routebar { from { transform: translateX(-100%); } to { transform: translateX(0); } }
      `}</style>
    </div>
  )
}


