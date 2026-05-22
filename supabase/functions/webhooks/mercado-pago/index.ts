import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

export async function handler(req: Request) {
  try {
    // Mercado Pago envia o webhook como POST com detalhes da notificação no corpo,
    // ou via GET dependendo da configuração. Vamos assumir a estrutura recomendada do webhook.
    const url = new URL(req.url)
    
    // Obter dados da query params ou body dependendo de como o webhook foi enviado
    let action = url.searchParams.get('action') || url.searchParams.get('topic')
    let paymentId = url.searchParams.get('data.id') || url.searchParams.get('id')

    // Tentar ler do corpo se for um POST
    if (req.method === 'POST') {
      try {
        const body = await req.json()
        if (body.action) action = body.action
        if (body.type === 'payment' && body.data?.id) {
          paymentId = body.data.id
        }
      } catch (e) {
        // Body pode não ser JSON
      }
    }

    if (!paymentId) {
      return new Response('No payment ID provided', { status: 400 })
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL') || ''
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''

    if (!supabaseUrl || !supabaseKey) {
        throw new Error('Missing Supabase environment variables');
    }

    const supabase = createClient(supabaseUrl, supabaseKey)

    // Get payment details from Mercado Pago
    const mpAccessToken = Deno.env.get('MERCADO_PAGO_ACCESS_TOKEN')
    
    if (!mpAccessToken) {
        throw new Error('Missing Mercado Pago access token');
    }

    const paymentRes = await fetch(
      `https://api.mercadopago.com/v1/payments/${paymentId}`,
      {
        headers: {
          Authorization: `Bearer ${mpAccessToken}`,
        },
      }
    )

    if (!paymentRes.ok) {
        throw new Error('Failed to fetch payment details from Mercado Pago')
    }

    const paymentData = await paymentRes.json()

    // Get donation by payment ID (External reference é o nosso donation_id)
    const externalReference = paymentData.external_reference;
    
    if (!externalReference) {
        return new Response('No external_reference found in payment', { status: 400 })
    }

    const { data: donation, error: donationError } = await supabase
      .from('donations')
      .select('*')
      .eq('id', externalReference)
      .single()

    if (donationError || !donation) {
      console.error('Donation not found', donationError)
      return new Response('Donation not found', { status: 404 })
    }

    // Update donation status
    const newStatus = paymentData.status === 'approved' ? 'completed' : paymentData.status

    if (donation.payment_status === newStatus) {
        // Já atualizado
        return new Response(JSON.stringify({ success: true, message: 'Already updated' }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
        });
    }

    const { error: updateError } = await supabase
      .from('donations')
      .update({
        payment_status: newStatus,
        paid_at: newStatus === 'completed' ? new Date().toISOString() : null,
      })
      .eq('id', donation.id)

    if (updateError) {
      throw updateError
    }

    // If payment approved, send notification
    if (newStatus === 'completed') {
      // Broadcast notification will be handled automatically by Supabase Realtime
      // if clients are subscribed to changes on the `donations` table.

      // Calculate streamer payout
      const platformFeePercent = 10 // 10%
      const gatewayFee = (donation.amount * 0.0099) // Taxa PIX Mercado Pago aproximada 0.99% ou fixa
      const platformFee = (donation.amount * platformFeePercent) / 100
      const streamerAmount = donation.amount - gatewayFee - platformFee

      await supabase
        .from('donations')
        .update({
          streamer_amount: streamerAmount,
          platform_fee: platformFee,
          gateway_fee: gatewayFee,
        })
        .eq('id', donation.id)

      // Atualizar saldo do streamer (opcional, dependendo de como gerenciamos o saldo)
      // await supabase.rpc('add_to_streamer_balance', { ... })
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('Webhook error:', error)
    return new Response(
      JSON.stringify({ error: 'Webhook processing failed' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
}

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
serve(handler)
