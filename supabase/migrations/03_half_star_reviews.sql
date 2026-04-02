-- Drop the existing constraint
ALTER TABLE public.product_reviews DROP CONSTRAINT IF EXISTS product_reviews_rating_check;

-- Change the column type from INT to NUMERIC(2,1)
ALTER TABLE public.product_reviews ALTER COLUMN rating TYPE numeric(2,1);

-- Re-add the constraint to ensure rating is within bounds (inclusive of 0.5 steps)
ALTER TABLE public.product_reviews ADD CONSTRAINT product_reviews_rating_check CHECK (rating >= 1 AND rating <= 5);
