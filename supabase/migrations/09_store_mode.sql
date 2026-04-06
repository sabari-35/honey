-- Create Store Access Requests Table
CREATE TABLE IF NOT EXISTS public.store_access_requests (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
    status text NOT NULL DEFAULT 'pending',
    requested_at timestamp with time zone DEFAULT now(),
    approved_at timestamp with time zone NULL,
    expires_at timestamp with time zone NULL
);

-- Policies for store_access_requests
ALTER TABLE public.store_access_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own access requests" ON store_access_requests
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own access requests" ON store_access_requests
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all access requests" ON store_access_requests
    FOR SELECT USING (is_admin());

CREATE POLICY "Admins can update access requests" ON store_access_requests
    FOR UPDATE USING (is_admin());


-- Create Store Products Table
CREATE TABLE IF NOT EXISTS public.store_products (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name text NOT NULL,
    stock_quantity integer NOT NULL DEFAULT 0,
    price numeric NOT NULL,
    images jsonb DEFAULT '[]'::jsonb,
    slug text UNIQUE,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- Policies for store_products
ALTER TABLE public.store_products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active store products" ON store_products
    FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage store products" ON store_products
    FOR ALL USING (is_admin());


-- Create Store Sales Table
CREATE TABLE IF NOT EXISTS public.store_sales (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    product_id uuid REFERENCES public.store_products(id) ON DELETE CASCADE,
    seller_id uuid REFERENCES public.profiles(id),
    quantity integer NOT NULL,
    price_at_sale numeric NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);

-- Policies for store_sales
ALTER TABLE public.store_sales ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can insert sales" ON store_sales
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can view own sales" ON store_sales
    FOR SELECT USING (auth.uid() = seller_id);

CREATE POLICY "Admins can view all sales" ON store_sales
    FOR SELECT USING (is_admin());

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE store_access_requests;
ALTER PUBLICATION supabase_realtime ADD TABLE store_products;
ALTER PUBLICATION supabase_realtime ADD TABLE store_sales;
