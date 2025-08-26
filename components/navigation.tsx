"use client";

import { Sheet, SheetContent, SheetTrigger } from "./ui/sheet";
import { Button } from "./ui/button";
import { Menu, FileSpreadsheet } from "lucide-react";
import { ThemeToggle } from "./theme-toggle";
import Link from "next/link";
import { SignedIn, SignedOut, UserButton, useClerk } from "@clerk/nextjs";
import { toast } from "sonner";

export function Navigation() {
  const { openSignIn } = useClerk();
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-center">
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

        <div className="flex items-center space-x-3 ml-8">
          <ThemeToggle />
          <SignedIn>
            <UserButton
              afterSignOutUrl="/"
              userProfileMode="modal"
              signOutMode="modal"
              appearance={{
                elements: {
                  userButtonBox: "rounded-md border border-border bg-background hover:bg-muted/70 transition-colors",
                  userButtonTrigger: "ring-0 focus:outline-none",
                  userButtonAvatarBox: "h-8 w-8",
                  userButtonPopoverCard: "rounded-lg border border-border shadow-xl bg-background",
                  userButtonPopoverHeader: "p-3",
                  userPreviewMainIdentifier: "text-foreground font-medium",
                  userPreviewSecondaryIdentifier: "text-muted-foreground",
                  userButtonPopoverActions: "p-2 space-y-1",
                  userButtonPopoverActionButton: "text-sm rounded-md hover:bg-muted/80 text-foreground",
                  userButtonPopoverActionButtonIcon: "text-muted-foreground",
                  userButtonPopoverFooter: "p-2 border-t border-border",
                },
              }}
            />
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
            </Button>
          </SheetTrigger>
        </Sheet>
      </div>
    </header>
  );
}
