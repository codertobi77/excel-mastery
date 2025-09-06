const AI_ENDPOINT = "/api/ai";

type Lesson = { title: string; content: string; duration: number; order: number }
type Chapter = { title: string; order: number; lessons: Lesson[] }
type Course = { title: string; description: string; level: string; duration: number; chapters: Chapter[] }

function enforceCourseStructure(raw: any, topic: string): Course {
  const safe = (raw && typeof raw === 'object') ? raw : {}
  const title = typeof safe.title === 'string' && safe.title.trim() ? safe.title : `Maîtriser ${topic}`
  const description = typeof safe.description === 'string' && safe.description.trim() ? safe.description : `Un parcours guidé pour progresser sur ${topic} dans Excel.`
  const level = typeof safe.level === 'string' && safe.level.trim() ? safe.level : 'BEGINNER'
  const duration = typeof safe.duration === 'number' && safe.duration > 0 ? safe.duration : 60
  let chapters: Chapter[] = Array.isArray(safe.chapters) ? safe.chapters : []

  // Ensure chapter orders and minimum count (>=4)
  const ensureLesson = (titleSeed: string, order: number): Lesson => ({
    title: `${titleSeed} ${order}`,
    content: `# ${titleSeed} ${order}

## Introduction

Dans cette leçon, nous allons explorer en détail ${titleSeed.toLowerCase()} dans le contexte de ${topic}. Cette approche vous permettra de maîtriser les concepts fondamentaux tout en développant une expertise pratique.

## Objectifs d'apprentissage

- Comprendre les principes de base de ${titleSeed.toLowerCase()}
- Appliquer ces concepts dans des situations réelles
- Développer des bonnes pratiques professionnelles

## Contenu détaillé

### Étape 1 : Préparation

Avant de commencer, assurez-vous d'avoir Excel ouvert et un nouveau classeur prêt. Cette préparation est essentielle pour suivre les exemples pratiques.

### Étape 2 : Application pratique

Nous allons maintenant voir comment appliquer ${titleSeed.toLowerCase()} dans ${topic} :

1. **Première approche** : Méthode traditionnelle
2. **Approche optimisée** : Techniques avancées
3. **Bonnes pratiques** : Conseils d'experts

### Étape 3 : Exemples concrets

**Exemple 1 :** Cas d'usage simple
- Contexte : Situation courante en entreprise
- Solution : Approche étape par étape
- Résultat : Gain de temps et d'efficacité

**Exemple 2 :** Cas d'usage avancé
- Contexte : Problème complexe
- Solution : Techniques expertes
- Résultat : Solution professionnelle

## Points clés à retenir

- ✅ ${titleSeed} est essentiel pour maîtriser ${topic}
- ✅ La pratique régulière améliore la compétence
- ✅ Les bonnes pratiques font la différence

## Exercice pratique

**Objectif :** Mettre en pratique ${titleSeed.toLowerCase()}

**Instructions :**
1. Ouvrez Excel
2. Créez un nouveau classeur
3. Appliquez les techniques apprises
4. Vérifiez votre résultat

**Astuce :** N'hésitez pas à expérimenter et à adapter les techniques à vos besoins spécifiques.

## Conclusion

Vous avez maintenant les bases pour utiliser efficacement ${titleSeed.toLowerCase()} dans ${topic}. La prochaine leçon approfondira ces concepts avec des cas d'usage plus complexes.`,
    duration: 15,
    order,
  })

  const defaultChapterTitle = (idx: number) => {
    const names = [
      `Fondamentaux de ${topic}`,
      `Fonctions clés de ${topic}`,
      `Pratique guidée ${topic}`,
      `Cas concrets ${topic}`,
      `Bonnes pratiques ${topic}`,
      `Pièges et astuces ${topic}`,
    ]
    return names[idx] || `${topic} - Section ${idx + 1}`
  }

  // Normalize existing chapters
  chapters = chapters.map((ch: any, i: number) => {
    const chTitle = typeof ch?.title === 'string' && ch.title.trim() ? ch.title : defaultChapterTitle(i)
    let lessons: Lesson[] = Array.isArray(ch?.lessons) ? ch.lessons : []
    // Ensure at least 2 lessons per chapter
    if (lessons.length < 2) {
      const base = chTitle.replace(/^(Chapitre\s*\d+[:\-]\s*)?/i, '').trim() || topic
      const needed = 2 - lessons.length
      for (let k = 0; k < needed; k++) {
        lessons.push(ensureLesson(base, lessons.length + 1))
      }
    }
    // Normalize lesson fields and orders
    lessons = lessons.map((ls: any, idx: number) => ({
      title: typeof ls?.title === 'string' && ls.title.trim() ? ls.title : `${chTitle} — Leçon ${idx + 1}`,
      content: typeof ls?.content === 'string' && ls.content.trim() ? ls.content : `# ${chTitle} — Leçon ${idx + 1}

## Introduction

Bienvenue dans cette leçon dédiée à ${topic}. Nous allons explorer ensemble les concepts essentiels qui vous permettront de progresser efficacement.

## Objectifs pédagogiques

- Maîtriser les fondamentaux de ${topic}
- Développer une approche méthodique
- Acquérir des réflexes professionnels

## Contenu de la leçon

### 1. Concepts théoriques

${topic} est un domaine riche qui nécessite une approche structurée. Voici les éléments clés à comprendre :

**Point important :** La théorie doit toujours être accompagnée de pratique pour une meilleure assimilation.

### 2. Applications pratiques

Voyons maintenant comment appliquer ces concepts dans des situations concrètes :

#### Exemple pratique 1
- **Contexte :** Situation professionnelle courante
- **Démarche :** Méthode étape par étape
- **Résultat :** Solution efficace et reproductible

#### Exemple pratique 2
- **Contexte :** Cas d'usage avancé
- **Démarche :** Techniques expertes
- **Résultat :** Optimisation des performances

### 3. Bonnes pratiques

💡 **Astuce professionnelle :** Toujours vérifier vos résultats et documenter votre démarche.

⚠️ **Attention :** Évitez les erreurs courantes en suivant ces recommandations.

## Exercice d'application

**Mission :** Mettre en pratique les concepts appris

**Étapes à suivre :**
1. Préparez votre environnement de travail
2. Appliquez la méthode présentée
3. Vérifiez vos résultats
4. Optimisez votre approche

## Récapitulatif

Cette leçon vous a permis de :
- ✅ Comprendre les bases de ${topic}
- ✅ Voir des exemples concrets d'application
- ✅ Découvrir les bonnes pratiques
- ✅ Pratiquer avec un exercice guidé

## Pour aller plus loin

Dans la prochaine leçon, nous approfondirons ces concepts avec des cas d'usage plus complexes et des techniques avancées.`,
      duration: typeof ls?.duration === 'number' && ls.duration > 0 ? ls.duration : 15,
      order: typeof ls?.order === 'number' && ls.order > 0 ? ls.order : idx + 1,
    }))
    return {
      title: chTitle,
      order: typeof ch?.order === 'number' && ch.order > 0 ? ch.order : i + 1,
      lessons,
    }
  })

  // Add chapters until we have at least 4
  for (let i = chapters.length; i < 4; i++) {
    const chTitle = defaultChapterTitle(i)
    chapters.push({
      title: chTitle,
      order: i + 1,
      lessons: [ensureLesson(chTitle, 1), ensureLesson(chTitle, 2), ensureLesson(chTitle, 3)],
    })
  }

  // Re-sequence orders
  chapters = chapters
    .sort((a, b) => a.order - b.order)
    .map((ch, i) => ({ ...ch, order: i + 1, lessons: ch.lessons.map((ls, j) => ({ ...ls, order: j + 1 })) }))

  // Derive total duration if missing
  const totalDuration = chapters.reduce((sum, ch) => sum + ch.lessons.reduce((s, ls) => s + (ls.duration || 10), 0), 0)

  return {
    title,
    description,
    level,
    duration: duration || totalDuration || 60,
    chapters,
  }
}

