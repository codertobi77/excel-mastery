import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';

/**
 * PROXY API ROUTE
 * This route is called by the frontend to generate a personalized mini-project.
 * It securely calls the internal Smyth Agent API.
 */
export async function POST(req: NextRequest) {
  try {
    // 1. Authenticate the user
    const { userId } = await auth();
    if (!userId) {
      return new NextResponse(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    // 2. Parse the request body
    const { skill_focus, difficulty } = await req.json();
    if (!skill_focus || !difficulty) {
        return new NextResponse(JSON.stringify({ error: 'skill_focus and difficulty are required' }), { status: 400 });
    }

    // 3. Call the internal Agent API
    const agentApiUrl = new URL('/api/agent/generate_mini_project', req.url).toString();

    const agentResponse = await fetch(agentApiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.SMYTH_API_TOKEN}`,
      },
      body: JSON.stringify({
        user_id: userId,
        skill_focus,
        difficulty,
      }),
    });

    // 4. Handle the agent's response
    if (!agentResponse.ok) {
      const errorBody = await agentResponse.text();
      console.error(`Agent API call failed with status ${agentResponse.status}:`, errorBody);
      return new NextResponse(JSON.stringify({ error: 'Failed to generate project from agent' }), { status: agentResponse.status });
    }

    const projectData = await agentResponse.json();
    return NextResponse.json(projectData);

  } catch (error) {
    console.error('Error in generate_mini_project proxy:', error);
    return new NextResponse(JSON.stringify({ error: 'An internal server error occurred' }), { status: 500 });
  }
}
