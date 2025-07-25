import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ uuid: string }> }
) {
  const { uuid } = await context.params;

  if (!uuid) {
    return NextResponse.json(
      { error: 'UUID is required' },
      { status: 400 }
    );
  }

  try {
    const body = await request.json();
    
    // Validate request body
    if (!body.messages || !Array.isArray(body.messages)) {
      return NextResponse.json(
        { error: 'Messages array is required' },
        { status: 400 }
      );
    }

    // Forward the request to the FastAPI backend
    const backendResponse = await fetch(`${BACKEND_URL}/analyze/${uuid}/ask`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!backendResponse.ok) {
      const errorData = await backendResponse.json().catch(() => ({}));
      return NextResponse.json(
        { error: errorData.detail || 'Failed to process question' },
        { status: backendResponse.status }
      );
    }

    const data = await backendResponse.json();
    
    // Return the response from the backend
    return NextResponse.json(data);

  } catch (error) {
    console.error('Ask API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 