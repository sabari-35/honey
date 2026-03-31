import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useCartStore, selectSubtotal } from '../store/cartStore';
import { useUiStore } from '../store/uiStore';
import { supabase } from '../config/supabase';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { formatCurrency } from '../utils/formatCurrency';
import { MapPin, Phone, User, CreditCard, Banknote, QrCode, ShieldCheck } from 'lucide-react';
import toast from 'react-hot-toast';

type PaymentMethod = 'cod' | 'upi' | 'card';

export default function Checkout() {
  const navigate = useNavigate();
  const { user, profile } = useAuthStore();
  const { items, clearCart } = useCartStore();
  const { setCartOpen } = useUiStore();
  
  const [fullName, setFullName] = useState((profile as any)?.full_name || '');
  const [phone, setPhone] = useState((profile as any)?.phone || '');
  const [address, setAddress] = useState((profile as any)?.default_address?.label || '');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cod');
  const [isProcessing, setIsProcessing] = useState(false);

  const subtotal = selectSubtotal(items);
  const shipping = subtotal > 1000 ? 0 : 150;
  const total = subtotal + shipping;

  useEffect(() => {
    // Ensure the cart drawer is closed for a focused checkout experience
    setCartOpen(false);

    if (items.length === 0) {
      navigate('/shop');
    }
  }, [items, navigate, setCartOpen]);

  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast.error('Please sign in to place an order.');
      navigate('/login');
      return;
    }

    if (!fullName || !phone || !address) {
      toast.error('Please complete your shipping information.');
      return;
    }

    setIsProcessing(true);
    const orderNumber = `GV-${new Date().getFullYear()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

    try {
      // 1. Create the order
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert([{
          order_number: orderNumber,
          user_id: user.id,
          subtotal,
          shipping_amount: shipping,
          total_amount: total,
          shipping_address: { label: address, full_name: fullName, phone },
          status: 'pending',
          payment_status: paymentMethod === 'cod' ? 'pending' : 'pending' // For UPI/Card it stays pending until verified
        }])
        .select()
        .single();

      if (orderError) throw orderError;

      // 2. Create order items
      const orderItems = items.map(item => ({
        order_id: order.id,
        product_id: item.product.id,
        quantity: item.quantity,
        unit_price: item.product.price,
        total_price: item.product.price * item.quantity,
        product_snapshot: { name: item.product.name, price: item.product.price, image: item.product.images?.[0]?.url }
      }));

      const { error: itemsError } = await supabase.from('order_items').insert(orderItems);
      if (itemsError) throw itemsError;

      // 3. Update stock (decrement)
      for (const item of items) {
        const { error: stockError } = await supabase.rpc('decrement_stock', { 
          p_id: item.product.id, 
          p_qty: item.quantity 
        });
        if (stockError) console.warn('Stock update failed:', stockError);
      }

      // 4. Handle Payment Flow
      if (paymentMethod === 'cod') {
        toast.success('Order placed successfully (COD)!');
        clearCart();
        navigate('/success', { state: { orderNumber, total } });
      } else {
        // Here you would integrate Razorpay/Stripe
        // For now, simulator success
        toast.loading('Redirecting to payment gateway...');
        setTimeout(() => {
          clearCart();
          navigate('/success', { state: { orderNumber, total } });
        }, 2000);
      }

    } catch (err: any) {
      toast.error(err.message || 'Failed to place order.');
    } finally {
      setIsProcessing(false);
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
            <p className="text-text-muted text-sm tracking-widest uppercase">Vault Transaction Protocol</p>
          </div>
        </div>

        <form onSubmit={handleSubmitOrder} className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          
          {/* Left Column: Forms */}
          <div className="lg:col-span-7 space-y-8">
            
            {/* Shipping Info */}
            <div className="neumorphic-panel p-8 rounded-3xl space-y-6">
              <div className="flex items-center gap-3 border-b border-glass-border pb-5">
                <User size={18} className="text-gold-primary" />
                <h2 className="font-display text-xl text-text-primary tracking-widest uppercase">Shipping Details</h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <Input label="Recipient Name" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Full name" required />
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
                  <p className="text-[10px] text-text-muted mt-2 tracking-widest uppercase ml-1">
                    Suggestion: Update your default address in Profile to skip this.
                  </p>
                </div>
              </div>
            </div>

            {/* Payment Method */}
            <div className="neumorphic-panel p-8 rounded-3xl space-y-6">
              <div className="flex items-center gap-3 border-b border-glass-border pb-5">
                <CreditCard size={18} className="text-gold-primary" />
                <h2 className="font-display text-xl text-text-primary tracking-widest uppercase">Payment Strategy</h2>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <PaymentOption 
                  id="cod" 
                  label="Cash on Delivery" 
                  icon={<Banknote size={20} />} 
                  selected={paymentMethod === 'cod'} 
                  onClick={() => setPaymentMethod('cod')}
                />
                <PaymentOption 
                  id="upi" 
                  label="UPI / GPay" 
                  icon={<QrCode size={20} />} 
                  selected={paymentMethod === 'upi'} 
                  onClick={() => setPaymentMethod('upi')}
                />
                <PaymentOption 
                  id="card" 
                  label="Card / Netbanking" 
                  icon={<CreditCard size={20} />} 
                  selected={paymentMethod === 'card'} 
                  onClick={() => setPaymentMethod('card')}
                />
              </div>
            </div>
          </div>

          {/* Right Column: Order Summary */}
          <div className="lg:col-span-5">
            <div className="neumorphic-panel p-8 rounded-3xl sticky top-32 space-y-8">
              <h2 className="font-display text-2xl text-gold-primary tracking-widest border-b border-glass-border pb-6 uppercase">Order Manifest</h2>
              
              <div className="space-y-6 max-h-[40vh] overflow-y-auto custom-scrollbar pr-2">
                {items.map((item) => (
                  <div key={item.product.id} className="flex gap-4 items-center">
                    <div className="w-16 h-16 rounded-xl overflow-hidden neumorphic-inset shrink-0 border border-glass-border">
                      <img src={item.product.images?.[0]?.url || '/placeholder.jpg'} alt="" className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-text-primary font-bold truncate text-sm">{item.product.name}</h3>
                      <p className="text-xs text-text-muted">Quantity: {item.quantity}</p>
                    </div>
                    <p className="text-gold-light font-mono text-sm font-bold">{formatCurrency(item.product.price * item.quantity)}</p>
                  </div>
                ))}
              </div>

              <div className="space-y-4 pt-6 border-t border-glass-border">
                <div className="flex justify-between text-sm">
                  <span className="text-text-secondary uppercase tracking-widest">Subtotal</span>
                  <span className="text-text-primary font-mono">{formatCurrency(subtotal)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-text-secondary uppercase tracking-widest">Logistics (Shipping)</span>
                  <span className="text-text-primary font-mono">{shipping === 0 ? 'FREE' : formatCurrency(shipping)}</span>
                </div>
                {shipping > 0 && (
                  <p className="text-[10px] text-gold-primary/70 uppercase tracking-widest">Free delivery on orders above ₹1,000</p>
                )}
                <div className="flex justify-between items-baseline pt-4 border-t border-gold-primary/20">
                  <span className="text-gold-primary font-display text-xl uppercase tracking-widest">Total Value</span>
                  <span className="text-gold-primary font-display text-3xl">{formatCurrency(total)}</span>
                </div>
              </div>

              <Button 
                type="submit" 
                className="w-full h-16 text-lg font-bold tracking-[0.2em] uppercase"
                isLoading={isProcessing}
              >
                Commite Transaction
              </Button>

              <div className="flex items-center justify-center gap-2 text-[10px] text-text-muted uppercase tracking-[0.2em]">
                <ShieldCheck size={12} className="text-gold-primary" />
                End-to-End Encrypted Vault
              </div>
            </div>
          </div>

        </form>
      </div>
    </div>
  );
}

function PaymentOption({ id, label, icon, selected, onClick }: any) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex flex-col items-center justify-center gap-3 p-6 rounded-2xl border transition-all duration-300 ${
        selected 
          ? 'bg-gold-primary/10 border-gold-primary text-gold-primary shadow-[0_0_20px_rgba(212,175,55,0.1)]' 
          : 'bg-surface-2/50 border-glass-border text-text-muted hover:border-gold-primary/30'
      }`}
    >
      <div className={`${selected ? 'text-gold-primary' : 'text-text-muted opacity-50'}`}>
        {icon}
      </div>
      <span className="text-[10px] font-bold uppercase tracking-widest text-center">{label}</span>
    </button>
  );
}
