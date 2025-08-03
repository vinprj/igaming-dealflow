
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { listingId, sellerId, buyerId, amount } = await req.json()

    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Get Stripe secret key
    const stripeKey = Deno.env.get('STRIPE_SECRET_KEY')
    if (!stripeKey) {
      throw new Error('Stripe secret key not configured')
    }

    // Create or get Stripe customer
    let stripeCustomerId: string
    const { data: existingCustomer } = await supabase
      .from('stripe_customers')
      .select('stripe_customer_id')
      .eq('user_id', buyerId)
      .single()

    if (existingCustomer) {
      stripeCustomerId = existingCustomer.stripe_customer_id
    } else {
      // Get user details
      const { data: user } = await supabase
        .from('users')
        .select('email, first_name, last_name')
        .eq('id', buyerId)
        .single()

      // Create Stripe customer
      const customerResponse = await fetch('https://api.stripe.com/v1/customers', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${stripeKey}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          email: user?.email || '',
          name: `${user?.first_name || ''} ${user?.last_name || ''}`.trim(),
        }),
      })

      const customer = await customerResponse.json()
      stripeCustomerId = customer.id

      // Save customer to database
      await supabase
        .from('stripe_customers')
        .insert({
          user_id: buyerId,
          stripe_customer_id: stripeCustomerId,
        })
    }

    // Create escrow record
    const { data: escrow, error: escrowError } = await supabase
      .from('escrow')
      .insert({
        listing_id: listingId,
        buyer_id: buyerId,
        seller_id: sellerId,
        amount,
        status: 'initiated',
        stripe_customer_id: stripeCustomerId,
      })
      .select()
      .single()

    if (escrowError) throw escrowError

    // Create Stripe Checkout Session
    const sessionResponse = await fetch('https://api.stripe.com/v1/checkout/sessions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${stripeKey}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        customer: stripeCustomerId,
        'payment_method_types[]': 'card',
        'line_items[0][price_data][currency]': 'usd',
        'line_items[0][price_data][unit_amount]': (amount * 100).toString(),
        'line_items[0][price_data][product_data][name]': 'iGaming Asset Purchase',
        'line_items[0][quantity]': '1',
        mode: 'payment',
        success_url: `${req.headers.get('origin')}/transactions?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${req.headers.get('origin')}/browse`,
        'metadata[escrow_id]': escrow.id,
        'metadata[listing_id]': listingId,
      }),
    })

    const session = await sessionResponse.json()

    if (!session.url) {
      throw new Error('Failed to create checkout session')
    }

    // Update escrow with payment intent ID
    await supabase
      .from('escrow')
      .update({ 
        stripe_payment_intent_id: session.payment_intent,
      })
      .eq('id', escrow.id)

    return new Response(
      JSON.stringify({ url: session.url, escrowId: escrow.id }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )

  } catch (error) {
    console.error('Error creating payment:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})
