import { NextRequest, NextResponse } from 'next/server';

/**
 * API Endpoint: /api/agent/evaluate_level
 * Method: POST
 *
 * Description:
 * Generates 5 progressive evaluation questions to determine a user's Excel level.
 *
 * Request Body:
 * {
 *   "user_id": "string"
 * }
 *
 * Response:
 * {
 *   "questions": [
 *     {
 *       "question_id": "q1",
 *       "level": "Beginner",
 *       "text": "Which function is used to sum a range of cells?",
 *       "options": ["A) SUM", "B) ADD", "C) TOTAL"],
 *       "correct_answer": "A) SUM"
 *     },
 *     ... 4 more questions
 *   ]
 * }
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { user_id } = body;

    // 1. Validate input
    if (!user_id) {
      return NextResponse.json({ error: 'user_id is required' }, { status: 400 });
    }

    // 2. Mocked Logic
    // In a real implementation, this would call the backend service:
    // POST /user/evaluation with { user_id }
    // The service would then generate dynamic questions based on the user's history.
    console.log(`Agent is requesting an evaluation for user_id: ${user_id}`);

    // 3. Return Mocked Response
    const mockedQuestions = [
      {
        question_id: "q1_sum",
        level: "Beginner",
        text: "Quelle fonction est utilisée pour additionner une plage de cellules ?",
        options: ["A) SUM", "B) ADD", "C) TOTAL", "D) PLUS"],
        "correct_answer": "A) SUM"
      },
      {
        question_id: "q2_vlookup",
        level: "Intermediate",
        text: "À quoi sert la fonction RECHERCHEV (VLOOKUP) ?",
        options: ["A) Rechercher une valeur verticalement dans un tableau", "B) Rechercher horizontalement", "C) Calculer une moyenne", "D) Créer un graphique"],
        "correct_answer": "A) Rechercher une valeur verticalement dans un tableau"
      },
      {
        question_id: "q3_pivot",
        level: "Intermediate",
        text: "Qu'est-ce qu'un tableau croisé dynamique (PivotTable) ?",
        options: ["A) Un outil pour résumer et analyser des données", "B) Une fonction de mise en forme", "C) Un type de graphique", "D) Une macro"],
        "correct_answer": "A) Un outil pour résumer et analyser des données"
      },
      {
        question_id: "q4_array",
        level: "Advanced",
        text: "Quelle est la combinaison de touches pour valider une formule matricielle ?",
        options: ["A) Enter", "B) Ctrl+Enter", "C) Ctrl+Shift+Enter", "D) Alt+Enter"],
        "correct_answer": "C) Ctrl+Shift+Enter"
      },
      {
        question_id: "q5_powerquery",
        level: "Advanced",
        text: "À quoi sert l'éditeur Power Query ?",
        options: ["A) Écrire des macros VBA", "B) Se connecter, transformer et combiner des données de plusieurs sources", "C) Créer des formulaires", "D) Animer des graphiques"],
        "correct_answer": "B) Se connecter, transformer et combiner des données de plusieurs sources"
      }
    ];

    return NextResponse.json({ questions: mockedQuestions });

  } catch (error) {
    console.error('Error in /api/agent/evaluate_level:', error);
    return NextResponse.json({ error: 'An internal server error occurred' }, { status: 500 });
  }
}
