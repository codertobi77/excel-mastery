"use client"

import { useState } from "react"
import { useUser } from "@clerk/nextjs"
import { useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Shield, Bell, Palette, User, MapPin, Calendar, Users } from "lucide-react"
import { UserProfile } from "@clerk/nextjs"

export default function SettingsPage() {
  const { user } = useUser()
  const userEmail = user?.primaryEmailAddress?.emailAddress || "";
  const userDoc = useQuery((api as any).users.getByEmail, userEmail ? { email: userEmail } : "skip");

  const getLevelLabel = (level: string) => {
    switch (level) {
      case "BEGINNER": return "Débutant";
      case "INTERMEDIATE": return "Intermédiaire";
      case "ADVANCED": return "Avancé";
      default: return level;
    }
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case "BEGINNER": return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
      case "INTERMEDIATE": return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
      case "ADVANCED": return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      default: return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
    }
  };

  return (
    <div className="p-4 sm:p-6 space-y-6 sm:space-y-8">
      <header className="flex items-center gap-2 sm:gap-3">
        <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
          <User className="w-5 h-5 text-primary-foreground" />
        </div>
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold">Paramètres</h1>
          <p className="text-sm sm:text-base text-muted-foreground">Gérez votre compte et vos préférences</p>
        </div>
      </header>

      {/* Profil détaillé */}
      {userDoc && (
        <section className="border rounded-lg p-3 sm:p-4 space-y-3 sm:space-y-4">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-primary" />
            <h2 className="font-semibold">Profil Excel Mastery</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
            <div className="space-y-2">
              <Label>Niveau Excel</Label>
              <div className="flex items-center gap-2">
                <Badge className={getLevelColor(userDoc.level)}>
                  {getLevelLabel(userDoc.level)}
                </Badge>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Crédits disponibles</Label>
              <div className="flex items-center gap-2">
                <span className="text-lg font-semibold">{userDoc.credits}</span>
                <span className="text-sm text-muted-foreground">crédits</span>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Plan</Label>
              <div className="flex items-center gap-2">
                <Badge className={userDoc.plan === 'PRO' ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200" : "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200"}>
                  {userDoc.plan === 'PRO' ? 'Pro' : 'Gratuit'}
                </Badge>
              </div>
            </div>
            {userDoc.gender && (
              <div className="space-y-2">
                <Label>Genre</Label>
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-muted-foreground" />
                  <span>{userDoc.gender}</span>
                </div>
              </div>
            )}
            {userDoc.age && userDoc.age > 0 && (
              <div className="space-y-2">
                <Label>Âge</Label>
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  <span>{userDoc.age} ans</span>
                </div>
              </div>
            )}
            {userDoc.nationality && (
              <div className="space-y-2">
                <Label>Nationalité</Label>
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-muted-foreground" />
                  <span>{userDoc.nationality}</span>
                </div>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Clerk Profile Component */}
      <section className="border rounded-lg p-3 sm:p-4 space-y-3 sm:space-y-4">
        <div className="flex items-center gap-2">
          <User className="w-4 h-4 text-primary" />
          <h2 className="font-semibold">Gestion du compte</h2>
        </div>
        <div className="mt-4">
          <UserProfile 
            appearance={{
              elements: {
                rootBox: "w-full",
                card: "shadow-none border-0",
                navbar: "hidden",
                navbarMobileMenuButton: "hidden",
                headerTitle: "text-lg font-semibold",
                headerSubtitle: "text-sm text-muted-foreground"
              }
            }}
          />
        </div>
      </section>
    </div>
  )
}
