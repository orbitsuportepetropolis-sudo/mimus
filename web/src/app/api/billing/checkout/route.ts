import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

let supabaseAdminInstance: any = null
function getSupabaseAdmin() {
  if (!supabaseAdminInstance) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    if (!url || !key) {
      throw new Error('Supabase URL or Key is missing from environment variables.')
    }
    supabaseAdminInstance = createClient(url, key)
  }
  return supabaseAdminInstance
}

const ASAAS_API_KEY = process.env.ASAAS_API_KEY || ''
const ASAAS_ENV = process.env.NEXT_PUBLIC_ASAAS_ENV || 'sandbox'
const ASAAS_BASE_URL = ASAAS_ENV === 'production'
  ? 'https://api.asaas.com/v3'
  : 'https://sandbox.asaas.com/v3'

// Helper for robust Asaas API fetching and error parsing
async function asaasFetch(url: string, apiKey: string, options: RequestInit = {}) {
  const response = await fetch(url, {
    ...options,
    headers: {
      ...options.headers,
      'access_token': apiKey
    }
  })
  const text = await response.text()
  let data: any
  try {
    data = JSON.parse(text)
  } catch (err) {
    throw new Error(`Asaas API returned non-JSON response (Status ${response.status}): ${text.substring(0, 200)}`)
  }
  if (!response.ok) {
    throw new Error(data.errors?.[0]?.description || `Asaas API error (Status ${response.status})`)
  }
  return data
}

export async function POST(request: Request) {
  try {
    const { storeId, email, name, paymentMethod, cpfCnpj, phone, usePromo, creditCard } = await request.json()

    if (!storeId || !email || !name || !paymentMethod || !cpfCnpj) {
      return NextResponse.json({ error: 'Parâmetros obrigatórios ausentes.' }, { status: 400 })
    }

    const price = 49.00
    const supabaseAdmin = getSupabaseAdmin()

    // MOCK MODE: If no Asaas API Key is configured, run simulated checkout
    const isMock = !ASAAS_API_KEY || ASAAS_API_KEY === 'sua_chave_do_asaas_aqui' || ASAAS_API_KEY.startsWith('seu_')
    if (isMock) {
      console.log('Running checkout in MOCK mode...')
      
      // Simulate slow response
      await new Promise(resolve => setTimeout(resolve, 1500))

      const mockSubId = 'asaas_sub_mock_' + Math.random().toString(36).substr(2, 9)
      const mockCustId = 'asaas_cus_mock_' + Math.random().toString(36).substr(2, 9)

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

    // 1. Search if customer already exists by CPF/CNPJ
    let customerId = ''
    const cleanCpfCnpj = cpfCnpj.replace(/\D/g, '')
    const searchUrl = `${ASAAS_BASE_URL}/customers?cpfCnpj=${cleanCpfCnpj}`
    
    const searchData = await asaasFetch(searchUrl, ASAAS_API_KEY, {
      method: 'GET'
    })

    if (searchData.data && searchData.data.length > 0) {
      customerId = searchData.data[0].id
      console.log(`Found existing Asaas customer: ${customerId}`)
    } else {
      // Create customer in Asaas
      console.log('Customer not found. Creating new customer in Asaas...')
      const createCustomerUrl = `${ASAAS_BASE_URL}/customers`
      const customerPayload = {
        name,
        email,
        cpfCnpj: cleanCpfCnpj,
        mobilePhone: phone || undefined
      }

      const customerData = await asaasFetch(createCustomerUrl, ASAAS_API_KEY, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(customerPayload)
      })

      customerId = customerData.id
      console.log(`Created new Asaas customer: ${customerId}`)
    }

    // 2. Create monthly subscription in Asaas
    const todayStr = new Date().toISOString().split('T')[0]
    const subscriptionPayload: any = {
      customer: customerId,
      billingType: paymentMethod, // 'PIX' or 'CREDIT_CARD'
      value: price,
      nextDueDate: todayStr,
      cycle: 'MONTHLY',
      description: 'Assinatura Mimus Pro'
    }

    if (paymentMethod === 'CREDIT_CARD' && creditCard) {
      const expiryYearFull = String(creditCard.expiryYear).length === 2
        ? '20' + creditCard.expiryYear
        : creditCard.expiryYear

      subscriptionPayload.creditCard = {
        holderName: creditCard.holderName,
        number: creditCard.number,
        expiryMonth: creditCard.expiryMonth,
        expiryYear: expiryYearFull,
        ccv: creditCard.ccv
      }

      subscriptionPayload.creditCardHolderInfo = {
        name: creditCard.holderName,
        email,
        cpfCnpj: cleanCpfCnpj,
        postalCode: '25620000', // Petrópolis placeholder CEP
        addressNumber: '100',
        phone: phone || '24999999999'
      }
    }

    console.log('Creating monthly subscription in Asaas...')
    const createSubUrl = `${ASAAS_BASE_URL}/subscriptions`
    const subData = await asaasFetch(createSubUrl, ASAAS_API_KEY, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(subscriptionPayload)
    })

    const subscriptionId = subData.id
    console.log(`Successfully created Asaas subscription: ${subscriptionId}`)

    // 3. Save details to database
    const promoEndsAt = usePromo ? new Date(Date.now() + 6 * 30 * 24 * 60 * 60 * 1000).toISOString() : null
    const subscriptionEndsAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()

    const { error: dbError } = await supabaseAdmin
      .from('stores')
      .update({
        plan: paymentMethod === 'CREDIT_CARD' ? 'pro' : 'free',
        plan_status: paymentMethod === 'CREDIT_CARD' ? 'active' : 'pending',
        promotional_ends_at: promoEndsAt,
        asaas_customer_id: customerId,
        asaas_subscription_id: subscriptionId,
        subscription_ends_at: subscriptionEndsAt
      })
      .eq('id', storeId)

    if (dbError) throw dbError

    // 4. Return response
    if (paymentMethod === 'PIX') {
      console.log('Retrieving Pix details for subscription...')
      // Wait for Asaas to generate the first charge
      await new Promise(resolve => setTimeout(resolve, 1500))

      const paymentsUrl = `${ASAAS_BASE_URL}/payments?subscription=${subscriptionId}`
      const paymentsData = await asaasFetch(paymentsUrl, ASAAS_API_KEY, {
        method: 'GET'
      })
      const firstPayment = paymentsData.data?.[0]
      if (!firstPayment) {
        throw new Error('Cobrança da assinatura não gerada pelo Asaas.')
      }

      const paymentId = firstPayment.id

      // Get Pix QR Code
      const pixUrl = `${ASAAS_BASE_URL}/payments/${paymentId}/pixQrCode`
      const pixData = await asaasFetch(pixUrl, ASAAS_API_KEY, {
        method: 'GET'
      })

      return NextResponse.json({
        success: true,
        subscriptionId: subscriptionId,
        billingType: 'PIX',
        pixCopyPaste: pixData.payload,
        pixQrCodeBase64: `data:image/png;base64,${pixData.encodedImage}`
      })
    }

    return NextResponse.json({
      success: true,
      subscriptionId: subscriptionId,
      billingType: 'CREDIT_CARD'
    })

  } catch (err: any) {
    console.error('Checkout API Error:', err)
    return NextResponse.json({ error: err.message || 'Erro interno no servidor' }, { status: 500 })
  }
}
