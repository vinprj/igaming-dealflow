
import React from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { FileText, ExternalLink, CheckCircle, Clock, AlertCircle } from 'lucide-react';

interface DocuSignEnvelope {
  id: string;
  envelope_id: string;
  listing_id: string;
  buyer_id: string;
  seller_id: string;
  status: 'sent' | 'delivered' | 'completed' | 'declined' | 'voided';
  document_type: string;
  signing_url_buyer: string | null;
  signing_url_seller: string | null;
  completed_at: string | null;
  created_at: string;
  listings: {
    title: string;
  };
}

export const DocuSignManager = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: envelopes = [], isLoading } = useQuery({
    queryKey: ['docusign-envelopes', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('docusign_envelopes')
        .select(`
          *,
          listings (
            title
          )
        `)
        .or(`buyer_id.eq.${user?.id},seller_id.eq.${user?.id}`)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as DocuSignEnvelope[];
    },
    enabled: !!user?.id,
  });

  const createEnvelopeMutation = useMutation({
    mutationFn: async ({ listingId, buyerId }: { listingId: string; buyerId: string }) => {
      const { data, error } = await supabase.functions.invoke('create-docusign-envelope', {
        body: { listingId, buyerId },
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast({
        title: 'Document created',
        description: 'Purchase agreement has been created and sent for signing.',
      });
      queryClient.invalidateQueries({ queryKey: ['docusign-envelopes'] });
    },
    onError: (error) => {
      toast({
        title: 'Failed to create document',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      sent: 'outline',
      delivered: 'secondary',
      completed: 'default',
      declined: 'destructive',
      voided: 'destructive',
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
      case 'declined':
      case 'voided':
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      default:
        return <Clock className="h-5 w-5 text-yellow-500" />;
    }
  };

  const getSigningUrl = (envelope: DocuSignEnvelope) => {
    if (envelope.buyer_id === user?.id) {
      return envelope.signing_url_buyer;
    }
    return envelope.signing_url_seller;
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Document Signing</CardTitle>
          <CardDescription>
            Manage purchase agreements and legal documents
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-4">Loading documents...</div>
          ) : envelopes.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No documents found</p>
            </div>
          ) : (
            <div className="space-y-4">
              {envelopes.map(envelope => (
                <div key={envelope.id} className="border rounded-lg p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-medium">{envelope.listings.title}</h3>
                      <p className="text-sm text-muted-foreground capitalize">
                        Document: {envelope.document_type.replace('_', ' ')}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Role: {envelope.buyer_id === user?.id ? 'Buyer' : 'Seller'}
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      {getStatusIcon(envelope.status)}
                      {getStatusBadge(envelope.status)}
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="text-sm text-muted-foreground">
                      Created: {new Date(envelope.created_at).toLocaleDateString()}
                      {envelope.completed_at && (
                        <span className="ml-4">
                          Completed: {new Date(envelope.completed_at).toLocaleDateString()}
                        </span>
                      )}
                    </div>

                    {envelope.status !== 'completed' && getSigningUrl(envelope) && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => window.open(getSigningUrl(envelope), '_blank')}
                      >
                        <ExternalLink className="h-4 w-4 mr-1" />
                        Sign Document
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
