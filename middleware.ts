import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextRequest, NextResponse, NextFetchEvent } from 'next/server';

// Create a matcher to identify agent routes that should bypass Clerk's default auth
const isAgentRoute = createRouteMatcher([
  '/api/agent/(.*)',
]);

// Initialize Clerk middleware. It will handle all routes that are not agent routes.
const clerkAuthMiddleware = clerkMiddleware();

/**
 * The main middleware function that orchestrates authentication.
 * It acts as a switch between custom token auth for the Smyth AI agent
 * and Clerk auth for the main web application.
 */
export default function middleware(req: NextRequest, event: NextFetchEvent) {
  // If the request is for an agent route, apply our custom token authentication.
  if (isAgentRoute(req)) {
    const authHeader = req.headers.get('authorization');
    // It's crucial to use an environment variable for the token in a real scenario.
    const expectedToken = `Bearer ${process.env.SMYTH_API_TOKEN}`;

    if (!authHeader || authHeader !== expectedToken) {
      // If the token is missing or incorrect, return a 401 Unauthorized response.
      console.error("Agent authentication failed: Invalid or missing token.");
      return new NextResponse(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // If the token is valid, allow the request to proceed to the route handler.
    return NextResponse.next();
  }

  // For all other routes, delegate to the Clerk authentication middleware.
  return clerkAuthMiddleware(req, event);
}

export const config = {
  // The matcher defines which routes the middleware will run on.
  matcher: [
    // This pattern excludes Next.js internals, static files, and public assets.
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // This pattern ensures the middleware always runs for API routes.
    '/(api|trpc)(.*)',
  ],
};
