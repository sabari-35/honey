-- Add new ENUM values dynamically
ALTER TYPE order_status ADD VALUE IF NOT EXISTS 'assigned';
ALTER TYPE order_status ADD VALUE IF NOT EXISTS 'picked';

-- DELIVERY BOYS
CREATE TABLE public.delivery_boys (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  vehicle_details TEXT, -- e.g. 'Honda Activa - KA 01 AB 1234'
  status TEXT DEFAULT 'offline' CHECK (status IN ('offline', 'idle', 'on_delivery')),
  current_lat DECIMAL(10,8),
  current_lng DECIMAL(11,8),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- DELIVERY ASSIGNMENTS
CREATE TABLE public.delivery_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
  delivery_boy_id UUID REFERENCES public.delivery_boys(id) ON DELETE CASCADE,
  assigned_at TIMESTAMPTZ DEFAULT NOW(),
  accepted_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'completed')),
  UNIQUE (order_id, delivery_boy_id) -- A delivery boy is assigned to an order once at a time
);

-- DELIVERY LOCATIONS
-- Used for location history & realtime tracking
CREATE TABLE public.delivery_locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  delivery_boy_id UUID REFERENCES public.delivery_boys(id) ON DELETE CASCADE,
  order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE, -- only populated if on active delivery
  lat DECIMAL(10,8) NOT NULL,
  lng DECIMAL(11,8) NOT NULL,
  speed DECIMAL(5,2), -- optional in m/s
  heading DECIMAL(5,2), -- optional 0-360 deg
  recorded_at TIMESTAMPTZ DEFAULT NOW()
);

-- Realtime Setup
-- delivery_assignments (for delivery dashboard to pop up new assignments)
-- delivery_locations (for realtime delivery tracking by customers)
-- orders (already exists, but we can make sure it can be listened to)
ALTER PUBLICATION supabase_realtime ADD TABLE delivery_locations;
ALTER PUBLICATION supabase_realtime ADD TABLE delivery_assignments;
-- ALTER PUBLICATION supabase_realtime ADD TABLE orders; -- Removed because orders is already in the publication


-- Indexes for performance
CREATE INDEX idx_delivery_locations_order ON public.delivery_locations(order_id);
CREATE INDEX idx_delivery_assignments_boy ON public.delivery_assignments(delivery_boy_id);
CREATE INDEX idx_delivery_assignments_order ON public.delivery_assignments(order_id);

-- RLS
ALTER TABLE public.delivery_boys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.delivery_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.delivery_locations ENABLE ROW LEVEL SECURITY;

-- Helper to check if delivery boy
CREATE OR REPLACE FUNCTION is_delivery_boy()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM delivery_boys
    WHERE id = auth.uid()
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Profiles: Add delivery_boy to user_role ENUM safely if possible, but we decided to use a separate table `delivery_boys`. 

-- Policies: Delivery Boys
CREATE POLICY "Admins have full access to delivery_boys" ON public.delivery_boys USING (is_admin());
CREATE POLICY "Delivery boys read own profile" ON public.delivery_boys FOR SELECT USING (id = auth.uid());
CREATE POLICY "Delivery boys update own profile" ON public.delivery_boys FOR UPDATE USING (id = auth.uid());
CREATE POLICY "Users can request to be delivery boys" ON public.delivery_boys FOR INSERT WITH CHECK (id = auth.uid());

-- Policies: Delivery Assignments
CREATE POLICY "Admins have full access to delivery_assignments" ON public.delivery_assignments USING (is_admin());
CREATE POLICY "Delivery boys read own assignments" ON public.delivery_assignments FOR SELECT USING (delivery_boy_id = auth.uid());
CREATE POLICY "Delivery boys update own assignments" ON public.delivery_assignments FOR UPDATE USING (delivery_boy_id = auth.uid());
CREATE POLICY "Customers read assignments for their orders" ON public.delivery_assignments FOR SELECT USING (
  order_id IN (SELECT id FROM public.orders WHERE user_id = auth.uid())
);

-- Policies: Delivery Locations
CREATE POLICY "Admins have full access to delivery_locations" ON public.delivery_locations USING (is_admin());
CREATE POLICY "Delivery boys insert own locations" ON public.delivery_locations FOR INSERT WITH CHECK (delivery_boy_id = auth.uid());
CREATE POLICY "Delivery boys read own locations" ON public.delivery_locations FOR SELECT USING (delivery_boy_id = auth.uid());
CREATE POLICY "Customers read locations of their orders" ON public.delivery_locations FOR SELECT USING (
  order_id IN (SELECT id FROM public.orders WHERE user_id = auth.uid())
);

-- Trigger to update delivery_boys updated_at
CREATE TRIGGER trg_delivery_boys_updated BEFORE UPDATE ON public.delivery_boys FOR EACH ROW EXECUTE FUNCTION update_updated_at();

