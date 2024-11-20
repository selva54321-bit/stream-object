import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { streamObject } from 'ai';
import { z } from 'zod';

const google = createGoogleGenerativeAI({
  apiKey: process.env.api_key,
});

const schema = z.object({
  fieldofdomain: z.object({
    nameofdomain: z.string(),
    investfordomain: z.number(),
    scopesfordomain: z.array(
      z.object({
        demand: z.string(),
        profit: z.string(),
        expectingcompanies: z.string(),
      })
    ),
  }),
});

export async function POST(req) {
  const { message } = await req.json();

  const { partialObjectStream } = await streamObject({
    model: google('gemini-1.5-flash'),
    schema: schema,
    prompt: `Generate domain information for ${message} field`,
  });

  // Create a ReadableStream to handle the streaming response
  const stream = new ReadableStream({
    async start(controller) {
      for await (const streamObj of partialObjectStream) {
        const chunk = JSON.stringify(streamObj);
        controller.enqueue(new TextEncoder().encode(chunk));
      }
      controller.close();
    },
  });

  return new Response(stream, {
    headers: { 'Content-Type': 'application/json' },
  });
}
