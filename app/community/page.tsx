import { Button } from "../../components/ui/button"
import { Navigation } from "../../components/navigation"

export default function CommunityPage() {
  return (
    <div className="min-h-screen flex flex-col items-center bg-background">
      <Navigation />
      <main className="flex-1 container py-8">
        <h1 className="text-4xl font-bold mb-6 text-center">Communauté</h1>
        <p className="text-lg text-muted-foreground mb-8 text-center">
          Rejoignez une communauté active d&apos;apprenants Excel et partagez vos connaissances.
        </p>
        <div className="p-8 border rounded-lg bg-card">
          <p className="text-center text-muted-foreground">
            La communauté sera bientôt disponible...
          </p>
          <div className="mt-4 flex justify-center">
            <Button>Être notifié du lancement</Button>
          </div>
        </div>
      </main>
    </div>
  )
}
