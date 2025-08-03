
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
    const { escrowId } = await req.json()

    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Get escrow details
    const { data: escrow, error: escrowError } = await supabase
      .from('escrow')
      .select(`
        *,
        docusign_envelopes (
          status
        )
      `)
      .eq('id', escrowId)
      .single()

    if (escrowError || !escrow) {
      throw new Error('Escrow transaction not found')
    }

    // Check if DocuSign envelope is completed
    if (!escrow.docusign_envelopes || escrow.docusign_envelopes.status !== 'completed') {
      throw new Error('Purchase agreement must be signed before releasing funds')
    }

    // Update escrow status to completed
    const { error: updateError } = await supabase
      .from('escrow')
      .update({
        status: 'completed',
        completion_date: new Date().toISOString(),
      })
      .eq('id', escrowId)

    if (updateError) throw updateError

    // In a real implementation, you would:
    // 1. Transfer funds from escrow to seller via Stripe
    // 2. Update payment status
    // 3. Send completion notifications

    // Create completion notifications
    await supabase.rpc('create_notification', {
      p_user_id: escrow.buyer_id,
      p_type: 'transaction_completed',
      p_title: 'Transaction Completed',
      p_content: 'Your purchase has been completed and funds have been released.',
      p_related_id: escrowId,
    })

    await supabase.rpc('create_notification', {
      p_user_id: escrow.seller_id,
      p_type: 'transaction_completed',
      p_title: 'Payment Received',
      p_content: 'Funds have been released from escrow to your account.',
      p_related_id: escrowId,
    })

    return new Response(
      JSON.stringify({ success: true }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )

  } catch (error) {
    console.error('Error completing escrow:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})
