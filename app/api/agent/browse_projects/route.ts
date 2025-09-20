import { NextRequest, NextResponse } from 'next/server';

/**
 * API Endpoint: /api/agent/browse_projects
 * Method: GET
 *
 * Description:
 * Explores community projects with filtering and personalized recommendations.
 *
 * Query Parameters:
 * - skill_filter: string (optional)
 * - difficulty_filter: string (optional)
 * - search_query: string (optional)
 * - user_id: string (for personalization)
 *
 * Response:
 * {
 *   "projects": [
 *     {
 *       "project_id": "string",
 *       "title": "string",
 *       "author_name": "string",
 *       "difficulty": "string",
 *       "tags": ["string"],
 *       "likes": "number"
 *     }
 *   ],
 *   "recommendations": [
 *     { "project_id": "string", "title": "string", "reason": "string" }
 *   ]
 * }
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const skill_filter = searchParams.get('skill_filter');
    const difficulty_filter = searchParams.get('difficulty_filter');
    const search_query = searchParams.get('search_query');
    const user_id = searchParams.get('user_id');

    // 1. Validate input
    if (!user_id) {
        return NextResponse.json({ error: 'user_id query parameter is required for personalization' }, { status: 400 });
    }

    // 2. Mocked Logic
    // In a real implementation, this would call:
    // GET /projects/search with the query parameters
    console.log(`Agent is requesting to browse projects for user_id: ${user_id} with filters:`, { skill_filter, difficulty_filter, search_query });

    // 3. Return Mocked Response
    const mockedResponse = {
      projects: [
        {
          project_id: "proj_abc",
          title: "Dashboard de Suivi Budgétaire Personnel",
          author_name: "Alice",
          difficulty: "Intermediate",
          tags: ["Budget", "Formules", "Graphiques"],
          likes: 128
        },
        {
          project_id: "proj_def",
          title: "Analyse de Données de Sondage avec TCD",
          author_name: "Charlie",
          difficulty: "Advanced",
          tags: ["Analyse", "TCD", "Statistiques"],
          likes: 95
        },
        {
          project_id: "proj_ghi",
          title: "Planificateur d'Événement Simple",
          author_name: "David",
          difficulty: "Beginner",
          tags: ["Organisation", "Dates", "Listes"],
          likes: 210
        }
      ],
      recommendations: [
        {
          project_id: "proj_xyz",
          title: "Automatisation de Rapports avec des Macros",
          reason: "Basé sur votre intérêt pour les TCD, vous pourriez aimer l'automatisation."
        }
      ]
    };

    return NextResponse.json(mockedResponse);

  } catch (error) {
    console.error('Error in /api/agent/browse_projects:', error);
    return NextResponse.json({ error: 'An internal server error occurred' }, { status: 500 });
  }
}
