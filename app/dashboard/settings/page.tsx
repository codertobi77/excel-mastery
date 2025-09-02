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

export default function SettingsPage() {
  const { user } = useUser()
  const userEmail = user?.primaryEmailAddress?.emailAddress || "";
  const userDoc = useQuery((api as any).users.getByEmail, userEmail ? { email: userEmail } : "skip");
  const [displayName, setDisplayName] = useState(`${user?.firstName ?? ''} ${user?.lastName ?? ''}`.trim())
  const [theme, setTheme] = useState("system")
  const [emailNotif, setEmailNotif] = useState(true)
  const [twoFA, setTwoFA] = useState(false)

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
    <div className="p-6 space-y-8">
      <header className="flex items-center gap-3">
        <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
          <User className="w-5 h-5 text-primary-foreground" />
        </div>
        <div>
          <h1 className="text-2xl font-semibold">Paramètres</h1>
          <p className="text-muted-foreground">Gérez votre compte et vos préférences</p>
        </div>
      </header>

      {/* Compte */}
      <section className="border rounded-lg p-4 space-y-4">
        <div className="flex items-center gap-2">
          <User className="w-4 h-4 text-primary" />
          <h2 className="font-semibold">Compte</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="display-name">Nom d'affichage</Label>
            <Input id="display-name" value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Email</Label>
            <Input value={user?.primaryEmailAddress?.emailAddress ?? ''} disabled />
          </div>
        </div>
        <div className="flex justify-end">
          <Button disabled>Enregistrer</Button>
        </div>
      </section>

      {/* Profil détaillé */}
      {userDoc && (
        <section className="border rounded-lg p-4 space-y-4">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-primary" />
            <h2 className="font-semibold">Profil détaillé</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

      {/* Apparence */}
      <section className="border rounded-lg p-4 space-y-4">
        <div className="flex items-center gap-2">
          <Palette className="w-4 h-4 text-primary" />
          <h2 className="font-semibold">Apparence</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Thème</Label>
            <Select value={theme} onValueChange={setTheme}>
              <SelectTrigger>
                <SelectValue placeholder="Choisir un thème" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="light">Clair</SelectItem>
                <SelectItem value="dark">Sombre</SelectItem>
                <SelectItem value="system">Système</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="flex justify-end">
          <Button disabled>Appliquer</Button>
        </div>
      </section>

      {/* Notifications */}
      <section className="border rounded-lg p-4 space-y-4">
        <div className="flex items-center gap-2">
          <Bell className="w-4 h-4 text-primary" />
          <h2 className="font-semibold">Notifications</h2>
        </div>
        <div className="flex items-center justify-between border rounded p-3">
          <div>
            <div className="font-medium">Emails de mise à jour</div>
            <div className="text-sm text-muted-foreground">Recevoir des emails sur les nouveautés et astuces</div>
          </div>
          <Switch checked={emailNotif} onCheckedChange={setEmailNotif} />
        </div>
      </section>

      {/* Sécurité */}
      <section className="border rounded-lg p-4 space-y-4">
        <div className="flex items-center gap-2">
          <Shield className="w-4 h-4 text-primary" />
          <h2 className="font-semibold">Sécurité</h2>
        </div>
        <div className="flex items-center justify-between border rounded p-3">
          <div>
            <div className="font-medium">Authentification à deux facteurs</div>
            <div className="text-sm text-muted-foreground">Ajoutez une couche de sécurité à votre compte</div>
          </div>
          <Switch checked={twoFA} onCheckedChange={setTwoFA} />
        </div>
        <div className="flex justify-end">
          <Button disabled>Gérer via Clerk</Button>
        </div>
      </section>
    </div>
  )
}
