-- Add optional display name preference for user settings
ALTER TABLE public.app_settings
ADD COLUMN IF NOT EXISTS display_name TEXT;
