import { NextRequest, NextResponse } from 'next/server';

/**
 * API Endpoint: /api/agent/start_lesson
 * Method: POST
 *
 * Description:
 * Starts a lesson adapted to the user's level. If a topic is provided,
 * it serves that specific lesson. Otherwise, it picks the next logical lesson.
 *
 * Request Body:
 * {
 *   "user_id": "string",
 *   "lesson_topic": "string" (optional)
 * }
 *
 * Response:
 * {
 *   "lesson_id": "string",
 *   "title": "string",
 *   "content": {
 *     "explanation": "string (markdown)",
 *     "example": "string (markdown)",
 *     "exercise": {
 *       "text": "string",
 *       "initial_data": "object"
 *     },
 *     "mini_quiz": [
 *       {
 *         "question": "string",
 *         "options": ["string"],
 *         "correct_answer": "string"
 *       }
 *     ]
 *   }
 * }
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { user_id, lesson_topic } = body;

    // 1. Validate input
    if (!user_id) {
      return NextResponse.json({ error: 'user_id is required' }, { status: 400 });
    }

    // 2. Mocked Logic
    // In a real implementation, this would call the backend:
    // - GET /user/{user_id}/profile to get the user's level.
    // - POST /lessons/start with { user_id, topic } to generate or fetch lesson content.
    console.log(`Agent is requesting a lesson for user_id: ${user_id}. Topic: ${lesson_topic || 'Next logical'}`);

    // 3. Return Mocked Response
    const lessonTitle = lesson_topic || "Les Tableaux Croisés Dynamiques";
    const mockedLesson = {
      lesson_id: "lesson_tcd_101",
      title: lessonTitle,
      content: {
        explanation: `
### Comprendre les Tableaux Croisés Dynamiques (TCD)

Un **Tableau Croisé Dynamique** est l'un des outils les plus puissants d'Excel.
Il vous permet de résumer, analyser, explorer et présenter vos données de manière interactive.
Imaginez que vous avez une grande table de ventes. Avec un TCD, vous pouvez rapidement répondre à des questions comme :
- Quel est le total des ventes par région ?
- Quel produit s'est le mieux vendu ce trimestre ?
- Qui sont nos meilleurs vendeurs ?
        `,
        example: `
#### Exemple Concret :

Prenons une table simple de ventes :

| Vendeur | Région | Produit | Ventes (€) |
|---|---|---|---|
| Alice | Nord | Pommes | 150 |
| Bob | Sud | Poires | 200 |
| Alice | Nord | Poires | 50 |
| Charlie | Ouest | Pommes | 300 |

Un TCD pourrait transformer cela en un résumé clair :

**Ventes par Région :**
- Nord : 200 €
- Sud : 200 €
- Ouest : 300 €
        `,
        exercise: {
          text: "Créez un TCD qui montre le total des ventes par vendeur.",
          initial_data: {
            "A1": "Vendeur", "B1": "Région", "C1": "Produit", "D1": "Ventes (€)",
            "A2": "Alice", "B2": "Nord", "C2": "Pommes", "D2": 150,
            "A3": "Bob", "B3": "Sud", "C3": "Poires", "D3": 200,
            "A4": "Alice", "B4": "Nord", "C4": "Poires", "D4": 50,
            "A5": "Charlie", "B5": "Ouest", "C5": "Pommes", "D5": 300,
          }
        },
        mini_quiz: [
          {
            question: "Le principal avantage d'un TCD est de...",
            options: ["Mettre en forme les cellules", "Résumer de grandes quantités de données", "Écrire des formules complexes"],
            "correct_answer": "Résumer de grandes quantités de données"
          }
        ]
      }
    };

    return NextResponse.json(mockedLesson);

  } catch (error) {
    console.error('Error in /api/agent/start_lesson:', error);
    return NextResponse.json({ error: 'An internal server error occurred' }, { status: 500 });
  }
}
