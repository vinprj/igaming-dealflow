
import React from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { DollarSign, FileText, CheckCircle, Clock } from 'lucide-react';

interface EscrowTransaction {
  id: string;
  listing_id: string;
  buyer_id: string;
  seller_id: string;
  amount: number;
  status: 'initiated' | 'funded' | 'completed' | 'disputed' | 'cancelled';
  stripe_payment_intent_id: string | null;
  docusign_envelope_id: string | null;
  completion_date: string | null;
  created_at: string;
  listings: {
    title: string;
  };
}

export const EscrowManager = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: escrowTransactions = [], isLoading } = useQuery({
    queryKey: ['escrow-transactions', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('escrow')
        .select(`
          *,
          listings (
            title
          )
        `)
        .or(`buyer_id.eq.${user?.id},seller_id.eq.${user?.id}`)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as EscrowTransaction[];
    },
    enabled: !!user?.id,
  });

  const completeEscrowMutation = useMutation({
    mutationFn: async (escrowId: string) => {
      const { error } = await supabase.functions.invoke('complete-escrow', {
        body: { escrowId },
      });

      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: 'Escrow completed',
        description: 'The escrow transaction has been completed successfully.',
      });
      queryClient.invalidateQueries({ queryKey: ['escrow-transactions'] });
    },
    onError: (error) => {
      toast({
        title: 'Failed to complete escrow',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      initiated: 'outline',
      funded: 'secondary',
      completed: 'default',
      disputed: 'destructive',
      cancelled: 'destructive',
    };

    return (
      <Badge variant={variants[status] || 'outline'}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'funded':
        return <DollarSign className="h-5 w-5 text-blue-500" />;
      default:
        return <Clock className="h-5 w-5 text-yellow-500" />;
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Escrow Transactions</CardTitle>
          <CardDescription>
            Monitor and manage your escrow transactions
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-4">Loading transactions...</div>
          ) : escrowTransactions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No escrow transactions found</p>
            </div>
          ) : (
            <div className="space-y-4">
              {escrowTransactions.map(transaction => (
                <div key={transaction.id} className="border rounded-lg p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-medium">{transaction.listings.title}</h3>
                      <p className="text-sm text-muted-foreground">
                        Amount: ${transaction.amount.toLocaleString()}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Role: {transaction.buyer_id === user?.id ? 'Buyer' : 'Seller'}
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      {getStatusIcon(transaction.status)}
                      {getStatusBadge(transaction.status)}
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="text-sm text-muted-foreground">
                      Created: {new Date(transaction.created_at).toLocaleDateString()}
                      {transaction.completion_date && (
                        <span className="ml-4">
                          Completed: {new Date(transaction.completion_date).toLocaleDateString()}
                        </span>
                      )}
                    </div>

                    {transaction.status === 'funded' && 
                     transaction.buyer_id === user?.id && 
                     transaction.docusign_envelope_id && (
                      <Button
                        size="sm"
                        onClick={() => completeEscrowMutation.mutate(transaction.id)}
                        disabled={completeEscrowMutation.isPending}
                      >
                        {completeEscrowMutation.isPending ? 'Processing...' : 'Release Funds'}
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
