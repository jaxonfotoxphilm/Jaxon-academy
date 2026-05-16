import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import Stripe from 'npm:stripe';
import { createClient } from 'jsr:@supabase/supabase-js@2';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') ?? '', {
  apiVersion: '2023-10-16',
  httpClient: Stripe.createFetchHttpClient(),
});

const cryptoProvider = Stripe.createSubtleCryptoProvider();

Deno.serve(async (req) => {
  const signature = req.headers.get('Stripe-Signature');
  if (!signature) {
    return new Response('No signature', { status: 400 });
  }

  try {
    const body = await req.text();
    const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET');
    let event;

    try {
      event = await stripe.webhooks.constructEventAsync(
        body,
        signature,
        webhookSecret!,
        undefined,
        cryptoProvider
      );
    } catch (err) {
      console.error(`Webhook signature verification failed: ${err.message}`);
      return new Response(`Webhook Error: ${err.message}`, { status: 400 });
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    switch (event.type) {
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        
        // Fetch the account ID via the stripe_customer_id
        const { data: account } = await supabaseAdmin
          .from('accounts')
          .select('id')
          .eq('stripe_customer_id', subscription.customer)
          .single();

        if (account) {
          await supabaseAdmin
            .from('subscriptions')
            .upsert({
              id: subscription.id,
              account_id: account.id,
              status: subscription.status,
              price_id: subscription.items.data[0].price.id,
              current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
            });
        }
        break;
      }
    }

    return new Response(JSON.stringify({ received: true }), { status: 200 });
  } catch (error) {
    console.error('Webhook processing error:', error);
    return new Response(JSON.stringify({ error: error.message }), { status: 400 });
  }
});
