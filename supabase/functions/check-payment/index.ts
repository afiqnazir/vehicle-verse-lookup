
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
    console.log('Payment gateway raw response:', JSON.stringify(data, null, 2));

    if (data.status && data.result) {
      const txnStatus = data.result.txnStatus;
      const utrField = data.result.utr;
      
      console.log('Transaction status:', txnStatus);
      console.log('UTR field:', utrField);
      
      // Check if payment is successful: both SUCCESS status AND UTR field must exist
      const isSuccess = txnStatus === 'SUCCESS' && utrField && utrField.trim() !== '';
      const isPending = txnStatus === 'PENDING';
      const isFailed = txnStatus === 'FAILED' || txnStatus === 'CANCELLED';
      
      console.log('Payment analysis:', {
        isSuccess,
        isPending,
        isFailed,
        hasUtr: !!utrField
      });
      
      return new Response(
        JSON.stringify({
          success: true,
          txnStatus: txnStatus,
          orderId: data.result.orderId,
          amount: data.result.amount,
          date: data.result.date,
          utr: utrField || null,
          isPaymentSuccessful: isSuccess,
          isPaymentPending: isPending,
          isPaymentFailed: isFailed
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    } else {
      console.log('Payment check failed - invalid response structure:', data);
      return new Response(
        JSON.stringify({
          success: false,
          error: data.message || 'Failed to check payment status',
          isPaymentFailed: true
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
      JSON.stringify({ 
        success: false, 
        error: 'Internal server error',
        isPaymentFailed: true 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
