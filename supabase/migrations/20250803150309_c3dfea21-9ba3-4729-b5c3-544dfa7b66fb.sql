
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create enums
CREATE TYPE kyc_level AS ENUM ('none', 'basic', 'advanced');
CREATE TYPE listing_status AS ENUM ('draft', 'pending', 'approved', 'live', 'sold');
CREATE TYPE access_request_status AS ENUM ('pending', 'approved', 'rejected');
CREATE TYPE notification_type AS ENUM ('access_request', 'nda_signed', 'new_message', 'listing_approved', 'listing_rejected');
CREATE TYPE escrow_status AS ENUM ('initiated', 'funded', 'completed', 'disputed');
CREATE TYPE user_role AS ENUM ('buyer', 'seller', 'admin');

-- Organizations table
CREATE TABLE public.organizations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Users table (extends Supabase auth.users)
CREATE TABLE public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  organization_id UUID REFERENCES public.organizations(id),
  roles user_role[] NOT NULL DEFAULT '{}',
  is_verified BOOLEAN NOT NULL DEFAULT FALSE,
  kyc_level kyc_level NOT NULL DEFAULT 'none',
  first_name TEXT,
  last_name TEXT,
  phone TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Listings table
CREATE TABLE public.listings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  seller_id UUID NOT NULL REFERENCES public.users(id),
  title TEXT NOT NULL,
  description TEXT,
  price DECIMAL(15,2),
  status listing_status NOT NULL DEFAULT 'draft',
  is_public BOOLEAN NOT NULL DEFAULT FALSE,
  category TEXT,
  country TEXT,
  license_type TEXT,
  revenue_monthly DECIMAL(15,2),
  revenue_annual DECIMAL(15,2),
  views INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Access requests table
CREATE TABLE public.access_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  buyer_id UUID NOT NULL REFERENCES public.users(id),
  listing_id UUID NOT NULL REFERENCES public.listings(id),
  status access_request_status NOT NULL DEFAULT 'pending',
  nda_signed BOOLEAN NOT NULL DEFAULT FALSE,
  nda_signed_at TIMESTAMPTZ,
  message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(buyer_id, listing_id)
);

