// FIX: Add Deno to global scope to avoid TypeScript errors in environments where Deno types are not automatically included.
declare const Deno: any;

// @ts-ignore: Deno imports are not recognized by the build environment's TypeScript compiler.
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

// Standard CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight request
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const {
      shopName,
      shopAddress,
      clientName,
      clientEmail,
      serviceName,
      date, // Expecting a pre-formatted date string
      time,
      price,
    } = await req.json()

    // Retrieve Resend API key from environment variables
    const resendApiKey = Deno.env.get('RESEND_API_KEY')
    if (!resendApiKey) {
      console.error('RESEND_API_KEY is not set in environment variables.')
      return new Response(JSON.stringify({ error: 'Email service is not configured.' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const subject = `Your Booking Confirmation with ${shopName}`
    const textBody = `
Hi ${clientName},

This email confirms your booking with ${shopName}.

Here are your details:
- Service: ${serviceName}
- Date: ${date}
- Time: ${time}
- Total: €${price}
${shopAddress ? `- Location: ${shopAddress}` : ''}

We look forward to seeing you!

- The ${shopName} Team
    `
    const htmlBody = `
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Booking Confirmation</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f4f4f4; }
    .container { max-width: 600px; margin: 20px auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px; background-color: #ffffff; }
    h2 { color: #007BFF; }
    ul { list-style: none; padding: 0; }
    li { padding: 8px 0; border-bottom: 1px solid #eee; }
    li:last-child { border-bottom: none; }
    strong { color: #111827; }
    .footer { font-size: 0.9em; color: #777; margin-top: 20px; text-align: center; }
  </style>
</head>
<body>
  <div class="container">
    <h2>Booking Confirmed!</h2>
    <p>Hi ${clientName},</p>
    <p>This email confirms your booking with <strong>${shopName}</strong>.</p>
    <h3>Your Details:</h3>
    <ul>
      <li><strong>Service:</strong> ${serviceName}</li>
      <li><strong>Date:</strong> ${date}</li>
      <li><strong>Time:</strong> ${time}</li>
      <li><strong>Total:</strong> €${price}</li>
      ${shopAddress ? `<li><strong>Location:</strong> ${shopAddress}</li>` : ''}
    </ul>
    <p>We look forward to seeing you!</p>
    <p><em>- The ${shopName} Team</em></p>
  </div>
  <div class="footer">
    <p>This is an automated email from ResaOne. Please do not reply.</p>
  </div>
</body>
</html>
    `

    // Use Resend's test address as the sender for demonstration purposes
    const fromAddress = 'ResaOne <onboarding@resend.dev>'

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${resendApiKey}`,
      },
      body: JSON.stringify({
        from: fromAddress,
        to: clientEmail,
        subject: subject,
        html: htmlBody,
        text: textBody,
      }),
    })

    if (!res.ok) {
        const errorBody = await res.json()
        console.error('Failed to send email:', errorBody)
        throw new Error(`Failed to send email. Status: ${res.status}`)
    }

    const data = await res.json()

    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})