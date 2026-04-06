import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useCartStore, selectSubtotal } from '../store/cartStore';
import { useUiStore } from '../store/uiStore';
import { useAnalytics } from '../hooks/useAnalytics';
import { supabase } from '../config/supabase';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { formatCurrency } from '../utils/formatCurrency';
import { MapPin, User, CreditCard, Banknote, QrCode, ShieldCheck, AlertTriangle, CheckCircle, Loader, MessageCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

type PaymentMethod = 'cod' | 'upi' | 'card' | 'whatsapp';

const COD_FEE = 30; // ₹40 COD handling fee
const RAZORPAY_KEY = import.meta.env.VITE_RAZORPAY_KEY_ID || 'rzp_test_placeholder';

// Dynamically load Razorpay script
function loadRazorpay(): Promise<boolean> {
  return new Promise((resolve) => {
    if ((window as any).Razorpay) { resolve(true); return; }
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

export default function Checkout() {
  const navigate = useNavigate();
  const { user, profile } = useAuthStore();
  const { items, clearCart } = useCartStore();
  const { setCartOpen } = useUiStore();
  const { trackEvent } = useAnalytics();

  const [fullName, setFullName] = useState((profile as any)?.full_name || '');
  const [phone, setPhone] = useState((profile as any)?.phone || '');
  const [address, setAddress] = useState((profile as any)?.default_address?.label || '');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cod');
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentStep, setPaymentStep] = useState<'idle' | 'creating_order' | 'gateway' | 'verifying'>('idle');
  const [showCODConfirm, setShowCODConfirm] = useState(false);
  const [whatsappNumber, setWhatsappNumber] = useState('6374241896');

  const subtotal = selectSubtotal(items);
  const shipping = subtotal > 1000 ? 0 : 15;
  const codFee = paymentMethod === 'cod' ? COD_FEE : 0;
  const total = subtotal + shipping + codFee;

  useEffect(() => {
    supabase.from('store_settings').select('setting_value').eq('setting_key', 'whatsapp_number').single()
      .then(({data}) => {
        if (data) setWhatsappNumber(data.setting_value);
      });
  }, []);

  useEffect(() => {
    setCartOpen(false);
    if (items.length === 0) navigate('/shop');
  }, [items, navigate, setCartOpen]);

  // ─────────────────────────────────────────────────────────
  // SHARED: Create a base order record
  // ─────────────────────────────────────────────────────────
  const getCoordinates = (): Promise<{lat: number, lng: number} | null> => {
    return new Promise((resolve) => {
      if (!navigator.geolocation) return resolve(null);
      navigator.geolocation.getCurrentPosition(
        (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => resolve(null),
        { timeout: 5000, enableHighAccuracy: false } // fast fallback without locking UI
      );
    });
  };

  const createOrderRecord = async (status: string, paymentStatus: string) => {
    const coords = await getCoordinates();
    const orderNumber = `GV-${new Date().getFullYear()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    
    const { data: order, error } = await supabase
      .from('orders')
      .insert([{
        order_number: orderNumber,
        user_id: user!.id,
        subtotal,
        shipping_amount: shipping,
        cod_charge: codFee,
        total_amount: total,
        shipping_address: { 
          label: address, 
          full_name: fullName, 
          phone,
          email: user!.email,
          lat: coords?.lat,
          lng: coords?.lng
        },
        status,
        payment_status: paymentStatus,
      }])
      .select()
      .single();
    if (error) throw error;

    // Insert order items
    const orderItems = items.map(item => ({
      order_id: order.id,
      product_id: item.product.id,
      quantity: item.quantity,
      unit_price: item.product.price,
      total_price: item.product.price * item.quantity,
      product_snapshot: { name: item.product.name, price: item.product.price, image: item.product.images?.[0]?.url },
    }));
    const { error: itemsError } = await supabase.from('order_items').insert(orderItems);
    if (itemsError) throw itemsError;

    return order;
  };

  // ─────────────────────────────────────────────────────────
  // ONLINE PAYMENT FLOW via Razorpay
  // ─────────────────────────────────────────────────────────
  const handleOnlinePayment = async () => {
    if (!user) { toast.error('Please sign in.'); navigate('/login'); return; }

    setIsProcessing(true);
    setPaymentStep('creating_order');

    let pendingOrderId: string | null = null;

    try {
      const loaded = await loadRazorpay();
      if (!loaded) throw new Error('Payment gateway failed to load. Check your connection.');

      // Step 1: Create awaiting_payment order
      const order = await createOrderRecord('awaiting_payment', 'pending');
      pendingOrderId = order.id;
      setPaymentStep('gateway');

      // Step 2: Open Razorpay
      const options = {
        key: RAZORPAY_KEY,
        amount: Math.round(total * 100), // paise
        currency: 'INR',
        name: 'VRK Farms Vault',
        description: `Order ${order.order_number}`,
        image: '/logo.png',
        notes: { order_id: order.id, order_number: order.order_number },
        prefill: { name: fullName, contact: phone, email: user.email },
        theme: { color: '#D4AF37' },
        config: {
          display: {
            // Show UPI first (includes GPay, PhonePe, Paytm)
            preferences: { show_default_blocks: false },
            blocks: {
              banks: {
                name: 'Pay via UPI',
                instruments: [
                  { method: 'upi', flows: ['collect', 'intent', 'qr'] },
                ],
              },
              cards: {
                name: 'Pay via Cards',
                instruments: [{ method: 'card' }],
              },
              netbanking: {
                name: 'Net Banking',
                instruments: [{ method: 'netbanking' }],
              },
            },
            sequence: ['block.banks', 'block.cards', 'block.netbanking'],
          },
        },

        handler: async (response: any) => {
          // Payment SUCCESS — verify and confirm the order
          setPaymentStep('verifying');
          try {
            const { data: result, error: rpcError } = await supabase.rpc('confirm_online_payment', {
              p_order_id: pendingOrderId,
              p_razorpay_payment_id: response.razorpay_payment_id,
              p_razorpay_order_id: response.razorpay_order_id || '',
              p_razorpay_signature: response.razorpay_signature || '',
            });

            if (rpcError || !result?.success) throw new Error('Payment verification failed.');

            // Deduct stock
            for (const item of items) {
              await supabase.rpc('decrement_stock', { p_id: item.product.id, p_qty: item.quantity });
              trackEvent(item.product.id, 'purchase');
            }

            clearCart();
            // Trigger Brevo Email Route in background
            if (user?.email) {
              supabase.functions.invoke('brevo-email', {
                body: {
                  template: 'order_placed',
                  payload: {
                    orderId: order.order_number,
                    orderTotal: total,
                    customerName: fullName,
                    customerEmail: user.email
                  }
                }
              }).catch(e => console.error("Brevo Email Error:", e));
            }
            toast.success('Payment verified! Order confirmed. 🎉');
            navigate('/success', { state: { orderNumber: order.order_number, total } });
          } catch (err: any) {
            toast.error(err.message || 'Verification failed. Contact support.');
            setIsProcessing(false);
            setPaymentStep('idle');
          }
        },

        modal: {
          ondismiss: async () => {
            // User CLOSED Razorpay without paying — delete the abandoned order
            if (pendingOrderId) {
              await supabase.rpc('abandon_payment_order', { p_order_id: pendingOrderId });
            }
            toast.error('Payment cancelled. Your order has not been placed.');
            setIsProcessing(false);
            setPaymentStep('idle');
          }
        }
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.on('payment.failed', async (response: any) => {
        if (pendingOrderId) {
          await supabase.rpc('abandon_payment_order', { p_order_id: pendingOrderId });
        }
        toast.error(`Payment failed: ${response.error.description}`);
        setIsProcessing(false);
        setPaymentStep('idle');
      });

      rzp.open();

    } catch (err: any) {
      // If order was created, clean it up
      if (pendingOrderId) {
        await supabase.rpc('abandon_payment_order', { p_order_id: pendingOrderId });
      }
      toast.error(err.message || 'Failed to initiate payment.');
      setIsProcessing(false);
      setPaymentStep('idle');
    }
  };

  // ─────────────────────────────────────────────────────────
  // COD FLOW
  // ─────────────────────────────────────────────────────────
  const handleCOD = async () => {
    setIsProcessing(true);
    setShowCODConfirm(false);
    try {
      const order = await createOrderRecord('pending', 'cod_pending');

      for (const item of items) {
        await supabase.rpc('decrement_stock', { p_id: item.product.id, p_qty: item.quantity });
        trackEvent(item.product.id, 'purchase');
      }

      clearCart();
      // Trigger Brevo Email Route in background
      if (user?.email) {
        supabase.functions.invoke('brevo-email', {
          body: {
            template: 'order_placed',
            payload: {
              orderId: order.order_number,
              orderTotal: total,
              customerName: fullName,
              customerEmail: user.email
            }
          }
        }).catch(e => console.error("Brevo Email Error:", e));
      }
      toast.success('Order placed! Pay ₹' + total + ' on delivery.');
      navigate('/success', { state: { orderNumber: order.order_number, total, isCOD: true } });
    } catch (err: any) {
      toast.error(err.message || 'Failed to place COD order.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleWhatsAppOrder = () => {
    setIsProcessing(true);
    try {
      const text = `*New Order - VRK FARMS*\n\n` + 
                   `📦 *Order Details:*\n` + 
                   items.map(i => `- ${i.quantity}x ${i.product.name} (₹${i.product.price * i.quantity})`).join('\n') + 
                   `\n\n*Subtotal:* ₹${subtotal}\n` +
                   `*Shipping:* ₹${shipping}\n` +
                   `*Total:* ₹${subtotal + shipping}\n\n` +
                   `👤 *Customer Info:*\n` +
                   `Name: ${fullName}\n` +
                   `Phone: ${phone}\n` +
                   `Address: ${address}\n\n` + 
                   `Please confirm my order.`;

      const encodedText = encodeURIComponent(text);
      const waNumber = whatsappNumber || '6374241896';
      // Basic formatting, remove non-digits. Assume Indian +91 if length is 10
      const cleanWa = waNumber.replace(/\D/g, '');
      const finalWa = cleanWa.length === 10 ? `91${cleanWa}` : cleanWa;
      const waUrl = `https://wa.me/${finalWa}?text=${encodedText}`;

      window.open(waUrl, '_blank');
      
      clearCart();
      toast.success('Redirecting to WhatsApp to complete order...');
      navigate('/shop');
    } catch(e: any) {
      toast.error('Failed to initiate WhatsApp order.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) { toast.error('Please sign in.'); navigate('/login'); return; }
    if (!fullName || !phone || !address) { toast.error('Please complete your shipping information.'); return; }

    if (paymentMethod === 'cod') {
      setShowCODConfirm(true);
    } else if (paymentMethod === 'whatsapp') {
      handleWhatsAppOrder();
    } else {
      handleOnlinePayment();
    }
  };

  return (
    <div className="min-h-screen bg-obsidian pt-28 pb-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        <div className="flex items-center gap-4 mb-12">
          <div className="w-12 h-12 rounded-2xl neumorphic-panel flex items-center justify-center text-gold-primary">
            <ShieldCheck size={28} />
          </div>
          <div>
            <h1 className="font-display text-4xl text-text-primary uppercase tracking-widest">Secure Checkout</h1>
            <p className="text-text-muted text-sm tracking-widest uppercase">UPI Transaction </p>
          </div>
        </div>

        {/* Payment Progress Indicator */}
        <AnimatePresence>
          {isProcessing && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="mb-8 neumorphic-panel rounded-2xl p-5 flex items-center gap-4 border border-gold-primary/30"
            >
              <Loader size={20} className="text-gold-primary animate-spin shrink-0" />
              <div>
                <p className="text-gold-primary font-bold text-sm uppercase tracking-widest">
                  {paymentStep === 'creating_order' && 'Initializing Vault Transaction...'}
                  {paymentStep === 'gateway' && 'Payment Gateway Active — Complete your payment'}
                  {paymentStep === 'verifying' && 'Cryptographically Verifying Payment...'}
                </p>
                <p className="text-text-muted text-xs mt-1">Do not close or refresh this page</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-12">

          {/* Left Column */}
          <div className="lg:col-span-7 space-y-8">

            {/* Shipping */}
            <div className="neumorphic-panel p-8 rounded-3xl space-y-6">
              <div className="flex items-center gap-3 border-b border-glass-border pb-5">
                <User size={18} className="text-gold-primary" />
                <h2 className="font-display text-xl text-text-primary tracking-widest uppercase">Shipping Details</h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <Input label="Recipient Name" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Full name" required /><br/>
                <Input label="Mobile Number" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Contact number" required />
                <div className="col-span-2">
                  <label className="block text-sm text-text-secondary mb-3 uppercase tracking-widest flex items-center gap-2">
                    <MapPin size={14} /> Full Delivery Address
                  </label>
                  <textarea
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    required
                    className="w-full border border-glass-border rounded-2xl px-5 py-4 bg-transparent text-text-primary placeholder:text-text-muted outline-none focus:border-gold-primary transition-colors font-sans neumorphic-inset min-h-[100px]"
                    placeholder="House No, Street, Landmark, City, Pincode"
                  />
                </div>
              </div>
            </div>

            {/* Payment Method */}
            <div className="neumorphic-panel p-8 rounded-3xl space-y-6">
              <div className="flex items-center gap-3 border-b border-glass-border pb-5">
                <CreditCard size={18} className="text-gold-primary" />
                <h2 className="font-display text-xl text-text-primary tracking-widest uppercase">Payment Gateways</h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <PaymentOption
                  label="Cash on Delivery"
                  sublabel={`+${formatCurrency(COD_FEE)} COD fee`}
                  icon={<Banknote size={20} />}
                  selected={paymentMethod === 'cod'}
                  onClick={() => setPaymentMethod('cod')}
                />
                <PaymentOption
                  label="UPI / GPay"
                  sublabel="Instant • Secure"
                  icon={<QrCode size={20} />}
                  selected={paymentMethod === 'upi'}
                  onClick={() => setPaymentMethod('upi')}
                  recommended
                />
                <PaymentOption
                  label="Card / Netbanking"
                  sublabel="All banks supported"
                  icon={<CreditCard size={20} />}
                  selected={paymentMethod === 'card'}
                  onClick={() => setPaymentMethod('card')}
                />
                <PaymentOption
                  label="WhatsApp Order"
                  sublabel="Direct to Admin"
                  icon={<MessageCircle size={20} />}
                  selected={paymentMethod === 'whatsapp'}
                  onClick={() => setPaymentMethod('whatsapp')}
                />
              </div>

              {/* WhatsApp Payment Info */}
              {paymentMethod === 'whatsapp' && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="flex items-start gap-3 bg-green-500/5 border border-green-500/20 rounded-2xl p-4"
                >
                  <MessageCircle size={16} className="text-green-400 shrink-0 mt-0.5" />
                  <p className="text-xs text-green-300 leading-relaxed">
                    By clicking to Place Order through WhatsApp, your current Vault manifest and precise location data will be formatted into an encrypted message. Direct communication will be established with the VRK Farms administrator to manually fulfill your request without gateway limits.
                  </p>
                </motion.div>
              )}

              {/* Online payment assurance banner */}
              {paymentMethod !== 'cod' && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="flex items-start gap-3 bg-emerald-500/5 border border-emerald-500/20 rounded-2xl p-4"
                >
                  <CheckCircle size={16} className="text-emerald-400 shrink-0 mt-0.5" />
                  <p className="text-xs text-emerald-300 leading-relaxed">
                    Your order will only be confirmed <strong>after your payment is verified</strong>. If payment fails, no order is created and no stock is reserved.
                  </p>
                </motion.div>
              )}

              {/* COD warning banner */}
              {paymentMethod === 'cod' && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="flex items-start gap-3 bg-amber-500/5 border border-amber-500/20 rounded-2xl p-4"
                >
                  <AlertTriangle size={16} className="text-amber-400 shrink-0 mt-0.5" />
                  <p className="text-xs text-amber-300 leading-relaxed">
                    A <strong>₹{COD_FEE} handling fee</strong> applies to Cash on Delivery orders. Payment is due upon delivery. Repeated refusals may result in account restrictions.
                  </p>
                </motion.div>
              )}
            </div>
          </div>

          {/* Right Column: Order Summary */}
          <div className="lg:col-span-5">
            <div className="neumorphic-panel p-8 rounded-3xl sticky top-32 space-y-8">
              <h2 className="font-display text-2xl text-gold-primary tracking-widest border-b border-glass-border pb-6 uppercase">Order Summary</h2>

              <div className="space-y-6 max-h-[35vh] overflow-y-auto custom-scrollbar pr-2">
                {items.map((item) => (
                  <div key={item.product.id} className="flex gap-4 items-center">
                    <div className="w-16 h-16 rounded-xl overflow-hidden neumorphic-inset shrink-0 border border-glass-border">
                      <img src={item.product.images?.[0]?.url || '/placeholder.jpg'} alt="" className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-text-primary font-bold truncate text-sm">{item.product.name}</h3>
                      <p className="text-xs text-text-muted">Qty: {item.quantity}</p>
                    </div>
                    <p className="text-gold-light font-mono text-sm font-bold">{formatCurrency(item.product.price * item.quantity)}</p>
                  </div>
                ))}
              </div>

              <div className="space-y-3 pt-6 border-t border-glass-border">
                <div className="flex justify-between text-sm">
                  <span className="text-text-secondary uppercase tracking-widest">Subtotal</span>
                  <span className="text-text-primary font-mono">{formatCurrency(subtotal)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-text-secondary uppercase tracking-widest">Shipping</span>
                  <span className={`font-mono ${shipping === 0 ? 'text-emerald-400' : 'text-text-primary'}`}>
                    {shipping === 0 ? 'FREE' : formatCurrency(shipping)}
                  </span>
                </div>
                {codFee > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-amber-400 uppercase tracking-widest">COD Fee</span>
                    <span className="text-amber-400 font-mono">+{formatCurrency(codFee)}</span>
                  </div>
                )}
                <div className="flex justify-between items-baseline pt-4 border-t border-gold-primary/20">
                  <span className="text-gold-primary font-display text-xl uppercase tracking-widest">Total</span>
                  <div className="text-right">
                    <span className="text-gold-primary font-display text-3xl">{formatCurrency(total)}</span>
                    {paymentMethod === 'cod' && (
                      <p className="text-[10px] text-amber-400 uppercase tracking-widest mt-1">Payable on delivery</p>
                    )}
                  </div>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full h-16 text-lg font-bold tracking-[0.2em] uppercase"
                isLoading={isProcessing}
                disabled={isProcessing}
              >
                {paymentMethod === 'cod' ? 'Place COD Order' : paymentMethod === 'whatsapp' ? 'Place Order Through WhatsApp' : 'Pay & Confirm Order'}
              </Button>

              <div className="flex items-center justify-center gap-2 text-[10px] text-text-muted uppercase tracking-[0.2em]">
                <ShieldCheck size={12} className="text-gold-primary" />
                {paymentMethod === 'cod' ? 'Secure Order • Pay on Delivery' : '256-bit Encrypted • Razorpay Gateway'}
              </div>
            </div>
          </div>
        </form>
      </div>

      {/* COD Confirmation Dialog */}
      <AnimatePresence>
        {showCODConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center px-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="neumorphic-panel rounded-3xl p-8 max-w-md w-full space-y-6 border border-amber-500/20"
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shrink-0">
                  <AlertTriangle size={24} className="text-amber-400" />
                </div>
                <div>
                  <h3 className="font-display text-2xl text-text-primary uppercase tracking-widest">Confirm COD Order</h3>
                  <p className="text-text-secondary text-sm mt-1">Please review before confirming</p>
                </div>
              </div>

              <div className="bg-surface-2 rounded-2xl p-5 space-y-3 border border-glass-border">
                <div className="flex justify-between text-sm">
                  <span className="text-text-muted">Products</span>
                  <span className="font-mono text-text-primary">{formatCurrency(subtotal)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-text-muted">Shipping</span>
                  <span className="font-mono text-text-primary">{shipping === 0 ? 'FREE' : formatCurrency(shipping)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-amber-400">COD Handling Fee</span>
                  <span className="font-mono text-amber-400">+{formatCurrency(COD_FEE)}</span>
                </div>
                <div className="flex justify-between pt-3 border-t border-glass-border">
                  <span className="font-bold text-text-primary uppercase tracking-widest text-sm">Pay on Delivery</span>
                  <span className="font-display text-xl text-gold-primary">{formatCurrency(total)}</span>
                </div>
              </div>

              <p className="text-xs text-text-muted leading-relaxed">
                By confirming, you agree to pay <strong className="text-text-primary">{formatCurrency(total)}</strong> in cash when your order is delivered. Repeated cancellations or refusals may restrict your ability to place future COD orders.
              </p>

              <div className="flex gap-4">
                <button
                  onClick={() => setShowCODConfirm(false)}
                  className="flex-1 h-12 rounded-2xl border border-glass-border text-text-secondary hover:border-gold-primary/30 transition-all text-sm font-bold"
                >
                  Go Back
                </button>
                <Button onClick={handleCOD} className="flex-1 h-12" isLoading={isProcessing}>
                  Confirm Order
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function PaymentOption({ label, sublabel, icon, selected, onClick, recommended }: any) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative flex flex-col items-center justify-center gap-2 p-5 rounded-2xl border transition-all duration-300 ${
        selected
          ? 'bg-gold-primary/10 border-gold-primary text-gold-primary shadow-[0_0_20px_rgba(212,175,55,0.12)]'
          : 'bg-surface-2/50 border-glass-border text-text-muted hover:border-gold-primary/30'
      }`}
    >
      {recommended && (
        <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-emerald-500 text-white text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest whitespace-nowrap">
          Under Production
        </span>
      )}
      <div className={selected ? 'text-gold-primary' : 'text-text-muted opacity-50'}>{icon}</div>
      <span className="text-[10px] font-bold uppercase tracking-widest text-center leading-tight">{label}</span>
      {sublabel && <span className={`text-[9px] ${selected ? 'text-gold-primary/70' : 'text-text-muted/50'}`}>{sublabel}</span>}
    </button>
  );
}
