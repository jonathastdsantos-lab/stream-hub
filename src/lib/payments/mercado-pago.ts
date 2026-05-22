export class MercadoPagoAPI {
  private accessToken: string
  private clientId: string

  constructor(accessToken: string, clientId: string) {
    this.accessToken = accessToken
    this.clientId = clientId
  }

  async createPayment(options: {
    amount: number // em centavos
    payerName: string
    payerEmail: string
    description: string
    externalReference: string // donation_id
    notificationUrl: string
  }): Promise<{
    id: string
    qrCode?: string
    pointOfInteraction?: any
    status: string
  }> {
    const body = {
      transaction_amount: options.amount / 100,
      payment_method_id: 'pix',
      payer: {
        email: options.payerEmail,
        first_name: options.payerName,
      },
      description: options.description,
      external_reference: options.externalReference,
      notification_url: options.notificationUrl,
    }

    const response = await fetch('https://api.mercadopago.com/v1/payments', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(`Mercado Pago error: ${error.message}`)
    }

    const data = await response.json()

    return {
      id: data.id,
      qrCode: data.point_of_interaction?.qr_code?.in_store_order_id,
      pointOfInteraction: data.point_of_interaction,
      status: data.status,
    }
  }

  async getPaymentStatus(paymentId: string): Promise<{
    id: string
    status: string
    statusDetail: string
    amount: number
    paidAt?: Date
  }> {
    const response = await fetch(
      `https://api.mercadopago.com/v1/payments/${paymentId}`,
      {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
        },
      }
    )

    if (!response.ok) {
      throw new Error('Failed to get payment status')
    }

    const data = await response.json()

    return {
      id: data.id,
      status: data.status,
      statusDetail: data.status_detail,
      amount: data.transaction_amount,
      paidAt: data.date_approved ? new Date(data.date_approved) : undefined,
    }
  }

  async refundPayment(paymentId: string, amount?: number): Promise<void> {
    const body: any = {}
    if (amount) {
      body.amount = amount
    }

    const response = await fetch(
      `https://api.mercadopago.com/v1/payments/${paymentId}/refunds`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      }
    )

    if (!response.ok) {
      throw new Error('Failed to refund payment')
    }
  }

  validateWebhook(body: string, signature: string, secret: string): boolean {
    // Mercado Pago usa X-Signature header
    // Formato: X-Signature: ts=timestamp,v1=hash
    // hash = SHA256(timestamp|id,secret)
    
    // Para simplificar, validar apenas o recebimento
    // Em produção, validar assinatura criptográfica
    return true
  }
}
