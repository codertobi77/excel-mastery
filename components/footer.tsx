"use client";

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const Footer: React.FC = () => {
  const pathname = usePathname?.() || "";

  // Hide footer on dashboard routes
  if (pathname.startsWith('/dashboard')) return null;

  return (
    <footer className="border-t bg-background text-muted-foreground">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 items-start">
          <div>
            <div className="text-foreground font-semibold mb-2">Excel Mastery AI</div>
            <p className="text-sm">Apprenez Excel avec un tuteur intelligent et des exercices pratiques.</p>
          </div>

          <nav className="space-y-2">
            <div className="text-foreground font-medium">Liens rapides</div>
            <div className="flex flex-col text-sm">
              <Link href="/" className="hover:text-foreground transition-colors">Accueil</Link>
              <Link href="/dashboard/courses" className="hover:text-foreground transition-colors">Cours & Tutoriels</Link>
              <Link href="/dashboard/practice" className="hover:text-foreground transition-colors">Exercices</Link>
              <Link href="/community" className="hover:text-foreground transition-colors">Communauté</Link>
            </div>
          </nav>

          <nav className="space-y-2">
            <div className="text-foreground font-medium">Légal</div>
            <div className="flex flex-col text-sm">
              <Link href="/terms" className="hover:text-foreground transition-colors">Termes & Conditions</Link>
              <Link href="/privacy" className="hover:text-foreground transition-colors">Politique de confidentialité</Link>
            </div>
          </nav>
        </div>

        <div className="mt-8 text-xs text-center">
          © {new Date().getFullYear()} Excel Mastery AI. Tous droits réservés.
        </div>
      </div>
    </footer>
  );
};

export default Footer;
