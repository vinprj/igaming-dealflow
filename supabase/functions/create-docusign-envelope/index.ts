
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
    const { listingId, buyerId } = await req.json()

    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Get DocuSign credentials
    const docusignKey = Deno.env.get('DOCUSIGN_INTEGRATION_KEY')
    const docusignSecret = Deno.env.get('DOCUSIGN_SECRET_KEY')
    const docusignUserId = Deno.env.get('DOCUSIGN_USER_ID')
    
    if (!docusignKey || !docusignSecret || !docusignUserId) {
      throw new Error('DocuSign credentials not configured')
    }

    // Get listing and user details
    const { data: listing } = await supabase
      .from('listings')
      .select('*, users!seller_id(*)')
      .eq('id', listingId)
      .single()

    const { data: buyer } = await supabase
      .from('users')
      .select('*')
      .eq('id', buyerId)
      .single()

    if (!listing || !buyer) {
      throw new Error('Listing or buyer not found')
    }

    // Create a simple envelope for demo purposes
    // In production, you would integrate with actual DocuSign API
    const envelopeId = `envelope_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    // Create envelope record in database
    const { data: envelope, error: envelopeError } = await supabase
      .from('docusign_envelopes')
      .insert({
        envelope_id: envelopeId,
        listing_id: listingId,
        buyer_id: buyerId,
        seller_id: listing.seller_id,
        status: 'sent',
        document_type: 'purchase_agreement',
        signing_url_buyer: `https://demo.docusign.net/signing/${envelopeId}/buyer`,
        signing_url_seller: `https://demo.docusign.net/signing/${envelopeId}/seller`,
      })
      .select()
      .single()

    if (envelopeError) throw envelopeError

    // Create notifications for both parties
    await supabase.rpc('create_notification', {
      p_user_id: buyerId,
      p_type: 'document_ready',
      p_title: 'Document Ready for Signing',
      p_content: `Purchase agreement for "${listing.title}" is ready for your signature.`,
      p_related_id: envelope.id,
    })

    await supabase.rpc('create_notification', {
      p_user_id: listing.seller_id,
      p_type: 'document_ready',
      p_title: 'Document Ready for Signing',
      p_content: `Purchase agreement for "${listing.title}" is ready for your signature.`,
      p_related_id: envelope.id,
    })

    return new Response(
      JSON.stringify({ envelope }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )

  } catch (error) {
    console.error('Error creating DocuSign envelope:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})
