import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

// Updated token for the payment API
const USER_TOKEN = "9856ce42fc26349fe5fab9c6b630e9c6";
const PAYMENT_API_URL = "https://pay.knief.xyz/api";

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
    const { action, orderData } = await req.json();

    if (action === 'create-order') {
      // Validate mobile number
      const mobileNumber = orderData.mobile?.replace(/\D/g, '') || '';
      if (mobileNumber.length !== 10) {
        return new Response(
          JSON.stringify({
            status: false,
            message: 'Invalid mobile number. Please provide a 10-digit mobile number.',
          }),
          {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      const payload = {
        customer_mobile: mobileNumber,
        user_token: USER_TOKEN,
        amount: '50', // Fixed amount of 50 rupees
        order_id: orderData.orderId,
        redirect_url: orderData.redirectUrl,
        remark1: 'Vehicle Lookup Payment',
        remark2: orderData.vehicleNumber,
        route: '1'
      };

      // Add error handling for network failures
      let response;
      try {
        response = await fetch(`${PAYMENT_API_URL}/create-order`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Accept': 'application/json',
          },
          body: new URLSearchParams(payload),
        });

        // Check if response is JSON
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
          console.error('Non-JSON response received:', {
            status: response.status,
            contentType,
            body: await response.text(),
          });
          return new Response(
            JSON.stringify({
              status: false,
              message: 'Payment service returned an invalid response format',
              error: 'Invalid response format'
            }),
            {
              status: 502,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            }
          );
        }

        let data;
        try {
          data = await response.json();
        } catch (jsonError) {
          console.error('JSON parsing error:', jsonError, 'Response:', await response.text());
          return new Response(
            JSON.stringify({
              status: false,
              message: 'Invalid response from payment service',
              error: 'JSON parsing failed'
            }),
            {
              status: 502,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            }
          );
        }

        // Check for payment_url in the response
        if (!data.payment_url) {
          console.error('Payment URL missing in response:', data);
          return new Response(
            JSON.stringify({
              status: false,
              message: 'Payment URL not received from payment service',
              error: 'Missing payment URL'
            }),
            {
              status: 502,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            }
          );
        }

        return new Response(
          JSON.stringify({
            status: true,
            payment_url: data.payment_url,
            message: 'Payment order created successfully'
          }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );

      } catch (networkError) {
        console.error('Payment API network error:', networkError);
        return new Response(
          JSON.stringify({ 
            status: false, 
            message: 'Payment service is temporarily unavailable. Please try again later.',
            error: networkError.message 
          }),
          {
            status: 503,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }
    }

    if (action === 'check-status') {
      const payload = {
        user_token: USER_TOKEN,
        order_id: orderData.orderId
      };

      // Add error handling for network failures
      let response;
      try {
        response = await fetch(`${PAYMENT_API_URL}/check-order-status`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Accept': 'application/json',
          },
          body: new URLSearchParams(payload),
        });

        // Check if response is JSON
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
          console.error('Non-JSON response received:', {
            status: response.status,
            contentType,
            body: await response.text(),
          });
          return new Response(
            JSON.stringify({
              status: false,
              message: 'Payment service returned an invalid response format',
              error: 'Invalid response format'
            }),
            {
              status: 502,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            }
          );
        }

        let data;
        try {
          data = await response.json();
        } catch (jsonError) {
          console.error('JSON parsing error:', jsonError, 'Response:', await response.text());
          return new Response(
            JSON.stringify({
              status: false,
              message: 'Invalid response from payment service',
              error: 'JSON parsing failed'
            }),
            {
              status: 502,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            }
          );
        }

        // Check for txnStatus in the response
        if (!data.txnStatus) {
          console.error('Transaction status missing in response:', data);
          return new Response(
            JSON.stringify({
              status: false,
              message: 'Transaction status not received from payment service',
              error: 'Missing transaction status'
            }),
            {
              status: 502,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            }
          );
        }

        return new Response(
          JSON.stringify({
            status: true,
            txnStatus: data.txnStatus,
            message: 'Payment status retrieved successfully'
          }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );

      } catch (networkError) {
        console.error('Payment status check network error:', networkError);
        return new Response(
          JSON.stringify({ 
            status: false, 
            message: 'Payment status check failed. Please try again.',
            error: networkError.message 
          }),
          {
            status: 503,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }
    }

    return new Response(
      JSON.stringify({ 
        status: false,
        message: 'Invalid action',
        error: 'The requested action is not supported' 
      }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Payment function error:', error);
    return new Response(
      JSON.stringify({ 
        status: false,
        message: 'Payment processing failed',
        error: error.message 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});