export async function generateCourseFromTopic(topic: string) {
  const fallback: Course = enforceCourseStructure({
    title: `Introduction à ${topic}`,
    description: `Un cours pour débutants sur ${topic}`,
    level: "BEGINNER",
    duration: 30,
    chapters: [
      {
        title: "Premiers pas",
        order: 1,
        lessons: [
          {
            title: "Les bases",
            content: `Découvrez les fondamentaux de ${topic} dans Excel`,
            duration: 10,
            order: 1,
          },
        ],
      },
    ],
  }, topic)

  try {
    const system = "Tu es un expert pédagogue Excel dans le style OpenClassrooms. Tu crées du contenu éducatif progressif avec analogies, explications détaillées et exercices pratiques. IMPORTANT: Réponds UNIQUEMENT avec du JSON valide.";
    const user = `Crée un cours Excel sur "${topic}" dans le style pédagogique OpenClassrooms.

STYLE REQUIS (comme OpenClassrooms):
- Explications progressives avec analogies du quotidien
- Ton conversationnel et bienveillant 
- Questions rhétoriques pour engager le lecteur
- Exemples concrets et pratiques
- Exercices "À vous de jouer" avec contexte et consignes détaillées
- Résumés "En résumé" à la fin
- Émojis pour rendre le contenu vivant 😊

FORMAT JSON EXACT:
{
  "title": "Maîtriser ${topic} dans Excel",
  "description": "Découvrez ${topic} étape par étape avec des explications claires, des analogies du quotidien et des exercices pratiques pour progresser en toute confiance.",
  "level": "BEGINNER",
  "duration": 90,
  "chapters": [
    {
      "title": "Découverte de ${topic}",
      "order": 1,
      "lessons": [
        {
          "title": "Qu'est-ce que ${topic} ?",
          "content": "# Qu'est-ce que ${topic} ?\n\n## Une analogie pour comprendre\n\nImaginez ${topic} comme [analogie du quotidien]. Tout comme [explication de l'analogie], ${topic} dans Excel vous permet de [bénéfice principal].\n\n## Définition simple\n\n${topic}, c'est [définition claire et accessible]. Prenons l'exemple concret de [exemple du quotidien] : [explication détaillée avec des termes simples].\n\n## Pourquoi c'est utile ?\n\nVous vous demandez peut-être : \"Mais pourquoi aurais-je besoin de ${topic} ?\" 🤔\n\nExcellente question ! ${topic} résout plusieurs problèmes courants :\n\n- **Gain de temps** : Au lieu de [tâche manuelle], vous pouvez [automatisation]\n- **Précision** : Fini les erreurs de calcul, Excel s'en charge\n- **Clarté** : Vos données deviennent plus lisibles et compréhensibles\n\n## Un exemple concret\n\nSupposons que vous gérez le budget familial. Sans ${topic}, vous devriez [processus manuel compliqué]. Avec ${topic}, c'est aussi simple que [processus simplifié] !\n\n## Les bases à connaître\n\nAvant de plonger dans ${topic}, assurez-vous de maîtriser :\n- Les cellules et leur adressage (A1, B2, etc.)\n- La saisie de données de base\n- L'utilisation de la souris et du clavier dans Excel\n\nPas de panique si ce n'est pas encore parfait ! 😌 Nous avancerons étape par étape.",
          "duration": 20,
          "order": 1
        },
        {
          "title": "Première approche de ${topic}",
          "content": "# Votre première utilisation de ${topic}\n\n## Préparation : on ne construit pas une maison sans fondations ! 🏗️\n\nTout comme un chef prépare ses ingrédients avant de cuisiner, nous allons préparer nos données avant d'utiliser ${topic}.\n\n### Étape 1 : Organiser vos données\n\n1. **Ouvrez Excel** (vous savez faire, j'en suis sûr ! 😊)\n2. **Créez un nouveau classeur** (Ctrl+N)\n3. **Saisissez des données d'exemple** :\n   - Colonne A : [exemple de données]\n   - Colonne B : [exemple de données]\n   - Colonne C : [exemple de données]\n\n### Étape 2 : Appliquer ${topic}\n\nMaintenant, la partie excitante ! 🎉\n\n1. **Sélectionnez vos données** (cliquez-glissez de A1 à C10 par exemple)\n2. **Trouvez ${topic}** dans le menu [emplacement exact]\n3. **Cliquez et... magie !** ✨\n\nVous voyez ce qui s'est passé ? Excel a automatiquement [résultat de l'action] !\n\n## Comprendre ce qui s'est passé\n\n\"Mais comment Excel a-t-il su quoi faire ?\" vous demandez-vous peut-être. 🤯\n\nC'est simple : Excel analyse vos données et [explication du processus]. C'est comme si vous aviez un assistant personnel qui comprend vos besoins !\n\n## Personnaliser le résultat\n\nLe résultat de base ne vous convient pas parfaitement ? Normal ! Chacun a ses préférences. Voici comment l'adapter :\n\n- **Pour changer [aspect 1]** : [instructions simples]\n- **Pour modifier [aspect 2]** : [instructions simples]\n- **Pour ajuster [aspect 3]** : [instructions simples]\n\n## Vérifier son travail\n\nComme dit le proverbe : \"Deux précautions valent mieux qu'une\" ! Vérifiez toujours :\n✅ Les données sont-elles correctes ?\n✅ Le format vous convient-il ?\n✅ Avez-vous sauvegardé ? (Ctrl+S, toujours !)",
          "duration": 25,
          "order": 2
        }
      ]
    },
    {
      "title": "Maîtriser ${topic}",
      "order": 2,
      "lessons": [
        {
          "title": "Techniques avancées de ${topic}",
          "content": "# Passez au niveau supérieur avec ${topic} ! 🚀\n\n## Vous êtes prêt pour la suite ?\n\nFélicitations ! Vous maîtrisez maintenant les bases de ${topic}. Mais comme dit l'expression : \"L'appétit vient en mangeant\" ! Découvrons des techniques plus avancées.\n\n## Technique 1 : [Technique avancée]\n\n### Le problème\nVous avez sûrement remarqué que [problème courant]. C'est frustrant, n'est-ce pas ? 😤\n\n### La solution\n[Technique avancée] résout ce problème élégamment. Voici comment :\n\n1. [Étape détaillée 1]\n2. [Étape détaillée 2]\n3. [Étape détaillée 3]\n\n### Exemple concret\nSupposons que [scénario réaliste]. Avec cette technique, vous obtenez [résultat amélioré] en quelques clics !\n\n## Technique 2 : [Autre technique]\n\n### Quand l'utiliser ?\nCette technique est parfaite quand [situation spécifique]. C'est comme avoir [analogie pertinente] !\n\n### Mode d'emploi\n[Instructions détaillées avec captures d'écran suggérées]\n\n## Les pièges à éviter ⚠️\n\nAttention ! Même les experts font parfois ces erreurs :\n\n- **Piège n°1** : [Erreur courante] → Solution : [correction]\n- **Piège n°2** : [Autre erreur] → Solution : [correction]\n- **Piège n°3** : [Troisième erreur] → Solution : [correction]\n\n## Astuces de pro 💡\n\nVoici quelques secrets que les experts utilisent :\n\n1. **Raccourci clavier** : [combinaison] pour [action rapide]\n2. **Astuce de formatage** : [technique] pour [amélioration visuelle]\n3. **Optimisation** : [méthode] pour [gain de performance]\n\n## À vous de jouer ! 🎯\n\n**Contexte :** Vous travaillez dans une entreprise et devez [scénario professionnel réaliste utilisant ${topic}].\n\n**Objectif :** Créer [livrable concret] en utilisant les techniques avancées apprises.\n\n**Consignes :**\n1. [Instruction précise 1]\n2. [Instruction précise 2]\n3. [Instruction précise 3]\n4. [Instruction précise 4]\n\n**Critères de réussite :**\n- [Critère mesurable 1]\n- [Critère mesurable 2]\n- [Critère mesurable 3]\n\n## En résumé\n\n${topic} devient vraiment puissant quand vous maîtrisez :\n- [Point clé 1] pour [bénéfice]\n- [Point clé 2] pour [bénéfice]\n- [Point clé 3] pour [bénéfice]\n\nMaintenant que vous connaissez ces techniques avancées, vous êtes prêt à impressionner vos collègues ! 😎",
          "duration": 35,
          "order": 1
        }
      ]
    }
  ]
}

CONTRAINTES ABSOLUES:
1. Réponds SEULEMENT avec le JSON, aucun autre texte
2. Remplace TOUS les "${topic}" par le sujet exact
3. Style conversationnel et bienveillant obligatoire
4. Minimum 500 mots par leçon dans "content"
5. Inclure émojis, analogies et exercices pratiques
6. JSON parfaitement valide requis`;
    
    const res = await fetch(AI_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ system, messages: [{ role: "user", content: user }], temperature: 0.3, max_tokens: 4000 }),
    });
    if (!res.ok) {
      console.error('AI API request failed:', res.status, res.statusText);
      return fallback;
    }
    const data = await res.json();
    console.log('AI Response for generateCourseFromTopic:', data.content?.substring(0, 500));
    
    try {
      // Clean the response to extract JSON
      let jsonContent = data.content;
      if (typeof jsonContent === 'string') {
        // Remove any text before the first {
        const firstBrace = jsonContent.indexOf('{');
        if (firstBrace > 0) {
          jsonContent = jsonContent.substring(firstBrace);
        }
        // Remove any text after the last }
        const lastBrace = jsonContent.lastIndexOf('}');
        if (lastBrace > 0 && lastBrace < jsonContent.length - 1) {
          jsonContent = jsonContent.substring(0, lastBrace + 1);
        }
      }
      
      const parsed = JSON.parse(jsonContent);
      console.log('Successfully parsed JSON for course generation');
      return enforceCourseStructure(parsed, topic)
    } catch (error) {
      console.error('Failed to parse AI response as JSON:', error);
      console.error('Raw content:', data.content);
      return fallback;
    }
  } catch {
    return fallback;
  }
}

