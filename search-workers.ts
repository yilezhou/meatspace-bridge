import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

/**
 * search-workers.ts
 * Supabase Edge Function for geospatial worker search.
 * Implements section 5.1 of the Profile & Geolocation Engine spec.
 */

interface SearchRequest {
  latitude: number;
  longitude: number;
  radius_meters: number;
  skills?: string[];
  limit?: number;
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { latitude, longitude, radius_meters, skills, limit = 10 }: SearchRequest = await req.json()

    if (latitude === undefined || longitude === undefined || radius_meters === undefined) {
      throw new Error("latitude, longitude, and radius_meters are required.")
    }

    // Input Validation & Hard Caps (Audit Finding 2)
    if (latitude < -90 || latitude > 90) throw new Error("Invalid latitude. Must be between -90 and 90.");
    if (longitude < -180 || longitude > 180) throw new Error("Invalid longitude. Must be between -180 and 180.");
    
    // Hard cap radius at 50,000 meters
    const validatedRadius = Math.min(radius_meters, 50000);
    if (validatedRadius <= 0) throw new Error("Radius must be greater than 0.");

    // Build the query using PostGIS functions via rpc or raw query.
    // Since we need complex joins and PostGIS functions, we'll use a specific query logic.
    // We use service_role to bypass RLS for the search as specified in the spec.

    // 1. Proximity Calculation & Skill Filtering
    // We perform this via a stored procedure/rpc for efficiency and security.
    // However, the prompt asks for the implementation here. We'll use the Supabase client
    // to query with PostGIS logic.

    let query = supabaseClient
      .rpc('search_workers_geo', {
        t_lat: latitude,
        t_long: longitude,
        r_meters: validatedRadius,
        skill_slugs: skills || null,
        p_limit: limit
      })

    const { data, error } = await query

    if (error) throw error

    // Sanitization and Fuzzy Coords (Section 3.2)
    // The fuzzy logic is applied here to ensure privacy.
    const sanitizedData = data.map((worker: any) => {
      // Logic from 3.2: ST_SnapToGrid(location, 0.01) approx 1.1km
      // If we are using an Edge Function, we can apply the fuzzy rounding here 
      // or rely on the RPC to have done it.
      
      // Manual fuzzy rounding to 2 decimal places (approx 1.1km)
      const fuzzyLat = Math.round(worker.lat * 100) / 100
      const fuzzyLng = Math.round(worker.lng * 100) / 100

      return {
        profile_id: worker.profile_id,
        display_name: worker.display_name,
        distance_meters: Math.round(worker.distance * 10) / 10,
        skills: worker.skills || [],
        fuzzy_coords: {
          lat: fuzzyLat,
          lng: fuzzyLng
        }
      }
    })

    return new Response(
      JSON.stringify({ data: sanitizedData, meta: { count: sanitizedData.length } }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    )
  }
})
