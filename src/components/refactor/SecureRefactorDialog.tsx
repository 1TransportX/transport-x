
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useSecurity } from '@/contexts/SecurityContext';
import { sanitizeInput, validateInputLength } from '@/utils/security';
import SecureInput from '@/components/forms/SecureInput';
import { RefreshCw, Shield, AlertTriangle } from 'lucide-react';

interface SecureRefactorDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  refactorType?: 'component' | 'data' | 'structure';
}

interface RefactorOperation {
  type: 'component' | 'data' | 'structure';
  target: string;
  description: string;
  safety_level: 'low' | 'medium' | 'high';
}

const SecureRefactorDialog: React.FC<SecureRefactorDialogProps> = ({
  isOpen,
  onClose,
  onSuccess,
  refactorType = 'component'
}) => {
  const { toast } = useToast();
  const { logSecurityEvent } = useSecurity();
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    type: refactorType,
    target: '',
    description: '',
    safety_level: 'medium' as 'low' | 'medium' | 'high',
    backup_created: false
  });

  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!formData.target.trim()) {
      errors.target = 'Target component/module is required';
    }

    if (!formData.description.trim()) {
      errors.description = 'Refactoring description is required';
    }

    const targetValidation = validateInputLength(formData.target, 2, 100, 'Target');
    if (!targetValidation.isValid) {
      errors.target = targetValidation.error || 'Invalid target';
    }

    const descValidation = validateInputLength(formData.description, 10, 500, 'Description');
    if (!descValidation.isValid) {
      errors.description = descValidation.error || 'Invalid description';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast({
        title: "Validation Error",
        description: "Please fix the errors before proceeding",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);

    try {
      // Log security event for refactoring operation
      logSecurityEvent('refactor_operation_initiated', 'info', {
        type: formData.type,
        target: sanitizeInput(formData.target),
        safety_level: formData.safety_level
      });

      // Simulate refactoring operation with security checks
      await simulateRefactorOperation({
        type: formData.type,
        target: sanitizeInput(formData.target),
        description: sanitizeInput(formData.description),
        safety_level: formData.safety_level
      });

      logSecurityEvent('refactor_operation_completed', 'info', {
        type: formData.type,
        target: sanitizeInput(formData.target)
      });

      toast({
        title: "Refactoring Completed",
        description: `Successfully refactored ${formData.type}: ${formData.target}`,
      });

      onSuccess();
      onClose();
      resetForm();
    } catch (error) {
      console.error('Error during refactoring:', error);
      logSecurityEvent('refactor_operation_error', 'error', { 
        error: error instanceof Error ? error.message : 'Unknown error',
        target: sanitizeInput(formData.target)
      });
      
      toast({
        title: "Refactoring Failed",
        description: "Unable to complete refactoring operation. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const simulateRefactorOperation = async (operation: RefactorOperation): Promise<void> => {
    // Simulate processing time based on safety level
    const processingTime = operation.safety_level === 'high' ? 3000 : 
                          operation.safety_level === 'medium' ? 2000 : 1000;
    
    await new Promise(resolve => setTimeout(resolve, processingTime));

    // Simulate potential failure for demonstration
    if (operation.target.toLowerCase().includes('critical')) {
      throw new Error('Cannot refactor critical system components');
    }
  };

  const resetForm = () => {
    setFormData({
      type: refactorType,
      target: '',
      description: '',
      safety_level: 'medium',
      backup_created: false
    });
    setValidationErrors({});
  };

  const getSafetyLevelIcon = (level: string) => {
    switch (level) {
      case 'high':
        return <Shield className="h-4 w-4 text-green-500" />;
      case 'medium':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'low':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      default:
        return <Shield className="h-4 w-4 text-gray-500" />;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <RefreshCw className="h-5 w-5" />
            Secure Refactoring Tool
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="refactor_type">Refactoring Type</Label>
            <Select
              value={formData.type}
              onValueChange={(value: 'component' | 'data' | 'structure') => 
                setFormData(prev => ({ ...prev, type: value }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select refactoring type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="component">Component Refactoring</SelectItem>
                <SelectItem value="data">Data Structure Refactoring</SelectItem>
                <SelectItem value="structure">System Structure Refactoring</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <SecureInput
            value={formData.target}
            onChange={(value) => setFormData(prev => ({ ...prev, target: value }))}
            label="Target Component/Module"
            placeholder="e.g., UserDashboard, InventoryManager"
            required
            maxLength={100}
            id="refactor_target"
          />
          {validationErrors.target && (
            <p className="text-xs text-red-500">{validationErrors.target}</p>
          )}

          <div>
            <Label htmlFor="description">Refactoring Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ 
                ...prev, 
                description: sanitizeInput(e.target.value) 
              }))}
              placeholder="Describe what changes will be made and why..."
              required
              maxLength={500}
              className={validationErrors.description ? 'border-red-500' : ''}
            />
            {validationErrors.description && (
              <p className="text-xs text-red-500">{validationErrors.description}</p>
            )}
          </div>

          <div>
            <Label htmlFor="safety_level">Safety Level</Label>
            <Select
              value={formData.safety_level}
              onValueChange={(value: 'low' | 'medium' | 'high') => 
                setFormData(prev => ({ ...prev, safety_level: value }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select safety level" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="high">
                  <div className="flex items-center gap-2">
                    {getSafetyLevelIcon('high')}
                    High - Maximum safety checks
                  </div>
                </SelectItem>
                <SelectItem value="medium">
                  <div className="flex items-center gap-2">
                    {getSafetyLevelIcon('medium')}
                    Medium - Standard safety checks
                  </div>
                </SelectItem>
                <SelectItem value="low">
                  <div className="flex items-center gap-2">
                    {getSafetyLevelIcon('low')}
                    Low - Minimal safety checks
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5" />
              <div className="text-sm text-yellow-800">
                <strong>Security Notice:</strong> All refactoring operations are logged and monitored. 
                Ensure you have proper permissions before proceeding.
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Refactoring...
                </>
              ) : (
                'Start Refactoring'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default SecureRefactorDialog;
