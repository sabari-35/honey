-- Payment System Enhancements
-- Adds COD fee, payment tracking, awaiting_payment status support, and RPC for confirming orders.

-- 1. Extend order_status enum with new states
ALTER TYPE order_status ADD VALUE IF NOT EXISTS 'awaiting_payment';
ALTER TYPE payment_status ADD VALUE IF NOT EXISTS 'cod_pending';
ALTER TYPE payment_status ADD VALUE IF NOT EXISTS 'verified';

-- 2. Add COD charge column to orders
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS cod_charge DECIMAL(10,2) DEFAULT 0;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS razorpay_order_id TEXT;

-- 3. Ensure payments table has all razorpay fields (from 01_init.sql they already exist, ensuring)
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS verified_at TIMESTAMPTZ;
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS gateway TEXT DEFAULT 'razorpay';

-- 4. Index for fast payment lookup by razorpay order id
CREATE INDEX IF NOT EXISTS idx_orders_razorpay_id ON orders(razorpay_order_id);
CREATE INDEX IF NOT EXISTS idx_payments_razorpay_pid ON payments(razorpay_payment_id);

-- 5. RPC: Confirm online payment and activate order atomically
CREATE OR REPLACE FUNCTION confirm_online_payment(
  p_order_id UUID,
  p_razorpay_payment_id TEXT,
  p_razorpay_order_id TEXT,
  p_razorpay_signature TEXT
)
RETURNS JSONB AS $$
DECLARE
  v_order RECORD;
BEGIN
  -- Fetch and lock the order
  SELECT * INTO v_order FROM orders WHERE id = p_order_id FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Order not found');
  END IF;

  IF v_order.payment_status = 'paid' THEN
    RETURN jsonb_build_object('success', true, 'message', 'Already paid');
  END IF;

  -- Update order to confirmed + paid
  UPDATE orders SET
    status = 'confirmed',
    payment_status = 'verified',
    razorpay_order_id = p_razorpay_order_id,
    updated_at = NOW()
  WHERE id = p_order_id;

  -- Upsert payment record
  INSERT INTO payments (order_id, razorpay_order_id, razorpay_payment_id, razorpay_signature, amount, status, verified_at)
  SELECT p_order_id, p_razorpay_order_id, p_razorpay_payment_id, p_razorpay_signature, 
         v_order.total_amount, 'paid', NOW()
  ON CONFLICT (id) DO NOTHING;

  -- Insert order status history entry
  INSERT INTO order_status_history (order_id, status, note)
  VALUES (p_order_id, 'confirmed', 'Payment verified via Razorpay: ' || p_razorpay_payment_id);

  RETURN jsonb_build_object('success', true, 'order_id', p_order_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. RPC: Abandon a pending payment order (cleanup)
CREATE OR REPLACE FUNCTION abandon_payment_order(p_order_id UUID)
RETURNS VOID AS $$
BEGIN
  DELETE FROM orders WHERE id = p_order_id AND status = 'awaiting_payment';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. RPC: Admin mark COD as collected
CREATE OR REPLACE FUNCTION mark_cod_collected(p_order_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE orders SET
    payment_status = 'paid',
    status = 'confirmed',
    updated_at = NOW()
  WHERE id = p_order_id AND payment_status = 'cod_pending';

  INSERT INTO order_status_history (order_id, status, note)
  VALUES (p_order_id, 'confirmed', 'COD payment collected and confirmed by admin');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. Allow orders insert for authenticated users (ensure policy exists)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'payments' AND policyname = 'Users create own payments'
  ) THEN
    CREATE POLICY "Users create own payments" ON payments FOR INSERT
      WITH CHECK (order_id IN (SELECT id FROM orders WHERE user_id = auth.uid()));
  END IF;
END $$;
