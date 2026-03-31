import { motion } from 'framer-motion';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { DollarSign, ShoppingBag, Package, Users } from 'lucide-react';
import { formatCurrency } from '../../utils/formatCurrency';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../config/supabase';
import { useEffect } from 'react';

const chartData = [
  { name: 'Mon', revenue: 4000 },
  { name: 'Tue', revenue: 3000 },
  { name: 'Wed', revenue: 5000 },
  { name: 'Thu', revenue: 8000 },
  { name: 'Fri', revenue: 6000 },
  { name: 'Sat', revenue: 9000 },
  { name: 'Sun', revenue: 11000 },
];

export default function Dashboard() {
  const queryClient = useQueryClient();

  const { data: statsData } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: async () => {
      const [ordersRes, profilesRes] = await Promise.all([
        supabase.from('orders').select('total_amount, status'),
        supabase.from('profiles').select('id', { count: 'exact' })
      ]);

      const orders = ordersRes.data || [];
      const grossVolume = orders.reduce((sum, o) => sum + Number(o.total_amount), 0);
      const pendingOrders = orders.filter(o => o.status === 'pending').length;

      return {
        grossVolume,
        totalOrders: orders.length,
        pendingOrders,
        activeAccounts: profilesRes.count || 0
      };
    }
  });

  useEffect(() => {
    const channel = supabase
      .channel('admin-stats-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => {
        queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [queryClient]);

  const stats = [
    { title: 'Gross Volume', value: formatCurrency(statsData?.grossVolume || 0), icon: DollarSign, change: '+12.5%' },
    { title: 'Total Orders', value: String(statsData?.totalOrders || 0), icon: ShoppingBag, change: '+8.2%' },
    { title: 'Pending Fulfillment', value: String(statsData?.pendingOrders || 0), icon: Package, change: '-2.4%' },
    { title: 'Active Accounts', value: String(statsData?.activeAccounts || 0), icon: Users, change: '+18.1%' },
  ];

  return (
    <div className="space-y-10">
      <h1 className="font-display text-4xl text-gold-primary tracking-widest uppercase">Vault Metrics</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        {stats.map((stat, i) => (
          <motion.div 
            key={i}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.1, duration: 0.4 }}
            className="neumorphic-panel p-8 rounded-3xl"
          >
            <div className="flex justify-between items-start mb-6">
              <div className="w-14 h-14 rounded-2xl neumorphic-inset flex items-center justify-center text-gold-primary">
                <stat.icon size={28} />
              </div>
              <span className={`text-sm font-bold ${stat.change.startsWith('+') ? 'text-success' : 'text-danger'}`}>
                {stat.change}
              </span>
            </div>
            <h3 className="text-text-secondary text-sm mb-2">{stat.title}</h3>
            <p className="text-3xl font-display text-text-primary tracking-wide">{stat.value}</p>
          </motion.div>
        ))}
      </div>

      <div className="neumorphic-panel p-8 rounded-3xl">
        <div className="flex justify-between items-center mb-8">
          <h3 className="text-text-primary text-xl font-medium tracking-wide">Revenue Flow</h3>
          <select className="neumorphic-inset bg-transparent text-text-secondary outline-none border-none py-2 px-4 rounded-xl cursor-pointer">
            <option>Last 7 Days</option>
            <option>This Month</option>
            <option>This Year</option>
          </select>
        </div>
        <div className="h-[400px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#D4AF37" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#D4AF37" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <XAxis dataKey="name" stroke="#6B7280" fontSize={12} tickLine={false} axisLine={false} dy={10} />
              <YAxis stroke="#6B7280" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `₹${value}`} dx={-10} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#1A1A1E', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '16px', boxShadow: '8px 8px 16px #0f0f11, -8px -8px 16px #25252b' }}
                itemStyle={{ color: '#D4AF37', fontWeight: 'bold' }}
                labelStyle={{ color: '#9CA3AF', marginBottom: '8px' }}
                cursor={{ stroke: 'rgba(212,175,55,0.2)', strokeWidth: 2 }}
              />
              <Area type="monotone" dataKey="revenue" stroke="#D4AF37" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
