import React, { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Camera, Upload, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { CameraCapture } from '@/components/ui/camera-capture';

interface DeliveryCompletionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  delivery: {
    id: string;
    delivery_number: string;
    customer_name: string;
  };
  vehicleId?: string;
  driverId: string;
  currentMileage: number;
  onComplete: () => void;
}

const DeliveryCompletionDialog: React.FC<DeliveryCompletionDialogProps> = ({
  isOpen,
  onClose,
  delivery,
  vehicleId,
  driverId,
  currentMileage,
  onComplete
}) => {
  const [mileageAfter, setMileageAfter] = useState('');
  const [odometerReading, setOdometerReading] = useState('');
  const [fuelRefilled, setFuelRefilled] = useState(false);
  const [fuelCost, setFuelCost] = useState('');
  const [receiptPhoto, setReceiptPhoto] = useState<File | null>(null);
  const [receiptPreview, setReceiptPreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleReceiptUpload = (file: File) => {
    if (file) {
      setReceiptPhoto(file);
      const previewUrl = URL.createObjectURL(file);
      setReceiptPreview(previewUrl);
    }
  };

  const handleCameraCapture = async () => {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        toast({
          title: "Camera Not Available",
          description: "Camera access is not available on this device. Please use the upload option instead.",
          variant: "destructive"
        });
        return;
      }
      setIsCameraOpen(true);
    } catch (error) {
      console.error('Camera access error:', error);
      toast({
        title: "Camera Error",
        description: "Unable to access camera. Please try the upload option instead.",
        variant: "destructive"
      });
    }
  };

  const handleCameraPhoto = (file: File) => {
    handleReceiptUpload(file);
    setIsCameraOpen(false);
  };

  const handleCameraCancel = () => {
    setIsCameraOpen(false);
  };

  const handleFileSelect = () => {
    fileInputRef.current?.click();
  };

  const removeReceipt = () => {
    setReceiptPhoto(null);
    if (receiptPreview) {
      URL.revokeObjectURL(receiptPreview);
      setReceiptPreview(null);
    }
  };

  const uploadReceiptPhoto = async (file: File): Promise<string | null> => {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${delivery.id}_${Date.now()}.${fileExt}`;
      
      const { data, error } = await supabase.storage
        .from('fuel-receipts')
        .upload(fileName, file);

      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage
        .from('fuel-receipts')
        .getPublicUrl(fileName);

      return publicUrl;
    } catch (error) {
      console.error('Error uploading receipt:', error);
      return null;
    }
  };

  const handleSubmit = async () => {
    if (!mileageAfter || !odometerReading) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive"
      });
      return;
    }

    if (fuelRefilled && (!fuelCost || !receiptPhoto)) {
      toast({
        title: "Missing Fuel Information",
        description: "Please enter fuel cost and upload receipt photo when refueling is selected.",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);

    try {
      let receiptUrl = null;
      
      if (fuelRefilled && receiptPhoto) {
        receiptUrl = await uploadReceiptPhoto(receiptPhoto);
        if (!receiptUrl) {
          throw new Error('Failed to upload receipt photo');
        }
      }

      // Create delivery completion record
      const { error: completionError } = await supabase
        .from('delivery_completions')
        .insert({
          delivery_id: delivery.id,
          driver_id: driverId,
          vehicle_id: vehicleId,
          mileage_before: currentMileage,
          mileage_after: parseInt(mileageAfter),
          odometer_reading: parseInt(odometerReading),
          fuel_refilled: fuelRefilled,
          fuel_cost: fuelRefilled ? parseFloat(fuelCost) : null,
          fuel_receipt_url: receiptUrl
        });

      if (completionError) throw completionError;

      // Update delivery with completion data
      const { error: deliveryError } = await supabase
        .from('deliveries')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString(),
          completion_mileage: parseInt(mileageAfter),
          completion_odometer: parseInt(odometerReading),
          fuel_receipt_url: receiptUrl,
          fuel_cost: fuelRefilled ? parseFloat(fuelCost) : null,
          completion_recorded_at: new Date().toISOString()
        })
        .eq('id', delivery.id);

      if (deliveryError) throw deliveryError;

      // Add fuel log if refueled
      if (fuelRefilled && fuelCost) {
        await supabase
          .from('fuel_logs')
          .insert({
            vehicle_id: vehicleId,
            driver_id: driverId,
            fuel_date: new Date().toISOString().split('T')[0],
            fuel_amount: 0, // We don't have volume, just cost
            cost: parseFloat(fuelCost),
            mileage: parseInt(odometerReading),
            location: 'Delivery Route'
          });
      }

      toast({
        title: "Delivery Completed",
        description: "Vehicle readings and delivery completion recorded successfully.",
      });

      onComplete();
      onClose();
    } catch (error) {
      console.error('Error completing delivery:', error);
      toast({
        title: "Error",
        description: "Failed to record delivery completion. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-md" aria-describedby="delivery-completion-desc">
          <DialogHeader>
            <DialogTitle>Complete Delivery</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="bg-gray-50 p-3 rounded-lg">
              <p className="text-sm font-medium">Delivery: {delivery.delivery_number}</p>
              <p className="text-sm text-gray-600">Customer: {delivery.customer_name}</p>
              <p className="text-sm text-gray-600">Current Mileage: {currentMileage} km</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="mileageAfter" className="text-sm font-medium">
                Mileage After Delivery (km) *
              </Label>
              <Input
                id="mileageAfter"
                type="number"
                value={mileageAfter}
                onChange={(e) => setMileageAfter(e.target.value)}
                placeholder="Enter mileage after delivery"
                min={currentMileage}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="odometerReading" className="text-sm font-medium">
                Final Odometer Reading (km) *
              </Label>
              <Input
                id="odometerReading"
                type="number"
                value={odometerReading}
                onChange={(e) => setOdometerReading(e.target.value)}
                placeholder="Enter final odometer reading"
              />
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="fuelRefilled"
                checked={fuelRefilled}
                onCheckedChange={setFuelRefilled}
              />
              <Label htmlFor="fuelRefilled" className="text-sm font-medium">
                Did you refuel the vehicle?
              </Label>
            </div>

            {fuelRefilled && (
              <div className="space-y-4 border-t pt-4">
                <div className="space-y-2">
                  <Label htmlFor="fuelCost" className="text-sm font-medium">
                    Fuel Cost *
                  </Label>
                  <Input
                    id="fuelCost"
                    type="number"
                    step="0.01"
                    value={fuelCost}
                    onChange={(e) => setFuelCost(e.target.value)}
                    placeholder="Enter fuel cost"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium">Fuel Receipt Photo *</Label>
                  
                  {receiptPreview ? (
                    <div className="relative">
                      <img 
                        src={receiptPreview} 
                        alt="Receipt preview" 
                        className="w-full h-32 object-cover rounded-lg border"
                      />
                      <Button
                        type="button"
                        size="sm"
                        variant="destructive"
                        className="absolute top-2 right-2"
                        onClick={removeReceipt}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <div className="flex space-x-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleCameraCapture}
                        className="flex-1"
                      >
                        <Camera className="h-4 w-4 mr-2" />
                        Camera
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleFileSelect}
                        className="flex-1"
                      >
                        <Upload className="h-4 w-4 mr-2" />
                        Upload
                      </Button>
                    </div>
                  )}

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={(e) => e.target.files?.[0] && handleReceiptUpload(e.target.files[0])}
                    className="hidden"
                  />
                </div>
              </div>
            )}

            <div className="flex space-x-2 pt-4">
              <Button
                variant="outline"
                onClick={onClose}
                disabled={isSubmitting}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="flex-1"
              >
                {isSubmitting ? 'Recording...' : 'Complete Delivery'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <CameraCapture
        isOpen={isCameraOpen}
        onCapture={handleCameraPhoto}
        onCancel={handleCameraCancel}
      />
    </>
  );
};

export default DeliveryCompletionDialog;
