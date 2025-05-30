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

      const data = await response.json();

      // Check for specific error conditions in the API response
      if (!response.ok || !data.status) {
        console.error('Payment API create-order error:', {
          status: response.status,
          statusText: response.statusText,
          data
        });
        
        return new Response(
          JSON.stringify({ 
            status: false, 
            message: data.message || 'Payment initiation failed',
            error: data.error || response.statusText
          }),
          {
            status: response.status,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      return new Response(
        JSON.stringify(data),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
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

      const data = await response.json();

      // Check for specific error conditions in the API response
      if (!response.ok || !data.status) {
        console.error('Payment API check-status error:', {
          status: response.status,
          statusText: response.statusText,
          data
        });
        
        return new Response(
          JSON.stringify({ 
            status: false, 
            message: data.message || 'Payment status check failed',
            error: data.error || response.statusText
          }),
          {
            status: response.status,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      return new Response(
        JSON.stringify(data),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
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