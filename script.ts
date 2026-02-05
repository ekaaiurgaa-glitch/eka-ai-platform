/**
 * EKA-AI Bunny Edge Script
 * Handles edge routing and request processing for the EKA-AI platform
 */

import * as BunnySDK from "@bunny.net/edgescript-sdk";

BunnySDK.net.http.serve(async (request: Request): Promise<Response> => {
  const url = new URL(request.url);
  
  // Health check endpoint at the edge
  if (url.pathname === "/edge/health") {
    return new Response(
      JSON.stringify({
        status: "healthy",
        service: "eka-ai-edge",
        timestamp: new Date().toISOString()
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" }
      }
    );
  }

  // Pass through to origin for all other requests
  return fetch(request);
});
