import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { amount, currency = 'INR', receipt, notes } = await req.json()
    const KEY_ID = Deno.env.get('RAZORPAY_KEY_ID') || Deno.env.get('VITE_RAZORPAY_KEY_ID')
    const KEY_SECRET = Deno.env.get('RAZORPAY_KEY_SECRET') || Deno.env.get('VITE_RAZORPAY_KEY_SECRET')

    if (!KEY_ID || !KEY_SECRET) {
      throw new Error('Razorpay credentials (RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET) are missing from Edge Function environment.')
    }

    if (!amount || amount <= 0) {
      throw new Error('Invalid amount provided.')
    }

    // Call Razorpay Orders API
    const authString = btoa(`${KEY_ID}:${KEY_SECRET}`)
    const response = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${authString}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount: Math.round(amount), // paise
        currency,
        receipt: receipt || `rcpt_${Date.now()}`,
        notes: notes || {},
      }),
    })

    const data = await response.json()

    if (!response.ok) {
      console.error('Razorpay order creation error:', data)
      return new Response(
        JSON.stringify({ error: data.error?.description || 'Failed to create Razorpay order' }),
        { status: response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error: any) {
    console.error('Edge Function error:', error.message)
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    )
  }
})
