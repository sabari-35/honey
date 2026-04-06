import { LayoutDashboard, ShoppingCart, Box, User, Wallet } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';

export function MobileBottomNav() {
  const location = useLocation();
  const { profile } = useAuthStore();
  const isAdmin = profile?.role === 'admin';

  let navItems = [
    { label: 'Dash', icon: LayoutDashboard, path: '/store-mode' },
    { label: 'Sales', icon: ShoppingCart, path: '/store-mode/sales' },
    { label: 'Stock', icon: Box, path: '/store-mode/stock' },
  ];

  if (isAdmin) {
    navItems.push({ label: 'Ledger', icon: Wallet, path: '/store-mode/ledger' });
  } else {
    navItems.push({ label: 'Me', icon: User, path: '/profile' });
  }

  return (
    <div className="fixed bottom-6 left-4 right-4 z-50">
      <div className="bg-obsidian/80 backdrop-blur-2xl neumorphic-panel rounded-full px-6 py-3 border border-glass-border flex justify-between items-center shadow-2xl">
        {navItems.map(({ label, icon: Icon, path }) => {
          const isActive = location.pathname === path;
          return (
            <Link 
              key={path} 
              to={path}
              className={`flex flex-col items-center gap-1 transition-all ${isActive ? 'text-gold-primary scale-110' : 'text-text-muted hover:text-text-secondary'}`}
            >
              <Icon size={20} className={isActive ? 'drop-shadow-gold' : ''} />
              <span className="text-[10px] font-black uppercase tracking-tighter">{label}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
