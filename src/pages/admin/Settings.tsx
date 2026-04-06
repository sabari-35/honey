import { useState, useEffect } from 'react';
import { supabase } from '../../config/supabase';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { MessageCircle, Save } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Settings() {
  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('store_settings')
        .select('*')
        .eq('setting_key', 'whatsapp_number')
        .single();
        
      if (error && error.code !== 'PGRST116') throw error; // PGRST116 is not found
      
      if (data) {
        setWhatsappNumber(data.setting_value);
      }
    } catch (e: any) {
      toast.error('Failed to load settings');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!whatsappNumber) return toast.error('Number cannot be empty');
    
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('store_settings')
        .upsert({ 
          setting_key: 'whatsapp_number', 
          setting_value: whatsappNumber.replace(/\D/g, ''),
          description: 'Phone number used for direct WhatsApp orders'
        }, { onConflict: 'setting_key' });

      if (error) throw error;
      toast.success('Settings updated successfully!');
    } catch (e: any) {
      toast.error('Failed to update settings');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return <div className="p-8 text-gold-primary animate-pulse">Loading settings...</div>;
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between border-b border-glass-border pb-6">
        <div>
          <h1 className="font-display text-4xl text-text-primary uppercase tracking-widest">Platform Config</h1>
          <p className="text-text-muted mt-2">Manage global settings securely</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="neumorphic-panel p-8 rounded-3xl space-y-6">
          <div className="flex items-center gap-3 border-b border-glass-border pb-4">
            <MessageCircle className="text-gold-primary" />
            <h2 className="font-display text-xl text-text-primary tracking-widest uppercase">Communication</h2>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-text-secondary uppercase tracking-widest mb-2 flex items-center gap-2">
                Order Receiver WhatsApp number
              </label>
              <Input 
                value={whatsappNumber}
                onChange={(e) => setWhatsappNumber(e.target.value)}
                placeholder="e.g. 6374241896"
              />
              <p className="text-xs text-text-muted mt-2 italic">
                Customers selecting the WhatsApp payment method will be redirected to this number with their encrypted cart.
              </p>
            </div>

            <Button onClick={handleSave} isLoading={isSaving} className="w-full mt-4">
              <Save size={16} className="mr-2" /> Save
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
