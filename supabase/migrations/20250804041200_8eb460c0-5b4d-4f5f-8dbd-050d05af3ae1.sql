-- Create user settings table
CREATE TABLE IF NOT EXISTS public.user_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  email_notifications BOOLEAN NOT NULL DEFAULT true,
  push_notifications BOOLEAN NOT NULL DEFAULT true,
  marketing_emails BOOLEAN NOT NULL DEFAULT false,
  two_factor_enabled BOOLEAN NOT NULL DEFAULT false,
  language TEXT NOT NULL DEFAULT 'en',
  timezone TEXT NOT NULL DEFAULT 'UTC',
  theme TEXT NOT NULL DEFAULT 'system' CHECK (theme IN ('light', 'dark', 'system')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on user settings
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;

-- Create policies for user settings (using unique names)
DROP POLICY IF EXISTS "view_own_settings" ON public.user_settings;
CREATE POLICY "view_own_settings" ON public.user_settings
  FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS "update_own_settings" ON public.user_settings;
CREATE POLICY "update_own_settings" ON public.user_settings
  FOR UPDATE USING (user_id = auth.uid());

DROP POLICY IF EXISTS "create_own_settings" ON public.user_settings;
CREATE POLICY "create_own_settings" ON public.user_settings
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- Function to create default user settings
CREATE OR REPLACE FUNCTION public.create_default_user_settings()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_settings (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS create_user_settings_trigger ON public.users;

-- Create trigger to create default settings for new users
CREATE TRIGGER create_user_settings_trigger
  AFTER INSERT ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION public.create_default_user_settings();