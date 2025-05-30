
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { vehicleNumber } = await req.json();
    
    console.log(`Looking up vehicle: ${vehicleNumber}`);

    if (!vehicleNumber || !vehicleNumber.trim()) {
      return new Response(
        JSON.stringify({ error: 'Vehicle number is required' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    let vehicleData = null;
    let apiUsed = '';

    // Try first API
    try {
      console.log('Trying first API...');
      const response1 = await fetch(
        `https://apex.renewbuyinsurance.com/api/v1/vaahan/registration_number/?regn_no=${vehicleNumber}`,
        {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
          },
        }
      );

      if (response1.ok) {
        const data = await response1.json();
        console.log('First API response:', data);
        vehicleData = data;
        apiUsed = 'first';
      }
    } catch (error) {
      console.log('First API failed:', error.message);
    }

    // Try second API if first failed
    if (!vehicleData) {
      try {
        console.log('Trying second API...');
        const response2 = await fetch(
          `https://apex.renewbuyinsurance.com/cv/api/v1/vaahan/registration_number/?regn_no=${vehicleNumber}`,
          {
            method: 'GET',
            headers: {
              'Accept': 'application/json',
              'Content-Type': 'application/json',
            },
          }
        );

        if (response2.ok) {
          const data = await response2.json();
          console.log('Second API response:', data);
          if (data.status && data.vaahan_details) {
            vehicleData = data.vaahan_details;
            apiUsed = 'second';
          }
        }
      } catch (error) {
        console.log('Second API failed:', error.message);
      }
    }

    if (vehicleData) {
      return new Response(
        JSON.stringify({ 
          success: true, 
          data: vehicleData,
          apiUsed,
          vehicleNumber 
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    } else {
      return new Response(
        JSON.stringify({ 
          error: 'Vehicle not found in any database',
          vehicleNumber 
        }),
        {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }
  } catch (error) {
    console.error('Error in vehicle-lookup function:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
