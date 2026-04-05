import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShoppingBag, User, Menu, LogOut, ShieldAlert, X, Package } from 'lucide-react';
import { useCartStore } from '../../store/cartStore';
import { useUiStore } from '../../store/uiStore';
import { useAuthStore } from '../../store/authStore';
import { supabase } from '../../config/supabase';
import toast from 'react-hot-toast';

export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  
  const items = useCartStore(state => state.items);
  const totalItems = items.reduce((t, i) => t + (Number(i.quantity) || 0), 0);
  const setCartOpen = useUiStore(state => state.setCartOpen);
  const { user, profile } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = async () => {
    if (isLoggingOut) return;
    setIsLoggingOut(true);
    const toastId = toast.loading('Securing vault exit...');
    try {
      await supabase.auth.signOut();
      toast.success('Successfully signed out. Vault locked.', { id: toastId });
      navigate('/');
      setMobileMenuOpen(false);
    } catch (error) {
      toast.error('Sign out failed.', { id: toastId });
    } finally {
      setIsLoggingOut(false);
    }
  };

  const navLinks = [
    { name: 'Shop', path: '/shop' },
    { name: 'Bee Farming', path: '/process' },
  ];

  return (
    <nav className="fixed w-full z-50 bg-obsidian/90 backdrop-blur-xl border-b border-glass-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-24">
          
          {/* Logo Section */}
          <div className="flex items-center gap-4 flex-1">
            <button 
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden text-text-primary p-2 neumorphic-inset rounded-xl"
            >
              {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
            <Link to="/" className="flex flex-col group" onClick={() => setMobileMenuOpen(false)}>
              <span className="font-display text-xl md:text-2xl tracking-[0.2em] font-bold text-gold-primary uppercase group-hover:text-gold-light transition-colors whitespace-nowrap">
                HONEY HUB
              </span>
              <span className="text-[0.6rem] tracking-[0.35em] font-sans text-text-muted uppercase mt-0.5 ml-1">
                Raw Collection
              </span>
            </Link>
          </div>

          {/* Desktop Navigation Links */}
          <div className="hidden lg:flex items-center justify-center flex-1 gap-10">
            {navLinks.map((link) => (
              <Link 
                key={link.path}
                to={link.path} 
                className="text-text-secondary hover:text-gold-primary font-bold tracking-[0.1em] transition-all uppercase text-xs whitespace-nowrap"
              >
                {link.name}
              </Link>
            ))}
          </div>

          {/* Action Icons */}
          <div className="flex items-center gap-2 sm:gap-6 flex-1 justify-end">
            
            {/* Admin Badge */}
            {user && profile?.role === 'admin' && (
              <Link to="/admin" className="hidden md:flex items-center gap-2 bg-gold-primary/10 border border-gold-primary/30 text-gold-primary text-[10px] uppercase tracking-widest px-3 py-2 rounded-full hover:bg-gold-primary/20 transition-all font-black">
                <ShieldAlert size={14} /> Admin
              </Link>
            )}

            <button 
              onClick={() => setCartOpen(true)} 
              className="flex flex-col items-center group px-2 relative cursor-pointer" 
              title="Cart"
            >
              <div className="relative">
                <ShoppingBag size={20} className="text-text-primary group-hover:text-gold-primary transition-colors" />
                {totalItems > 0 && (
                  <span className="absolute -top-2 -right-2 bg-gold-primary text-[10px] text-obsidian font-black w-4 h-4 rounded-full flex items-center justify-center">
                    {totalItems}
                  </span>
                )}
              </div>
              <span className="text-[10px] uppercase font-bold text-text-muted mt-1">Cart</span>
            </button>

            {/* Profile/Auth */}
            {user ? (
              <div className="flex items-center gap-1 sm:gap-4">
                <Link to="/orders" className="flex flex-col items-center group px-2" title="Orders">
                  <Package size={20} className="text-text-primary group-hover:text-gold-primary transition-colors" />
                  <span className="text-[10px] uppercase font-bold text-text-muted mt-1 hidden sm:block">Orders</span>
                </Link>
                <Link to="/profile" className="flex flex-col items-center group px-2" title="Profile">
                  <User size={20} className="text-text-primary group-hover:text-gold-primary transition-colors" />
                  <span className="text-[10px] uppercase font-bold text-text-muted mt-1 hidden sm:block">Profile</span>
                </Link>
                <button 
                  onClick={handleLogout} 
                  disabled={isLoggingOut}
                  className="flex flex-col items-center group px-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed" 
                  title="Logout"
                >
                  <LogOut size={20} className="text-text-muted group-hover:text-danger transition-colors" />
                  <span className="text-[10px] uppercase font-bold text-text-muted mt-1 hidden sm:block">
                    {isLoggingOut ? '...' : 'Logout'}
                  </span>
                </button>
              </div>
            ) : (
              <Link to="/login" className="flex flex-col items-center group px-2" title="Login">
                <User size={20} className="text-text-primary group-hover:text-gold-primary transition-colors" />
                <span className="text-[10px] uppercase font-bold text-text-muted mt-1">Login</span>
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-obsidian/95 backdrop-blur-2xl border-b border-glass-border animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="px-4 pt-4 pb-8 space-y-4">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                onClick={() => setMobileMenuOpen(false)}
                className="block px-4 py-4 text-lg font-display text-text-primary tracking-widest uppercase hover:bg-glass-border/10 rounded-2xl transition-colors"
              >
                {link.name}
              </Link>
            ))}
            {user && profile?.role === 'admin' && (
              <Link
                to="/admin"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-3 px-4 py-4 text-lg font-display text-gold-primary tracking-widest uppercase hover:bg-glass-border/10 rounded-2xl transition-colors"
              >
                <ShieldAlert size={20} /> Admin Dashboard
              </Link>
            )}
            {!user && (
               <Link
                to="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-4 py-4 text-lg font-display text-gold-primary tracking-widest uppercase hover:bg-glass-border/10 rounded-2xl transition-colors"
               >
                 Login / Register
               </Link>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
