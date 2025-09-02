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
    content: `Contenu détaillé, exemples pratiques et astuces pour ${titleSeed.toLowerCase()} sur ${topic}.`,
    duration: 10,
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
      content: typeof ls?.content === 'string' && ls.content.trim() ? ls.content : `Introduction et exemples sur ${topic}.`,
      duration: typeof ls?.duration === 'number' && ls.duration > 0 ? ls.duration : 10,
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
      lessons: [ensureLesson(chTitle, 1), ensureLesson(chTitle, 2)],
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
    const system = "Tu es un expert Excel qui crée des cours structurés au format JSON strict, lisibles et complets.";
    const user = (
      `Crée un cours sur "${topic}" et retourne UNIQUEMENT un JSON valide avec le schéma suivant:\n` +
      `{"title": string (titre concis, formulé par l'IA),"description": string (utile, claire),"level": "BEGINNER"|"INTERMEDIATE"|"ADVANCED","duration": number (en minutes pour tout le cours),` +
      `"chapters": [{"title": string (concis, formulé par l'IA),"order": number,"lessons": [{"title": string (concis, formulé par l'IA),"content": string (explication + exemples),"duration": number (minutes),"order": number}]}]}` +
      `\nContraintes: (1) Au moins 4 chapitres (chapters.length >= 4). (2) Chaque chapitre contient au minimum 2 leçons. (3) Les titres (cours/chapitres/leçons) doivent être formulés par l'IA (courts, clairs). (4) JSON strict, sans texte supplémentaire.`
    );
    const res = await fetch(AI_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ system, messages: [{ role: "user", content: user }], temperature: 0.4, max_tokens: 2000 }),
    });
    if (!res.ok) return fallback;
    const data = await res.json();
    try {
      const parsed = JSON.parse(data.content);
      return enforceCourseStructure(parsed, topic)
    } catch {
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
    const system = "Tu es un professeur expert en Microsoft Excel et en pédagogie numérique. Tu sais analyser les tests de positionnement et créer des parcours d'apprentissage personnalisés, progressifs et interactifs.";
    const user = `Analyse les résultats du test de positionnement et génère un parcours personnalisé.

### Données du test :
- Niveau choisi par l'utilisateur : ${chosenLevel}
- Score obtenu : ${testResult.score}/10
- Résultat : ${testResult.result}
- Niveau réel validé : ${actualLevel}

### Analyse des erreurs :
${testResult.review.map((r, i) => `Question ${i + 1}: ${r.isCorrect ? 'Correcte' : 'Incorrecte'} - ${r.analysis}`).join('\n')}

### Structure attendue (JSON strict) :
{
  "title": "string (titre du parcours)",
  "description": "string (description du parcours)",
  "level": "${actualLevel}",
  "duration": number (durée totale en minutes),
  "objectives": ["string", "string", "string"] (objectifs pédagogiques),
  "chapters": [
    {
      "title": "string (titre du module)",
      "order": number,
      "objectives": ["string", "string"] (objectifs du module),
      "lessons": [
        {
          "title": "string (titre de la leçon)",
          "content": "string (cours théorique détaillé avec explications étape par étape)",
          "examples": ["string", "string"] (exemples pratiques concrets),
          "exercise": "string (exercice d'application avec consignes)",
          "quiz": [
            {
              "question": "string",
              "options": ["string", "string", "string", "string"],
              "answer": number (index de la bonne réponse)
            }
          ],
          "duration": number (durée en minutes),
          "order": number
        }
      ]
    }
  ],
  "conclusion": {
    "summary": "string (résumé des notions apprises)",
    "nextSteps": "string (conseils pour aller plus loin)",
    "resources": ["string", "string"] (ressources complémentaires)
  }
}

### Contraintes :
- Langage clair et progressif, adapté au niveau ${actualLevel}
- Accent sur la pratique et la mise en situation réelle
- Modules indépendants mais logiquement reliés
- Au moins 4 modules avec 2-3 leçons chacun
- Chaque leçon doit avoir des exemples pratiques et un quiz
- Prendre en compte les erreurs du test pour renforcer les points faibles
- Réponds uniquement avec un JSON valide, pas de texte supplémentaire

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
    
    if (!res.ok) return fallback;
    const data = await res.json();
    
    try {
      const parsed = JSON.parse(data.content);
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
    } catch {
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


