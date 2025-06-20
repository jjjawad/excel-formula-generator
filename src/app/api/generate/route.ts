import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

// Initialize the OpenAI client with the API key from environment variables
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Create a Supabase client with the service role key for admin-level access
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const USAGE_LIMIT = 10;

export async function POST(req: Request) {
  try {
    // 1. Extract the user's prompt from the request body
    const { userPrompt } = await req.json();

    if (!userPrompt) {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
    }

    // 1. Get the user's session from the request cookies
    const cookieStore = await cookies();
    const token = cookieStore.get('sb-access-token')?.value; // This is an example, cookie name might differ

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized: No session found' }, { status: 401 });
    }

    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token);

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized: Invalid token' }, { status: 401 });
    }

    // 2. Check the user's current usage
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('usage_count, plan_type')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      console.error('Profile fetch error:', profileError);
      return NextResponse.json({ error: 'Could not retrieve user profile.' }, { status: 500 });
    }

    // 3. Enforce usage limit for free users
    if (profile.plan_type === 'free' && profile.usage_count >= USAGE_LIMIT) {
      return NextResponse.json({ error: `You have reached your limit of ${USAGE_LIMIT} free generations.` }, { status: 429 }); // 429: Too Many Requests
    }

    // 4. If usage is fine, proceed to call OpenAI
    const systemPrompt = `
      You are an expert in Excel and Google Sheets formulas.
      Your task is to take a user's natural language request and return ONLY a JSON object with two keys: "formula" and "explanation".
      - The "formula" should be the most appropriate and robust formula for the user's request.
      - The "explanation" should be a clear, concise, and easy-to-understand description of how the formula works.
      - Do not include any other text, greetings, or introductory phrases in your response. Just the JSON object.
    `;

    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      response_format: { type: 'json_object' },
    });
    
    const aiResponse = completion.choices[0].message.content;

    if (!aiResponse) {
      return NextResponse.json({ error: 'Failed to get response from AI' }, { status: 500 });
    }

    // 5. If OpenAI call is successful, increment usage count
    if (profile.plan_type === 'free') {
      const { error: updateError } = await supabaseAdmin
        .from('profiles')
        .update({ usage_count: profile.usage_count + 1 })
        .eq('id', user.id);
      
      if (updateError) {
        console.error('Failed to update usage count:', updateError);
        // Don't block the user, but log the error.
      }
    }

    // 6. Return the successful response
    return NextResponse.json(JSON.parse(aiResponse));

  } catch (error) {
    console.error('Error in generate API route:', error);
    return NextResponse.json({ error: 'An internal server error occurred' }, { status: 500 });
  }
} 