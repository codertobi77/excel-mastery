import { NextRequest, NextResponse } from 'next/server';

/**
 * API Endpoint: /api/agent/generate_mini_project
 * Method: POST
 *
 * Description:
 * Creates a personalized mini-project (30-60 min) focused on a specific skill.
 *
 * Request Body:
 * {
 *   "user_id": "string",
 *   "skill_focus": "string", // e.g., 'PivotTables', 'DataValidation'
 *   "difficulty": "string" // e.g., 'Intermediate'
 * }
 *
 * Response:
 * {
 *   "project_id": "string",
 *   "title": "string",
 *   "context": "string",
 *   "instructions": ["string"],
 *   "data_url": "string", // URL to a CSV or Excel file
 *   "solution_url": "string"
 * }
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { user_id, skill_focus, difficulty } = body;

    // 1. Validate input
    if (!user_id || !skill_focus || !difficulty) {
      return NextResponse.json({ error: 'user_id, skill_focus, and difficulty are required' }, { status: 400 });
    }

    // 2. Mocked Logic
    // In a real implementation, this would call:
    // POST /projects/create with the payload
    // The backend would generate a project, store it, and return the details.
    console.log(`Agent is requesting a mini-project for user_id: ${user_id}. Focus: ${skill_focus}, Difficulty: ${difficulty}`);

    // 3. Return Mocked Response
    const mockedResponse = {
      project_id: "proj_12345",
      title: `Analyse des Ventes Trimestrielles avec des Tableaux Croisés Dynamiques`,
      context: "Vous êtes analyste pour une entreprise de vente au détail. Votre manager vous a demandé d'analyser les données de ventes du dernier trimestre pour identifier les tendances clés.",
      instructions: [
        "1. Téléchargez les données de ventes à partir de l'URL fournie.",
        "2. Créez un Tableau Croisé Dynamique pour montrer le total des ventes par région.",
        "3. Ajoutez un filtre pour pouvoir visualiser les ventes par catégorie de produit.",
        "4. Créez un graphique croisé dynamique pour représenter ces données.",
        "5. Rédigez une courte synthèse de vos découvertes."
      ],
      data_url: "https://example.com/data/sales_q3.csv",
      solution_url: "https://example.com/solutions/sales_q3_solution.xlsx"
    };

    return NextResponse.json(mockedResponse);

  } catch (error) {
    console.error('Error in /api/agent/generate_mini_project:', error);
    return NextResponse.json({ error: 'An internal server error occurred' }, { status: 500 });
  }
}
