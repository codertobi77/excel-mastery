"use client";

import { Sheet, SheetContent, SheetTrigger } from "./ui/sheet";
import { Button } from "./ui/button";
import { Menu, FileSpreadsheet } from "lucide-react";
import { ThemeToggle } from "./theme-toggle";
import Link from "next/link";
import { SignedIn, SignedOut, useClerk } from "@clerk/nextjs";
import { toast } from "sonner";
import { UserButton } from "@clerk/nextjs";

export function Navigation() {
  const { openSignIn } = useClerk();
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center justify-center space-x-9">
          <Link href="/" className="flex items-center justify-center space-x-3">
            <FileSpreadsheet className="h-6 w-6 text-primary" />
            <span className="hidden font-bold text-xl sm:inline-block">
              Excel Mastery AI
            </span>
          </Link>
          <nav className="hidden md:flex items-center justify-center space-x-8 text-sm font-medium">
            <Link href="/dashboard/tutor" className="text-muted-foreground hover:text-primary transition-colors" onMouseEnter={() => {
              fetch('/api/conversations', { cache: 'no-store' }).catch(() => {})
            }}>
              Tuteur IA
            </Link>
            <Link href="/dashboard/courses" className="text-muted-foreground hover:text-primary transition-colors" onMouseEnter={() => {
              fetch('/api/courses', { cache: 'no-store' }).catch(() => {})
            }}>
              Cours & Tutoriels
            </Link>
            <Link href="/dashboard/practice" className="text-muted-foreground hover:text-primary transition-colors">
              Exercices
            </Link>
            <Link href="/dashboard/tips" className="text-muted-foreground hover:text-primary transition-colors">
              Astuces
            </Link>
            <Link href="/community" className="text-muted-foreground hover:text-primary transition-colors">
              Communauté
            </Link>
          </nav>
        </div>

        <div className="hidden md:flex items-center space-x-3 ml-8">
          <ThemeToggle />
          <SignedIn>
            <UserButton />
          </SignedIn>
          <SignedOut>
            <Button
              variant="default"
              onClick={() => {
                try {
                  openSignIn({ redirectUrl: "/dashboard" })
                } catch (e) {
                  toast.error("Impossible d'ouvrir la fenêtre de connexion")
                }
              }}
            >
              Se connecter
            </Button>
          </SignedOut>
        </div>

        <Sheet>
          <SheetTrigger asChild>
            <Button
              tabIndex={0}
              aria-label="Open menu"
              variant="ghost"
              className="px-0 text-base hover:bg-transparent focus-visible:bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 md:hidden"
            >
              <span className="sr-only">Menu</span>
              <Menu className="h-6 w-6" />
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-80 sm:w-96 p-0 md:hidden">
            <div className="p-4 border-b">
              <Link href="/" className="flex items-center space-x-2">
                <FileSpreadsheet className="h-5 w-5 text-primary" />
                <span className="font-semibold">Excel Mastery AI</span>
              </Link>
            </div>
            <nav className="flex flex-col p-4 space-y-2 text-sm">
              <Link href="/dashboard/tutor" className="px-3 py-2 rounded-md hover:bg-muted text-foreground">Tuteur IA</Link>
              <Link href="/dashboard/courses" className="px-3 py-2 rounded-md hover:bg-muted text-foreground">Cours & Tutoriels</Link>
              <Link href="/dashboard/practice" className="px-3 py-2 rounded-md hover:bg-muted text-foreground">Exercices</Link>
              <Link href="/dashboard/tips" className="px-3 py-2 rounded-md hover:bg-muted text-foreground">Astuces</Link>
              <Link href="/community" className="px-3 py-2 rounded-md hover:bg-muted text-foreground">Communauté</Link>
            </nav>
            <div className="p-4 border-t flex items-center justify-between">
              <ThemeToggle />
              <div className="flex items-center gap-2">
                <SignedIn>
                  <UserButton />
                </SignedIn>
                <SignedOut>
                  <Button
                    variant="default"
                    onClick={() => {
                      try {
                        openSignIn({ redirectUrl: "/dashboard" })
                      } catch (e) {
                        toast.error("Impossible d'ouvrir la fenêtre de connexion")
                      }
                    }}
                  >
                    Se connecter
                  </Button>
                </SignedOut>
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
}
