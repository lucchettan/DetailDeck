
// @ts-ignore: Deno types are not available in this environment
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
// @ts-ignore: Deno types are not available in this environment
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      // @ts-ignore: Deno types are not available in this environment
      Deno.env.get('SUPABASE_URL') ?? '',
      // @ts-ignore: Deno types are not available in this environment
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    )

    const { data: { user } } = await supabaseClient.auth.getUser()
    if (!user) throw new Error('User not found')

    // 1. Create Shop
    const { data: shop, error: shopError } = await supabaseClient
      .from('shops')
      .insert({
        owner_id: user.id,
        name: 'Prestige Detailing IDF',
        phone: '01 23 45 67 89',
        email: user.email,
        shop_image_url: 'https://images.unsplash.com/photo-1616422285623-13ff0162193c?q=80&w=2070&auto=format&fit=crop',
        business_type: 'local',
        address_line1: '15 Rue des Artisans',
        address_city: 'Versailles',
        address_postal_code: '78000',
        address_country: 'France',
        schedule: {
            "monday": {"isOpen": true, "timeframes": [{"from": "09:00", "to": "18:00"}]},
            "tuesday": {"isOpen": true, "timeframes": [{"from": "09:00", "to": "18:00"}]},
            "wednesday": {"isOpen": true, "timeframes": [{"from": "09:00", "to": "18:00"}]},
            "thursday": {"isOpen": true, "timeframes": [{"from": "09:00", "to": "18:00"}]},
            "friday": {"isOpen": true, "timeframes": [{"from": "09:00", "to": "18:00"}]},
            "saturday": {"isOpen": true, "timeframes": [{"from": "09:00", "to": "13:00"}]},
            "sunday": {"isOpen": false, "timeframes": []}
        },
        supported_vehicle_sizes: ['S', 'M', 'L', 'XL']
      })
      .select()
      .single()

    if (shopError) throw shopError
    const shop_id = shop.id

    // 2. Create Services, Formulas, and Supplements
    const { data: services, error: servicesError } = await supabaseClient.from('services').insert([
        { shop_id, name: 'Nettoyage Intérieur Essentiel', description: 'Aspiration complète, dépoussiérage des plastiques, nettoyage des vitres. Idéal pour un entretien régulier.', category: 'interior', base_price: 80, base_duration: 120, image_url: 'https://images.unsplash.com/photo-1551431804-83e78328639e?q=80&w=2070&auto=format&fit=crop' },
        { shop_id, name: 'Lavage Extérieur Premium', description: 'Prélavage, lavage manuel aux deux seaux, séchage microfibre, cire de protection rapide et nettoyage des jantes.', category: 'exterior', base_price: 90, base_duration: 150, image_url: 'https://images.unsplash.com/photo-1605152273339-a8a1c83c273a?q=80&w=1974&auto=format&fit=crop' },
        { shop_id, name: 'Traitement Carrosserie Céramique', description: 'Protection longue durée (2 ans). Décontamination, polissage et application d\'un revêtement céramique professionnel.', category: 'exterior', base_price: 450, base_duration: 480, image_url: 'https://images.unsplash.com/photo-1627361242304-a2a4b9b6e765?q=80&w=2070&auto=format&fit=crop' },
        { shop_id, name: 'Rénovation des Optiques de Phares', description: 'Ponçage et polissage des phares pour retrouver leur transparence et améliorer la visibilité nocturne.', category: 'complementary', base_price: 70, base_duration: 60, image_url: 'https://images.unsplash.com/photo-1617855338244-bf24f4a34b3d?q=80&w=2070&auto=format&fit=crop' },
    ]).select();

    if (servicesError) throw servicesError;
    const service_int_1_id = services.find(s => s.name.includes('Intérieur Essentiel'))!.id;
    const service_ext_1_id = services.find(s => s.name.includes('Lavage Extérieur'))!.id;
    const service_ext_2_id = services.find(s => s.name.includes('Céramique'))!.id;
    const service_comp_1_id = services.find(s => s.name.includes('Optiques'))!.id;

    const { data: formulas, error: formulasError } = await supabaseClient.from('formulas').insert([
        { service_id: service_int_1_id, name: 'Basique', description: 'Aspiration complète de l\'habitacle\nDépoussiérage des plastiques\nNettoyage des vitres intérieures', additional_price: 0, additional_duration: 0 },
        { service_id: service_int_1_id, name: 'Pressing des Sièges', description: 'Tout le contenu de la formule Basique\nNettoyage en profondeur des sièges\nShampouinage des moquettes', additional_price: 70, additional_duration: 90 },
        { service_id: service_ext_1_id, name: 'Basique', description: 'Prélavage au canon à mousse\nLavage manuel technique des deux seaux\nNettoyage des jantes et pneus', additional_price: 0, additional_duration: 0 },
        { service_id: service_ext_1_id, name: 'Finition Lustrante', description: 'Tout le contenu de la formule Basique\nApplication d\'une cire de protection\nBrillant des pneus', additional_price: 60, additional_duration: 60 },
        { service_id: service_ext_2_id, name: 'Garantie 2 ans', description: 'Protection céramique de haute qualité.', additional_price: 0, additional_duration: 0 },
        { service_id: service_ext_2_id, name: 'Garantie 5 ans', description: 'Revêtement premium auto-cicatrisant pour une protection maximale.', additional_price: 400, additional_duration: 120 },
        { service_id: service_comp_1_id, name: 'Basique', description: 'Rénovation complète des deux optiques avant.', additional_price: 0, additional_duration: 0 },
    ]).select();
    if (formulasError) throw formulasError;
    
    const { error: supplementsError } = await supabaseClient.from('service_vehicle_size_supplements').insert([
        { service_id: service_int_1_id, size: 'S', additional_price: 0, additional_duration: 0 },
        { service_id: service_int_1_id, size: 'M', additional_price: 15, additional_duration: 30 },
        { service_id: service_int_1_id, size: 'L', additional_price: 30, additional_duration: 45 },
        { service_id: service_int_1_id, size: 'XL', additional_price: 50, additional_duration: 60 },
        { service_id: service_ext_1_id, size: 'S', additional_price: 0, additional_duration: 0 },
        { service_id: service_ext_1_id, size: 'M', additional_price: 20, additional_duration: 30 },
        { service_id: service_ext_1_id, size: 'L', additional_price: 40, additional_duration: 45 },
        { service_id: service_ext_1_id, size: 'XL', additional_price: 60, additional_duration: 60 },
        { service_id: service_ext_2_id, size: 'S', additional_price: 0, additional_duration: 0 },
        { service_id: service_ext_2_id, size: 'M', additional_price: 100, additional_duration: 60 },
        { service_id: service_ext_2_id, size: 'L', additional_price: 200, additional_duration: 120 },
        { service_id: service_ext_2_id, size: 'XL', additional_price: 300, additional_duration: 180 },
    ]);
    if(supplementsError) throw supplementsError;
    
    const { error: addonsError } = await supabaseClient.from('add_ons').insert([
      { shop_id, service_id: service_int_1_id, name: 'Traitement Anti-Odeurs', price: 40, duration: 30 }
    ]);
    if(addonsError) throw addonsError;

    const formulaInt1Id = formulas.find(f => f.service_id === service_int_1_id && f.name === 'Basique')!.id;
    const formulaExt1Id = formulas.find(f => f.service_id === service_ext_1_id && f.name === 'Finition Lustrante')!.id;

    // 3. Create a couple of fake reservations
    const pastDate = new Date();
    pastDate.setDate(pastDate.getDate() - 7);
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 3);

    const { error: reservationsError } = await supabaseClient.from('reservations').insert([
      {
        shop_id,
        date: pastDate.toISOString().split('T')[0],
        start_time: '10:00',
        duration: 150,
        price: 95,
        client_name: 'Marie Curie',
        client_email: 'marie.curie@example.com',
        client_phone: '0611223344',
        status: 'completed',
        payment_status: 'paid',
        service_details: { vehicleSize: "M", services: [{ serviceId: service_int_1_id, serviceName: "Nettoyage Intérieur Essentiel", formulaId: formulaInt1Id, formulaName: "Basique", addOns: [] }] }
      },
      {
        shop_id,
        date: futureDate.toISOString().split('T')[0],
        start_time: '14:00',
        duration: 255,
        price: 190,
        client_name: 'Louis Pasteur',
        client_email: 'louis.pasteur@example.com',
        client_phone: '0655667788',
        status: 'upcoming',
        payment_status: 'on_site',
        service_details: { vehicleSize: "L", services: [{ serviceId: service_ext_1_id, serviceName: "Lavage Extérieur Premium", formulaId: formulaExt1Id, formulaName: "Finition Lustrante", addOns: [] }] }
      }
    ]);

    if (reservationsError) throw reservationsError;

    return new Response(JSON.stringify({ message: 'Demo data seeded successfully' }), {
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
