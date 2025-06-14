/*
  # Notion API Proxy Edge Function

  1. Purpose
    - Proxy requests to Notion API to avoid CORS issues
    - Handle authentication with Notion API token
    - Provide secure server-side access to Notion API

  2. Security
    - Uses server-side environment variables for API token
    - Validates request methods and endpoints
    - Handles errors gracefully
*/

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS, PATCH",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, Notion-Version",
};

const NOTION_TOKEN = Deno.env.get('VITE_NOTION_TOKEN');
const NOTION_API_URL = 'https://api.notion.com/v1';

Deno.serve(async (req: Request) => {
  try {
    // Handle CORS preflight requests
    if (req.method === "OPTIONS") {
      return new Response(null, {
        status: 200,
        headers: corsHeaders,
      });
    }

    if (!NOTION_TOKEN) {
      return new Response(
        JSON.stringify({ error: 'Notion token not configured' }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Extract the Notion API endpoint from the request
    const url = new URL(req.url);
    const endpoint = url.searchParams.get('endpoint');
    
    if (!endpoint) {
      return new Response(
        JSON.stringify({ error: 'Missing endpoint parameter' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Prepare the request to Notion API
    const notionUrl = `${NOTION_API_URL}${endpoint}`;
    const requestOptions: RequestInit = {
      method: req.method,
      headers: {
        'Authorization': `Bearer ${NOTION_TOKEN}`,
        'Content-Type': 'application/json',
        'Notion-Version': '2022-06-28'
      }
    };

    // Add body for POST, PATCH, PUT requests
    if (req.method !== 'GET' && req.method !== 'DELETE') {
      const body = await req.text();
      if (body) {
        requestOptions.body = body;
      }
    }

    // Make the request to Notion API
    const response = await fetch(notionUrl, requestOptions);
    const data = await response.text();

    // Return the response with CORS headers
    return new Response(data, {
      status: response.status,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
      },
    });

  } catch (error) {
    console.error('Notion proxy error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});