// Déclare Deno pour éviter les erreurs TypeScript dans les environnements où les types Deno ne sont pas inclus.
declare const Deno: any;

// @ts-ignore: Les imports Deno ne sont pas reconnus par le compilateur TypeScript de l'environnement de build.
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

// En-têtes CORS standards
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req: any) => {
  // Gérer la requête CORS preflight
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
      date, // Attend une date pré-formatée
      time,
      price,
    } = await req.json()

    // Récupérer la clé API Resend depuis les variables d'environnement
    const resendApiKey = Deno.env.get('RESEND_API_KEY')
    if (!resendApiKey) {
      console.error('RESEND_API_KEY n\'est pas définie dans les variables d\'environnement.')
      return new Response(JSON.stringify({ error: 'Le service d\'e-mail n\'est pas configuré.' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const subject = `Confirmation de votre réservation chez ${shopName}`
    const textBody = `
Bonjour ${clientName},

Cet e-mail confirme votre réservation chez ${shopName}.

Voici les détails :
- Prestation : ${serviceName}
- Date : ${date}
- Heure : ${time}
- Total : ${price} €
${shopAddress ? `- Lieu : ${shopAddress}` : ''}

Nous avons hâte de vous voir !

- L'équipe ${shopName}
    `
    const htmlBody = `
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Confirmation de réservation</title>
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
    <h2>Réservation Confirmée !</h2>
    <p>Bonjour ${clientName},</p>
    <p>Cet e-mail confirme votre réservation avec <strong>${shopName}</strong>.</p>
    <h3>Vos détails :</h3>
    <ul>
      <li><strong>Prestation :</strong> ${serviceName}</li>
      <li><strong>Date :</strong> ${date}</li>
      <li><strong>Heure :</strong> ${time}</li>
      <li><strong>Total :</strong> ${price} €</li>
      ${shopAddress ? `<li><strong>Lieu :</strong> ${shopAddress}</li>` : ''}
    </ul>
    <p>Nous avons hâte de vous recevoir !</p>
    <p><em>- L'équipe ${shopName}</em></p>
  </div>
  <div class="footer">
    <p>Ceci est un e-mail automatique envoyé via ResaOne. Merci de ne pas y répondre.</p>
  </div>
</body>
</html>
    `
    // L'adresse de l'expéditeur doit être un domaine vérifié sur Resend
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
        console.error('Échec de l\'envoi de l\'e-mail:', errorBody)
        throw new Error(`Échec de l'envoi de l'e-mail. Statut : ${res.status}`)
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
