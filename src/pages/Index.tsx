import { useState } from 'react';
import { Search, Car, Shield, Calendar, User, MapPin, Wrench, FileText, IndianRupee } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface VehicleDetails {
  customer_details?: {
    full_name?: string;
    communication_address?: {
      address_line?: string;
      pincode?: number;
    };
  };
  nominee_details?: {
    name?: string;
  };
  vehicle_details?: {
    registration_no?: string;
    engine_no?: string;
    chassis_no?: string;
    registration_date?: string;
    manufacture_date?: string;
    vehicle_color?: string;
    vehicle_type?: string;
    is_vehicle_financed?: boolean;
    registration_address?: {
      address_line?: string;
      pincode?: number;
    };
  };
  meta_data?: {
    signzy_response?: {
      result?: {
        class?: string;
        vehicleManufacturerName?: string;
        model?: string;
        type?: string;
        normsType?: string;
        bodyType?: string;
        ownerCount?: string;
        status?: string;
        vehicleInsuranceCompanyName?: string;
        vehicleInsuranceUpto?: string;
        vehicleInsurancePolicyNumber?: string;
        rcFinancer?: string;
        vehicleCubicCapacity?: string;
        grossVehicleWeight?: string;
        vehicleSeatCapacity?: string;
        puccUpto?: string;
        rtoCode?: string;
      };
    };
  };
  previous_policy_exp_date?: string;
  previous_policy_number?: string;
  previous_year_ncb?: number;
  is_commercial?: boolean;
  is_two_wheeler?: boolean;
  is_four_wheeler?: boolean;
}

