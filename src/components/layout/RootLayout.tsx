import { Outlet, useLocation } from 'react-router-dom';
import Navbar from './Navbar';
import Footer from './Footer';
import CartDrawer from '../cart/CartDrawer';

export default function RootLayout() {
  const location = useLocation();
  const isCheckoutPage = location.pathname === '/checkout';

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
