
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { vehicleNumber, customerMobile } = await req.json();
    
    console.log(`Creating payment for vehicle: ${vehicleNumber}`);

    if (!vehicleNumber || !customerMobile) {
      return new Response(
        JSON.stringify({ error: 'Vehicle number and customer mobile are required' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const userToken = Deno.env.get('PAYMENT_GATEWAY_TOKEN');
    if (!userToken) {
      return new Response(
        JSON.stringify({ error: 'Payment gateway not configured' }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Generate unique order ID
    const orderId = `VEH${Date.now()}${Math.floor(Math.random() * 1000)}`;
    
    // Create payment order
    const formData = new URLSearchParams();
    formData.append('customer_mobile', customerMobile);
    formData.append('user_token', userToken);
    formData.append('amount', '50');
    formData.append('order_id', orderId);
    formData.append('redirect_url', `${req.headers.get('origin')}/payment-status`);
    formData.append('remark1', `Vehicle lookup for ${vehicleNumber}`);
    formData.append('remark2', 'RTO Vehicle Information');
    formData.append('route', '1');

    console.log('Creating payment order with data:', {
      orderId,
      amount: '50',
      vehicleNumber,
      customerMobile
    });

    const response = await fetch('https://pay.knief.xyz/api/create-order', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData,
    });

    const data = await response.json();
    console.log('Payment gateway response:', data);

    if (data.status) {
      return new Response(
        JSON.stringify({
          success: true,
          orderId: data.result.orderId,
          paymentUrl: data.result.payment_url,
          vehicleNumber,
          amount: '50'
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    } else {
      return new Response(
        JSON.stringify({
          error: data.message || 'Failed to create payment order'
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }
  } catch (error) {
    console.error('Error creating payment:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
