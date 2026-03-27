-- Add display_name column to app_settings table
ALTER TABLE public.app_settings 
ADD COLUMN IF NOT EXISTS display_name TEXT;

-- Update the view to reflect the new column if needed (but there's no view mentioned for settings)
COMMENT ON COLUMN public.app_settings.display_name IS 'User chosen display name for the dashboard greeting';
