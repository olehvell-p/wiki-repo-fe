import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';

export async function GET(
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
    // Create a ReadableStream to proxy the SSE events
    const stream = new ReadableStream({
      async start(controller) {
        try {
          // Connect to the FastAPI SSE endpoint
          const response = await fetch(`${BACKEND_URL}/analyze/${uuid}`, {
            headers: {
              'Accept': 'text/event-stream',
              'Cache-Control': 'no-cache',
            },
          });

          if (!response.ok) {
            throw new Error(`Backend responded with status: ${response.status}`);
          }

          const reader = response.body?.getReader();
          if (!reader) {
            throw new Error('No response body');
          }

          const decoder = new TextDecoder();

          try {
            while (true) {
              const { done, value } = await reader.read();
              
              if (done) {
                break;
              }

              // Decode and forward the chunk
              const chunk = decoder.decode(value, { stream: true });
              controller.enqueue(new TextEncoder().encode(chunk));
            }
          } finally {
            reader.releaseLock();
          }
        } catch (error) {
          console.error('SSE Proxy Error:', error);
          // Send an error event to the client
          const errorEvent = `data: ${JSON.stringify({
            event_type: 'error',
            message: 'Connection to analysis service failed'
          })}\n\n`;
          controller.enqueue(new TextEncoder().encode(errorEvent));
        } finally {
          controller.close();
        }
      },
    });

    // Return the SSE response
    return new NextResponse(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache, no-store, max-age=0',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Cache-Control',
      },
    });

  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      { error: 'Failed to connect to analysis stream' },
      { status: 500 }
    );
  }
} 