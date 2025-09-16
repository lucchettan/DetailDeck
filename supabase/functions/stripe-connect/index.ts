// Fix: The unpkg.com URL for type definitions appears to be unreliable. Switching to the esm.sh CDN, which is commonly used for Deno modules and should resolve the missing 'Deno' global type issues.
/// <reference types="https://esm.sh/@supabase/functions-js@2.4.1/src/edge-runtime.d.ts" />

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@11.1.0?target=deno";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.43.4";

// Initialize Stripe client
const stripe = Stripe(Deno.env.get("STRIPE_SECRET_KEY")!, {
  apiVersion: "2022-11-15",
  httpClient: Stripe.createFetchHttpClient(),
});

// Reusable CORS headers
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
    if (!code) throw new Error("Authorization code is missing.");

    // 1. Create Supabase client with user's auth context
    // IMPORTANT: Use the NEW secret names that are not blocked by the Supabase CLI.
    const supabaseClient = createClient(
      Deno.env.get("NEXT_PUBLIC_SUPABASE_URL")!,
      Deno.env.get("NEXT_PUBLIC_SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: req.headers.get("Authorization")! } } }
    );

    // 2. Get user from the token
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError) throw userError;
    if (!user) throw new Error("User not found from token. Authentication failed.");

    // 3. Exchange code with Stripe
    const response = await stripe.oauth.token({
      grant_type: "authorization_code",
      code,
    });

    if (response.error) {
      const stripeError = new Error(`Stripe OAuth error: ${response.error_description}`);
      (stripeError as any).stripe_error = response; 
      throw stripeError;
    }

    const stripeAccountId = response.stripe_user_id;

    // 4. Update the shop record
    const { error: updateError } = await supabaseClient
      .from("shops")
      .update({
        stripe_account_id: stripeAccountId,
        stripe_account_enabled: true,
      })
      .eq("owner_id", user.id);

    if (updateError) {
      throw new Error(`Failed to update shop record: ${updateError.message}`);
    }

    // 5. Success
    return new Response(JSON.stringify({ success: true, stripeAccountId }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    console.error("--- STRIPE CONNECT FUNCTION CRITICAL ERROR ---");
    console.error(error);

    if ((error as any).stripe_error) {
        return new Response(JSON.stringify({ 
            error: "An error occurred during the Stripe OAuth process.",
            technical_details: {
                message: error.message,
                stripe_response: (error as any).stripe_error,
            }
        }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 400,
        });
    }

    return new Response(JSON.stringify({ 
        error: "An unexpected backend error occurred.",
        technical_details: {
            message: error.message,
            stack: error.stack,
        }
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
