-- PRODUCT REVIEWS
CREATE TABLE public.product_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- INDEXES
CREATE INDEX idx_reviews_product_id ON product_reviews(product_id);
CREATE INDEX idx_reviews_user_id ON product_reviews(user_id);

-- UPDATED_AT TRIGGER
CREATE TRIGGER trg_product_reviews_updated BEFORE UPDATE ON product_reviews FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ENABLE RLS
ALTER TABLE public.product_reviews ENABLE ROW LEVEL SECURITY;

-- POLICIES
CREATE POLICY "Anyone reads reviews" ON product_reviews FOR SELECT USING (true);
CREATE POLICY "Authenticated users create reviews" ON product_reviews FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own reviews" ON product_reviews FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users delete own reviews" ON product_reviews FOR DELETE USING (auth.uid() = user_id);

-- PROFILE VISIBILITY (Necessary for reviews to show names)
CREATE POLICY "Public read basic profile info" ON profiles FOR SELECT USING (true);

-- REALTIME
ALTER PUBLICATION supabase_realtime ADD TABLE product_reviews;
