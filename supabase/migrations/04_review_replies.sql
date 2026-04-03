CREATE TABLE public.product_review_replies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id UUID REFERENCES public.product_reviews(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  comment TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_replies_review_id ON product_review_replies(review_id);
CREATE INDEX idx_replies_user_id ON product_review_replies(user_id);
CREATE TRIGGER trg_product_review_replies_updated BEFORE UPDATE ON product_review_replies FOR EACH ROW EXECUTE FUNCTION update_updated_at();
ALTER TABLE public.product_review_replies ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone reads replies" ON product_review_replies FOR SELECT USING (true);
CREATE POLICY "Authenticated users create replies" ON product_review_replies FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own replies" ON product_review_replies FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users delete own replies" ON product_review_replies FOR DELETE USING (auth.uid() = user_id);
ALTER PUBLICATION supabase_realtime ADD TABLE product_review_replies;
