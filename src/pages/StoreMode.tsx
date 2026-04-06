import { useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useStoreAccess } from '../hooks/store/useStoreAccess';
import { useStoreSales } from '../hooks/store/useStoreSales';
import { useAuthStore } from '../store/authStore';
import { StoreHeader } from '../components/store/StoreHeader';
import { StockList } from '../components/store/StockList';
import { MobileBottomNav } from '../components/store/MobileBottomNav';
import { RequestAccessCard } from '../components/store/RequestAccessCard';
import { Loader2 } from 'lucide-react';

export default function StoreMode() {
  const { profile } = useAuthStore();
  const isAdmin = profile?.role === 'admin';
  
  const { request, isApproved, isLoading: isAccessLoading, isExpired, isPending, isRejected } = useStoreAccess();
  const { products, isProductsLoading, sellProduct } = useStoreSales();

  if (isAccessLoading && !isAdmin) {
    return (
      <div className="min-h-screen bg-obsidian flex items-center justify-center">
        <Loader2 className="text-gold-primary animate-spin" size={32} />
      </div>
    );
  }

  // Admin bypass
  if (!isAdmin) {
    if (!request) {
      return (
        <div className="min-h-screen bg-obsidian text-text-primary p-6 flex items-center justify-center">
          <div className="max-w-md w-full">
            <RequestAccessCard />
          </div>
        </div>
      );
    }

    if (isPending) {
      return <Navigate to="/store-access-pending" replace />;
    }

    if (isRejected || isExpired) {
      return (
        <div className="min-h-screen bg-obsidian text-text-primary p-6 flex items-center justify-center">
          <div className="max-w-md w-full neumorphic-panel p-8 rounded-3xl text-center space-y-4">
            <h2 className="text-xl font-display text-danger uppercase tracking-widest">Access Denied</h2>
            <p className="text-text-secondary text-sm">
              {isRejected ? 'Your access request was rejected.' : 'Your store session has expired.'}
            </p>
            <RequestAccessCard />
          </div>
        </div>
      );
    }
  }

  return (
    <div className="min-h-screen bg-obsidian text-text-primary p-6">
      <div className="max-w-md mx-auto">
        <StoreHeader 
          status={isAdmin ? 'approved' : (request?.status || 'pending')} 
          expiresAt={isAdmin ? null : request?.expires_at} 
        />
        
        <div className="grid grid-cols-2 gap-4 mb-8">
          <div className="neumorphic-panel p-4 rounded-3xl text-center">
            <p className="text-[10px] text-text-muted uppercase tracking-widest font-black mb-1">Items</p>
            <p className="text-xl font-display text-gold-primary">{products.length}</p>
          </div>
          <div className="neumorphic-panel p-4 rounded-3xl text-center">
            <p className="text-[10px] text-text-muted uppercase tracking-widest font-black mb-1">Low Stock Alerts</p>
            <p className="text-xl font-display text-danger">
              {products.filter(p => p.stock_quantity < 10).length}
            </p>
          </div>
        </div>

        <StockList 
          products={products} 
          isLoading={isProductsLoading} 
          onSell={(id, price, qty) => sellProduct(id, qty, price)}
        />

        <MobileBottomNav />
      </div>
    </div>
  );
}
