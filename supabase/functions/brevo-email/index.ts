import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS Preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { template, payload } = await req.json()
    const BREVO_API_KEY = Deno.env.get('BREVO_API_KEY')

    if (!BREVO_API_KEY) {
      throw new Error("BREVO_API_KEY is missing from Edge Function secrets.")
    }

    // VRK Farms specific sender details
    let emailOptions: any = {
      sender: { name: "VRK Farms", email: "honey.salesplatform@gmail.com" }, // Verified Sender
      replyTo: { name: "VRK Farms", email: "honey.salesplatform@gmail.com" },
    }

    // Process intent-driven templates
    if (template === 'order_placed') {
      emailOptions.to = [{ email: payload.customerEmail, name: payload.customerName }]
      emailOptions.subject = `Your VRK Farms Order Confirmed #${payload.orderId}`
      emailOptions.htmlContent = `
        <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e5e5e5; border-radius: 10px;">
          <h2 style="color: #D4AF37;">Thank you for your order, ${payload.customerName}!</h2>
          <p>We've successfully received your order <strong>#${payload.orderId}</strong> for <strong>₹${payload.orderTotal}</strong>.</p>
          <p>The vault keepers are currently manifesting your items. You will receive another update once a delivery partner is assigned.</p>
          <br/>
          <p style="color: #666; font-size: 12px;">VRK Farms Raw Collection<br/>Track your order on the website dashboard.</p>
        </div>
      `
    } else if (template === 'delivery_assigned') {
      emailOptions.to = [{ email: payload.customerEmail, name: payload.customerName }]
      emailOptions.subject = `Partner Assigned for Order #${payload.orderId}`
      emailOptions.htmlContent = `
        <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e5e5e5; border-radius: 10px;">
          <h2 style="color: #D4AF37;">Great news, ${payload.customerName}!</h2>
          <p>Your order <strong>#${payload.orderId}</strong> has been assigned to our trusted delivery partner: <strong>${payload.driverName}</strong>.</p>
          <p>They are heading your way in a <strong>${payload.driverVehicle}</strong>.</p>
          <p>You can track their live GPS location directly on your VRK Farms Dashboard!</p>
        </div>
      `
    } else if (template === 'driver_registered') {
      emailOptions.to = [{ email: payload.driverEmail, name: payload.driverName }]
      emailOptions.bcc = [{ email: "admin@vrkfarms.com", name: "Admin Vault" }]
      emailOptions.subject = `Welcome to the VRK Delivery Fleet, ${payload.driverName}!`
      emailOptions.htmlContent = `
        <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e5e5e5; border-radius: 10px;">
          <h2 style="color: #D4AF37;">Welcome to the Vault Team, ${payload.driverName}!</h2>
          <p>Your delivery partner profile has been successfully registered.</p>
          <p>Admin has been notified to verify your vehicle details (<strong>${payload.vehicleDetails}</strong>).</p>
          <p>Login to the Delivery Dashboard to begin accepting orders and tracking your metrics!</p>
        </div>
      `
    } else {
      throw new Error(`Unknown email template requested: ${template}`)
    }

    // Execute via Brevo v3 SMTP API
    const res = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        "accept": "application/json",
        "api-key": BREVO_API_KEY,
        "content-type": "application/json"
      },
      body: JSON.stringify(emailOptions)
    });

    const data = await res.json()
    
    if (!res.ok) {
       console.error("Brevo Error:", data)
       throw new Error(data.message || "Failed to send via Brevo.")
    }

    return new Response(JSON.stringify({ success: true, messageId: data.messageId }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (error: any) {
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})