export async function generateCourse(
  chosenLevel: "BEGINNER" | "INTERMEDIATE" | "ADVANCED",
  testResult: {
    level: "BEGINNER" | "INTERMEDIATE" | "ADVANCED";
    score: number;
    result: "SUCCESS" | "FAIL";
    review: Array<{
      question: string;
      options: string[];
      userAnswer: number;
      correctAnswer: number;
      isCorrect: boolean;
      analysis: string;
    }>;
  }
) {
  // Determine the actual level based on test results
  const actualLevel = testResult.result === "SUCCESS" ? chosenLevel : 
    chosenLevel === "ADVANCED" ? "INTERMEDIATE" :
    chosenLevel === "INTERMEDIATE" ? "BEGINNER" : "BEGINNER";

  const fallback: Course = enforceCourseStructure({
    title: `Cours Excel - Niveau ${actualLevel.toLowerCase()}`,
    description: `Un parcours complet pour maîtriser Excel au niveau ${actualLevel.toLowerCase()}`,
    level: actualLevel,
    duration: 120,
    chapters: [
      {
        title: "Introduction",
        order: 1,
        lessons: [
          {
            title: "Les bases d'Excel",
            content: `Découvrez les fondamentaux d'Excel pour le niveau ${actualLevel.toLowerCase()}`,
            duration: 15,
            order: 1,
          },
        ],
      },
    ],
  }, "Excel")

  try {
    const system = "Tu es un expert pédagogue Excel et créateur de contenu e-learning professionnel. Tu crées des parcours d'apprentissage riches, interactifs et explicatifs comme ceux d'OpenClassrooms, avec du contenu multimédia détaillé et des explications approfondies.";
    const user = `Analyse les résultats du test de positionnement et génère un parcours personnalisé de très haute qualité pédagogique.

### Données du test :
- Niveau choisi par l'utilisateur : ${chosenLevel}
- Score obtenu : ${testResult.score}/10
- Résultat : ${testResult.result}
- Niveau réel validé : ${actualLevel}

### Analyse des erreurs :
${testResult.review.map((r, i) => `Question ${i + 1}: ${r.isCorrect ? 'Correcte' : 'Incorrecte'} - ${r.analysis}`).join('\n')}

### Structure JSON requise (style OpenClassrooms) :
{
  "title": "string (titre engageant du parcours)",
  "description": "string (description détaillée des objectifs et bénéfices)",
  "level": "${actualLevel}",
  "duration": number (durée totale en minutes),
  "chapters": [
    {
      "title": "string (titre de chapitre clair)",
      "order": number,
      "lessons": [
        {
          "title": "string (titre de leçon engageant)",
          "content": "string (CONTENU TRÈS DÉTAILLÉ au format Markdown avec : explications étape par étape, exemples concrets, captures d'écran suggérées, astuces pro, points d'attention, analogies pour faciliter la compréhension, sections avec titres ##, listes, code Excel, tableaux. Minimum 800 mots par leçon avec structure pédagogique claire.)",
          "mediaElements": [
            {
              "type": "image|video|interactive|diagram",
              "title": "string (titre du média)",
              "description": "string (description détaillée du contenu visuel)",
              "placement": "string (où placer dans la leçon)",
              "altText": "string (texte alternatif descriptif)"
            }
          ],
          "practicalExercise": {
            "title": "string (titre de l'exercice)",
            "instructions": "string (consignes détaillées étape par étape)",
            "expectedResult": "string (résultat attendu)",
            "tips": ["string (conseils pour réussir)"]
          },
          "keyTakeaways": ["string (points clés à retenir)"],
          "duration": number (minutes),
          "order": number
        }
      ]
    }
  ]
}

### EXIGENCES DE CONTENU (qualité OpenClassrooms) :
• Explications très détaillées avec contexte, justifications et exemples
• Progression pédagogique logique du simple au complexe
• Éléments visuels suggérés (captures d'écran, diagrammes, vidéos explicatives)
• Exercices pratiques avec instructions précises et résultats attendus
• Points clés et récapitulatifs pour faciliter la mémorisation
• Astuces professionnelles et bonnes pratiques d'experts
• Analogies et métaphores pour faciliter la compréhension
• Structure Markdown avec titres, listes, tableaux, code Excel
• Minimum 4 chapitres, 2-3 leçons par chapitre
• Chaque leçon doit faire minimum 800 mots de contenu riche et structuré
• Prendre en compte les erreurs du test pour renforcer les points faibles identifiés
• Adapter le vocabulaire et la complexité au niveau ${actualLevel}

### CONTRAINTES TECHNIQUES :
- Réponds UNIQUEMENT avec un JSON valide, sans texte supplémentaire
- Assure-toi que le JSON est bien formé et complet
- Chaque leçon doit avoir tous les champs requis

Génère le parcours personnalisé maintenant :`;

    const res = await fetch(AI_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ 
        system, 
        messages: [{ role: "user", content: user }], 
        temperature: 0.3, 
        max_tokens: 4000 
      }),
    });
    
    if (!res.ok) {
      console.error('AI API request failed for personalized course:', res.status, res.statusText);
      return fallback;
    }
    const data = await res.json();
    console.log('AI Response for generateCourse:', data.content?.substring(0, 500));
    
    try {
      // Clean the response to extract JSON
      let jsonContent = data.content;
      if (typeof jsonContent === 'string') {
        // Remove any text before the first {
        const firstBrace = jsonContent.indexOf('{');
        if (firstBrace > 0) {
          jsonContent = jsonContent.substring(firstBrace);
        }
        // Remove any text after the last }
        const lastBrace = jsonContent.lastIndexOf('}');
        if (lastBrace > 0 && lastBrace < jsonContent.length - 1) {
          jsonContent = jsonContent.substring(0, lastBrace + 1);
        }
      }
      
      const parsed = JSON.parse(jsonContent);
      console.log('Successfully parsed JSON for personalized course generation');
      
      // Convert to the expected Course format
      const course: Course = {
        title: parsed.title || fallback.title,
        description: parsed.description || fallback.description,
        level: parsed.level || actualLevel,
        duration: parsed.duration || fallback.duration,
        chapters: parsed.chapters?.map((ch: any, i: number) => ({
          title: ch.title || `Module ${i + 1}`,
          order: ch.order || i + 1,
          lessons: ch.lessons?.map((ls: any, j: number) => ({
            title: ls.title || `Leçon ${j + 1}`,
            content: ls.content || "Contenu de la leçon",
            duration: ls.duration || 15,
            order: ls.order || j + 1,
          })) || []
        })) || fallback.chapters
      };
      
      return enforceCourseStructure(course, "Excel");
    } catch (error) {
      console.error('Failed to parse AI response as JSON for personalized course:', error);
      console.error('Raw content:', data.content);
      return fallback;
    }
  } catch {
    return fallback;
  }
}

