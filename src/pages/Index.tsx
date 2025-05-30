
import { useState } from 'react';
import { Search, Car, Shield, Calendar, User, MapPin, Wrench, FileText } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";

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
  const { toast } = useToast();

  const formatVehicleNumber = (input: string) => {
    // Remove spaces and convert to uppercase
    const formatted = input.replace(/\s/g, '').toUpperCase();
    setVehicleNumber(formatted);
  };

  const fetchVehicleDetails = async () => {
    if (!vehicleNumber.trim()) {
      toast({
        title: "Invalid Input",
        description: "Please enter a valid vehicle number",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    setError('');
    setVehicleData(null);

    try {
      // First API URL
      console.log('Trying first API...');
      let response = await fetch(`https://apex.renewbuyinsurance.com/api/v1/vaahan/registration_number/?regn_no=${vehicleNumber}`);
      
      if (response.ok) {
        const data = await response.json();
        console.log('First API response:', data);
        setVehicleData(data);
        toast({
          title: "Vehicle Found!",
          description: "Vehicle details retrieved successfully",
        });
        setLoading(false);
        return;
      }

      // Second API URL (fallback)
      console.log('First API failed, trying second API...');
      response = await fetch(`https://apex.renewbuyinsurance.com/cv/api/v1/vaahan/registration_number/?regn_no=${vehicleNumber}`);
      
      if (response.ok) {
        const data = await response.json();
        console.log('Second API response:', data);
        if (data.status && data.vaahan_details) {
          setVehicleData(data.vaahan_details);
          toast({
            title: "Vehicle Found!",
            description: "Vehicle details retrieved successfully",
          });
        } else {
          throw new Error('Vehicle not found in database');
        }
      } else {
        throw new Error('Vehicle not found in any database');
      }
    } catch (err) {
      console.error('API Error:', err);
      setError('Vehicle not found. Please check the vehicle number and try again.');
      toast({
        title: "Vehicle Not Found",
        description: "Please verify the vehicle number and try again",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchVehicleDetails();
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
                    Searching...
                  </>
                ) : (
                  <>
                    <Search className="h-4 w-4 mr-2" />
                    Search
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Error Message */}
        {error && (
          <Card className="mb-8 bg-red-900/40 backdrop-blur-sm border-red-500/30">
            <CardContent className="pt-6">
              <p className="text-red-200 text-center">{error}</p>
            </CardContent>
          </Card>
        )}

        {/* Vehicle Details */}
        {vehicleData && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Owner Information */}
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

            {/* Vehicle Information */}
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

            {/* Detailed Vehicle Info (if available from meta_data) */}
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

            {/* Insurance Information */}
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

            {/* Additional Information */}
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

        {/* Features Section */}
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
