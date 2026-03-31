import { Outlet, Link, useLocation, Navigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { Box, Users, Settings, ShoppingCart, LogOut, LayoutDashboard } from 'lucide-react';
import { supabase } from '../../config/supabase';
import Navbar from './Navbar';

export default function AdminLayout() {
  const { user, profile, isLoading } = useAuthStore();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-obsidian">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl neumorphic-inset flex items-center justify-center mx-auto animate-pulse">
            <LayoutDashboard className="text-gold-primary" size={32} />
          </div>
          <p className="text-gold-primary font-display tracking-widest uppercase text-sm">Authenticating Vault Access...</p>
        </div>
      </div>
    );
  }

  // Strict Admin-only Guard
  if (!user || profile?.role !== 'admin') {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = '/login';
  };

  const navLinks = [
    { to: '/admin', label: 'Dashboard', icon: Box, exact: true },
    { to: '/admin/orders', label: 'Orders', icon: ShoppingCart, exact: false },
    { to: '/admin/products', label: 'Products', icon: Settings, exact: false },
    { to: '/admin/users', label: 'Users', icon: Users, exact: false },
  ];

  return (
    <>
    <Navbar />
    <div className="flex h-screen bg-obsidian text-text-primary p-4 pt-28 gap-6">
      {/* Sidebar */}
      <aside className="w-64 neumorphic-panel rounded-3xl flex flex-col border-none shrink-0 overflow-hidden">
        <div className="h-20 flex items-center px-8 border-b border-glass-border">
          <Link to="/admin" className="font-display text-xl text-gold-primary uppercase tracking-widest hover:text-gold-light transition-colors">
            Admin Vault
          </Link>
        </div>
        
        {/* Admin Profile Badge */}
        <div className="px-6 py-5 border-b border-glass-border flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl neumorphic-inset flex items-center justify-center shrink-0 overflow-hidden">
            {profile && (profile as any).avatar_url ? (
              <img src={(profile as any).avatar_url} alt="" className="w-full h-full object-cover" />
            ) : (
              <span className="text-gold-primary font-bold text-sm">{(profile as any)?.full_name?.[0] || 'A'}</span>
            )}
          </div>
          <div className="min-w-0">
            <p className="text-text-primary text-sm font-bold truncate">{(profile as any)?.full_name || user?.email}</p>
            <span className="text-[10px] bg-gold-primary/20 text-gold-primary px-2 py-0.5 rounded-full uppercase tracking-widest font-bold">Admin</span>
          </div>
        </div>

        <nav className="flex-1 p-4 flex flex-col gap-2">
          {navLinks.map(({ to, label, icon: Icon, exact }) => {
            const isActive = exact ? location.pathname === to : location.pathname.startsWith(to);
            return (
              <Link key={to} to={to} className={`p-4 rounded-2xl font-medium transition-all flex items-center gap-3 group ${isActive ? 'neumorphic-inset text-gold-primary' : 'text-text-secondary hover:text-text-primary hover:bg-white/5'}`}>
                <Icon size={18} className={isActive ? 'text-gold-primary' : 'text-text-muted group-hover:text-text-secondary'} />
                <span className="tracking-wide">{label}</span>
              </Link>
            );
          })}
          
          <div className="mt-auto pt-4 border-t border-glass-border">
            <Link to="/shop" className="p-4 rounded-2xl font-medium transition-all flex items-center gap-3 text-text-secondary hover:text-text-primary hover:bg-white/5 w-full">
              <ShoppingCart size={18} className="text-text-muted" />
              <span className="tracking-wide">View Storefront</span>
            </Link>
            <button onClick={handleLogout} className="w-full mt-1 p-4 rounded-2xl text-danger hover:bg-danger/10 transition-colors flex items-center gap-3 font-medium cursor-pointer">
              <LogOut size={18} /> Force Exit
            </button>
          </div>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto rounded-3xl">
        <div className="max-w-6xl mx-auto pb-12 pt-2">
          <Outlet />
        </div>
      </main>
    </div>
    </>
  );
}
