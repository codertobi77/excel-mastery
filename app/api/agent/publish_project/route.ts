import { NextRequest, NextResponse } from 'next/server';

/**
 * API Endpoint: /api/agent/publish_project
 * Method: POST
 *
 * Description:
 * Publishes a user-created project to the community gallery after validation.
 *
 * Request Body:
 * {
 *   "user_id": "string",
 *   "project_id": "string",
 *   "publication_settings": {
 *     "title": "string",
 *     "description": "string",
 *     "tags": ["string"]
 *   }
 * }
 *
 * Response:
 * {
 *   "status": "string", // 'pending_validation' or 'published'
 *   "publication_url": "string" (optional)
 * }
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { user_id, project_id, publication_settings } = body;

    // 1. Validate input
    if (!user_id || !project_id || !publication_settings) {
      return NextResponse.json({ error: 'user_id, project_id, and publication_settings are required' }, { status: 400 });
    }

    // 2. Mocked Logic
    // In a real implementation, this would call:
    // - GET /projects/{project_id}/validate
    // - PUT /projects/{project_id}/publish with the settings
    console.log(`Agent is requesting to publish project_id: ${project_id} for user_id: ${user_id}`);

    // 3. Return Mocked Response
    // We can simulate the validation step.
    const validationPassed = Math.random() > 0.1; // 90% chance of passing validation

    if (validationPassed) {
        return NextResponse.json({
            status: "published",
            publication_url: `https://excel-mastery.com/community/projects/${project_id}`
        });
    } else {
        return NextResponse.json({
            status: "pending_validation",
            message: "Votre projet a été soumis pour validation. Il sera publié après examen."
        });
    }

  } catch (error) {
    console.error('Error in /api/agent/publish_project:', error);
    return NextResponse.json({ error: 'An internal server error occurred' }, { status: 500 });
  }
}
