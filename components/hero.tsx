import { Button } from "@/components/ui/button"
import { FileSpreadsheet, ArrowRight } from "lucide-react"

export function Hero() {
  return (
    <div className="relative isolate overflow-hidden">
      <div className="absolute inset-x-0 top-0 -z-10 transform-gpu overflow-hidden blur-3xl" aria-hidden="true">
        <div className="relative left-[calc(50%-11rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 rotate-[30deg] bg-gradient-to-tr from-primary to-secondary opacity-30 sm:left-[calc(50%-30rem)] sm:w-[72.1875rem]"></div>
      </div>
      
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-screen-xl py-12 sm:py-16 lg:py-20 flex flex-col lg:flex-row items-center justify-between gap-12">
          <div className="flex-1 text-center lg:text-left">
            <div className="flex flex-wrap justify-center lg:justify-start gap-4">
              <span className="rounded-full px-3 py-1 text-sm leading-6 text-primary ring-1 ring-primary/20">
                Nouveau
              </span>
              <a href="#" className="inline-flex items-center space-x-2 text-sm font-medium leading-6 text-primary">
                <span>Découvrez notre tuteur IA</span>
                <ArrowRight className="h-4 w-4" />
              </a>
            </div>
            
            <h1 className="mt-8 text-4xl font-bold tracking-tight sm:text-6xl">
              Maîtrisez Excel avec l'IA
            </h1>
            <p className="mt-6 text-lg leading-8 text-muted-foreground max-w-2xl mx-auto lg:mx-0">
              Apprenez Excel à votre rythme avec notre tuteur IA intelligent. Des cours personnalisés, des exercices pratiques et une communauté active pour tous les niveaux.
            </p>
            <div className="mt-10 flex flex-wrap justify-center lg:justify-start gap-4">
              <Button size="lg" className="shadow-lg">
                Commencer gratuitement
              </Button>
              <Button variant="outline" size="lg">
                En savoir plus
              </Button>
            </div>
          </div>
          
          <div className="flex-1 flex justify-center lg:justify-end">
            <div className="relative w-full max-w-lg">
              <div className="absolute top-0 -left-4 w-72 h-72 bg-primary/30 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
              <div className="absolute top-0 -right-4 w-72 h-72 bg-secondary/30 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>
              <div className="relative">
                <div className="rounded-xl bg-white/5 p-8 backdrop-blur-sm ring-1 ring-primary/10">
                  <FileSpreadsheet className="h-48 w-48 sm:h-64 sm:w-64 text-primary opacity-80 mx-auto" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}