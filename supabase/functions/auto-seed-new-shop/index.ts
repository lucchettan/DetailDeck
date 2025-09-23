import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface ShopData {
  id: string;
  name: string;
  email: string;
  owner_id: string;
}

// Définir les données par défaut selon la langue (détectée depuis l'email ou autre)
const getDefaultData = (language: string = 'fr') => {
  const translations = {
    fr: {
      categories: [
        { name: 'Intérieur', description: 'Nettoyage et protection de l\'habitacle' },
        { name: 'Extérieur', description: 'Lavage, polish et protection de la carrosserie' }
      ],
      vehicleSizes: [
        { name: 'Citadine', description: 'Petites voitures urbaines (Clio, 208, Polo, etc.)' },
        { name: 'Berline / Coupé', description: 'Berlines, coupés, cabriolets (BMW Série 3, Audi A4, etc.)' },
        { name: 'Break / SUV Compact', description: 'Breaks, SUV compacts (X3, Q5, Tiguan, etc.)' },
        { name: '4x4 / Minivan', description: 'Gros 4x4, minivans, utilitaires (X5, Espace, Transporter, etc.)' }
      ]
    },
    en: {
      categories: [
        { name: 'Interior', description: 'Cabin cleaning and protection' },
        { name: 'Exterior', description: 'Washing, polishing and bodywork protection' }
      ],
      vehicleSizes: [
        { name: 'Compact', description: 'Small urban cars (Clio, 208, Polo, etc.)' },
        { name: 'Sedan / Coupe', description: 'Sedans, coupes, convertibles (BMW 3 Series, Audi A4, etc.)' },
        { name: 'Wagon / Compact SUV', description: 'Wagons, compact SUVs (X3, Q5, Tiguan, etc.)' },
        { name: '4x4 / Minivan', description: 'Large 4x4s, minivans, commercial vehicles (X5, Espace, Transporter, etc.)' }
      ]
    },
    es: {
      categories: [
        { name: 'Interior', description: 'Limpieza y protección del habitáculo' },
        { name: 'Exterior', description: 'Lavado, pulido y protección de la carrocería' }
      ],
      vehicleSizes: [
        { name: 'Urbano', description: 'Coches urbanos pequeños (Clio, 208, Polo, etc.)' },
        { name: 'Berlina / Coupé', description: 'Berlinas, cupés, descapotables (BMW Serie 3, Audi A4, etc.)' },
        { name: 'Familiar / SUV Compacto', description: 'Familiares, SUV compactos (X3, Q5, Tiguan, etc.)' },
        { name: '4x4 / Monovolumen', description: 'Grandes 4x4, monovolúmenes, comerciales (X5, Espace, Transporter, etc.)' }
      ]
    }
  };

  return translations[language as keyof typeof translations] || translations.fr;
};

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    const { shop } = await req.json() as { shop: ShopData };

    if (!shop || !shop.id) {
      throw new Error('Shop data is required');
    }

    console.log(`Auto-seeding data for new shop: ${shop.name} (${shop.id})`);

    // Détecter la langue (peut être amélioré avec d'autres méthodes)
    let language = 'fr'; // Par défaut français

    // Logique simple de détection de langue basée sur l'email ou d'autres critères
    if (shop.email?.includes('.com') && !shop.email?.includes('.fr')) {
      language = 'en';
    } else if (shop.email?.includes('.es')) {
      language = 'es';
    }

    const defaultData = getDefaultData(language);

    // 1. Créer les catégories de services par défaut
    console.log('Creating default service categories...');
    const { data: categories, error: categoriesError } = await supabaseClient
      .from('shop_service_categories')
      .insert(
        defaultData.categories.map(cat => ({
          shop_id: shop.id,
          name: cat.name,
          description: cat.description,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }))
      )
      .select();

    if (categoriesError) {
      console.error('Error creating categories:', categoriesError);
      throw categoriesError;
    }

    console.log(`Created ${categories?.length || 0} categories`);

    // 2. Créer les tailles de véhicules par défaut
    console.log('Creating default vehicle sizes...');
    const { data: vehicleSizes, error: vehicleSizesError } = await supabaseClient
      .from('shop_vehicle_sizes')
      .insert(
        defaultData.vehicleSizes.map(size => ({
          shop_id: shop.id,
          name: size.name,
          description: size.description,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }))
      )
      .select();

    if (vehicleSizesError) {
      console.error('Error creating vehicle sizes:', vehicleSizesError);
      throw vehicleSizesError;
    }

    console.log(`Created ${vehicleSizes?.length || 0} vehicle sizes`);

    const result = {
      success: true,
      message: `Auto-seeded data for shop ${shop.name}`,
      data: {
        shop_id: shop.id,
        language: language,
        categories_created: categories?.length || 0,
        vehicle_sizes_created: vehicleSizes?.length || 0
      }
    };

    console.log('Auto-seed completed successfully:', result);

    return new Response(
      JSON.stringify(result),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      }
    );

  } catch (error) {
    console.error('Auto-seed error:', error);

    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Unknown error occurred'
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      }
    );
  }
});
