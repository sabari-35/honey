import { useStoreSales } from '../hooks/store/useStoreSales';
import { MobileBottomNav } from '../components/store/MobileBottomNav';
import { ArrowLeft, ShoppingCart, Clock, Download, Package } from 'lucide-react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { formatCurrency } from '../utils/formatCurrency';

export default function StoreSales() {
  const { sales, products, myLedger, isSalesLoading: isLoading } = useStoreSales();

  const handleDownloadReport = () => {
    if (!sales || sales.length === 0) return;
    
    const todayStr = format(new Date(), 'yyyy-MM-dd');
    const dailySales = sales.filter(s => format(new Date(s.created_at), 'yyyy-MM-dd') === todayStr);

    if (dailySales.length === 0) {
      alert("No sales logged today to download.");
      return;
    }

    const headers = ['Date', 'Time', 'Product', 'Quantity', 'Price', 'Total', 'Storekeeper'];
    const rows = dailySales.map(s => [
      format(new Date(s.created_at), 'yyyy-MM-dd'),
      format(new Date(s.created_at), 'hh:mm a'),
      `"${s.store_products?.name || 'Unknown'}"`,
      s.quantity,
      s.price_at_sale,
      s.quantity * s.price_at_sale,
      `"${s.profiles?.full_name || 'Admin'}"`
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Vault_Daily_Sales_Report_${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  // Calculations
  const totalStockValue = products.reduce((acc, p) => acc + (p.stock_quantity * p.price), 0);
  
  const productBreakdown: Record<string, number> = sales.reduce((acc: Record<string, number>, sale) => {
    const name = sale.store_products?.name || 'Unknown Product';
    if (!acc[name]) acc[name] = 0;
    acc[name] += sale.quantity;
    return acc;
  }, {});

  return (
    <div className="min-h-screen bg-obsidian text-text-primary p-6 pb-24">
      <div className="max-w-md mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-glass-border">
          <Link to="/store-mode" className="text-text-muted hover:text-gold-primary transition-colors">
            <ArrowLeft size={24} />
          </Link>
          <div className="text-center">
            <h1 className="text-xs uppercase tracking-[0.3em] text-gold-primary font-black flex items-center gap-2">
              <ShoppingCart size={14} /> Vault Sales
            </h1>
          </div>
          <button 
            onClick={handleDownloadReport}
            className="text-text-muted hover:text-gold-primary transition-colors"
            title="Download CSV Report"
          >
            <Download size={20} />
          </button>
        </div>

        {/* Global Stats */}
        <div className="grid grid-cols-2 gap-4">
          <div className="neumorphic-panel p-4 text-center rounded-3xl flex flex-col justify-center">
             <p className="text-[10px] text-text-muted font-black uppercase tracking-widest mb-1">Owe To Admin</p>
             <p className={`text-xl font-display ${myLedger?.outstandingBalance > 0 ? 'text-danger drop-shadow-[0_0_8px_rgba(239,68,68,0.5)]' : 'text-success'}`}>
               {formatCurrency(myLedger?.outstandingBalance || 0)}
             </p>
          </div>
          <div className="neumorphic-panel p-4 text-center rounded-3xl flex flex-col justify-center">
             <p className="text-[10px] text-text-muted font-black uppercase tracking-widest mb-1">Full Stock Value</p>
             <p className="text-xl font-display text-gold-secondary">
               {formatCurrency(totalStockValue)}
             </p>
          </div>
        </div>

        {/* Product Breakdown */}
        {Object.keys(productBreakdown).length > 0 && (
          <div className="neumorphic-panel p-5 rounded-3xl space-y-3 border border-glass-border">
             <h2 className="text-[10px] font-black uppercase tracking-widest text-text-secondary flex items-center justify-center gap-2 pb-2"><Package size={12}/> Items Sold This Session</h2>
             <div className="grid grid-cols-2 gap-3">
               {Object.entries(productBreakdown).map(([name, qty]) => (
                 <div key={name} className="bg-black/40 p-3 rounded-2xl border border-glass-border text-center">
                    <p className="text-[10px] text-text-muted font-black uppercase tracking-widest truncate">{name}</p>
                    <p className="text-lg font-mono text-gold-primary mt-1">{(qty as number)} <span className="text-[9px] text-text-muted font-sans font-bold">SOLD</span></p>
                 </div>
               ))}
             </div>
          </div>
        )}

        {/* Sales List */}
        <div className="space-y-4 pt-2">
          <h2 className="text-[10px] font-black uppercase tracking-widest text-text-secondary pl-2 text-center">Recent Transactions</h2>
          
          {isLoading ? (
             <div className="space-y-4">
               {[1,2,3].map(i => <div key={i} className="h-20 neumorphic-panel animate-pulse rounded-2xl" />)}
             </div>
          ) : sales.length === 0 ? (
            <div className="text-center p-8 text-text-muted uppercase text-[10px] tracking-widest font-black">
              No sales logged yet
            </div>
          ) : (
            sales.map((sale) => (
              <div key={sale.id} className="neumorphic-panel p-4 rounded-2xl flex items-center justify-between">
                <div className="flex gap-4 items-center">
                   <div className="w-10 h-10 rounded-xl bg-black/40 neumorphic-inset flex items-center justify-center border border-glass-border">
                     {sale.store_products?.images?.[0]?.url ? (
                        <img src={sale.store_products.images[0].url} alt="" className="w-full h-full object-cover rounded-xl" />
                     ) : (
                        <ShoppingCart size={14} className="text-gold-primary/50" />
                     )}
                   </div>
                   <div>
                     <h3 className="text-sm font-bold text-text-primary uppercase tracking-wide">
                        {sale.store_products?.name || 'Unknown Product'}
                     </h3>
                     <div className="flex items-center gap-2 mt-1 text-[10px] text-text-muted font-black uppercase tracking-wider">
                        <span className="flex items-center gap-1"><Clock size={10} /> {format(new Date(sale.created_at), 'dd MMM yyyy • hh:mm a')}</span>
                        <span className="text-gold-secondary/50">•</span>
                        <span>{sale.profiles?.full_name || 'Admin'}</span>
                     </div>
                   </div>
                </div>
                
                <div className="text-right">
                  <p className="text-success font-mono font-bold text-sm bg-success/10 px-2 py-0.5 rounded border border-success/20">
                     +₹{sale.quantity * sale.price_at_sale}
                  </p>
                  <p className="text-[10px] text-text-muted font-black tracking-widest mt-1">QTY: {sale.quantity}</p>
                </div>
              </div>
            ))
          )}

          <button 
            onClick={handleDownloadReport}
            className="w-full py-4 mt-8 rounded-2xl border border-gold-primary text-gold-primary font-black uppercase text-xs tracking-[0.3em] hover:bg-gold-primary hover:text-black transition-colors flex items-center justify-center gap-2"
          >
            <Download size={16} /> Download Daily Report (CSV)
          </button>
        </div>

        <MobileBottomNav />
      </div>
    </div>
  );
}
