import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

export async function handler(req: Request) {
  // Configurar headers CORS
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  }

  // Lidar com requests OPTIONS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const {
      streamId,
      amount,
      donorName,
      donorEmail,
      message,
      paymentMethod,
      isAnonymous,
    } = await req.json()

    if (!streamId || !amount || !donorName) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL') || ''
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
    
    if (!supabaseUrl || !supabaseKey) {
        throw new Error('Missing Supabase environment variables');
    }

    const supabase = createClient(supabaseUrl, supabaseKey)

    // Get authenticated user (optional, doação pode ser anônima)
    const authHeader = req.headers.get('Authorization') || ''
    const token = authHeader.replace('Bearer ', '')
    let authUserId = null;

    if (token) {
        const { data: { user }, error: userError } = await supabase.auth.getUser(token)
        if (user) {
            authUserId = user.id;
        }
    }

    // Buscar stream para obter o streamer_id
    const { data: streamData, error: streamError } = await supabase
      .from('streams')
      .select('user_id')
      .eq('id', streamId)
      .single()

    if (streamError || !streamData) {
        return new Response(JSON.stringify({ error: 'Stream not found' }), { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    // Create donation record
    const amountInCents = Math.round(amount * 100)

    const { data: donation, error: donationError } = await supabase
      .from('donations')
      .insert({
        stream_id: streamId,
        streamer_id: streamData.user_id,
        donor_user_id: authUserId,
        donor_name: isAnonymous ? 'Anônimo' : donorName,
        donor_email: donorEmail,
        amount: amount,
        message: message,
        payment_method: paymentMethod,
        payment_status: 'pending',
      })
      .select()
      .single()

    if (donationError) {
      throw donationError
    }

    // Create payment via Mercado Pago
    if (paymentMethod === 'pix') {
      // Setup Mercado Pago
      const mpAccessToken = Deno.env.get('MERCADO_PAGO_ACCESS_TOKEN')
      
      if (!mpAccessToken) {
         throw new Error('Missing Mercado Pago access token');
      }

      // Create payment
      const paymentBody = {
        transaction_amount: amount,
        payment_method_id: 'pix',
        payer: {
          email: donorEmail || 'donor@anonymous.com',
          first_name: donorName,
        },
        description: `Doação StreamHub - ${streamId}`,
        external_reference: donation.id,
        notification_url: `${Deno.env.get('SITE_URL') || supabaseUrl}/functions/v1/webhooks/mercado-pago`,
      }

      const paymentRes = await fetch('https://api.mercadopago.com/v1/payments', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${mpAccessToken}`,
          'Content-Type': 'application/json',
          'X-Idempotency-Key': donation.id
        },
        body: JSON.stringify(paymentBody),
      })

      const paymentData = await paymentRes.json()
      
      if (!paymentRes.ok) {
          console.error("Mercado Pago error:", paymentData);
          throw new Error('Failed to create Mercado Pago payment');
      }

      // Update donation with payment info
      await supabase
        .from('donations')
        .update({
          payment_id: paymentData.id.toString(),
          payment_status: paymentData.status,
        })
        .eq('id', donation.id)

      return new Response(
        JSON.stringify({
          donationId: donation.id,
          paymentId: paymentData.id,
          qrCode: paymentData.point_of_interaction?.qr_code,
          qrCodeBase64: paymentData.point_of_interaction?.qr_code_base64,
          status: paymentData.status,
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({ error: 'Payment method not supported' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Failed to create donation' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
}

// Para usar com o Deno Deploy
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
serve(handler)
