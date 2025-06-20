import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import Stripe from 'stripe';
import { stripe } from '@/lib/stripe';
import { createClient } from '@supabase/supabase-js';

// This is the admin client that can bypass RLS
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  const body = await req.text();
  const signature = (await headers()).get('Stripe-Signature') as string;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err: any) {
    console.error(`Webhook signature verification failed: ${err.message}`);
    return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 });
  }

  // Handle the checkout.session.completed event
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;
    const userId = session.metadata?.user_id;

    if (!userId) {
      console.error('Webhook Error: No user_id in metadata');
      return NextResponse.json({ error: 'Webhook Error: No user_id in metadata' }, { status: 400 });
    }

    console.log(`Received successful payment for user: ${userId}`);

    // Update the user's profile to the 'pro' plan
    const { error } = await supabaseAdmin
      .from('profiles')
      .update({ plan_type: 'pro' })
      .eq('id', userId);
    
    if (error) {
      console.error('Error updating user plan:', error);
      return NextResponse.json({ error: 'Database error while updating plan' }, { status: 500 });
    }

    console.log(`User ${userId} successfully upgraded to Pro plan.`);
  }

  return NextResponse.json({ received: true });
} 