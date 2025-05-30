import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const USER_TOKEN = "9856ce42fc26349fe5fab9c6b630e9c6";
const PAYMENT_API_URL = "https://pay.knief.xyz/api";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, orderData } = await req.json();

    if (action === 'create-order') {
      const payload = {
        customer_mobile: orderData.mobile,
        user_token: USER_TOKEN,
        amount: '50', // Fixed amount of 50 rupees
        order_id: orderData.orderId,
        redirect_url: orderData.redirectUrl,
        remark1: 'Vehicle Lookup Payment',
        remark2: orderData.vehicleNumber,
        route: '1'
      };

      const response = await fetch(`${PAYMENT_API_URL}/create-order`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams(payload),
      });

      const data = await response.json();
      return new Response(JSON.stringify(data), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'check-status') {
      const payload = {
        user_token: USER_TOKEN,
        order_id: orderData.orderId
      };

      const response = await fetch(`${PAYMENT_API_URL}/check-order-status`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams(payload),
      });

      const data = await response.json();
      return new Response(JSON.stringify(data), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(
      JSON.stringify({ error: 'Invalid action' }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});