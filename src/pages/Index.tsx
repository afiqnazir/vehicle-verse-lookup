
import { useState } from 'react';
import { Search, Car, Shield, Calendar, User, MapPin, Wrench, FileText } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { PaymentModal } from "@/components/PaymentModal";

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
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const { toast } = useToast();

  const formatVehicleNumber = (input: string) => {
    // Remove spaces and convert to uppercase
    const formatted = input.replace(/\s/g, '').toUpperCase();
    setVehicleNumber(formatted);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!vehicleNumber.trim()) {
      toast({
        title: "Invalid Input",
        description: "Please enter a valid vehicle number",
        variant: "destructive",
      });
      return;
    }

    // Clear previous data and errors
    setVehicleData(null);
    setError('');
    
    // Show payment modal
    setShowPaymentModal(true);
  };

  const handleProceedToPayment = async (mobile: string) => {
    setPaymentLoading(true);
    
    try {
      console.log('Creating payment for vehicle lookup...');
      
      const { data, error } = await supabase.functions.invoke('create-payment', {
        body: { 
          vehicleNumber,
          customerMobile: mobile
        }
      });

      if (error) {
        console.error('Payment creation error:', error);
        throw new Error(error.message || 'Failed to create payment');
      }

      if (data.success) {
        console.log('Payment created successfully:', data);
        
        // Store vehicle number in URL params for payment status page
        const paymentUrl = `${data.paymentUrl}?orderId=${data.orderId}&vehicleNumber=${encodeURIComponent(vehicleNumber)}`;
        
        toast({
          title: "Payment Created!",
          description: "Redirecting to payment gateway...",
        });

        // Redirect to payment gateway
        window.location.href = paymentUrl;
      } else {
        throw new Error(data.error || 'Failed to create payment');
      }
    } catch (err) {
      console.error('Payment creation error:', err);
      setError('Unable to create payment. Please try again.');
      toast({
        title: "Payment Error",
        description: "Failed to create payment. Please try again.",
        variant: "destructive",
      });
    } finally {
      setPaymentLoading(false);
      setShowPaymentModal(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      {/* Header */}
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
        {/* Search Section */}
        <Card className="mb-8 bg-black/40 backdrop-blur-sm border-blue-500/30">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl text-white flex items-center justify-center space-x-2">
              <Search className="h-6 w-6" />
              <span>Vehicle Number Lookup</span>
            </CardTitle>
            <p className="text-blue-200">Enter your vehicle registration number to get complete RTO information</p>
            <div className="mt-2 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
              <p className="text-yellow-200 text-sm font-semibold">
                💳 Payment Required: ₹50 per vehicle lookup
              </p>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-4 max-w-md mx-auto">
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
                <Search className="h-4 w-4 mr-2" />
                Search (₹50)
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Error Message */}
        {error && (
          <Card className="mb-8 bg-red-900/40 backdrop-blur-sm border-red-500/30">
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-red-200 mb-2">{error}</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Payment Modal */}
        <PaymentModal
          isOpen={showPaymentModal}
          onClose={() => setShowPaymentModal(false)}
          onProceedToPayment={handleProceedToPayment}
          vehicleNumber={vehicleNumber}
          loading={paymentLoading}
        />

        {/* Features Section */}
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
              <h3 className="text-white font-semibold mb-2">Secure Payment</h3>
              <p className="text-blue-200 text-sm">Secure UPI payment gateway with instant confirmation</p>
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
      </div>
    </div>
  );
};

export default Index;
