import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';

/**
 * PROXY API ROUTE
 * This route is called by the frontend client. It is protected by Clerk's user authentication.
 * It acts as a secure proxy to the internal Smyth Agent API.
 * It attaches the required secret bearer token for the agent API.
 */
export async function POST(req: NextRequest) {
  try {
    // 1. Authenticate the user using Clerk
    const { userId } = await auth();
    if (!userId) {
      return new NextResponse(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    // 2. Parse the request body from the client
    const { lesson_topic } = await req.json();
    if (!lesson_topic) {
        return new NextResponse(JSON.stringify({ error: 'lesson_topic is required' }), { status: 400 });
    }

    // This is the user_id from the database, which the agent API expects.
    // The prompt implies a mapping between clerkId and our own user_id.
    // For now, we will pass the clerkId, assuming the agent API can handle it
    // or that we would normally look up our internal ID here.
    const user_id_for_agent = userId;

    // 3. Call the internal Agent API from the backend
    const agentApiUrl = new URL('/api/agent/start_lesson', req.url).toString();

    const agentResponse = await fetch(agentApiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.SMYTH_API_TOKEN}`,
      },
      body: JSON.stringify({
        user_id: user_id_for_agent,
        lesson_topic: lesson_topic,
      }),
    });

    // 4. Check if the agent API call was successful
    if (!agentResponse.ok) {
      const errorBody = await agentResponse.text();
      console.error(`Agent API call failed with status ${agentResponse.status}:`, errorBody);
      return new NextResponse(JSON.stringify({ error: 'Failed to get lesson from agent' }), { status: agentResponse.status });
    }

    // 5. Stream the response from the agent API back to the client
    const lessonData = await agentResponse.json();
    return NextResponse.json(lessonData);

  } catch (error) {
    console.error('Error in start_lesson proxy:', error);
    return new NextResponse(JSON.stringify({ error: 'An internal server error occurred' }), { status: 500 });
  }
}
