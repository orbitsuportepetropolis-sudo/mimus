import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
)

const ASAAS_API_KEY = process.env.ASAAS_API_KEY || ''
const IS_SANDBOX = process.env.NEXT_PUBLIC_ASAAS_ENV !== 'production'
const ASAAS_URL = IS_SANDBOX ? 'https://sandbox.asaas.com/api/v3' : 'https://api.asaas.com/v3'

export async function POST(request: Request) {
  try {
    const { storeId, email, name, paymentMethod, cpfCnpj, phone, usePromo, creditCard } = await request.json()

    if (!storeId || !email || !name || !paymentMethod || !cpfCnpj) {
      return NextResponse.json({ error: 'Parâmetros obrigatórios ausentes.' }, { status: 400 })
    }

    const price = usePromo ? 39.00 : 49.00

    // MOCK MODE: If no Asaas API Key is configured, run simulated checkout
    if (!ASAAS_API_KEY || ASAAS_API_KEY === 'mock') {
      console.log('Running checkout in MOCK mode...')
      
      // Simulate slow response
      await new Promise(resolve => setTimeout(resolve, 1500))

      const mockSubId = 'sub_mock_' + Math.random().toString(36).substr(2, 9)
      const mockCustId = 'cus_mock_' + Math.random().toString(36).substr(2, 9)

      // Calculate promotional ends date if applicable (6 months from now)
      const promoEndsAt = usePromo ? new Date(Date.now() + 6 * 30 * 24 * 60 * 60 * 1000).toISOString() : null
      const subscriptionEndsAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()

      // Update store in database
      const { error: updateError } = await supabaseAdmin
        .from('stores')
        .update({
          plan: 'pro',
          plan_status: 'active',
          promotional_ends_at: promoEndsAt,
          asaas_customer_id: mockCustId,
          asaas_subscription_id: mockSubId,
          subscription_ends_at: subscriptionEndsAt
        })
        .eq('id', storeId)

      if (updateError) throw updateError

      if (paymentMethod === 'PIX') {
        const mockPixKey = `00020126580014br.gov.bcb.pix0136mimuspay-${price}-mock-subscription-620705033906304CA38`
        return NextResponse.json({
          success: true,
          mock: true,
          subscriptionId: mockSubId,
          billingType: 'PIX',
          pixCopyPaste: mockPixKey,
          pixQrCodeBase64: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="150" height="150"><rect width="150" height="150" fill="white"/><rect x="15" y="15" width="40" height="40" fill="%23b5127b"/><rect x="25" y="25" width="20" height="20" fill="white"/><rect x="95" y="15" width="40" height="40" fill="%23b5127b"/><rect x="105" y="25" width="20" height="20" fill="white"/><rect x="15" y="95" width="40" height="40" fill="%23b5127b"/><rect x="25" y="105" width="20" height="20" fill="white"/><rect x="65" y="65" width="20" height="20" fill="%23b5127b"/></svg>'
        })
      }

      return NextResponse.json({
        success: true,
        mock: true,
        subscriptionId: mockSubId,
        billingType: 'CREDIT_CARD'
      })
    }

    // REAL ASAAS INTEGRATION MODE
    console.log('Running checkout in REAL ASAAS mode...')

    // 1. Create or Find Customer in Asaas
    const customerResponse = await fetch(`${ASAAS_URL}/customers`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'access_token': ASAAS_API_KEY
      },
      body: JSON.stringify({
        name,
        email,
        cpfCnpj,
        phone: phone || undefined
      })
    })

    const customerData = await customerResponse.json()
    if (!customerResponse.ok) {
      throw new Error(customerData.errors?.[0]?.description || 'Erro ao criar cliente no Asaas.')
    }

    const asaasCustomerId = customerData.id

    // 2. Create Subscription in Asaas
    // First due date will be tomorrow (since Next.js trial runs locally, 
    // but in Asaas we need a real date, let's set it to 1 day from now)
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    const nextDueDate = tomorrow.toISOString().split('T')[0]

    const subscriptionPayload: any = {
      customer: asaasCustomerId,
      billingType: paymentMethod, // 'PIX' or 'CREDIT_CARD'
      value: price,
      nextDueDate,
      cycle: 'MONTHLY',
      description: `Assinatura Mimus Pro - ${name}`
    }

    if (paymentMethod === 'CREDIT_CARD' && creditCard) {
      subscriptionPayload.creditCard = {
        holderName: creditCard.holderName,
        number: creditCard.number,
        expiryMonth: creditCard.expiryMonth,
        expiryYear: creditCard.expiryYear,
        ccv: creditCard.ccv
      }
      subscriptionPayload.creditCardHolderInfo = {
        name,
        email,
        cpfCnpj,
        postalCode: creditCard.postalCode || '01001-000',
        addressNumber: creditCard.addressNumber || '1',
        phone: phone || '11999999999'
      }
    }

    const subscriptionResponse = await fetch(`${ASAAS_URL}/subscriptions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'access_token': ASAAS_API_KEY
      },
      body: JSON.stringify(subscriptionPayload)
    })

    const subscriptionData = await subscriptionResponse.json()
    if (!subscriptionResponse.ok) {
      throw new Error(subscriptionData.errors?.[0]?.description || 'Erro ao criar assinatura no Asaas.')
    }

    const asaasSubscriptionId = subscriptionData.id

    // Calculate dates
    const promoEndsAt = usePromo ? new Date(Date.now() + 6 * 30 * 24 * 60 * 60 * 1000).toISOString() : null
    const subscriptionEndsAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()

    // Update Supabase Store status
    const { error: dbError } = await supabaseAdmin
      .from('stores')
      .update({
        plan: 'pro',
        plan_status: paymentMethod === 'CREDIT_CARD' ? 'active' : 'pending',
        promotional_ends_at: promoEndsAt,
        asaas_customer_id: asaasCustomerId,
        asaas_subscription_id: asaasSubscriptionId,
        subscription_ends_at: subscriptionEndsAt
      })
      .eq('id', storeId)

    if (dbError) throw dbError

    // 3. For PIX, fetch the payment QR Code
    if (paymentMethod === 'PIX') {
      // Fetch payments for this subscription to get the first one
      const paymentsResponse = await fetch(`${ASAAS_URL}/subscriptions/${asaasSubscriptionId}/payments`, {
        headers: { 'access_token': ASAAS_API_KEY }
      })
      const paymentsData = await paymentsResponse.json()
      const firstPaymentId = paymentsData.data?.[0]?.id

      if (firstPaymentId) {
        // Fetch QR Code details
        const qrCodeResponse = await fetch(`${ASAAS_URL}/payments/${firstPaymentId}/pixQrCode`, {
          headers: { 'access_token': ASAAS_API_KEY }
        })
        const qrCodeData = await qrCodeResponse.json()

        return NextResponse.json({
          success: true,
          subscriptionId: asaasSubscriptionId,
          billingType: 'PIX',
          pixCopyPaste: qrCodeData.payload,
          pixQrCodeBase64: `data:image/png;base64,${qrCodeData.encodedImage}`
        })
      }
    }

    return NextResponse.json({
      success: true,
      subscriptionId: asaasSubscriptionId,
      billingType: paymentMethod
    })

  } catch (err: any) {
    console.error('Checkout API Error:', err)
    return NextResponse.json({ error: err.message || 'Erro interno no servidor' }, { status: 500 })
  }
}
