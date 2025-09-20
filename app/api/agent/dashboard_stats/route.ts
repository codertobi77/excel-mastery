import { NextRequest, NextResponse } from 'next/server';

/**
 * API Endpoint: /api/agent/dashboard_stats
 * Method: GET
 *
 * Description:
 * Retrieves user's progress statistics and leaderboard rankings.
 *
 * Query Parameters:
 * - user_id: string
 * - period: string (optional, e.g., 'weekly', 'monthly', 'all_time')
 *
 * Response:
 * {
 *   "user_id": "string",
 *   "stats": {
 *     "lessons_completed": "number",
 *     "exercises_passed": "number",
 *     "current_streak_days": "number",
 *     "time_spent_minutes": "number"
 *   },
 *   "leaderboard": {
 *     "user_rank": "number",
 *     "top_users": [
 *       { "rank": 1, "name": "string", "points": "number" },
 *       { "rank": 2, "name": "string", "points": "number" },
 *       { "rank": 3, "name": "string", "points": "number" }
 *     ]
 *   },
 *   "personalized_encouragement": "string"
 * }
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const user_id = searchParams.get('user_id');
    const period = searchParams.get('period') || 'all_time';

    // 1. Validate input
    if (!user_id) {
      return NextResponse.json({ error: 'user_id query parameter is required' }, { status: 400 });
    }

    // 2. Mocked Logic
    // In a real implementation, this would call:
    // - GET /user/{user_id}/stats?period={period}
    // - GET /leaderboard
    console.log(`Agent is requesting dashboard stats for user_id: ${user_id} for period: ${period}`);

    // 3. Return Mocked Response
    const mockedResponse = {
      user_id: user_id,
      stats: {
        lessons_completed: 25,
        exercises_passed: 40,
        current_streak_days: 12,
        time_spent_minutes: 720
      },
      leaderboard: {
        user_rank: 4,
        top_users: [
          { rank: 1, name: "Alice", points: 15000 },
          { rank: 2, name: "Bob", points: 14500 },
          { rank: 3, name: "Charlie", points: 13000 }
        ]
      },
      personalized_encouragement: "Excellent travail sur les fonctions de recherche ! Continuez comme ça et vous serez bientôt dans le top 3."
    };

    return NextResponse.json(mockedResponse);

  } catch (error) {
    console.error('Error in /api/agent/dashboard_stats:', error);
    return NextResponse.json({ error: 'An internal server error occurred' }, { status: 500 });
  }
}
