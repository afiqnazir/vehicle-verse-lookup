
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
  const [checkAttempts, setCheckAttempts] = useState(0);
  const [maxAttempts] = useState(10); // Maximum attempts to check payment status

  const orderId = searchParams.get('orderId');
  const vehicleNumber = searchParams.get('vehicleNumber');

  useEffect(() => {
    if (orderId) {
      checkPaymentStatus();
    } else {
      console.error('No order ID found in URL parameters');
      setPaymentStatus('failed');
    }
  }, [orderId]);

  const checkPaymentStatus = async () => {
    try {
      console.log('Checking payment status for order:', orderId, 'Attempt:', checkAttempts + 1);
      
      const { data, error } = await supabase.functions.invoke('check-payment', {
        body: { orderId }
      });

      if (error) {
        console.error('Payment check error:', error);
        setPaymentStatus('failed');
        toast({
          title: "Payment Check Failed",
          description: "Unable to verify payment status. Please try again.",
          variant: "destructive",
        });
        return;
      }

      console.log('Payment status response:', data);
      setPaymentDetails(data);

      // Handle successful payment verification
      if (data.success && data.isPaymentSuccessful) {
        console.log('Payment verified as successful with UTR:', data.utr);
        setPaymentStatus('success');
        
        // Fetch vehicle details since payment is successful
        if (vehicleNumber) {
          await fetchVehicleDetails();
        }
        
        toast({
          title: "Payment Successful!",
          description: `Payment verified! UTR: ${data.utr}`,
        });
      } 
      // Handle pending payment
      else if (data.success && data.isPaymentPending) {
        console.log('Payment is still pending');
        setPaymentStatus('pending');
        
        // Check again after 3 seconds, but only if we haven't exceeded max attempts
        if (checkAttempts < maxAttempts) {
          setTimeout(() => {
            setCheckAttempts(prev => prev + 1);
            checkPaymentStatus();
          }, 3000);
        } else {
          console.log('Max attempts reached, marking as failed');
          setPaymentStatus('failed');
          toast({
            title: "Payment Timeout",
            description: "Payment verification timed out. Please contact support if payment was deducted.",
            variant: "destructive",
          });
        }
      } 
      // Handle failed payment
      else if (data.isPaymentFailed || (data.success && data.txnStatus === 'FAILED')) {
        console.log('Payment marked as failed by gateway');
        setPaymentStatus('failed');
        toast({
          title: "Payment Failed",
          description: "Your payment was not successful. Please try again.",
          variant: "destructive",
        });
      }
      // Handle any other case as failed
      else {
        console.log('Payment status unclear, marking as failed. Data:', data);
        setPaymentStatus('failed');
        toast({
          title: "Payment Verification Failed",
          description: "Unable to confirm payment status. Please contact support.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error checking payment status:', error);
      setPaymentStatus('failed');
      toast({
        title: "Payment Check Error",
        description: "An error occurred while checking payment status.",
        variant: "destructive",
      });
    }
  };

  const fetchVehicleDetails = async () => {
    if (!vehicleNumber) return;

    try {
      console.log('Fetching vehicle details for:', vehicleNumber);
      const { data, error } = await supabase.functions.invoke('vehicle-lookup', {
        body: { vehicleNumber }
      });

      if (error) {
        console.error('Vehicle lookup error:', error);
        return;
      }

      if (data.success && data.data) {
        setVehicleData(data.data);
        console.log('Vehicle data fetched successfully');
      } else {
        console.error('Vehicle lookup failed:', data);
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

  const handleRetryCheck = () => {
    setCheckAttempts(0);
    setPaymentStatus('checking');
    checkPaymentStatus();
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
                <p className="text-blue-300 text-sm mt-2">Attempt {checkAttempts + 1} of {maxAttempts}</p>
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
                  <p className="text-blue-300 text-xs">
                    Order ID: {paymentDetails.orderId}
                  </p>
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
              <div className="text-center space-y-4">
                <p className="text-red-400">
                  Your payment could not be processed. This could be due to:
                </p>
                <ul className="text-blue-200 text-sm list-disc list-inside space-y-1">
                  <li>Payment was cancelled</li>
                  <li>Insufficient balance</li>
                  <li>Network issues</li>
                  <li>Payment gateway timeout</li>
                </ul>
                {paymentDetails && (
                  <div className="text-xs text-blue-300 mt-4">
                    <p>Order ID: {paymentDetails.orderId || orderId}</p>
                    {paymentDetails.txnStatus && (
                      <p>Status: {paymentDetails.txnStatus}</p>
                    )}
                  </div>
                )}
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
                <p className="text-blue-300 text-xs">
                  Checking... {checkAttempts + 1}/{maxAttempts}
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
              
              {paymentStatus === 'failed' && (
                <>
                  <Button
                    onClick={handleRetryCheck}
                    variant="outline"
                    className="flex-1 border-yellow-500/30 text-yellow-200 hover:bg-yellow-500/10"
                  >
                    Retry Check
                  </Button>
                  {vehicleNumber && (
                    <Button
                      onClick={handleTryAgain}
                      className="flex-1 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600"
                    >
                      Try Again
                    </Button>
                  )}
                </>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PaymentStatus;
