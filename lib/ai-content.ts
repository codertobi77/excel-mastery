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
    const system = "Tu es un expert pédagogue Excel. Tu dois créer un cours détaillé au format JSON strict. IMPORTANT: Réponds UNIQUEMENT avec du JSON valide, sans aucun texte avant ou après.";
    const user = `Crée un cours Excel sur "${topic}" avec du contenu très détaillé.

FORMAT JSON EXACT REQUIS:
{
  "title": "Cours pratique: ${topic}",
  "description": "Un cours complet pour maîtriser ${topic} dans Excel avec des exemples concrets et des exercices pratiques",
  "level": "BEGINNER",
  "duration": 120,
  "chapters": [
    {
      "title": "Introduction à ${topic}",
      "order": 1,
      "lessons": [
        {
          "title": "Découverte de ${topic}",
          "content": "# Découverte de ${topic}\n\n## Qu'est-ce que ${topic} ?\n\n${topic} est une fonctionnalité essentielle d'Excel qui permet de...\n\n## Pourquoi utiliser ${topic} ?\n\n- **Gain de temps** : Automatise les tâches répétitives\n- **Précision** : Réduit les erreurs manuelles\n- **Efficacité** : Améliore la productivité\n\n## Cas d'usage concrets\n\n### Exemple 1 : En entreprise\nImaginez que vous devez analyser les ventes mensuelles. Avec ${topic}, vous pouvez...\n\n### Exemple 2 : Gestion personnelle\nPour suivre votre budget familial, ${topic} vous permet de...\n\n## Prérequis\n\nAvant de commencer, assurez-vous de :\n- Avoir Excel installé\n- Connaître les bases d'Excel (cellules, formules simples)\n- Disposer de données d'exemple\n\n## Points clés à retenir\n\n- ${topic} simplifie l'analyse de données\n- La pratique est essentielle pour maîtriser ${topic}\n- Commencez par des exemples simples avant d'aborder des cas complexes",
          "duration": 20,
          "order": 1
        },
        {
          "title": "Première utilisation de ${topic}",
          "content": "# Première utilisation de ${topic}\n\n## Étape par étape\n\n### Étape 1 : Préparation des données\n\n1. **Ouvrez Excel** et créez un nouveau classeur\n2. **Saisissez vos données** dans les colonnes A à D\n3. **Vérifiez la cohérence** de vos données\n\n### Étape 2 : Application de ${topic}\n\n1. **Sélectionnez vos données** (Ctrl+A)\n2. **Accédez au menu** Insertion > ${topic}\n3. **Configurez les paramètres** selon vos besoins\n\n### Étape 3 : Personnalisation\n\n**Options importantes :**\n- Format d'affichage\n- Filtres automatiques\n- Calculs personnalisés\n\n## Exercice pratique\n\n**Objectif :** Créer votre premier ${topic}\n\n**Instructions :**\n1. Téléchargez le fichier d'exemple\n2. Appliquez ${topic} aux données\n3. Personnalisez l'affichage\n4. Sauvegardez votre travail\n\n**Résultat attendu :** Un ${topic} fonctionnel avec vos données\n\n## Astuces de pro\n\n💡 **Astuce 1 :** Utilisez Ctrl+Z pour annuler rapidement\n💡 **Astuce 2 :** Sauvegardez régulièrement votre travail\n💡 **Astuce 3 :** Testez avec des données simples d'abord",
          "duration": 25,
          "order": 2
        }
      ]
    },
    {
      "title": "Techniques avancées de ${topic}",
      "order": 2,
      "lessons": [
        {
          "title": "Optimisation de ${topic}",
          "content": "# Optimisation de ${topic}\n\n## Techniques d'optimisation\n\n### 1. Performance\n\n**Améliorer la vitesse :**\n- Limitez les données inutiles\n- Utilisez des formules efficaces\n- Évitez les calculs complexes\n\n### 2. Lisibilité\n\n**Rendre ${topic} plus clair :**\n- Nommez vos colonnes explicitement\n- Utilisez des couleurs cohérentes\n- Ajoutez des commentaires\n\n### 3. Maintenance\n\n**Faciliter les mises à jour :**\n- Structurez vos données\n- Documentez vos choix\n- Créez des modèles réutilisables\n\n## Cas d'usage avancés\n\n### Analyse financière\nPour analyser la rentabilité par produit...\n\n### Suivi de projet\nPour monitorer l'avancement des tâches...\n\n### Reporting automatisé\nPour générer des rapports mensuels...\n\n## Bonnes pratiques\n\n✅ **À faire :**\n- Tester avec des données réelles\n- Valider les résultats\n- Former les utilisateurs\n\n❌ **À éviter :**\n- Surcharger avec trop d'informations\n- Négliger la documentation\n- Ignorer les retours utilisateurs",
          "duration": 30,
          "order": 1
        }
      ]
    }
  ]
}

CONTRAINTES STRICTES:
1. Réponds UNIQUEMENT avec ce JSON, rien d'autre
2. Remplace "${topic}" par le sujet demandé dans tout le contenu
3. Le contenu doit être détaillé et pratique
4. Minimum 300 mots par leçon dans le champ "content"
5. JSON valide obligatoire`;
    
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
