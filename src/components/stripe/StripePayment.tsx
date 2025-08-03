
import React, { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useMutation } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { CreditCard, DollarSign } from 'lucide-react';

interface StripePaymentProps {
  listingId: string;
  sellerId: string;
  amount: number;
  listingTitle: string;
  onPaymentSuccess?: (escrowId: string) => void;
}

export const StripePayment = ({ 
  listingId, 
  sellerId, 
  amount, 
  listingTitle,
  onPaymentSuccess 
}: StripePaymentProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);

  const createPaymentMutation = useMutation({
    mutationFn: async () => {
      setIsProcessing(true);
      
      const { data, error } = await supabase.functions.invoke('create-stripe-payment', {
        body: {
          listingId,
          sellerId,
          amount,
          buyerId: user?.id,
        },
      });

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      if (data.url) {
        // Open Stripe checkout in a new tab
        window.open(data.url, '_blank');
        toast({
          title: 'Payment initiated',
          description: 'Please complete your payment in the new tab.',
        });
        
        if (onPaymentSuccess && data.escrowId) {
          onPaymentSuccess(data.escrowId);
        }
      }
    },
    onError: (error) => {
      toast({
        title: 'Payment failed',
        description: error.message,
        variant: 'destructive',
      });
    },
    onSettled: () => {
      setIsProcessing(false);
    },
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <CreditCard className="h-5 w-5 mr-2" />
          Secure Payment
        </CardTitle>
        <CardDescription>
          Complete your purchase securely through Stripe
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="bg-muted p-4 rounded-lg">
          <h3 className="font-medium mb-2">{listingTitle}</h3>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Purchase Amount:</span>
            <span className="font-bold text-lg flex items-center">
              <DollarSign className="h-4 w-4" />
              {amount.toLocaleString()}
            </span>
          </div>
        </div>

        <div className="space-y-2">
          <Label>Escrow Protection</Label>
          <p className="text-sm text-muted-foreground">
            Your payment will be held in escrow until the transaction is completed and all 
            documents are signed. This ensures both buyer and seller are protected.
          </p>
        </div>

        <Button
          onClick={() => createPaymentMutation.mutate()}
          disabled={isProcessing || createPaymentMutation.isPending}
          className="w-full"
          size="lg"
        >
          {isProcessing || createPaymentMutation.isPending ? (
            'Processing...'
          ) : (
            <>
              <CreditCard className="h-4 w-4 mr-2" />
              Pay ${amount.toLocaleString()} Securely
            </>
          )}
        </Button>

        <div className="text-xs text-muted-foreground text-center">
          <p>🔒 Secured by Stripe • SSL Encrypted</p>
          <p>Your payment information is never stored on our servers</p>
        </div>
      </CardContent>
    </Card>
  );
};
