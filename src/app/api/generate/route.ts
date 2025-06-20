import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers';

// Initialize the OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const USAGE_LIMIT = 10;

export async function POST(req: Request) {
  const cookieStore = await cookies();

  // Create a Supabase client configured to use cookies. This is the modern way to handle auth in API routes.
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
      },
    }
  );

  try {
    // 1. Get the user's session from the Supabase client
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();

    if (sessionError || !session) {
      return NextResponse.json({ error: 'Unauthorized: Could not get session' }, { status: 401 });
    }

    const user = session.user;

    // We still need an admin client to bypass RLS and update usage counts
    const supabaseAdmin = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        {
          cookies: {
            get(name: string) {
              return cookieStore.get(name)?.value
            },
          },
        }
    );

    // 2. Check the user's current usage from the 'profiles' table
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
      return NextResponse.json({ error: `You have reached your limit of ${USAGE_LIMIT} free generations.` }, { status: 429 });
    }
    
    // 4. Get the user's prompt from the request body
    const { userPrompt } = await req.json();
    if (!userPrompt) {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
    }

    // 5. If usage is fine, proceed to call OpenAI
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

    // 6. If OpenAI call is successful, increment usage count
    if (profile.plan_type === 'free') {
      const { error: updateError } = await supabaseAdmin
        .from('profiles')
        .update({ usage_count: profile.usage_count + 1 })
        .eq('id', user.id);
      
      if (updateError) {
        console.error('Failed to update usage count:', updateError);
      }
    }

    // 7. Return the successful response
    return NextResponse.json(JSON.parse(aiResponse));

  } catch (error) {
    console.error('Error in generate API route:', error);
    return NextResponse.json({ error: 'An internal server error occurred' }, { status: 500 });
  }
} 