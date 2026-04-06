import { useState, useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import { storeService } from '../services/store/storeService';
import { useStoreSales } from '../hooks/store/useStoreSales';
import { StoreProduct } from '../types/store';
import { MobileBottomNav } from '../components/store/MobileBottomNav';
import { ArrowLeft, Plus, Box, Save, X, Edit2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';

export default function StoreStock() {
  const { profile } = useAuthStore();
  const isAdmin = profile?.role === 'admin';
  
  const {
    products, 
    isProductsLoading: isLoading, 
    addProduct, 
    updateStock 
  } = useStoreSales();

  const [isAddingMode, setIsAddingMode] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // New product form
  const [newName, setNewName] = useState('');
  const [newPrice, setNewPrice] = useState('');
  const [newStock, setNewStock] = useState('');

  // Edit stock map
  const [editStockMap, setEditStockMap] = useState<Record<string, string>>({});

  const handleCreateProduct = async () => {
    if (!newName || !newPrice || !newStock) {
      toast.error('Please fill all fields');
      return;
    }

    try {
      await addProduct({
        name: newName,
        price: parseFloat(newPrice),
        stock_quantity: parseInt(newStock, 10),
        images: []
      });
      setIsAddingMode(false);
      setNewName('');
      setNewPrice('');
      setNewStock('');
    } catch (error) {
       // Handled by hook
    }
  };

  const handleUpdateStock = async (id: string) => {
    const newStockStr = editStockMap[id];
    if (!newStockStr) {
      setEditingId(null);
      return;
    }
    const newStockVal = parseInt(newStockStr, 10);
    if (isNaN(newStockVal)) {
      toast.error('Invalid stock number');
      return;
    }

    try {
      await updateStock(id, newStockVal);
      setEditingId(null);
    } catch (error) {
       // Handled by hook
    }
  };

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
              <Box size={14} /> Vault Stock
            </h1>
          </div>
          <div className="w-6"></div> {/* spacer */}
        </div>
<br /><br />
        {/* Add Product Button (Admins only) */}
        {isAdmin && !isAddingMode && (
          <button 
            onClick={() => setIsAddingMode(true)}
            className="w-full h-12 flex items-center justify-center gap-2 neumorphic-panel rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] text-gold-primary border border-gold-primary/20 hover:bg-gold-primary/10 transition-all"
          >
            <Plus size={16} /> Add New Product
          </button>
        )}

        {/* Add New Product Form */}
        {isAddingMode && (
          <div className="neumorphic-panel p-6 rounded-3xl space-y-4 border border-gold-primary/30">
            <div className="flex justify-between items-center">
              <h2 className="text-[10px] font-black uppercase tracking-widest text-text-secondary">New Product</h2>
              <button onClick={() => setIsAddingMode(false)} className="text-text-muted hover:text-danger">
                <X size={16} />
              </button>
            </div>
            <input 
              type="text" 
              placeholder="Product Name" 
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="w-full h-12 bg-black/40 border border-glass-border rounded-xl px-4 text-sm text-text-primary focus:border-gold-primary transition-colors outline-none"
            />
            <div className="grid grid-cols-2 gap-4">
              <input 
                type="number" 
                placeholder="Price (₹)" 
                value={newPrice}
                onChange={(e) => setNewPrice(e.target.value)}
                className="w-full h-12 bg-black/40 border border-glass-border rounded-xl px-4 text-sm text-text-primary focus:border-gold-primary transition-colors outline-none"
              />
              <input 
                type="number" 
                placeholder="Initial Stock" 
                value={newStock}
                onChange={(e) => setNewStock(e.target.value)}
                className="w-full h-12 bg-black/40 border border-glass-border rounded-xl px-4 text-sm text-text-primary focus:border-gold-primary transition-colors outline-none"
              />
            </div>
            <button 
              onClick={handleCreateProduct}
              className="w-full h-12 neumorphic-gold rounded-xl text-obsidian font-black uppercase text-[10px] tracking-widest flex items-center justify-center gap-2"
            >
              <Save size={16} /> Create Product
            </button>
          </div>
        )}

        {/* Stock List */}
        <div className="space-y-4">
          {isLoading ? (
             <div className="h-32 neumorphic-panel rounded-3xl animate-pulse"></div>
          ) : products.length === 0 ? (
            <div className="text-center p-8 text-text-muted uppercase text-[10px] tracking-widest font-black">
              No store products found
            </div>
          ) : (
            products.map((product) => (
              <div key={product.id} className="neumorphic-panel p-4 rounded-2xl flex items-center justify-between border border-transparent hover:border-gold-primary/20 transition-all">
                <div className="flex-1">
                  <h3 className="font-bold text-text-primary uppercase tracking-wide text-sm">{product.name}</h3>
                  <p className="text-xs text-gold-secondary font-mono mt-1">₹{product.price}</p>
                </div>

                <div className="flex items-center gap-3">
                  {editingId === product.id ? (
                    <div className="flex items-center gap-2">
                       <input 
                          type="number"
                          className="w-16 h-8 bg-black border border-gold-primary rounded text-center text-sm font-mono text-text-primary outline-none"
                          value={editStockMap[product.id] ?? product.stock_quantity}
                          onChange={(e) => setEditStockMap({...editStockMap, [product.id]: e.target.value })}
                          autoFocus
                       />
                       <button onClick={() => handleUpdateStock(product.id)} className="text-success hover:text-green-400 p-2">
                          <CheckIcon />
                       </button>
                       <button onClick={() => setEditingId(null)} className="text-danger hover:text-red-400 p-2">
                          <X size={16} />
                       </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-4">
                      <div className="flex flex-col items-end">
                        <span className="text-[10px] uppercase font-black text-text-muted tracking-widest">In Stock</span>
                        <span className={`text-lg font-mono font-bold ${product.stock_quantity < 10 ? 'text-danger drop-shadow-[0_0_8px_rgba(239,68,68,0.5)]' : 'text-text-primary'}`}>
                          {product.stock_quantity}
                        </span>
                      </div>
                      
                      {isAdmin && (
                        <button 
                          onClick={() => {
                            setEditingId(product.id);
                            setEditStockMap({...editStockMap, [product.id]: product.stock_quantity.toString()});
                          }}
                          className="w-8 h-8 rounded-full bg-black/40 flex items-center justify-center text-text-muted hover:text-gold-primary border border-glass-border transition-colors"
                        >
                          <Edit2 size={12} />
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        <MobileBottomNav />
      </div>
    </div>
  );
}

function CheckIcon() {
  return <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
}
