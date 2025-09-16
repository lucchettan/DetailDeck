// Fix: Directly reference Deno's standard library types to resolve issues with loading nested remote type definitions.
/// <reference types="https://deno.land/x/deno/tsc/lib.deno.d.ts" />

// Follow this setup guide to integrate Resend if you don't have an email provider yet:
// https://supabase.com/docs/guides/functions/examples/resend
// You'll need to set a RESEND_API_KEY secret in your project.

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { translations } from '../../../lib/translations.ts'

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
const SUPABASE_URL = Deno.env.get('SUPABASE_URL');

// Helper to format duration from minutes to a human-readable "Xh XXmin" format
const formatDuration = (minutes: number): string => {
  if (isNaN(minutes) || minutes < 0) return '0min';
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  let formatted = '';
  if (hours > 0) formatted += `${hours}h`;
  if (remainingMinutes > 0) {
    if (hours > 0) formatted += ' ';
    formatted += `${remainingMinutes}min`;
  }
  return formatted || '0min';
};

// Helper to generate the Google Calendar URL
const getGoogleCalendarUrl = (reservation: any, shop: any) => {
  const startTime = new Date(`${reservation.date}T${reservation.start_time}`);
  const endTime = new Date(startTime.getTime() + reservation.duration * 60000);
  
  const formatForGoogle = (date: Date) => date.toISOString().replace(/-|:|\.\d{3}/g, '');

  const url = new URL('https://www.google.com/calendar/render');
  url.searchParams.set('action', 'TEMPLATE');
  url.searchParams.set('text', `${reservation.service_details.name} at ${shop.name}`);
  url.searchParams.set('dates', `${formatForGoogle(startTime)}/${formatForGoogle(endTime)}`);
  url.searchParams.set('details', `Appointment for ${reservation.service_details.name}. Client: ${reservation.client_name}.`);
  url.searchParams.set('location', shop.address);
  
  return url.toString();
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type' } })
  }

  try {
    const { reservation, shop, locale = 'fr' } = await req.json();
    const t = translations[locale as 'en' | 'fr' | 'es'];

    const clientName = reservation.client_name;
    const clientEmail = reservation.client_email;
    const shopName = shop.name;
    const shopEmail = shop.email || 'noreply@resaone.app';
    const shopPhone = shop.phone || 'N/A';
    
    const subject = t.emailSubject.replace('{shopName}', shopName);
    const formattedDate = new Date(reservation.date + 'T00:00:00').toLocaleDateString(locale, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

    // Generate calendar links
    const googleCalendarUrl = getGoogleCalendarUrl(reservation, shop);
    const appleCalendarUrl = `${SUPABASE_URL}/functions/v1/generate-ics?res_id=${reservation.id}`;

    const htmlBody = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 20px auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px; }
        .header { text-align: center; margin-bottom: 20px; padding-bottom: 10px; border-bottom: 1px solid #ddd; }
        .header h1 { color: #007BFF; }
        .summary-item { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #eee; }
        .summary-item strong { color: #111827; }
        .footer { text-align: center; margin-top: 20px; font-size: 0.9em; color: #777; }
        .button { display: inline-block; padding: 10px 15px; margin: 5px; background-color: #007BFF; color: #fff; text-decoration: none; border-radius: 5px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>ResaOne</h1>
          <h2>${subject}</h2>
        </div>
        <p>${t.emailGreeting.replace('{clientName}', clientName)}</p>
        <p>${t.emailIntro}</p>
        
        <div class="summary">
          <div class="summary-item"><span>${t.service}</span><strong>${reservation.service_details.name}</strong></div>
          <div class="summary-item"><span>${t.date}</span><strong>${formattedDate}</strong></div>
          <div class="summary-item"><span>${t.time}</span><strong>${reservation.start_time}</strong></div>
          <div class="summary-item"><span>${t.estimatedDuration}</span><strong>${formatDuration(reservation.duration)}</strong></div>
          <div class="summary-item"><span>Total</span><strong>€${reservation.price}</strong></div>
        </div>
        
        <div style="text-align: center; margin-top: 30px;">
          <a href="${googleCalendarUrl}" class="button">${t.addToGoogleCalendar}</a>
          <a href="${appleCalendarUrl}" class="button">${t.addToAppleCalendar}</a>
        </div>
        
        <p style="margin-top: 30px;">${t.emailManageBooking}<br><b>${shopName}</b><br>Tel: ${shopPhone}</p>
        <p>${t.emailThanks}</p>
        
        <div class="footer">
          <p>Powered by ResaOne</p>
        </div>
      </div>
    </body>
    </html>
    `;

    if (!RESEND_API_KEY) {
        throw new Error("RESEND_API_KEY is not set in environment variables.");
    }

    const resendResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: `ResaOne <noreply@resaone.app>`, // Should be a verified domain on Resend
        to: [clientEmail],
        reply_to: shopEmail,
        subject: subject,
        html: htmlBody,
      }),
    });

    if (!resendResponse.ok) {
        const errorBody = await resendResponse.json();
        console.error("Resend API Error:", errorBody);
        throw new Error("Failed to send email via Resend.");
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type' },
    });
  } catch (error) {
    console.error('Function Error:', error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type' },
    });
  }
})