export async function generateExercise(topic: string, difficulty: string) {
  const system = "Tu es un expert Excel. Tu génères des exercices avec solution au format JSON strict.";
  const user = `Génère un exercice Excel sur "${topic}" de difficulté ${difficulty}. Format JSON exact: {"title": string, "description": string, "difficulty": "${difficulty}", "content": string, "solution": string}. Réponds uniquement en JSON valide.`;
  const res = await fetch(AI_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ system, messages: [{ role: "user", content: user }], temperature: 0.5, max_tokens: 1000 }),
  });
  if (!res.ok) throw new Error("AI generation failed");
  const data = await res.json();
  return JSON.parse(data.content);
}

export async function generatePlacementTest(level: "BEGINNER" | "INTERMEDIATE" | "ADVANCED") {
  const fallback = {
    level,
    title: `Test de positionnement niveau ${level.toLowerCase()}`,
    questions: [
      {
        question: "Qu'est-ce qu'une cellule dans Excel ?",
        options: ["Une zone de texte", "L'intersection d'une ligne et d'une colonne", "Un graphique", "Une formule"],
        answer: 1
      },
      {
        question: "Comment commence une formule Excel ?",
        options: ["Par un espace", "Par le signe =", "Par des guillemets", "Par un nombre"],
        answer: 1
      }
    ]
  };

  try {
    const system = "Tu es un expert en Excel et en pédagogie. Ta mission est de créer un **test de positionnement** de 10 questions pour évaluer le niveau d'un utilisateur (BEGINNER, INTERMEDIATE ou ADVANCED).";
    const user = `Crée un test de positionnement de niveau ${level} avec exactement 10 questions. 

### Schéma JSON attendu
{
  "level": "${level}",
  "title": "string (titre du test, ex: 'Test de positionnement niveau ${level.toLowerCase()}')",
  "questions": [
    {
      "question": "string (énoncé de la question, clair et précis)",
      "options": ["string", "string", "string", "string"],
      "answer": number (index de la bonne réponse, commençant à 0)
    }
  ]
}

### Contraintes
1. Toujours générer **exactement 10 questions**.
2. Une seule bonne réponse par question.
3. Le niveau des questions doit correspondre à ${level}.
   - BEGINNER : notions de base (cellules, formules simples, mise en forme).
   - INTERMEDIATE : formules conditionnelles, recherches, graphiques, filtres avancés.
   - ADVANCED : tableaux croisés dynamiques, fonctions complexes, automatisation, Power Query, macros VBA simples.
4. Réponds **uniquement avec un JSON valide**.

Génère le test maintenant :`;

    const res = await fetch(AI_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ 
        system, 
        messages: [{ role: "user", content: user }], 
        temperature: 0.3, 
        max_tokens: 3000 
      }),
    });

    if (!res.ok) return fallback;
    const data = await res.json();
    
    try {
      const parsed = JSON.parse(data.content);
      // Validate structure
      if (parsed.level && parsed.title && Array.isArray(parsed.questions) && parsed.questions.length === 10) {
        return parsed;
      }
      return fallback;
    } catch {
      return fallback;
    }
  } catch {
    return fallback;
  }
}

