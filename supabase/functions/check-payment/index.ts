
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
    // Parse the request body
    const requestBody = await req.text();
    console.log('Raw request body:', requestBody);
    
    let orderId;
    
    // Try to parse as JSON first
    try {
      const jsonBody = JSON.parse(requestBody);
      orderId = jsonBody.orderId;
      console.log('Parsed JSON orderId:', orderId);
    } catch (jsonError) {
      console.log('Failed to parse as JSON, trying form data');
      
      // If JSON parsing fails, try form data
      const formData = new URLSearchParams(requestBody);
      orderId = formData.get('orderId');
      console.log('Parsed form orderId:', orderId);
    }
    
    console.log(`Final orderId for payment check: ${orderId}`);

    if (!orderId || orderId === 'null' || orderId === 'undefined') {
      console.error('Invalid order ID received:', orderId);
      return new Response(
        JSON.stringify({ 
          success: false,
          error: 'Order ID is required and cannot be null',
          isPaymentFailed: true 
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const userToken = Deno.env.get('PAYMENT_GATEWAY_TOKEN');
    if (!userToken) {
      console.error('Payment gateway token not configured');
      return new Response(
        JSON.stringify({ 
          success: false,
          error: 'Payment gateway not configured',
          isPaymentFailed: true 
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Prepare form data for the payment gateway API
    const formData = new URLSearchParams();
    formData.append('user_token', userToken);
    formData.append('order_id', orderId.toString());

    console.log('Sending request to payment gateway with orderId:', orderId);

    const response = await fetch('https://pay.knief.xyz/api/check-order-status', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData,
    });

    if (!response.ok) {
      console.error('Payment gateway HTTP error:', response.status, response.statusText);
      return new Response(
        JSON.stringify({
          success: false,
          error: `Payment gateway error: ${response.status}`,
          isPaymentFailed: true
        }),
        {
          status: response.status,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const responseText = await response.text();
    console.log('Payment gateway raw response text:', responseText);

    let data;
    try {
      data = JSON.parse(responseText);
    } catch (parseError) {
      console.error('Failed to parse payment gateway response:', parseError);
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Invalid response from payment gateway',
          isPaymentFailed: true
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    console.log('Payment gateway parsed response:', JSON.stringify(data, null, 2));

    // Check if the response has the expected structure
    if (data.status === true && data.result) {
      const txnStatus = data.result.txnStatus;
      const utrField = data.result.utr;
      const orderId = data.result.orderId;
      const amount = data.result.amount;
      const date = data.result.date;
      
      console.log('Transaction details:', {
        txnStatus,
        utrField,
        orderId,
        amount,
        date,
        hasUtr: !!utrField
      });
      
      // Payment is successful ONLY if txnStatus is SUCCESS AND utr field exists and is not empty
      const isSuccess = txnStatus === 'SUCCESS' && utrField && utrField.toString().trim() !== '';
      const isPending = txnStatus === 'PENDING';
      const isFailed = txnStatus === 'FAILED' || txnStatus === 'CANCELLED' || (!isSuccess && !isPending);
      
      console.log('Payment status analysis:', {
        isSuccess,
        isPending,
        isFailed,
        txnStatus,
        utrExists: !!utrField,
        utrValue: utrField
      });
      
      return new Response(
        JSON.stringify({
          success: true,
          txnStatus: txnStatus,
          orderId: orderId,
          amount: amount,
          date: date,
          utr: utrField || null,
          isPaymentSuccessful: isSuccess,
          isPaymentPending: isPending,
          isPaymentFailed: isFailed
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    } else if (data.status === false) {
      // API returned an error
      console.log('Payment gateway returned error:', data.message);
      return new Response(
        JSON.stringify({
          success: false,
          error: data.message || 'Payment check failed',
          isPaymentFailed: true
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    } else {
      // Unexpected response structure
      console.log('Unexpected response structure:', data);
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Unexpected response from payment gateway',
          isPaymentFailed: true
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }
  } catch (error) {
    console.error('Error in check-payment function:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: 'Internal server error while checking payment',
        details: error.message,
        isPaymentFailed: true 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
