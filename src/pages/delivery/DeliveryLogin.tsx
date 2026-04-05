import { useState } from 'react';
import { supabase } from '../../config/supabase';
import { useNavigate } from 'react-router-dom';
import { Plane, Lock, Mail } from 'lucide-react';
import toast from 'react-hot-toast';

export default function DeliveryLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    // We log the partner in via Supabase Auth
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    
    if (error) {
      toast.error(error.message);
      setLoading(false);
      return;
    }

    // Check if user is actually a delivery boy
    const { data: boyData } = await supabase.from('delivery_boys').select('id').eq('id', data.user.id).single();
    
    if (!boyData) {
      toast.error('Unauthorized access. This portal is for delivery partners only.');
      await supabase.auth.signOut();
    } else {
      toast.success('Login Successful');
      navigate('/delivery/dashboard');
    }
    
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-obsidian flex items-center justify-center p-4">
      <div className="w-full max-w-md p-8 bg-white/5 border border-gold-primary/20 shadow-[0_0_40px_rgba(212,175,55,0.05)] rounded-2xl backdrop-blur-sm relative overflow-hidden">
        
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-gold-primary to-transparent" />
        
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gold-primary/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-gold-primary/30 text-gold-primary">
            <Plane size={32} />
          </div>
          <h1 className="text-2xl font-display text-gold-primary tracking-widest uppercase">Partner Portal</h1>
          <p className="text-sm text-gray-400 mt-2">Sign in to manage your deliveries</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-300">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
              <input 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full bg-black/30 border border-white/10 rounded-lg py-3 pl-10 pr-4 text-white focus:outline-none focus:border-gold-primary transition-colors"
                placeholder="partner@honeyplatform.com"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-300">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full bg-black/30 border border-white/10 rounded-lg py-3 pl-10 pr-4 text-white focus:outline-none focus:border-gold-primary transition-colors"
                placeholder="••••••••"
              />
            </div>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-gold-primary text-obsidian font-bold py-3 rounded-lg hover:bg-gold-light transition-all flex justify-center items-center gap-2"
          >
            {loading ? <span className="animate-pulse">Authenticating...</span> : 'Access Portal'}
          </button>
        </form>

      </div>
    </div>
  );
}
