import { useState, useEffect } from 'react';
import { useAuthStore } from '../../store/authStore';
import { storeService } from '../../services/store/storeService';
import { MobileBottomNav } from '../../components/store/MobileBottomNav';
import { ArrowLeft, Wallet, Send, Check } from 'lucide-react';
import { Link, Navigate } from 'react-router-dom';
import { formatCurrency } from '../../utils/formatCurrency';
import toast from 'react-hot-toast';

export default function StoreLedger() {
  const { profile } = useAuthStore();
  const isAdmin = profile?.role === 'admin';
  
  const [ledgers, setLedgers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Payment marking states
  const [selectedKeeper, setSelectedKeeper] = useState<string | null>(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSendingReport, setIsSendingReport] = useState<string | null>(null);

  useEffect(() => {
    if (isAdmin) fetchLedgers();
  }, [isAdmin]);

  const fetchLedgers = async () => {
    try {
      const data = await storeService.getLedgers();
      setLedgers(data);
    } catch (error) {
      toast.error('Failed to load store ledgers');
    } finally {
      setIsLoading(false);
    }
  };

  const handleMarkPayment = async () => {
    if (!selectedKeeper || !paymentAmount) return;
    const amount = parseFloat(paymentAmount);
    if (isNaN(amount) || amount <= 0) {
      toast.error('Enter a valid amount');
      return;
    }

    setIsSubmitting(true);
    try {
      await storeService.recordCashReceived(selectedKeeper, amount);
      toast.success('Payment recorded successfully');
      setSelectedKeeper(null);
      setPaymentAmount('');
      fetchLedgers();
    } catch (error) {
      console.error(error);
      toast.error('Failed to record payment');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSendReport = async (storekeeperId: string, name: string) => {
    setIsSendingReport(storekeeperId);
    try {
      await storeService.triggerDailyReport(storekeeperId, name);
      toast.success('Daily report dispatched securely to Admin inbox');
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || 'Failed to send daily report');
    } finally {
      setIsSendingReport(null);
    }
  };

  if (!isAdmin) return <Navigate to="/store-mode" replace />;

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
              <Wallet size={14} /> Vault Ledger
            </h1>
          </div>
          <div className="w-6"></div>
        </div>

        <p className="text-[10px] text-text-muted font-black tracking-widest uppercase text-center mt-2">
          Monitor outstanding cash balances from Store Terminals
        </p>

        {/* Ledger List */}
        <div className="space-y-4 pt-4">
          {isLoading ? (
             <div className="space-y-4">
               {[1,2].map(i => <div key={i} className="h-32 neumorphic-panel animate-pulse rounded-3xl" />)}
             </div>
          ) : ledgers.length === 0 ? (
            <div className="text-center p-8 text-text-muted uppercase text-[10px] tracking-widest font-black">
              No sales activity found across terminals
            </div>
          ) : (
            ledgers.map((ledger) => (
              <div key={ledger.storekeeper_id} className="neumorphic-panel p-5 rounded-3xl space-y-4 border border-gold-primary/10">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-bold text-text-primary uppercase tracking-wide text-sm">{ledger.full_name}</h3>
                    <p className="text-[10px] text-text-muted tracking-widest uppercase mt-1">Store Terminal</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] uppercase font-black text-text-muted tracking-widest mb-1">Outstanding</p>
                    <p className={`text-xl font-mono font-bold ${ledger.outstandingBalance > 0 ? 'text-danger drop-shadow-[0_0_8px_rgba(239,68,68,0.5)]' : 'text-success'}`}>
                      {formatCurrency(ledger.outstandingBalance)}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs bg-black/40 p-3 rounded-2xl border border-glass-border shadow-inner">
                   <div>
                     <span className="block text-text-muted mb-1">Total Sales</span>
                     <span className="font-mono text-gold-primary font-bold">{formatCurrency(ledger.totalRevenue)}</span>
                   </div>
                   <div>
                     <span className="block text-text-muted mb-1">Total Received</span>
                     <span className="font-mono text-success font-bold">{formatCurrency(ledger.totalPaid)}</span>
                   </div>
                </div>

                {ledger.outstandingBalance > 0 && selectedKeeper !== ledger.storekeeper_id && (
                  <div className="grid grid-cols-2 gap-3 pt-2">
                    <button 
                      onClick={() => handleSendReport(ledger.storekeeper_id, ledger.full_name)}
                      disabled={isSendingReport === ledger.storekeeper_id}
                      className="w-full py-2.5 rounded-xl border border-glass-border text-text-secondary hover:text-gold-primary hover:border-gold-primary/30 text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                    >
                      {isSendingReport === ledger.storekeeper_id ? <span className="animate-pulse">Sending...</span> : <><Send size={12}/> EOD Report</>}
                    </button>
                    <button 
                      onClick={() => setSelectedKeeper(ledger.storekeeper_id)}
                      className="w-full py-2.5 rounded-xl bg-gold-primary/10 border border-gold-primary/30 text-gold-primary hover:bg-gold-primary hover:text-obsidian text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all"
                    >
                      <Check size={12}/> Mark Paid
                    </button>
                  </div>
                )}

                {/* Receive Payment Form */}
                {selectedKeeper === ledger.storekeeper_id && (
                  <div className="pt-2 flex gap-2 items-center">
                    <input 
                      type="number"
                      placeholder="Amount Received"
                      value={paymentAmount}
                      onChange={(e) => setPaymentAmount(e.target.value)}
                      className="flex-1 bg-black border border-glass-border rounded-xl px-4 py-2.5 text-sm text-text-primary focus:border-gold-primary outline-none font-mono"
                      autoFocus
                    />
                    <button 
                      onClick={handleMarkPayment}
                      disabled={isSubmitting}
                      className="px-4 py-2.5 rounded-xl bg-success text-obsidian font-bold text-xs uppercase tracking-wider disabled:opacity-50"
                    >
                      Save
                    </button>
                    <button 
                       onClick={() => { setSelectedKeeper(null); setPaymentAmount(''); }}
                       className="px-4 py-2.5 rounded-xl border border-glass-border text-text-secondary text-xs uppercase tracking-wider"
                    >
                      Cancel
                    </button>
                  </div>
                )}

              </div>
            ))
          )}
        </div>

        {/* Dummy spacing for bottom nav if needed */}
      </div>
    </div>
  );
}
