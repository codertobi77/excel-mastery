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

export async function generateCourse(topic: string) {
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