-- Messages table
CREATE TABLE public.messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sender_id UUID NOT NULL REFERENCES public.users(id),
  receiver_id UUID NOT NULL REFERENCES public.users(id),
  listing_id UUID REFERENCES public.listings(id),
  content TEXT NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Notifications table
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id),
  type notification_type NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  related_id UUID, -- Can reference listing_id, access_request_id, etc.
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Escrow table
CREATE TABLE public.escrow (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  listing_id UUID NOT NULL REFERENCES public.listings(id),
  buyer_id UUID NOT NULL REFERENCES public.users(id),
  seller_id UUID NOT NULL REFERENCES public.users(id),
  amount DECIMAL(15,2) NOT NULL,
  status escrow_status NOT NULL DEFAULT 'initiated',
  stripe_payment_intent_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Document uploads table
CREATE TABLE public.documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  listing_id UUID NOT NULL REFERENCES public.listings(id),
  uploader_id UUID NOT NULL REFERENCES public.users(id),
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size BIGINT,
  mime_type TEXT,
  is_public BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Document access logs table
CREATE TABLE public.document_access_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  document_id UUID NOT NULL REFERENCES public.documents(id),
  user_id UUID NOT NULL REFERENCES public.users(id),
  action TEXT NOT NULL, -- 'view', 'download'
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable Row Level Security on all tables
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.access_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.escrow ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_access_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for organizations
CREATE POLICY "Users can view their own organization" ON public.organizations
  FOR SELECT USING (id IN (SELECT organization_id FROM public.users WHERE id = auth.uid()));

CREATE POLICY "Users can update their own organization" ON public.organizations
  FOR UPDATE USING (id IN (SELECT organization_id FROM public.users WHERE id = auth.uid()));

-- RLS Policies for users
CREATE POLICY "Users can view their own profile" ON public.users
  FOR SELECT USING (id = auth.uid());

CREATE POLICY "Users can update their own profile" ON public.users
  FOR UPDATE USING (id = auth.uid());

CREATE POLICY "Public read access for user profiles" ON public.users
  FOR SELECT USING (true);

-- RLS Policies for listings
CREATE POLICY "Anyone can view approved public listings" ON public.listings
  FOR SELECT USING (status = 'approved' AND is_public = true);

CREATE POLICY "Sellers can view their own listings" ON public.listings
  FOR SELECT USING (seller_id = auth.uid());

CREATE POLICY "Sellers can create listings" ON public.listings
  FOR INSERT WITH CHECK (seller_id = auth.uid());

CREATE POLICY "Sellers can update their own listings" ON public.listings
  FOR UPDATE USING (seller_id = auth.uid());

CREATE POLICY "Buyers with approved access can view private listings" ON public.listings
  FOR SELECT USING (
    id IN (
      SELECT listing_id FROM public.access_requests 
      WHERE buyer_id = auth.uid() AND status = 'approved'
    )
  );

-- RLS Policies for access_requests
CREATE POLICY "Users can view their own access requests" ON public.access_requests
  FOR SELECT USING (buyer_id = auth.uid() OR listing_id IN (SELECT id FROM public.listings WHERE seller_id = auth.uid()));

CREATE POLICY "Buyers can create access requests" ON public.access_requests
  FOR INSERT WITH CHECK (buyer_id = auth.uid());

CREATE POLICY "Sellers can update access requests for their listings" ON public.access_requests
  FOR UPDATE USING (listing_id IN (SELECT id FROM public.listings WHERE seller_id = auth.uid()));

-- RLS Policies for messages
CREATE POLICY "Users can view their own messages" ON public.messages
  FOR SELECT USING (sender_id = auth.uid() OR receiver_id = auth.uid());

CREATE POLICY "Users can send messages" ON public.messages
  FOR INSERT WITH CHECK (sender_id = auth.uid());

CREATE POLICY "Users can update their own messages" ON public.messages
  FOR UPDATE USING (receiver_id = auth.uid());

-- RLS Policies for notifications
CREATE POLICY "Users can view their own notifications" ON public.notifications
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can update their own notifications" ON public.notifications
  FOR UPDATE USING (user_id = auth.uid());

-- RLS Policies for escrow
CREATE POLICY "Users can view their own escrow transactions" ON public.escrow
  FOR SELECT USING (buyer_id = auth.uid() OR seller_id = auth.uid());

CREATE POLICY "Users can create escrow transactions" ON public.escrow
  FOR INSERT WITH CHECK (buyer_id = auth.uid() OR seller_id = auth.uid());

-- RLS Policies for documents
CREATE POLICY "Sellers can manage documents for their listings" ON public.documents
  FOR ALL USING (listing_id IN (SELECT id FROM public.listings WHERE seller_id = auth.uid()));

CREATE POLICY "Approved buyers can view documents" ON public.documents
  FOR SELECT USING (
    listing_id IN (
      SELECT listing_id FROM public.access_requests 
      WHERE buyer_id = auth.uid() AND status = 'approved' AND nda_signed = true
    )
  );

-- RLS Policies for document access logs
CREATE POLICY "Users can view their own document access" ON public.document_access_logs
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Document access logging" ON public.document_access_logs
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- Create indexes for better performance
CREATE INDEX idx_users_organization_id ON public.users(organization_id);
CREATE INDEX idx_listings_seller_id ON public.listings(seller_id);
CREATE INDEX idx_listings_status ON public.listings(status);
CREATE INDEX idx_access_requests_buyer_listing ON public.access_requests(buyer_id, listing_id);
CREATE INDEX idx_messages_sender_receiver ON public.messages(sender_id, receiver_id);
CREATE INDEX idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX idx_documents_listing_id ON public.documents(listing_id);

-- Function to handle user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.users (id, email, first_name, last_name)
  VALUES (
    new.id,
    new.email,
    new.raw_user_meta_data->>'first_name',
    new.raw_user_meta_data->>'last_name'
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user creation
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to create notification
CREATE OR REPLACE FUNCTION public.create_notification(
  p_user_id UUID,
  p_type notification_type,
  p_title TEXT,
  p_content TEXT,
  p_related_id UUID DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  notification_id UUID;
BEGIN
  INSERT INTO public.notifications (user_id, type, title, content, related_id)
  VALUES (p_user_id, p_type, p_title, p_content, p_related_id)
  RETURNING id INTO notification_id;
  
  RETURN notification_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update listing views
CREATE OR REPLACE FUNCTION public.increment_listing_views(listing_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE public.listings 
  SET views = views + 1 
  WHERE id = listing_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
