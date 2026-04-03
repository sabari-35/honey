-- ====================================================
-- RECOMMENDATION ENGINE v2.0
-- Advanced Hybrid Real-Time System
-- ====================================================

-- 1. Extend products table with rich metadata
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS flavor_profile TEXT[],
  ADD COLUMN IF NOT EXISTS health_benefits TEXT[],
  ADD COLUMN IF NOT EXISTS price_segment TEXT CHECK (price_segment IN ('budget', 'mid', 'premium', 'luxury')) DEFAULT 'mid',
  ADD COLUMN IF NOT EXISTS profit_margin_score DECIMAL(3,2) DEFAULT 0.5 CHECK (profit_margin_score >= 0 AND profit_margin_score <= 1),
  ADD COLUMN IF NOT EXISTS stock_priority INT DEFAULT 5 CHECK (stock_priority >= 1 AND stock_priority <= 10);

-- 2. User Activity Table
CREATE TABLE IF NOT EXISTS public.user_activity (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  session_id TEXT,
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
  activity_type TEXT NOT NULL CHECK (activity_type IN ('view', 'cart', 'purchase', 'search', 'recommendation_click')),
  weight_score INT NOT NULL DEFAULT 1,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Recommendation Scores Cache Table
CREATE TABLE IF NOT EXISTS public.recommendation_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cache_key TEXT UNIQUE NOT NULL,
  product_ids UUID[] NOT NULL,
  score_data JSONB DEFAULT '{}',
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Optimized Composite Indexes
CREATE INDEX IF NOT EXISTS idx_user_activity_user_created ON user_activity(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_activity_session ON user_activity(session_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_activity_product ON user_activity(product_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_activity_type ON user_activity(activity_type, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_recommendation_cache_key ON recommendation_scores(cache_key);
CREATE INDEX IF NOT EXISTS idx_recommendation_expires ON recommendation_scores(expires_at);

-- 5. Enable RLS
ALTER TABLE public.user_activity ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recommendation_scores ENABLE ROW LEVEL SECURITY;

-- 6. RLS Policies
CREATE POLICY "Users insert own activity" ON user_activity FOR INSERT WITH CHECK (
  auth.uid() = user_id OR user_id IS NULL
);
CREATE POLICY "Users read own activity" ON user_activity FOR SELECT USING (
  auth.uid() = user_id OR user_id IS NULL
);
CREATE POLICY "Anyone reads recommendation scores" ON recommendation_scores FOR SELECT USING (true);

-- 7. Enable Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE user_activity;

-- ====================================================
-- RPC FUNCTIONS
-- ====================================================

-- 7a. Trending Products via Time-Decay Popularity Score
CREATE OR REPLACE FUNCTION get_trending_products(p_limit INT DEFAULT 6)
RETURNS TABLE (
  id UUID, name TEXT, slug TEXT, price DECIMAL, compare_price DECIMAL,
  images JSONB, category TEXT, tags TEXT[], stock_quantity INT, featured BOOLEAN,
  profit_margin_score DECIMAL, trending_score DECIMAL
) AS $$
DECLARE
  v_decay_rate DECIMAL := 0.05;
BEGIN
  RETURN QUERY
  SELECT
    p.id, p.name, p.slug, p.price, p.compare_price,
    p.images, p.category, p.tags, p.stock_quantity, p.featured,
    p.profit_margin_score,
    SUM(
      ua.weight_score *
      EXP(-v_decay_rate * EXTRACT(EPOCH FROM (NOW() - ua.created_at)) / 3600)
    ) * (1 + COALESCE(p.profit_margin_score, 0.5)) AS trending_score
  FROM products p
  JOIN user_activity ua ON ua.product_id = p.id
  WHERE p.is_active = true
    AND ua.created_at > NOW() - INTERVAL '7 days'
  GROUP BY p.id, p.name, p.slug, p.price, p.compare_price,
           p.images, p.category, p.tags, p.stock_quantity, p.featured, p.profit_margin_score
  ORDER BY trending_score DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- 7b. Hybrid Personalized Recommendations
CREATE OR REPLACE FUNCTION get_hybrid_recommendations(
  p_user_id UUID DEFAULT NULL,
  p_session_id TEXT DEFAULT NULL,
  p_limit INT DEFAULT 6
)
RETURNS TABLE (
  id UUID, name TEXT, slug TEXT, price DECIMAL, compare_price DECIMAL,
  images JSONB, category TEXT, tags TEXT[], stock_quantity INT, featured BOOLEAN,
  final_score DECIMAL
) AS $$
DECLARE
  v_activity_count INT;
  v_interest_weight DECIMAL;
  v_popularity_weight DECIMAL;
BEGIN
  -- Count how much data we have for the user
  SELECT COUNT(*) INTO v_activity_count
  FROM user_activity ua
  WHERE (p_user_id IS NOT NULL AND ua.user_id = p_user_id)
     OR (p_session_id IS NOT NULL AND ua.session_id = p_session_id)
    AND ua.created_at > NOW() - INTERVAL '30 days';

  -- Dynamic weighting based on data richness
  IF v_activity_count = 0 THEN
    v_interest_weight := 0;
    v_popularity_weight := 1;
  ELSIF v_activity_count < 5 THEN
    v_interest_weight := 0.5;
    v_popularity_weight := 0.5;
  ELSE
    v_interest_weight := 0.7;
    v_popularity_weight := 0.3;
  END IF;

  RETURN QUERY
  WITH user_prefs AS (
    -- Build user preference vector from activity history
    SELECT
      p.category,
      p.tags,
      SUM(ua.weight_score) AS pref_weight
    FROM user_activity ua
    JOIN products p ON p.id = ua.product_id
    WHERE ((p_user_id IS NOT NULL AND ua.user_id = p_user_id)
        OR (p_session_id IS NOT NULL AND ua.session_id = p_session_id))
      AND ua.created_at > NOW() - INTERVAL '30 days'
    GROUP BY p.category, p.tags
  ),
  popularity AS (
    SELECT
      ua.product_id,
      SUM(ua.weight_score * EXP(-0.05 * EXTRACT(EPOCH FROM (NOW() - ua.created_at)) / 3600)) AS pop_score
    FROM user_activity ua
    WHERE ua.created_at > NOW() - INTERVAL '7 days'
    GROUP BY ua.product_id
  )
  SELECT
    p.id, p.name, p.slug, p.price, p.compare_price,
    p.images, p.category, p.tags, p.stock_quantity, p.featured,
    (
      v_interest_weight * COALESCE(
        (SELECT SUM(up.pref_weight) FROM user_prefs up
         WHERE up.category = p.category OR up.tags && p.tags), 0
      ) +
      v_popularity_weight * COALESCE(pop.pop_score, 0)
    ) * (1 + COALESCE(p.profit_margin_score, 0.5)) AS final_score
  FROM products p
  LEFT JOIN popularity pop ON pop.product_id = p.id
  WHERE p.is_active = true
    AND (
      -- Exclude already-viewed products for personalized users
      v_activity_count < 3
      OR p.id NOT IN (
        SELECT ua2.product_id FROM user_activity ua2
        WHERE ua2.user_id = p_user_id AND ua2.activity_type = 'purchase'
      )
    )
  ORDER BY final_score DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- 7c. Similar Products by Tag Intersection
CREATE OR REPLACE FUNCTION get_similar_products(p_product_id UUID, p_limit INT DEFAULT 4)
RETURNS TABLE (
  id UUID, name TEXT, slug TEXT, price DECIMAL, images JSONB,
  category TEXT, tags TEXT[], stock_quantity INT, similarity_score INT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.id, p.name, p.slug, p.price, p.images,
    p.category, p.tags, p.stock_quantity,
    (
      CASE WHEN p.category = ref.category THEN 3 ELSE 0 END +
      COALESCE(CARDINALITY(p.tags & ref.tags), 0)
    ) AS similarity_score
  FROM products p
  CROSS JOIN (SELECT category, tags FROM products WHERE id = p_product_id) AS ref
  WHERE p.id != p_product_id
    AND p.is_active = true
    AND (p.category = ref.category OR p.tags && ref.tags)
  ORDER BY similarity_score DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- 7d. Frequently Bought Together (Co-occurrence Analysis)
CREATE OR REPLACE FUNCTION get_frequently_bought_together(p_product_id UUID, p_limit INT DEFAULT 4)
RETURNS TABLE (
  id UUID, name TEXT, slug TEXT, price DECIMAL, images JSONB,
  category TEXT, tags TEXT[], stock_quantity INT, co_occurrence_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.id, p.name, p.slug, p.price, p.images,
    p.category, p.tags, p.stock_quantity,
    COUNT(*) AS co_occurrence_count
  FROM user_activity ua1
  JOIN user_activity ua2 ON (
    ua1.user_id = ua2.user_id OR ua1.session_id = ua2.session_id
  )
  JOIN products p ON p.id = ua2.product_id
  WHERE ua1.product_id = p_product_id
    AND ua2.product_id != p_product_id
    AND ua1.activity_type IN ('cart', 'purchase')
    AND ua2.activity_type IN ('cart', 'purchase')
    AND p.is_active = true
    AND ABS(EXTRACT(EPOCH FROM (ua1.created_at - ua2.created_at))) < 3600 -- within same session window
  GROUP BY p.id, p.name, p.slug, p.price, p.images, p.category, p.tags, p.stock_quantity
  ORDER BY co_occurrence_count DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- 7e. Fallback: Featured Products for New/Guest Users
CREATE OR REPLACE FUNCTION get_featured_fallback(p_limit INT DEFAULT 6)
RETURNS TABLE (
  id UUID, name TEXT, slug TEXT, price DECIMAL, compare_price DECIMAL,
  images JSONB, category TEXT, tags TEXT[], stock_quantity INT, featured BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT p.id, p.name, p.slug, p.price, p.compare_price,
         p.images, p.category, p.tags, p.stock_quantity, p.featured
  FROM products p
  WHERE p.is_active = true
  ORDER BY p.featured DESC, p.created_at DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- 8. Weight Mapping Trigger — auto-assign weight scores from activity_type
CREATE OR REPLACE FUNCTION assign_activity_weight()
RETURNS TRIGGER AS $$
BEGIN
  NEW.weight_score := CASE NEW.activity_type
    WHEN 'view' THEN 1
    WHEN 'search' THEN 2
    WHEN 'cart' THEN 3
    WHEN 'recommendation_click' THEN 4
    WHEN 'purchase' THEN 5
    ELSE 1
  END;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_activity_weight
  BEFORE INSERT ON user_activity
  FOR EACH ROW EXECUTE FUNCTION assign_activity_weight();
