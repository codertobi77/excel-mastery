import {
  BookOpen,
  BrainCircuit,
  Users,
  Trophy,
  Target,
  Sparkles
} from "lucide-react"

const features = [
  {
    name: 'Tuteur IA Personnel',
    description: 'Un assistant intelligent disponible 24/7 pour répondre à toutes vos questions Excel.',
    icon: BrainCircuit,
  },
  {
    name: 'Cours Adaptatifs',
    description: 'Des formations personnalisées qui s\'adaptent à votre niveau et à votre progression.',
    icon: BookOpen,
  },
  {
    name: 'Exercices Pratiques',
    description: 'Mettez en pratique vos connaissances avec des exercices corrigés automatiquement.',
    icon: Target,
  },
  {
    name: 'Communauté Active',
    description: 'Échangez avec d\'autres apprenants et partagez vos connaissances.',
    icon: Users,
  },
  {
    name: 'Suivi de Progression',
    description: 'Visualisez votre évolution et identifiez vos points d\'amélioration.',
    icon: Trophy,
  },
  {
    name: 'Contenu Actualisé',
    description: 'Des ressources constamment mises à jour selon les dernières fonctionnalités d\'Excel.',
    icon: Sparkles,
  },
]

export function Features() {
  return (
    <section className="py-16 sm:py-24 bg-secondary/50">
      <div className="container px-4 sm:px-6 lg:px-8 mx-auto">
        <div className="max-w-2xl mx-auto text-center mb-16">
          <h2 className="text-base font-semibold leading-7 text-primary">Apprentissage Accéléré</h2>
          <p className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
            Tout ce dont vous avez besoin pour maîtriser Excel
          </p>
          <p className="mt-6 text-lg leading-8 text-muted-foreground">
            Une plateforme complète qui combine intelligence artificielle et pédagogie pour un apprentissage efficace et personnalisé.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature) => (
            <div
              key={feature.name}
              className="flex flex-col bg-card rounded-xl p-6 shadow-sm hover:shadow-md transition-all hover:scale-105"
            >
              <dt className="flex items-center gap-x-3 text-base font-semibold leading-7 mb-4">
                <feature.icon className="h-7 w-7 flex-none text-primary" aria-hidden="true" />
                {feature.name}
              </dt>
              <dd className="flex-auto text-base leading-7 text-muted-foreground">
                {feature.description}
              </dd>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}