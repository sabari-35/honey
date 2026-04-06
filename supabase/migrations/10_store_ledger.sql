-- Create Store Ledger Table for tracking cash payments from Storekeepers to Admin
CREATE TABLE IF NOT EXISTS public.store_ledger (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    amount numeric NOT NULL,
    storekeeper_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
    admin_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at timestamp with time zone DEFAULT now()
);

-- Turn on RLS
ALTER TABLE public.store_ledger ENABLE ROW LEVEL SECURITY;

-- Admins can manage ledgers completely
CREATE POLICY "Admins can manage store ledgers" ON store_ledger
    FOR ALL USING (is_admin()) WITH CHECK (is_admin());

-- Storekeepers can view their own ledger entries
CREATE POLICY "Storekeepers can view own ledger" ON store_ledger
    FOR SELECT USING (auth.uid() = storekeeper_id);

-- Enable Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE store_ledger;
