import { supabase } from '../../config/supabase';
import { StoreProduct } from '../../types/store';

export const storeService = {
  async getProducts(): Promise<StoreProduct[]> {
    const { data, error } = await supabase
      .from('store_products')
      .select('id, name, stock_quantity, price, images, slug')
      .eq('is_active', true)
      .order('name');

    if (error) {
      console.error('Error fetching store products:', error);
      throw error;
    }

    return data || [];
  },

  async recordSale(productId: string, quantity: number, priceAtSale: number): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    // 1. Insert sale record
    const { error: saleError } = await supabase
      .from('store_sales')
      .insert([
        {
          product_id: productId,
          seller_id: user.id,
          quantity,
          price_at_sale: priceAtSale,
        }
      ]);

    if (saleError) throw saleError;

    // 2. Decrement product stock atomically
    const { error: updateError } = await supabase.rpc('decrement_store_stock', {
      p_product_id: productId,
      p_quantity: quantity
    });

    if (updateError) throw updateError;
  },

  async getSales(): Promise<any[]> {
    const { data, error } = await supabase
      .from('store_sales')
      .select('*, store_products(name, images), profiles(full_name, avatar_url)')
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      console.error('Error fetching sales:', error);
      throw error;
    }

    return data || [];
  },

  async addProduct(product: Omit<StoreProduct, 'id' | 'slug'>): Promise<StoreProduct> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const slug = product.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');

    const { data, error } = await supabase
      .from('store_products')
      .insert([
        {
          name: product.name,
          stock_quantity: product.stock_quantity,
          price: product.price,
          slug: slug + '-' + Math.random().toString(36).substring(2, 6)
        }
      ])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async updateStock(productId: string, stockQuantity: number): Promise<void> {
    const { error } = await supabase
      .from('store_products')
      .update({ stock_quantity: stockQuantity })
      .eq('id', productId);

    if (error) throw error;
  },

  async getLedgers(): Promise<any[]> {
    // We fetch store sales to see who owes what
    const { data: sales, error: salesError } = await supabase
      .from('store_sales')
      .select('quantity, price_at_sale, seller_id, profiles(full_name)');

    if (salesError) throw salesError;

    // Fetch cash payments
    const { data: payments, error: paymentsError } = await supabase
      .from('store_ledger')
      .select('amount, storekeeper_id');

    if (paymentsError) throw paymentsError;

    const ledgersMap = new Map();

    // Sum sales
    sales?.forEach(sale => {
      const g = sale.seller_id;
      if (!ledgersMap.has(g)) {
        ledgersMap.set(g, {
          storekeeper_id: g,
          full_name: Array.isArray(sale.profiles) ? sale.profiles[0]?.full_name : (sale.profiles as any)?.full_name || 'Admin',
          totalRevenue: 0,
          totalPaid: 0
        });
      }
      ledgersMap.get(g).totalRevenue += (sale.quantity * sale.price_at_sale);
    });

    // Sum payments
    payments?.forEach(payment => {
      const g = payment.storekeeper_id;
      if (ledgersMap.has(g)) {
        ledgersMap.get(g).totalPaid += Number(payment.amount);
      }
    });

    return Array.from(ledgersMap.values()).map(l => ({
      ...l,
      outstandingBalance: l.totalRevenue - l.totalPaid
    }));
  },

  async recordCashReceived(storekeeperId: string, amount: number): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { error } = await supabase
      .from('store_ledger')
      .insert({
        storekeeper_id: storekeeperId,
        admin_id: user.id,
        amount
      });
      
    if (error) throw error;
  },

  async triggerDailyReport(storekeeperId: string, storekeeperName: string): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    // Get today's start date
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Fetch sales for this storekeeper today
    const { data: todaySales, error } = await supabase
      .from('store_sales')
      .select('*, store_products(name)')
      .eq('seller_id', storekeeperId)
      .gte('created_at', today.toISOString());

    if (error) throw error;

    if (!todaySales || todaySales.length === 0) {
      throw new Error("No sales found for today to report.");
    }

    const itemsSoldMap = new Map();
    let totalItemsSold = 0;
    let totalSalesValue = 0;

    todaySales.forEach(sale => {
       const pName = sale.store_products?.name || 'Unknown';
       if (!itemsSoldMap.has(pName)) {
          itemsSoldMap.set(pName, { name: pName, quantity: 0, total: 0 });
       }
       const rev = sale.quantity * sale.price_at_sale;
       itemsSoldMap.get(pName).quantity += sale.quantity;
       itemsSoldMap.get(pName).total += rev;
       totalItemsSold += sale.quantity;
       totalSalesValue += rev;
    });

    const payload = {
      storekeeperName,
      adminEmail: user.email, // Admins receive this
      totalItemsSold,
      totalSalesValue,
      salesDetailsList: Array.from(itemsSoldMap.values())
    };

    console.log("Triggering EOD Report with payload: ", payload);

    const { error: invokeError } = await supabase.functions.invoke('brevo-email', {
      body: {
        template: 'store_daily_report',
        payload
      }
    });

    if (invokeError) throw invokeError;
  }
};
