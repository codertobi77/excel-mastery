export default function NotFound() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center text-center gap-4">
      <h1 className="text-2xl font-semibold">Page introuvable</h1>
      <p className="text-muted-foreground">La page demandée n'existe pas.</p>
      <a href="/" className="px-4 py-2 rounded bg-primary text-primary-foreground">Retour à l'accueil</a>
    </div>
  )
}
