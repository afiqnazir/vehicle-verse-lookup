
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
    const { orderId } = await req.json();
    
    console.log(`Checking payment status for order: ${orderId}`);

    if (!orderId) {
      return new Response(
        JSON.stringify({ error: 'Order ID is required' }),
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

    const formData = new URLSearchParams();
    formData.append('user_token', userToken);
    formData.append('order_id', orderId);

    console.log('Checking payment status for order:', orderId);

    const response = await fetch('https://pay.knief.xyz/api/check-order-status', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData,
    });

    const data = await response.json();
    console.log('Payment status response:', data);

    if (data.status) {
      return new Response(
        JSON.stringify({
          success: true,
          txnStatus: data.result.txnStatus,
          orderId: data.result.orderId,
          amount: data.result.amount,
          date: data.result.date,
          utr: data.result.utr || null
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    } else {
      return new Response(
        JSON.stringify({
          error: data.message || 'Failed to check payment status'
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }
  } catch (error) {
    console.error('Error checking payment:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
