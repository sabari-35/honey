import { createBrowserRouter, RouterProvider, Outlet } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import PageTransition from './components/layout/PageTransition';
import { useAuthInit } from './hooks/useAuth';

// Layout
const RootLayout = lazy(() => import('./components/layout/RootLayout'));
const AdminLayout = lazy(() => import('./components/layout/AdminLayout'));

// Pages
const Landing = lazy(() => import('./pages/Landing'));
const Process = lazy(() => import('./pages/Process'));
const Shop = lazy(() => import('./pages/Shop'));
const ProductDetail = lazy(() => import('./pages/ProductDetail'));
const Checkout = lazy(() => import('./pages/Checkout'));
const OrderSuccess = lazy(() => import('./pages/OrderSuccess'));
const Login = lazy(() => import('./pages/Login'));
const Profile = lazy(() => import('./pages/Profile'));
const MyOrders = lazy(() => import('./pages/MyOrders'));
const CustomerTracking = lazy(() => import('./pages/CustomerTracking'));

// Admin Pages
const Dashboard = lazy(() => import('./pages/admin/Dashboard'));
const Orders = lazy(() => import('./pages/admin/Orders'));
const Products = lazy(() => import('./pages/admin/Products'));
const Users = lazy(() => import('./pages/admin/Users'));
const Reviews = lazy(() => import('./pages/admin/Reviews'));
const AdminDeliveries = lazy(() => import('./pages/admin/AdminDeliveries'));

// Delivery Pages
const DeliveryLogin = lazy(() => import('./pages/delivery/DeliveryLogin'));
const DeliveryDashboard = lazy(() => import('./pages/delivery/DeliveryDashboard'));

const FallbackLoader = () => (
  <div className="min-h-screen bg-obsidian flex items-center justify-center text-gold-primary font-display tracking-widest uppercase">
    Loading...
  </div>
);

const router = createBrowserRouter([
  {
    path: '/',
    element: (
      <Suspense fallback={<FallbackLoader />}>
        <RootLayout />
      </Suspense>
    ),
    children: [
      { index: true, element: <PageTransition><Landing /></PageTransition> },
      { path: 'process', element: <PageTransition><Process /></PageTransition> },
      { path: 'shop', element: <PageTransition><Shop /></PageTransition> },
      { path: 'product/:slug', element: <PageTransition><ProductDetail /></PageTransition> },
      { path: 'checkout', element: <PageTransition><Checkout /></PageTransition> },
      { path: 'success', element: <PageTransition><OrderSuccess /></PageTransition> },
      { path: 'login', element: <PageTransition><Login /></PageTransition> },
      { path: 'profile', element: <PageTransition><Profile /></PageTransition> },
      { path: 'orders', element: <PageTransition><MyOrders /></PageTransition> },
      { path: 'order/:id/track', element: <PageTransition><CustomerTracking /></PageTransition> },
    ],
  },
  {
    path: '/admin',
    element: (
      <Suspense fallback={<FallbackLoader />}>
        <AdminLayout />
      </Suspense>
    ),
    children: [
      { index: true, element: <PageTransition><Dashboard /></PageTransition> },
      { path: 'orders', element: <PageTransition><Orders /></PageTransition> },
      { path: 'products', element: <PageTransition><Products /></PageTransition> },
      { path: 'users', element: <PageTransition><Users /></PageTransition> },
      { path: 'reviews', element: <PageTransition><Reviews /></PageTransition> },
      { path: 'deliveries', element: <PageTransition><AdminDeliveries /></PageTransition> },
    ]
  },
  {
    path: '/delivery',
    element: (
      <Suspense fallback={<FallbackLoader />}>
        <Outlet />
      </Suspense>
    ),
    children: [
      { path: 'login', element: <PageTransition><DeliveryLogin /></PageTransition> },
      { path: 'dashboard', element: <PageTransition><DeliveryDashboard /></PageTransition> },
    ]
  }
]);

function AppRouter() {
  useAuthInit(); // Initialize auth listener system-wide
  return <RouterProvider router={router} />;
}

export default AppRouter;