export async function correctPlacementTest(
  level: "BEGINNER" | "INTERMEDIATE" | "ADVANCED",
  questions: Array<{
    question: string;
    options: string[];
    answer: number;
  }>,
  userAnswers: number[]
) {
  const fallback = {
    level,
    score: 0,
    result: "FAIL" as const,
    review: questions.map((q, i) => ({
      question: q.question,
      options: q.options,
      userAnswer: userAnswers[i] ?? -1,
      correctAnswer: q.answer,
      isCorrect: (userAnswers[i] ?? -1) === q.answer,
      analysis: "Analyse non disponible"
    }))
  };

  try {
    const system = "Tu es un expert en Excel et en pédagogie. Tu dois corriger un test de 10 questions à choix multiples, et fournir une analyse détaillée des résultats.";
    const user = `Corrige ce test de positionnement Excel de niveau ${level}.

### Données du test
Niveau choisi : ${level}
Questions : ${JSON.stringify(questions)}
Réponses de l'utilisateur : ${JSON.stringify(userAnswers)}

### Sortie attendue
Un JSON strict avec le format suivant :

{
  "level": "${level}",
  "score": number (entre 0 et 10),
  "result": "SUCCESS" | "FAIL",
  "review": [
    {
      "question": "string (énoncé de la question)",
      "options": ["string", "string", "string", "string"],
      "userAnswer": number (index de la réponse choisie par l'utilisateur),
      "correctAnswer": number (index de la bonne réponse),
      "isCorrect": boolean,
      "analysis": "string (explication claire : pourquoi la réponse est correcte ou non, rappel de la bonne logique Excel)"
    }
  ]
}

### Contraintes
1. **Toujours corriger exactement 10 questions**.
2. \`score\` = nombre de bonnes réponses.
3. \`result\` = "SUCCESS" si score ≥ 7, sinon "FAIL".
4. L'analyse doit être **pédagogique et détaillée**, en expliquant les erreurs éventuelles et en rappelant la bonne règle Excel.
5. Réponds uniquement avec un JSON valide conforme au schéma ci-dessus.

Corrige le test maintenant :`;

    const res = await fetch(AI_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ 
        system, 
        messages: [{ role: "user", content: user }], 
        temperature: 0.2, 
        max_tokens: 4000 
      }),
    });

    if (!res.ok) return fallback;
    const data = await res.json();
    
    try {
      const parsed = JSON.parse(data.content);
      // Validate structure
      if (parsed.level && typeof parsed.score === 'number' && parsed.result && Array.isArray(parsed.review) && parsed.review.length === 10) {
        return parsed;
      }
      return fallback;
    } catch {
      return fallback;
    }
  } catch {
    return fallback;
  }
}

export async function generatePersonalizedContent(userId: string) {
  // Placeholder: return beginner defaults until wired to Convex progress
  return {
    skillLevel: "BEGINNER",
    topics: [
      "Introduction à Excel",
      "Les bases des formules",
      "Mise en forme simple",
      "Trier et filtrer des données",
      "Créer des graphiques basiques",
    ],
    difficulty: "EASY",
  };
}
