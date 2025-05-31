
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CreditCard, Phone } from 'lucide-react';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProceedToPayment: (mobile: string) => void;
  vehicleNumber: string;
  loading: boolean;
}

export const PaymentModal = ({ 
  isOpen, 
  onClose, 
  onProceedToPayment, 
  vehicleNumber, 
  loading 
}: PaymentModalProps) => {
  const [mobile, setMobile] = useState('');
  const [mobileError, setMobileError] = useState('');

  const validateMobile = (mobileNumber: string) => {
    const mobileRegex = /^[6-9]\d{9}$/;
    return mobileRegex.test(mobileNumber);
  };

  const handleProceed = () => {
    if (!mobile.trim()) {
      setMobileError('Mobile number is required');
      return;
    }
    
    if (!validateMobile(mobile)) {
      setMobileError('Please enter a valid 10-digit mobile number');
      return;
    }

    setMobileError('');
    onProceedToPayment(mobile);
  };

  const handleMobileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 10);
    setMobile(value);
    if (mobileError) setMobileError('');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-slate-900 border-blue-500/30">
        <DialogHeader>
          <DialogTitle className="text-white flex items-center space-x-2">
            <CreditCard className="h-5 w-5" />
            <span>Payment Required</span>
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          <div className="text-center space-y-2">
            <p className="text-blue-200">
              To view complete vehicle details for
            </p>
            <p className="text-white font-semibold text-lg">{vehicleNumber}</p>
            <p className="text-blue-200">
              You need to pay a small fee of
            </p>
            <p className="text-green-400 font-bold text-2xl">₹50</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="mobile" className="text-blue-200 flex items-center space-x-2">
              <Phone className="h-4 w-4" />
              <span>Mobile Number</span>
            </Label>
            <Input
              id="mobile"
              type="tel"
              placeholder="Enter 10-digit mobile number"
              value={mobile}
              onChange={handleMobileChange}
              className="bg-white/10 border-blue-500/30 text-white placeholder:text-blue-200"
              disabled={loading}
            />
            {mobileError && (
              <p className="text-red-400 text-sm">{mobileError}</p>
            )}
          </div>

          <div className="flex space-x-3">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={loading}
              className="flex-1 border-blue-500/30 text-blue-200 hover:bg-blue-500/10"
            >
              Cancel
            </Button>
            <Button
              onClick={handleProceed}
              disabled={loading || !mobile}
              className="flex-1 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Processing...
                </>
              ) : (
                <>
                  <CreditCard className="h-4 w-4 mr-2" />
                  Pay ₹50 & Continue
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