const Index = () => {
  const [vehicleNumber, setVehicleNumber] = useState('');
  const [vehicleData, setVehicleData] = useState<VehicleDetails | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [paymentUrl, setPaymentUrl] = useState('');
  const [orderId, setOrderId] = useState('');
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [paymentVerifying, setPaymentVerifying] = useState(false);
  const { toast } = useToast();

  const formatVehicleNumber = (input: string) => {
    const formatted = input.replace(/\s/g, '').toUpperCase();
    setVehicleNumber(formatted);
  };

  const generateOrderId = () => {
    return `VL${Date.now()}${Math.floor(Math.random() * 1000)}`;
  };

  const initiatePayment = async () => {
    setLoading(true);
    setError('');
    
    try {
      const newOrderId = generateOrderId();
      const { data: paymentData, error: paymentError } = await supabase.functions.invoke('payment', {
        body: {
          action: 'create-order',
          orderData: {
            mobile: '0000000000', // You might want to add a mobile input field
            orderId: newOrderId,
            redirectUrl: window.location.href,
            vehicleNumber
          }
        }
      });

      if (paymentError) throw new Error(paymentError.message);
      if (!paymentData.status) throw new Error(paymentData.message);

      setOrderId(newOrderId);
      setPaymentUrl(paymentData.result.payment_url);
      setShowPaymentDialog(true);
      
      // Open payment URL in new window
      window.open(paymentData.result.payment_url, '_blank');
      
      // Start checking payment status
      checkPaymentStatus(newOrderId);
    } catch (err) {
      console.error('Payment initiation error:', err);
      toast({
        title: "Payment Error",
        description: "Failed to initiate payment. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const checkPaymentStatus = async (orderIdToCheck: string) => {
    setPaymentVerifying(true);
    
    const checkStatus = async () => {
      try {
        const { data: statusData, error: statusError } = await supabase.functions.invoke('payment', {
          body: {
            action: 'check-status',
            orderData: {
              orderId: orderIdToCheck
            }
          }
        });

        if (statusError) throw new Error(statusError.message);

        if (statusData.status && statusData.result.txnStatus === 'SUCCESS') {
          setShowPaymentDialog(false);
          setPaymentVerifying(false);
          fetchVehicleDetails();
          return true;
        }

        return false;
      } catch (err) {
        console.error('Payment status check error:', err);
        return false;
      }
    };

    // Check every 5 seconds for 2 minutes
    let attempts = 0;
    const maxAttempts = 24;
    
    const intervalId = setInterval(async () => {
      attempts++;
      const success = await checkStatus();
      
      if (success || attempts >= maxAttempts) {
        clearInterval(intervalId);
        setPaymentVerifying(false);
        if (!success && attempts >= maxAttempts) {
          toast({
            title: "Payment Timeout",
            description: "Please try initiating the payment again.",
            variant: "destructive",
          });
          setShowPaymentDialog(false);
        }
      }
    }, 5000);
  };

  const fetchVehicleDetails = async () => {
    setLoading(true);
    setError('');
    setVehicleData(null);

    try {
      const { data, error: functionError } = await supabase.functions.invoke('vehicle-lookup', {
        body: { vehicleNumber }
      });

      if (functionError) throw new Error(functionError.message);

      if (data.success && data.data) {
        setVehicleData(data.data);
        toast({
          title: "Vehicle Found!",
          description: `Vehicle details retrieved successfully using ${data.apiUsed} API`,
        });
      } else {
        throw new Error(data.error || 'Vehicle not found in database');
      }
    } catch (err) {
      console.error('Vehicle lookup error:', err);
      setError('Unable to fetch vehicle details. Please try again or check if the vehicle number is correct.');
      toast({
        title: "Vehicle Not Found",
        description: "Please check the vehicle number and try again",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    initiatePayment();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      <div className="bg-black/20 backdrop-blur-sm border-b border-blue-500/20">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl">
              <Car className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">All In One RTO Info</h1>
              <p className="text-blue-200">Complete Vehicle Information System</p>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <Card className="mb-8 bg-black/40 backdrop-blur-sm border-blue-500/30">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl text-white flex items-center justify-center space-x-2">
              <Search className="h-6 w-6" />
              <span>Vehicle Number Lookup</span>
            </CardTitle>
            <p className="text-blue-200">Enter your vehicle registration number to get complete RTO information</p>
            <div className="mt-2">
              <Badge variant="secondary" className="bg-green-500/20 text-green-200">
                <IndianRupee className="h-4 w-4 mr-1" />
                50 per search
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="flex flex-col md:flex-row gap-4 max-w-md mx-auto">
              <div className="flex-1">
                <Input
                  type="text"
                  placeholder="e.g., MH01AB1234"
                  value={vehicleNumber}
                  onChange={(e) => formatVehicleNumber(e.target.value)}
                  className="bg-white/10 border-blue-500/30 text-white placeholder:text-blue-200 text-lg h-12"
                  disabled={loading}
                />
              </div>
              <Button 
                type="submit"
                disabled={loading || !vehicleNumber.trim()}
                className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 h-12 px-8"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Processing...
                  </>
                ) : (
                  <>
                    <IndianRupee className="h-4 w-4 mr-2" />
                    Pay & Search
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Complete Payment</DialogTitle>
              <DialogDescription>
                {paymentVerifying ? (
                  <div className="text-center py-4">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
                    <p>Verifying payment status...</p>
                    <p className="text-sm text-muted-foreground mt-2">Please complete the payment in the opened window</p>
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <p>Please complete the payment of ₹50 in the opened window.</p>
                    <p className="text-sm text-muted-foreground mt-2">If the payment window is closed, click below to reopen</p>
                    <Button
                      className="mt-4"
                      onClick={() => window.open(paymentUrl, '_blank')}
                    >
                      Reopen Payment Window
                    </Button>
                  </div>
                )}
              </DialogDescription>
            </DialogHeader>
          </DialogContent>
        </Dialog>

        {error && (
          <Card className="mb-8 bg-red-900/40 backdrop-blur-sm border-red-500/30">
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-red-200 mb-2">{error}</p>
              </div>
            </CardContent>
          </Card>
        )}

        {vehicleData && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="bg-black/40 backdrop-blur-sm border-blue-500/30">
              <CardHeader>
                <CardTitle className="text-white flex items-center space-x-2">
                  <User className="h-5 w-5" />
                  <span>Owner Information</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-blue-200 text-sm">Owner Name</p>
                  <p className="text-white font-semibold">{vehicleData.customer_details?.full_name || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-blue-200 text-sm">Nominee</p>
                  <p className="text-white font-semibold">{vehicleData.nominee_details?.name || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-blue-200 text-sm">Address</p>
                  <p className="text-white">{vehicleData.customer_details?.communication_address?.address_line || 'N/A'}</p>
                  {vehicleData.customer_details?.communication_address?.pincode && (
                    <p className="text-blue-300">Pincode: {vehicleData.customer_details.communication_address.pincode}</p>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-black/40 backdrop-blur-sm border-blue-500/30">
              <CardHeader>
                <CardTitle className="text-white flex items-center space-x-2">
                  <Car className="h-5 w-5" />
                  <span>Vehicle Information</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-blue-200 text-sm">Registration Number</p>
                  <p className="text-white font-semibold text-lg">{vehicleData.vehicle_details?.registration_no || 'N/A'}</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-blue-200 text-sm">Engine Number</p>
                    <p className="text-white font-mono">{vehicleData.vehicle_details?.engine_no || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-blue-200 text-sm">Chassis Number</p>
                    <p className="text-white font-mono">{vehicleData.vehicle_details?.chassis_no || 'N/A'}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-blue-200 text-sm">Registration Date</p>
                    <p className="text-white">{vehicleData.vehicle_details?.registration_date || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-blue-200 text-sm">Manufacture Date</p>
                    <p className="text-white">{vehicleData.vehicle_details?.manufacture_date || 'N/A'}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-blue-200 text-sm">Color</p>
                    <p className="text-white">{vehicleData.vehicle_details?.vehicle_color || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-blue-200 text-sm">Vehicle Type</p>
                    <Badge variant="secondary" className="bg-blue-500/20 text-blue-200">
                      {vehicleData.vehicle_details?.vehicle_type || 'N/A'}
                    </Badge>
                  </div>
                </div>
                <div>
                  <p className="text-blue-200 text-sm">Financed</p>
                  <Badge variant={vehicleData.vehicle_details?.is_vehicle_financed ? "destructive" : "default"}>
                    {vehicleData.vehicle_details?.is_vehicle_financed ? 'Yes' : 'No'}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {vehicleData.meta_data?.signzy_response?.result && (
              <Card className="bg-black/40 backdrop-blur-sm border-blue-500/30 lg:col-span-2">
                <CardHeader>
                  <CardTitle className="text-white flex items-center space-x-2">
                    <Wrench className="h-5 w-5" />
                    <span>Technical Specifications</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <div className="space-y-4">
                      <div>
                        <p className="text-blue-200 text-sm">Manufacturer</p>
                        <p className="text-white font-semibold">{vehicleData.meta_data.signzy_response.result.vehicleManufacturerName || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-blue-200 text-sm">Model</p>
                        <p className="text-white">{vehicleData.meta_data.signzy_response.result.model || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-blue-200 text-sm">Vehicle Class</p>
                        <p className="text-white">{vehicleData.meta_data.signzy_response.result.class || 'N/A'}</p>
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      <div>
                        <p className="text-blue-200 text-sm">Fuel Type</p>
                        <p className="text-white">{vehicleData.meta_data.signzy_response.result.type || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-blue-200 text-sm">Engine Capacity</p>
                        <p className="text-white">{vehicleData.meta_data.signzy_response.result.vehicleCubicCapacity ? `${vehicleData.meta_data.signzy_response.result.vehicleCubicCapacity} CC` : 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-blue-200 text-sm">Seating Capacity</p>
                        <p className="text-white">{vehicleData.meta_data.signzy_response.result.vehicleSeatCapacity || 'N/A'}</p>
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      <div>
                        <p className="text-blue-200 text-sm">Emission Norms</p>
                        <p className="text-white">{vehicleData.meta_data.signzy_response.result.normsType || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-blue-200 text-sm">Gross Weight</p>
                        <p className="text-white">{vehicleData.meta_data.signzy_response.result.grossVehicleWeight ? `${vehicleData.meta_data.signzy_response.result.grossVehicleWeight} KG` : 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-blue-200 text-sm">Status</p>
                        <Badge variant="default" className="bg-green-500/20 text-green-200">
                          {vehicleData.meta_data.signzy_response.result.status || 'N/A'}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            <Card className="bg-black/40 backdrop-blur-sm border-blue-500/30">
              <CardHeader>
                <CardTitle className="text-white flex items-center space-x-2">
                  <Shield className="h-5 w-5" />
                  <span>Insurance Information</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-blue-200 text-sm">Insurance Company</p>
                  <p className="text-white font-semibold">{vehicleData.meta_data?.signzy_response?.result?.vehicleInsuranceCompanyName || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-blue-200 text-sm">Policy Number</p>
                  <p className="text-white font-mono">{vehicleData.previous_policy_number || vehicleData.meta_data?.signzy_response?.result?.vehicleInsurancePolicyNumber || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-blue-200 text-sm">Insurance Valid Upto</p>
                  <p className="text-white">{vehicleData.previous_policy_exp_date || vehicleData.meta_data?.signzy_response?.result?.vehicleInsuranceUpto || 'N/A'}</p>
                </div>
                {vehicleData.previous_year_ncb !== undefined && (
                  <div>
                    <p className="text-blue-200 text-sm">Previous Year NCB</p>
                    <Badge variant="default" className="bg-green-500/20 text-green-200">
                      {vehicleData.previous_year_ncb}%
                    </Badge>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="bg-black/40 backdrop-blur-sm border-blue-500/30">
              <CardHeader>
                <CardTitle className="text-white flex items-center space-x-2">
                  <FileText className="h-5 w-5" />
                  <span>Additional Information</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {vehicleData.meta_data?.signzy_response?.result?.rcFinancer && (
                  <div>
                    <p className="text-blue-200 text-sm">Financer</p>
                    <p className="text-white">{vehicleData.meta_data.signzy_response.result.rcFinancer}</p>
                  </div>
                )}
                {vehicleData.meta_data?.signzy_response?.result?.puccUpto && (
                  <div>
                    <p className="text-blue-200 text-sm">PUCC Valid Upto</p>
                    <p className="text-white">{vehicleData.meta_data.signzy_response.result.puccUpto}</p>
                  </div>
                )}
                {vehicleData.meta_data?.signzy_response?.result?.rtoCode && (
                  <div>
                    <p className="text-blue-200 text-sm">RTO Code</p>
                    <p className="text-white">{vehicleData.meta_data.signzy_response.result.rtoCode}</p>
                  </div>
                )}
                <div className="flex flex-wrap gap-2">
                  {vehicleData.is_commercial && (
                    <Badge variant="outline" className="border-orange-500 text-orange-200">Commercial</Badge>
                  )}
                  {vehicleData.is_two_wheeler && (
                    <Badge variant="outline" className="border-blue-500 text-blue-200">Two Wheeler</Badge>
                  )}
                  {vehicleData.is_four_wheeler && (
                    <Badge variant="outline" className="border-green-500 text-green-200">Four Wheeler</Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {!vehicleData && !loading && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
            <Card className="bg-black/40 backdrop-blur-sm border-blue-500/30 text-center">
              <CardContent className="pt-6">
                <div className="p-3 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl w-fit mx-auto mb-4">
                  <Search className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-white font-semibold mb-2">Quick Search</h3>
                <p className="text-blue-200 text-sm">Instant vehicle information lookup with advanced search algorithms</p>
              </CardContent>
            </Card>
            
            <Card className="bg-black/40 backdrop-blur-sm border-blue-500/30 text-center">
              <CardContent className="pt-6">
                <div className="p-3 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl w-fit mx-auto mb-4">
                  <Shield className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-white font-semibold mb-2">Secure & Reliable</h3>
                <p className="text-blue-200 text-sm">Multiple data sources ensure accurate and up-to-date information</p>
              </CardContent>
            </Card>
            
            <Card className="bg-black/40 backdrop-blur-sm border-blue-500/30 text-center">
              <CardContent className="pt-6">
                <div className="p-3 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl w-fit mx-auto mb-4">
                  <FileText className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-white font-semibold mb-2">Complete Details</h3>
                <p className="text-blue-200 text-sm">Comprehensive vehicle information including insurance and technical specs</p>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

export default Index;