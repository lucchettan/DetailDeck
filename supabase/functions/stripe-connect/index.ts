// supabase/functions/stripe-connect/index.ts
// Fix: Add a triple-slash directive to reference Deno's Deploy types.
// This informs the TypeScript compiler about the global 'Deno' object and its APIs,
// resolving the "Cannot find name 'Deno'" errors.
/// <reference types="https://deno.land/x/deno/types/deploy.d.ts" />

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@11.1.0?target=deno";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.43.4";

const stripe = Stripe(Deno.env.get("STRIPE_SECRET_KEY")!, {
  apiVersion: "2022-11-15",
  httpClient: Stripe.createFetchHttpClient(),
});

// Define CORS headers for reuse
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight request
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { code } = await req.json();
    if (!code) {
      throw new Error("Authorization code is missing.");
    }

    // 1. Create a Supabase client authenticated as the user making the request.
    // This is CRITICAL for Row-Level Security (RLS) to work correctly.
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: req.headers.get("Authorization")! } } }
    );

    // 2. Get the user from the authenticated client.
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError) throw userError;
    if (!user) throw new Error("User not found. Authentication failed.");

    // 3. Exchange the authorization code from Stripe for a permanent account ID.
    const response = await stripe.oauth.token({
      grant_type: "authorization_code",
      code,
    });

    if (response.error) {
      throw new Error(`Stripe OAuth error: ${response.error_description}`);
    }

    const stripeAccountId = response.stripe_user_id;

    // 4. Verify a shop record exists for this user before attempting an update.
    // This provides a more specific and useful error if the data is inconsistent.
    const { data: shop, error: shopSelectError } = await supabaseClient
      .from("shops")
      .select('id')
      .eq("owner_id", user.id)
      .single();

    if (shopSelectError || !shop) {
        throw new Error(`Could not find a shop record for user ID: ${user.id}. Error: ${shopSelectError?.message}`);
    }

    // 5. Update the user's shop record with the new Stripe Account ID.
    const { error: updateError } = await supabaseClient
      .from("shops")
      .update({
        stripe_account_id: stripeAccountId,
        stripe_account_enabled: true,
      })
      .eq("owner_id", user.id);

    if (updateError) {
      console.error("Supabase shop update error:", updateError);
      throw new Error(`Failed to update shop with Stripe ID: ${updateError.message}`);
    }

    // 6. Return a success response.
    return new Response(JSON.stringify({ success: true, stripeAccountId }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    // 7. Return a detailed error response.
    console.error("Stripe Connect Function Error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});
