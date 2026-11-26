import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { supabase } from '../../config/supabase';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { X, UploadCloud } from 'lucide-react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import toast from 'react-hot-toast';

const productSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  slug: z.string().min(1, 'Slug is required').regex(/^[a-z0-9-]+$/, 'Slug must be lowercase letters, numbers, and hyphens only'),
  description: z.string().optional(),
  price: z.number().min(0, 'Price must be positive'),
  discount_percent: z.number().min(0).max(100).default(0),
  stock_quantity: z.number().min(0, 'Stock must be positive'),
  low_stock_threshold: z.number().min(0),
  is_active: z.boolean().default(true),
});

type ProductFormData = z.infer<typeof productSchema>;

// Auto-generate a URL-safe slug from a name with a random suffix to avoid collisions
function generateSlug(name: string): string {
  const base = name.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  const suffix = Math.random().toString(36).substring(2, 6);
  return `${base}-${suffix}`;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  product?: any;
}

export default function ProductFormModal({ isOpen, onClose, product }: Props) {
  const queryClient = useQueryClient();
  const [imageFile, setImageFile] = useState<File | null>(null);

  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: '', slug: '', description: '', price: 0, discount_percent: 0,
      stock_quantity: 0, low_stock_threshold: 5, is_active: true,
    }
  });

  const watchedName = watch('name');

  // Auto-generate slug from name only when creating a new product
  useEffect(() => {
    if (!product && watchedName) {
      setValue('slug', generateSlug(watchedName), { shouldValidate: false });
    }
  }, [watchedName, product, setValue]);

  useEffect(() => {
    if (product) {
      // Calculate active discount if compare_price is set
      const initialPrice = product.compare_price || product.price;
      const discount = product.compare_price 
        ? Math.round(((product.compare_price - product.price) / product.compare_price) * 100) 
        : 0;

      reset({
        name: product.name, slug: product.slug, description: product.description,
        price: initialPrice, discount_percent: discount, stock_quantity: product.stock_quantity,
        low_stock_threshold: product.low_stock_threshold, is_active: product.is_active,
      });
    } else {
      reset({ name: '', slug: '', description: '', price: 0, discount_percent: 0, stock_quantity: 0, low_stock_threshold: 5, is_active: true });
    }
    setImageFile(null);
  }, [product, reset, isOpen]);

  const mutation = useMutation({
    mutationFn: async (data: ProductFormData) => {
      let imageUrl = product?.images?.[0]?.url;

      if (imageFile) {
        const fileExt = imageFile.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
        const { error: uploadError } = await supabase.storage.from('products').upload(fileName, imageFile);
        if (uploadError) {
          console.warn('Image upload failed, proceeding without image:', uploadError.message);
        } else {
          const { data: { publicUrl } } = supabase.storage.from('products').getPublicUrl(fileName);
          imageUrl = publicUrl;
        }
      }

      // Calculate final prices
      const hasDiscount = data.discount_percent > 0;
      const finalPrice = hasDiscount 
        ? data.price * (1 - data.discount_percent / 100)
        : data.price;
      const comparePrice = hasDiscount ? data.price : null;

      const payload = { 
        ...data, 
        price: finalPrice,
        compare_price: comparePrice,
        images: imageUrl ? [{ url: imageUrl }] : [] 
      };
      
      // Remove local UI field before sending to DB
      delete (payload as any).discount_percent;

      if (product?.id) {
        const { error } = await supabase.from('products').update(payload).eq('id', product.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('products').insert([payload]);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success(`Product ${product ? 'updated' : 'added'} successfully.`);
      onClose();
    },
    onError: (err: any) => {
      toast.error(err.message || 'Operation failed.');
    }
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-obsidian/80 backdrop-blur-sm">
      <div className="neumorphic-panel w-full max-w-3xl max-h-[92vh] overflow-y-auto custom-scrollbar rounded-3xl">
        <div className="flex justify-between items-center p-8 border-b border-glass-border sticky top-0 bg-[#1A1A1E] z-10">
          <h2 className="text-3xl font-display text-gold-primary tracking-widest uppercase">
            {product ? 'Update Entry' : 'New Entry'}
          </h2>
          <button onClick={onClose} className="w-10 h-10 rounded-full neumorphic-inset flex items-center justify-center text-text-muted hover:text-gold-primary transition-colors">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit((data) => mutation.mutate(data))} className="p-8 space-y-6 text-text-primary">
          <div className="grid grid-cols-2 gap-6">
            <Input label="Product Name" {...register('name')} error={errors.name?.message} placeholder="e.g. Wild Forest Honey" />
            <div>
              <Input label="URL Slug (auto-generated)" {...register('slug')} error={errors.slug?.message} placeholder="e.g. wild-forest-honey-a1b2" />
              <p className="text-xs text-text-muted mt-1 ml-1">Auto-filled from name. Edit only if needed.</p>
            </div>
            
            <Input label="Price (₹)" type="number" {...register('price', { valueAsNumber: true })} error={errors.price?.message} />
            <Input label="Discount (%)" type="number" {...register('discount_percent', { valueAsNumber: true })} error={errors.discount_percent?.message} />

            <Input label="Stock Units" type="number" {...register('stock_quantity', { valueAsNumber: true })} error={errors.stock_quantity?.message} />
            <Input label="Low Stock Alert At" type="number" {...register('low_stock_threshold', { valueAsNumber: true })} error={errors.low_stock_threshold?.message} />

            <div className="col-span-2">
              <label className="block text-sm text-text-secondary mb-3 uppercase tracking-widest font-bold">Description</label>
              <textarea
                className="w-full border border-glass-border rounded-xl px-5 py-4 bg-transparent text-text-primary focus:border-gold-primary outline-none neumorphic-inset min-h-[120px] resize-y"
                placeholder="Describe the product — taste, origin, health benefits..."
                {...register('description')}
              />
            </div>

            <div className="col-span-2">
              <label className="block text-sm text-text-secondary mb-3 uppercase tracking-widest font-bold">Product Image</label>
              <div className="border border-dashed border-glass-border rounded-2xl p-10 flex flex-col items-center justify-center text-text-muted neumorphic-inset relative cursor-pointer hover:border-gold-primary hover:text-gold-primary transition-colors">
                <input type="file" accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer" onChange={(e) => setImageFile(e.target.files?.[0] || null)} />
                <UploadCloud size={36} className="mb-3" />
                <span className="text-sm tracking-widest uppercase">{imageFile ? imageFile.name : (product?.images?.[0]?.url ? 'Click to change image' : 'Click to upload image')}</span>
              </div>
            </div>

            <div className="col-span-2 flex items-center gap-4 bg-white/5 p-5 rounded-2xl neumorphic-panel">
              <input type="checkbox" id="isActive" {...register('is_active')} className="w-5 h-5 accent-gold-primary cursor-pointer" />
              <label htmlFor="isActive" className="text-text-primary text-sm cursor-pointer uppercase tracking-widest font-bold">Active — Visible to customers on shop page</label>
            </div>
          </div>

          <div className="flex justify-end gap-4 pt-6 border-t border-glass-border">
            <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
            <Button type="submit" isLoading={mutation.isPending}>
              {product ? 'Save Changes' : 'Add to Vault'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

