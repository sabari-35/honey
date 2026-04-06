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

    // Premium Obsidian & Gold Email Container Template Function
    const wrapInPremiumContainer = (content: string, header: string) => `
      <!DOCTYPE html>
      <html>
      <body style="margin:0; padding:0; background-color:#111111; font-family:'Helvetica Neue', Helvetica, Arial, sans-serif; color:#ffffff;">
        <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color:#111111; padding: 40px 20px;">
          <tr><td align="center">
            <table width="600" border="0" cellspacing="0" cellpadding="0" style="background-color:#1a1a1a; border: 1px solid #333333; border-radius: 16px; overflow:hidden;">
              <!-- Header -->
              <tr><td style="background-color:#111111; padding: 40px 0; text-align: center; border-bottom: 1px solid #D4AF37;">
                <h1 style="color:#D4AF37; margin:0; font-size:28px; letter-spacing:4px; text-transform:uppercase; font-weight:900;">VRK FARMS</h1>
                <p style="color:#888888; font-size:10px; letter-spacing:3px; margin-top:8px; text-transform:uppercase;">Raw Collection</p>
              </td></tr>
              
              <!-- Content Body -->
              <tr><td style="padding: 40px 40px;">
                <h2 style="color:#ffffff; font-size:22px; margin-top:0; margin-bottom:24px; font-weight:300;">${header}</h2>
                ${content}
              </td></tr>
              
              <!-- Footer -->
              <tr><td style="background-color:#111111; padding: 30px; text-align: center; border-top: 1px solid #222222;">
                <p style="color:#666666; font-size:12px; line-height:1.5; margin:0;">
                  VRK Farms Luxury Extractions<br>
                  © ${new Date().getFullYear()} The Honey Platform. All Rights Reserved.
                </p>
                <div style="margin-top:15px;">
                  <a href="https://vrkfarms.com" style="color:#D4AF37; text-decoration:none; font-size:12px; letter-spacing:1px; text-transform:uppercase;">Visit Website</a>
                </div>
              </td></tr>
            </table>
          </td></tr>
        </table>
      </body>
      </html>
    `;

    // Process intent-driven templates
    if (template === 'order_placed') {
      emailOptions.to = [{ email: payload.customerEmail, name: payload.customerName }]
      emailOptions.subject = `Your VRK Farms Order Confirmed #${payload.orderId}`
      emailOptions.htmlContent = wrapInPremiumContainer(`
        <p style="color:#cccccc; line-height:1.6; font-size:15px; margin-bottom:20px;">
          We have successfully received your order <strong>#${payload.orderId}</strong>. Your pure, cold-pressed honey is currently being secured from our vault.
        </p>
        
        <table width="100%" border="0" cellspacing="0" cellpadding="0" style="margin-top:30px; margin-bottom:30px; background-color:#111111; border: 1px solid #333333; border-radius: 8px;">
          <tr><td style="padding: 20px;">
            <p style="color:#888888; font-size:11px; text-transform:uppercase; letter-spacing:2px; margin:0 0 10px 0;">Total Extracted Value</p>
            <p style="color:#D4AF37; font-size:32px; font-weight:bold; margin:0;">₹${payload.orderTotal}</p>
          </td></tr>
        </table>

        <p style="color:#cccccc; line-height:1.6; font-size:15px;">
          You will receive another update immediately once a delivery partner intercepts your order. You can monitor the live GPS telemetry directly through your tracking dashboard.
        </p>
      `, `Thank you, ${payload.customerName}.`)
      
    } else if (template === 'delivery_assigned') {
      emailOptions.to = [{ email: payload.customerEmail, name: payload.customerName }]
      emailOptions.subject = `Partner Assigned for Order #${payload.orderId}`
      emailOptions.htmlContent = wrapInPremiumContainer(`
        <p style="color:#cccccc; line-height:1.6; font-size:15px; margin-bottom:20px;">
          Your order <strong>#${payload.orderId}</strong> has just been dispatched. A certified VRK Farms partner is en route.
        </p>

        <table width="100%" border="0" cellspacing="0" cellpadding="0" style="margin-top:30px; margin-bottom:30px; background-color:#151515; border-left: 3px solid #D4AF37; padding: 20px;">
          <tr>
            <td style="padding-bottom:10px;">
              <p style="color:#888888; font-size:11px; text-transform:uppercase; letter-spacing:2px; margin:0 0 5px 0;">Assigned Partner</p>
              <p style="color:#ffffff; font-size:18px; margin:0;">${payload.driverName}</p>
            </td>
          </tr>
          <tr>
            <td>
              <p style="color:#888888; font-size:11px; text-transform:uppercase; letter-spacing:2px; margin:15px 0 5px 0;">Transport Matrix</p>
              <p style="color:#ffffff; font-size:16px; margin:0; opacity:0.9;">${payload.driverVehicle}</p>
            </td>
          </tr>
        </table>

        <p style="color:#cccccc; line-height:1.6; font-size:15px;">
          Lock in on the Live Map via your dashboard to track you r partner block by block.
        </p>
      `, `Manifest Assigned.`)
      
    } else if (template === 'driver_registered') {
      emailOptions.to = [{ email: payload.driverEmail, name: payload.driverName }]
      emailOptions.bcc = [{ email: "admin@vrkfarms.com", name: "Admin Vault" }]
      emailOptions.subject = `Welcome to the VRK Delivery Fleet, ${payload.driverName}!`
      emailOptions.htmlContent = wrapInPremiumContainer(`
        <p style="color:#cccccc; line-height:1.6; font-size:15px; margin-bottom:20px;">
          Your delivery partner profile has been successfully integrated into the VRK mainframe. Welcome to the elite fleet.
        </p>

        <table width="100%" border="0" cellspacing="0" cellpadding="0" style="margin-top:30px; margin-bottom:30px; background-color:#111111; border: 1px solid #333333; border-radius: 8px;">
          <tr><td style="padding: 20px;">
            <p style="color:#888888; font-size:11px; text-transform:uppercase; letter-spacing:2px; margin:0 0 10px 0;">Registered Vehicle</p>
            <p style="color:#D4AF37; font-size:20px; font-weight:bold; margin:0;">${payload.vehicleDetails}</p>
          </td></tr>
        </table>

        <p style="color:#cccccc; line-height:1.6; font-size:15px;">
          Admin has been notified to verify your chassis. Login to the Delivery Dashboard to intercept your first drop.
        </p>
      `, `Clearance Granted, ${payload.driverName}.`)
      
    } else if (template === 'store_daily_report') {
      emailOptions.to = [{ email: payload.adminEmail, name: "Admin Vault" }]
      emailOptions.subject = `VRK Farms: Daily Store Cash Report - ${new Date().toLocaleDateString()}`
      
      const salesTable = payload.salesDetailsList.map((item: any) => `
        <tr>
          <td style="padding: 10px; border-bottom: 1px solid #222;">${item.name}</td>
          <td style="padding: 10px; border-bottom: 1px solid #222; text-align: center;">${item.quantity}</td>
          <td style="padding: 10px; border-bottom: 1px solid #222; text-align: right; color:#D4AF37;">₹${item.total}</td>
        </tr>
      `).join('');

      emailOptions.htmlContent = wrapInPremiumContainer(`
        <p style="color:#cccccc; line-height:1.6; font-size:15px; margin-bottom:20px;">
          The daily automated reconciliation report has been generated for Vault Terminal: <strong>${payload.storekeeperName}</strong>.
        </p>

        <table width="100%" border="0" cellspacing="0" cellpadding="0" style="margin-top:30px; margin-bottom:15px; background-color:#151515; border: 1px solid #333333; border-radius: 8px;">
          <tr>
            <td style="padding: 20px; text-align: center; border-right: 1px solid #333;">
              <p style="color:#888888; font-size:11px; text-transform:uppercase; letter-spacing:2px; margin:0 0 5px 0;">Items Sold</p>
              <p style="color:#ffffff; font-size:24px; font-weight:bold; margin:0;">${payload.totalItemsSold}</p>
            </td>
            <td style="padding: 20px; text-align: center;">
              <p style="color:#888888; font-size:11px; text-transform:uppercase; letter-spacing:2px; margin:0 0 5px 0;">Total Revenue</p>
              <p style="color:#D4AF37; font-size:24px; font-weight:bold; margin:0;">₹${payload.totalSalesValue}</p>
            </td>
          </tr>
        </table>

        <table width="100%" border="0" cellspacing="0" cellpadding="0" style="margin-bottom:30px; background-color:#111111; color: #fff; font-size: 14px;">
          <thead>
            <tr>
              <th style="padding: 10px; text-align: left; color:#888; font-size:10px; text-transform:uppercase; border-bottom: 1px solid #333;">Item</th>
              <th style="padding: 10px; text-align: center; color:#888; font-size:10px; text-transform:uppercase; border-bottom: 1px solid #333;">Qty</th>
              <th style="padding: 10px; text-align: right; color:#888; font-size:10px; text-transform:uppercase; border-bottom: 1px solid #333;">Total</th>
            </tr>
          </thead>
          <tbody>
            ${salesTable}
          </tbody>
        </table>

        <p style="color:#cccccc; line-height:1.6; font-size:15px;">
          Please open the Store Ledger Dashboard to mark any physical cash collections against this balance.
        </p>
      `, `End of Day Report`)
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
