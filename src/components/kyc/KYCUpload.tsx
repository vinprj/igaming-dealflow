
import React, { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Upload, FileText, CheckCircle, XCircle, Clock } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

const documentTypes = [
  { value: 'passport', label: 'Passport' },
  { value: 'drivers_license', label: 'Driver\'s License' },
  { value: 'national_id', label: 'National ID' },
  { value: 'utility_bill', label: 'Utility Bill' },
  { value: 'bank_statement', label: 'Bank Statement' },
];

export const KYCUpload = () => {
  const [selectedDocumentType, setSelectedDocumentType] = useState<string>('');
  const [uploadingFile, setUploadingFile] = useState<File | null>(null);
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: kycDocuments = [], isLoading } = useQuery({
    queryKey: ['kyc-documents', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('kyc_documents')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  const uploadMutation = useMutation({
    mutationFn: async ({ file, documentType }: { file: File; documentType: string }) => {
      if (!user?.id) throw new Error('No user ID');

      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${documentType}_${Date.now()}.${fileExt}`;

      // Upload file to storage
      const { error: uploadError } = await supabase.storage
        .from('kyc-documents')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      // Create database record
      const { error: dbError } = await supabase
        .from('kyc_documents')
        .insert({
          user_id: user.id,
          document_type: documentType,
          file_path: fileName,
          file_name: file.name,
          mime_type: file.type,
          file_size: file.size,
        });

      if (dbError) throw dbError;
    },
    onSuccess: () => {
      toast({
        title: 'Document uploaded',
        description: 'Your KYC document has been uploaded successfully and is pending review.',
      });
      queryClient.invalidateQueries({ queryKey: ['kyc-documents'] });
      setUploadingFile(null);
      setSelectedDocumentType('');
    },
    onError: (error) => {
      toast({
        title: 'Upload failed',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !selectedDocumentType) return;

    // Validate file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: 'File too large',
        description: 'Please select a file smaller than 5MB.',
        variant: 'destructive',
      });
      return;
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'application/pdf'];
    if (!allowedTypes.includes(file.type)) {
      toast({
        title: 'Invalid file type',
        description: 'Please upload a JPEG, PNG, or PDF file.',
        variant: 'destructive',
      });
      return;
    }

    setUploadingFile(file);
    uploadMutation.mutate({ file, documentType: selectedDocumentType });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'rejected':
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return <Clock className="h-5 w-5 text-yellow-500" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'approved':
        return 'Approved';
      case 'rejected':
        return 'Rejected';
      default:
        return 'Pending Review';
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Upload KYC Documents</CardTitle>
          <CardDescription>
            Upload your identity verification documents for account verification
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="document-type">Document Type</Label>
            <Select value={selectedDocumentType} onValueChange={setSelectedDocumentType}>
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Select document type" />
              </SelectTrigger>
              <SelectContent>
                {documentTypes.map(type => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="file-upload">Choose File</Label>
            <div className="mt-1 flex items-center space-x-4">
              <Input
                id="file-upload"
                type="file"
                accept=".jpg,.jpeg,.png,.pdf"
                onChange={handleFileUpload}
                disabled={!selectedDocumentType || uploadMutation.isPending}
                className="flex-1"
              />
              {uploadMutation.isPending && (
                <div className="flex items-center text-sm text-muted-foreground">
                  <Upload className="h-4 w-4 mr-1 animate-spin" />
                  Uploading...
                </div>
              )}
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              Accepted formats: JPEG, PNG, PDF (Max 5MB)
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Your Documents</CardTitle>
          <CardDescription>
            Track the status of your uploaded KYC documents
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-4">Loading documents...</div>
          ) : kycDocuments.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No documents uploaded yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {kycDocuments.map(doc => (
                <div key={doc.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">{doc.file_name}</p>
                    <p className="text-sm text-muted-foreground capitalize">
                      {doc.document_type.replace('_', ' ')}
                    </p>
                    {doc.status === 'rejected' && doc.rejection_reason && (
                      <p className="text-sm text-red-600 mt-1">{doc.rejection_reason}</p>
                    )}
                  </div>
                  <div className="flex items-center space-x-2">
                    {getStatusIcon(doc.status)}
                    <span className="text-sm">{getStatusText(doc.status)}</span>
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
