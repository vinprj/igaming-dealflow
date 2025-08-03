
-- Add KYC documents table for document storage
CREATE TABLE public.kyc_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  document_type TEXT NOT NULL CHECK (document_type IN ('passport', 'drivers_license', 'national_id', 'utility_bill', 'bank_statement')),
  file_path TEXT NOT NULL,
  file_name TEXT NOT NULL,
  mime_type TEXT,
  file_size BIGINT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  reviewed_by UUID REFERENCES auth.users(id),
  reviewed_at TIMESTAMPTZ,
  rejection_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on KYC documents
ALTER TABLE public.kyc_documents ENABLE ROW LEVEL SECURITY;

-- Users can view their own KYC documents
CREATE POLICY "Users can view their own KYC documents" ON public.kyc_documents
  FOR SELECT USING (user_id = auth.uid());

-- Users can upload their own KYC documents
CREATE POLICY "Users can upload their own KYC documents" ON public.kyc_documents
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- Users can update their own pending KYC documents
CREATE POLICY "Users can update their own pending KYC documents" ON public.kyc_documents
  FOR UPDATE USING (user_id = auth.uid() AND status = 'pending');

-- Add DocuSign envelopes table
CREATE TABLE public.docusign_envelopes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  envelope_id TEXT UNIQUE NOT NULL,
  listing_id UUID REFERENCES public.listings(id) ON DELETE CASCADE NOT NULL,
  buyer_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  seller_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  status TEXT NOT NULL DEFAULT 'sent' CHECK (status IN ('sent', 'delivered', 'completed', 'declined', 'voided')),
  document_type TEXT NOT NULL DEFAULT 'purchase_agreement',
  signing_url_buyer TEXT,
  signing_url_seller TEXT,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on DocuSign envelopes
ALTER TABLE public.docusign_envelopes ENABLE ROW LEVEL SECURITY;

-- Users can view envelopes they're involved in
CREATE POLICY "Users can view their own envelopes" ON public.docusign_envelopes
  FOR SELECT USING (buyer_id = auth.uid() OR seller_id = auth.uid());

-- Add Stripe customers table for better customer management
CREATE TABLE public.stripe_customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  stripe_customer_id TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on Stripe customers
ALTER TABLE public.stripe_customers ENABLE ROW LEVEL SECURITY;

-- Users can view their own Stripe customer info
CREATE POLICY "Users can view their own Stripe info" ON public.stripe_customers
  FOR SELECT USING (user_id = auth.uid());

-- Update escrow table to include more Stripe-related fields
ALTER TABLE public.escrow 
ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT,
ADD COLUMN IF NOT EXISTS docusign_envelope_id UUID REFERENCES public.docusign_envelopes(id),
ADD COLUMN IF NOT EXISTS completion_date TIMESTAMPTZ;

-- Create storage bucket for KYC documents
INSERT INTO storage.buckets (id, name, public) 
VALUES ('kyc-documents', 'kyc-documents', false)
ON CONFLICT (id) DO NOTHING;

-- Create storage policy for KYC documents - users can upload their own
CREATE POLICY "Users can upload their own KYC documents" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'kyc-documents' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Users can view their own KYC documents
CREATE POLICY "Users can view their own KYC documents" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'kyc-documents' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Create notification function for KYC status updates
CREATE OR REPLACE FUNCTION public.notify_kyc_status_change()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status != NEW.status AND NEW.status IN ('approved', 'rejected') THEN
    PERFORM public.create_notification(
      NEW.user_id,
      'kyc_update'::notification_type,
      CASE WHEN NEW.status = 'approved' 
           THEN 'KYC Document Approved'
           ELSE 'KYC Document Rejected'
      END,
      CASE WHEN NEW.status = 'approved'
           THEN 'Your ' || NEW.document_type || ' has been approved.'
           ELSE 'Your ' || NEW.document_type || ' was rejected. Reason: ' || COALESCE(NEW.rejection_reason, 'No reason provided')
      END,
      NEW.id
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for KYC status notifications
CREATE TRIGGER kyc_status_notification
  AFTER UPDATE ON public.kyc_documents
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_kyc_status_change();
