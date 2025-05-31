
import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, XCircle, Clock, ArrowLeft, Loader2 } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const PaymentStatus = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [paymentStatus, setPaymentStatus] = useState<'checking' | 'success' | 'failed' | 'pending'>('checking');
  const [paymentDetails, setPaymentDetails] = useState<any>(null);
  const [vehicleData, setVehicleData] = useState<any>(null);

  const orderId = searchParams.get('orderId');
  const vehicleNumber = searchParams.get('vehicleNumber');

  useEffect(() => {
    if (orderId) {
      checkPaymentStatus();
    } else {
      setPaymentStatus('failed');
    }
  }, [orderId]);

  const checkPaymentStatus = async () => {
    try {
      console.log('Checking payment status for order:', orderId);
      
      const { data, error } = await supabase.functions.invoke('check-payment', {
        body: { orderId }
      });

      if (error) {
        console.error('Payment check error:', error);
        setPaymentStatus('failed');
        return;
      }

      console.log('Payment status response:', data);
      setPaymentDetails(data);

      if (data.success && data.txnStatus === 'SUCCESS') {
        setPaymentStatus('success');
        // Fetch vehicle details since payment is successful
        if (vehicleNumber) {
          await fetchVehicleDetails();
        }
        toast({
          title: "Payment Successful!",
          description: "Your payment has been confirmed. Fetching vehicle details...",
        });
      } else if (data.success && data.txnStatus === 'PENDING') {
        setPaymentStatus('pending');
        // Check again after 3 seconds
        setTimeout(() => {
          checkPaymentStatus();
        }, 3000);
      } else {
        setPaymentStatus('failed');
        toast({
          title: "Payment Failed",
          description: "Your payment could not be processed. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error checking payment status:', error);
      setPaymentStatus('failed');
    }
  };

  const fetchVehicleDetails = async () => {
    if (!vehicleNumber) return;

    try {
      const { data, error } = await supabase.functions.invoke('vehicle-lookup', {
        body: { vehicleNumber }
      });

      if (error) {
        console.error('Vehicle lookup error:', error);
        return;
      }

      if (data.success && data.data) {
        setVehicleData(data.data);
      }
    } catch (error) {
      console.error('Error fetching vehicle details:', error);
    }
  };

  const handleGoHome = () => {
    navigate('/');
  };

  const handleTryAgain = () => {
    navigate('/', { 
      state: { 
        vehicleNumber: vehicleNumber,
        retryPayment: true 
      } 
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 p-4">
      <div className="container mx-auto max-w-2xl py-8">
        <Card className="bg-black/40 backdrop-blur-sm border-blue-500/30">
          <CardHeader className="text-center">
            <CardTitle className="text-white flex items-center justify-center space-x-2">
              {paymentStatus === 'checking' && <Loader2 className="h-6 w-6 animate-spin" />}
              {paymentStatus === 'success' && <CheckCircle className="h-6 w-6 text-green-400" />}
              {paymentStatus === 'failed' && <XCircle className="h-6 w-6 text-red-400" />}
              {paymentStatus === 'pending' && <Clock className="h-6 w-6 text-yellow-400" />}
              <span>
                {paymentStatus === 'checking' && 'Verifying Payment...'}
                {paymentStatus === 'success' && 'Payment Successful!'}
                {paymentStatus === 'failed' && 'Payment Failed'}
                {paymentStatus === 'pending' && 'Payment Pending'}
              </span>
            </CardTitle>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {paymentStatus === 'checking' && (
              <div className="text-center">
                <p className="text-blue-200">Please wait while we verify your payment...</p>
              </div>
            )}

            {paymentStatus === 'success' && paymentDetails && (
              <div className="space-y-4">
                <div className="text-center space-y-2">
                  <p className="text-green-400 font-semibold">
                    Payment of ₹{paymentDetails.amount} completed successfully!
                  </p>
                  {paymentDetails.utr && (
                    <p className="text-blue-200 text-sm">
                      Transaction ID: {paymentDetails.utr}
                    </p>
                  )}
                </div>
                
                {vehicleData ? (
                  <div className="mt-6">
                    <h3 className="text-white font-semibold mb-4">Vehicle Details:</h3>
                    <div className="bg-white/5 p-4 rounded-lg space-y-2">
                      <p className="text-blue-200">
                        <span className="font-semibold">Registration:</span> 
                        <span className="text-white ml-2">{vehicleData.vehicle_details?.registration_no || 'N/A'}</span>
                      </p>
                      <p className="text-blue-200">
                        <span className="font-semibold">Owner:</span> 
                        <span className="text-white ml-2">{vehicleData.customer_details?.full_name || 'N/A'}</span>
                      </p>
                      <p className="text-blue-200">
                        <span className="font-semibold">Model:</span> 
                        <span className="text-white ml-2">{vehicleData.meta_data?.signzy_response?.result?.model || 'N/A'}</span>
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="text-center">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto text-blue-400" />
                    <p className="text-blue-200 mt-2">Loading vehicle details...</p>
                  </div>
                )}
              </div>
            )}

            {paymentStatus === 'failed' && (
              <div className="text-center space-y-2">
                <p className="text-red-400">
                  Your payment could not be processed. This could be due to:
                </p>
                <ul className="text-blue-200 text-sm list-disc list-inside space-y-1">
                  <li>Payment was cancelled</li>
                  <li>Insufficient balance</li>
                  <li>Network issues</li>
                </ul>
              </div>
            )}

            {paymentStatus === 'pending' && (
              <div className="text-center space-y-2">
                <p className="text-yellow-400">
                  Your payment is being processed. This may take a few minutes.
                </p>
                <p className="text-blue-200 text-sm">
                  We'll automatically check the status every few seconds.
                </p>
              </div>
            )}

            <div className="flex space-x-3 pt-4">
              <Button
                variant="outline"
                onClick={handleGoHome}
                className="flex-1 border-blue-500/30 text-blue-200 hover:bg-blue-500/10"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Home
              </Button>
              
              {paymentStatus === 'failed' && vehicleNumber && (
                <Button
                  onClick={handleTryAgain}
                  className="flex-1 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600"
                >
                  Try Again
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PaymentStatus;
