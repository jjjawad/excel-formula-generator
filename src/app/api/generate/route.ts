import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const FREE_LIMIT = 5; // We use this limit for logged-in free users

export async function POST(req: Request) {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { get(name: string) { return cookieStore.get(name)?.value } } }
  );

  try {
    const { data: { session } } = await supabase.auth.getSession();

    // If a user session exists, perform checks and increment usage
    if (session) {
      const user = session.user;

      // Use admin client to bypass RLS for usage checks/updates
      const supabaseAdmin = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        { cookies: { get(name: string) { return cookieStore.get(name)?.value } } }
      );

      const { data: profile, error: profileError } = await supabaseAdmin
        .from('profiles')
        .select('usage_count, plan_type')
        .eq('id', user.id)
        .single();

      if (profileError) throw new Error('Could not retrieve user profile.');

      if (profile.plan_type === 'free' && profile.usage_count >= FREE_LIMIT) {
        return NextResponse.json({ error: `You have reached your limit of ${FREE_LIMIT} free generations.` }, { status: 429 });
      }

      // If checks pass, increment usage count for free users
      if (profile.plan_type === 'free') {
        await supabaseAdmin
          .from('profiles')
          .update({ usage_count: profile.usage_count + 1 })
          .eq('id', user.id);
      }
    }
    // If no session, it's a guest. The frontend has already checked their local credits. We proceed.
    
    // --- Common logic for both guests and users ---

    const { userPrompt } = await req.json();
    if (!userPrompt) {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
    }

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

    return NextResponse.json(JSON.parse(aiResponse));

  } catch (error: any) {
    console.error('Error in generate API route:', error);
    return NextResponse.json({ error: error.message || 'An internal server error occurred' }, { status: 500 });
  }
} 