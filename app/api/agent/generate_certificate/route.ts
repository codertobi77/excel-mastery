import { NextRequest, NextResponse } from 'next/server';

/**
 * API Endpoint: /api/agent/generate_certificate
 * Method: POST
 *
 * Description:
 * Generates a certificate in HTML/PDF format after a user completes an advanced level.
 *
 * Request Body:
 * {
 *   "user_id": "string",
 *   "level_completed": "string", // e.g., 'Advanced'
 *   "skills_validated": ["string"]
 * }
 *
 * Response:
 * {
 *   "certificate_type": "html", // or "pdf_base64"
 *   "content": "string" // HTML content or base64 encoded PDF
 * }
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { user_id, level_completed, skills_validated } = body;

    // 1. Validate input
    if (!user_id || !level_completed || !skills_validated) {
      return NextResponse.json({ error: 'user_id, level_completed, and skills_validated are required' }, { status: 400 });
    }

    // 2. Mocked Logic
    // In a real implementation, this would:
    // - Fetch user details (GET /user/{user_id}/profile) to get their name.
    // - Use a PDF generation library (like Puppeteer or PDFKit) on the server.
    // - Create a PDF from an HTML template.
    console.log(`Agent is requesting a certificate for user_id: ${user_id} for completing level: ${level_completed}`);

    // 3. Return Mocked HTML Response
    const userName = "Jean Dupont"; // Dummy name
    const issuanceDate = new Date().toLocaleDateString('fr-FR');
    const skillsList = skills_validated.map((skill: string) => `<li>${skill}</li>`).join('');

    const mockedHtmlContent = `
      <div style="border: 10px solid #107c41; padding: 50px; text-align: center; font-family: Arial, sans-serif;">
        <h1 style="color: #107c41;">Certificat de Réussite</h1>
        <p style="font-size: 20px;">délivré à</p>
        <h2 style="font-size: 36px; margin: 20px 0;">${userName}</h2>
        <p style="font-size: 20px;">pour avoir complété avec succès le niveau</p>
        <h3 style="font-size: 28px; color: #1e88e5;">${level_completed} d'Excel Mastery</h3>
        <p style="margin-top: 40px;">Compétences validées :</p>
        <ul style="list-style: none; padding: 0; margin: 10px auto; max-width: 300px;">
          ${skillsList}
        </ul>
        <p style="margin-top: 50px; font-size: 14px;">Délivré le ${issuanceDate}</p>
      </div>
    `;

    return NextResponse.json({
      certificate_type: "html",
      content: mockedHtmlContent
    });

  } catch (error) {
    console.error('Error in /api/agent/generate_certificate:', error);
    return NextResponse.json({ error: 'An internal server error occurred' }, { status: 500 });
  }
}
