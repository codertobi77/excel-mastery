import { NextRequest, NextResponse } from 'next/server';

/**
 * API Endpoint: /api/agent/gamification_update
 * Method: POST
 *
 * Description:
 * Updates the user's gamification stats (points, badges, streaks) after an activity.
 *
 * Request Body:
 * {
 *   "user_id": "string",
 *   "action_type": "string" // e.g., 'lesson_completed', 'exercise_success', 'quiz_perfect'
 *   "points_earned": "number",
 *   "lesson_completed": "string" (optional)
 * }
 *
 * Response:
 * {
 *   "user_id": "string",
 *   "new_total_points": "number",
 *   "newly_unlocked_badges": ["string"],
 *   "level_up": "boolean",
 *   "new_level": "string" (optional)
 * }
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { user_id, action_type, points_earned } = body;

    // 1. Validate input
    if (!user_id || !action_type || points_earned === undefined) {
      return NextResponse.json({ error: 'user_id, action_type, and points_earned are required' }, { status: 400 });
    }

    // 2. Mocked Logic
    // In a real implementation, this would call:
    // PUT /user/{user_id}/gamification with the payload
    // The backend would calculate new totals, check for badge unlocks, and level-ups.
    console.log(`Agent is updating gamification for user_id: ${user_id}. Action: ${action_type}, Points: ${points_earned}`);

    // 3. Return Mocked Response
    const mockedResponse = {
      user_id: user_id,
      new_total_points: 1250, // Dummy value
      newly_unlocked_badges: ["Apprenti Analyste"],
      level_up: true,
      new_level: "Excelerator Niveau 5"
    };

    // Add some variability for demonstration
    if (action_type === 'quiz_perfect') {
        mockedResponse.newly_unlocked_badges.push("Maître du Quiz");
    }

    return NextResponse.json(mockedResponse);

  } catch (error) {
    console.error('Error in /api/agent/gamification_update:', error);
    return NextResponse.json({ error: 'An internal server error occurred' }, { status: 500 });
  }
}
