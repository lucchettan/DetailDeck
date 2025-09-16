// Fix: Updated the type reference to a valid URL for Supabase Edge Function types.
// This resolves errors related to the Deno global object not being found.
/// <reference types="https://esm.sh/@supabase/functions-js@2.4.1/src/edge-runtime.d.ts" />

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@11.1.0?target=deno";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.43.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  let stage = "start";
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // --- STEP 0: ENVIRONMENT VARIABLE VALIDATION ---
    stage = "validate-env";
    // This is the most critical step. We verify all secrets exist before doing anything.
    const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY");
    const supabaseUrl = Deno.env.get("NEXT_PUBLIC_SUPABASE_URL");
    const supabaseAnonKey = Deno.env.get("NEXT_PUBLIC_SUPABASE_ANON_KEY");

    if (!stripeSecretKey) {
      throw new Error("SECRET_MISSING: La variable d'environnement STRIPE_SECRET_KEY n'est pas définie dans votre fonction Supabase.");
    }
    if (!supabaseUrl) {
      throw new Error("SECRET_MISSING: La variable d'environnement NEXT_PUBLIC_SUPABASE_URL n'est pas définie.");
    }
    if (!supabaseAnonKey) {
      throw new Error("SECRET_MISSING: La variable d'environnement NEXT_PUBLIC_SUPABASE_ANON_KEY n'est pas définie.");
    }

    // Initialize clients now that we know the keys exist
    stage = "init-clients";
    const stripe = Stripe(stripeSecretKey, {
      apiVersion: "2022-11-15",
      httpClient: Stripe.createFetchHttpClient(),
    });

    const supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: req.headers.get("Authorization")! } },
    });
    
    // --- END STEP 0 ---

    stage = "read-body";
    const { code } = await req.json();
    if (!code) throw new Error("Le code d'autorisation est manquant dans la requête.");

    stage = "get-user";
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError) throw userError;
    if (!user) throw new Error("Utilisateur non trouvé à partir du token. L'authentification a échoué.");

    stage = "stripe-token";
    const response = await stripe.oauth.token({
      grant_type: "authorization_code",
      code,
    });

    if (response.error) {
      const stripeError = new Error(`Erreur Stripe OAuth: ${response.error_description}`);
      (stripeError as any).stripe_error = response;
      throw stripeError;
    }

    const stripeAccountId = response.stripe_user_id;

    stage = "update-shop";
    const { error: updateError } = await supabaseClient
      .from("shops")
      .update({
        stripe_account_id: stripeAccountId,
        stripe_account_enabled: true,
      })
      .eq("owner_id", user.id);

    if (updateError) {
      throw new Error(`Échec de la mise à jour du shop: ${updateError.message}`);
    }

    stage = "success";
    return new Response(JSON.stringify({ success: true, stripeAccountId }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    console.error("--- ERREUR CRITIQUE DANS LA FONCTION STRIPE CONNECT ---");
    console.error("FAILED AT STAGE:", stage);
    console.error(error);
    
    return new Response(JSON.stringify({
        error: "Une erreur est survenue côté serveur.",
        stage,
        technical_details: {
            message: error.message,
            stack: error.stack, // Include stack trace for full context
        }
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
