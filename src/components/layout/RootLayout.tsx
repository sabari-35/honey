import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import toast from 'react-hot-toast';
import { useAuthStore } from '../../store/authStore';
import Navbar from './Navbar';
import Footer from './Footer';
import CartDrawer from '../cart/CartDrawer';

export default function RootLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, profile } = useAuthStore();
  const isCheckoutPage = location.pathname === '/checkout';

  useEffect(() => {
    // Force profile completion for signed-in users
    if (user && profile && location.pathname !== '/profile') {
      const isMissingInfo = !(profile as any).full_name || !(profile as any).phone;
      if (isMissingInfo) {
        toast.error('Complete your profile to unlock vault access.', { icon: '🔐', id: 'profile-incomplete' });
        navigate('/profile', { replace: true });
      }
    }
  }, [user, profile, location.pathname, navigate]);

  return (
    <div className="flex flex-col min-h-screen bg-obsidian text-text-primary">
      <Navbar />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
      {/* Ensure Cart Drawer is hidden on checkout for a cleaner flow */}
      {!isCheckoutPage && <CartDrawer />}
    </div>
  );
}
