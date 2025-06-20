import { NextResponse } from 'next/server';
import OpenAI from 'openai';

// Initialize the OpenAI client with the API key from environment variables
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: Request) {
  try {
    // 1. Extract the user's prompt from the request body
    const { userPrompt } = await req.json();

    if (!userPrompt) {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
    }

    // 2. Define the system prompt for the AI
    // This guides the AI to behave in a specific way
    const systemPrompt = `
      You are an expert in Excel and Google Sheets formulas.
      Your task is to take a user's natural language request and return ONLY a JSON object with two keys: "formula" and "explanation".
      - The "formula" should be the most appropriate and robust formula for the user's request.
      - The "explanation" should be a clear, concise, and easy-to-understand description of how the formula works, written for a non-technical user.
      - Do not include any other text, greetings, or introductory phrases in your response. Just the JSON object.
    `;

    // 3. Call the OpenAI API
    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo', // Use gpt-4 for higher accuracy if preferred
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      response_format: { type: 'json_object' }, // Enforce JSON output
    });

    // 4. Extract the JSON content from the AI's response
    const aiResponse = completion.choices[0].message.content;

    if (!aiResponse) {
      return NextResponse.json({ error: 'Failed to get response from AI' }, { status: 500 });
    }
    
    // The response is already a JSON string, so we can return it directly.
    // We'll parse it on the client-side.
    return NextResponse.json(JSON.parse(aiResponse));

  } catch (error) {
    console.error('Error in generate API route:', error);
    return NextResponse.json({ error: 'An internal server error occurred' }, { status: 500 });
  }
} 