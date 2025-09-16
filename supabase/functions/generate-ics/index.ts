// Fix: Directly reference Deno's standard library types to resolve issues with loading nested remote type definitions.
/// <reference types="https://deno.land/x/deno/tsc/lib.deno.d.ts" />

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2'

// Helper to format a date into the required UTC format for iCal (YYYYMMDDTHHMMSSZ)
const formatToUTC = (date: Date): string => {
  return date.getUTCFullYear() +
    (date.getUTCMonth() + 1).toString().padStart(2, '0') +
    date.getUTCDate().toString().padStart(2, '0') +
    'T' +
    date.getUTCHours().toString().padStart(2, '0') +
    date.getUTCMinutes().toString().padStart(2, '0') +
    date.getUTCSeconds().toString().padStart(2, '0') +
    'Z';
};

serve(async (req) => {
  try {
    const url = new URL(req.url);
    const reservationId = url.searchParams.get('res_id');

    if (!reservationId) {
      throw new Error("Reservation ID is required.");
    }
    
    // Create a Supabase client with the ANON KEY to fetch public data.
    // Ensure RLS policies on 'reservations' and 'shops' tables allow this access if needed,
    // though a service_role key is safer for backend functions.
    const supabaseClient: SupabaseClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!
    );

    const { data: reservation, error } = await supabaseClient
      .from('reservations')
      .select('*, shops(*)')
      .eq('id', reservationId)
      .single();

    if (error || !reservation) {
      throw new Error(error?.message || "Reservation not found.");
    }
    
    const startTime = new Date(`${reservation.date}T${reservation.start_time}`);
    const endTime = new Date(startTime.getTime() + reservation.duration * 60000);
    const now = new Date();

    const icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//ResaOne//Booking//EN',
      'BEGIN:VEVENT',
      `UID:${reservation.id}@resaone.app`,
      `DTSTAMP:${formatToUTC(now)}`,
      `DTSTART:${formatToUTC(startTime)}`,
      `DTEND:${formatToUTC(endTime)}`,
      `SUMMARY:${reservation.service_details.name}`,
      `DESCRIPTION:Your appointment with ${reservation.client_name} for ${reservation.service_details.name}.\\nTotal Price: €${reservation.price}`,
      `LOCATION:${reservation.shops.address}`,
      'END:VEVENT',
      'END:VCALENDAR'
    ].join('\r\n');

    return new Response(icsContent, {
      headers: {
        'Content-Type': 'text/calendar; charset=utf-8',
        'Content-Disposition': 'attachment; filename="reservation.ics"'
      },
    });

  } catch (err) {
    return new Response(String(err?.message ?? err), { status: 500 })
  }
})