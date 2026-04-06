import { motion } from 'framer-motion';
import { ArrowRight, Droplet, Star, ShieldCheck } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { useState, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '../config/supabase';

export default function Landing() {
  const queryClient = useQueryClient();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // 3D Intro Animation Timer
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1300);

    // Prefetch products data as soon as landing mounts
    queryClient.prefetchQuery({
      queryKey: ['products', 'featured'],
      queryFn: async () => {
        const { data, error } = await supabase
          .from('products')
          .select('*')
          .eq('is_active', true)
          .order('featured', { ascending: false })
          .order('created_at', { ascending: false });
        if (error) throw error;
        return data;
      },
      staleTime: 1000 * 60 * 5,
    });
    
    return () => clearTimeout(timer);
  }, [queryClient]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-obsidian flex items-center justify-center relative overflow-hidden">
        {/* Pulse wave */}
        <div className="absolute w-80 h-80 rounded-full border-4 border-gold-primary opacity-30 animate-ping"></div>

        {/* Outer spinning ring */}
        <div className="absolute w-72 h-72 border-t-4 border-gold-light rounded-full animate-spin-slow"></div>

        {/* Inner spinning ring */}
        <div className="absolute w-48 h-48 border-b-4 border-[#8B6508] rounded-full animate-spin-reverse"></div>

        {/* Particle container */}
        <div className="relative flex">
          {"VRK".split("").map((letter, i) => (
            <span key={i} className="particle-letter font-display">
              {letter}
            </span>
          ))}
        </div>

        {/* Loading text */}
        <div className="absolute bottom-20 text-lg text-gold-primary tracking-[0.5em] animate-pulse font-display">
          FARMS
        </div>

        <style>{`
          /* Each letter assembles from particles */
          .particle-letter {
            font-size: 6rem;
            margin: 0 0.5rem;
            color: transparent;
            position: relative;
            overflow: hidden;
            animation: assemble 2.5s ease forwards;
          }

          /* Glowing hologram effect after assemble */
          .particle-letter::before {
            content: attr(class);
            position: absolute;
            left: 0;
            right: 0;
            color: #D4AF37;
            text-shadow: 0 0 15px #FDE047, 0 0 40px #D4AF37, 0 0 80px #8B6508;
            opacity: 0;
            animation: glow 2s ease-in-out infinite alternate 2.5s;
          }

          /* Assemble animation (particles flying in) */
          @keyframes assemble {
            0% {
              color: transparent;
              text-shadow: 0 0 0 #D4AF37;
              letter-spacing: 3rem;
              transform: translateY(100px) scale(0.5) rotateX(90deg);
              opacity: 0;
            }
            50% {
              opacity: 0.6;
              text-shadow: 0 0 20px #D4AF37, 0 0 40px #B8860B;
              transform: translateY(0) scale(1.2) rotateX(0deg);
            }
            100% {
              opacity: 1;
              color: #D4AF37;
              text-shadow: 0 0 25px #FDE047, 0 0 60px #D4AF37, 0 0 120px #8B6508;
              transform: scale(1);
              letter-spacing: 1.5rem;
            }
          }

          /* Neon glow loop after assemble */
          @keyframes glow {
            from {
              opacity: 0.8;
              text-shadow: 0 0 20px #D4AF37, 0 0 40px #B8860B;
            }
            to {
              opacity: 1;
              text-shadow: 0 0 30px #FDE047, 0 0 60px #D4AF37, 0 0 150px #8B6508;
            }
          }

          /* Spin variations */
          .animate-spin-slow {
            animation: spin 6s linear infinite;
          }
          .animate-spin-reverse {
            animation: spinReverse 8s linear infinite;
          }

          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
          @keyframes spinReverse {
            from { transform: rotate(360deg); }
            to { transform: rotate(0deg); }
          }
        `}</style>
      </div>
    );
  }
  return (
    <div className="w-full">
      {/* HERO SECTION */}
      <section 
        className="relative min-h-[90vh] flex items-center justify-center overflow-hidden bg-cover bg-center"
        style={{ backgroundImage: 'url(/landing-bg.png)' }}
      >
        {/* Background Effects */}
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-obsidian/70 backdrop-blur-[2px]" />
          {/* Animated aurora glow */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gold-primary/20 blur-[120px] rounded-full animate-pulse pointer-events-none" />
        </div>

        <div className="relative z-10 max-w-5xl mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, ease: 'easeOut' }}
            className="mb-8"
          >
           <br /> <br /> <br />
            <h1 className="text-5xl md:text-7xl lg:text-8xl font-display text-text-primary leading-tight mb-6">
              Liquid <span className="text-gold-primary italic">Gold</span> in the <span >Dark</span>
            </h1>
            
            <p className="text-lg md:text-xl text-text-secondary max-w-2xl mx-auto font-light leading-relaxed mb-10">
              Pure, raw, cold-pressed honey harvested from the untouched forests of the Himalayas. No preservatives. No compromise.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              
              <Link to="/shop">
                <Button size="lg" className="w-full sm:w-auto group">
                  Explore the Products
                  <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
            
               
            </div>
            <br />
            <span className="inline-block py-1 px-3 rounded-full border border-gold-primary/30 bg-gold-glow text-gold-primary text-sm font-medium tracking-widest uppercase mb-6">
              BLOODY SWEET
            </span>
          </motion.div>
        </div>
      </section>

      {/* VALUE PROPS */}
      <section className="py-24 bg-surface-1 border-y border-glass-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 text-center">
            <motion.div whileHover={{ y: -5 }} className="glass-panel p-8">
              <div className="w-16 h-16 rounded-full bg-gold-glow border border-gold-primary/30 flex items-center justify-center mx-auto mb-6 text-gold-primary">
                <Droplet size={32} />
              </div>
              <h3 className="font-display text-xl text-text-primary mb-3">Cold Pressed</h3>
              <p className="text-text-secondary text-sm leading-relaxed">Extracted using traditional methods below 35°C to preserve vital enzymes and natural pollen.</p>
            </motion.div>

            <motion.div whileHover={{ y: -5 }} className="glass-panel p-8">
              <div className="w-16 h-16 rounded-full bg-gold-glow border border-gold-primary/30 flex items-center justify-center mx-auto mb-6 text-gold-primary">
                <ShieldCheck size={32} />
              </div>
              <h3 className="font-display text-xl text-text-primary mb-3">100% Pure</h3>
              <p className="text-text-secondary text-sm leading-relaxed">No added sugar, no artificial flavors, and absolutely no pasteurization. Just raw nature.</p>
            </motion.div>

            <motion.div whileHover={{ y: -5 }} className="glass-panel p-8">
              <div className="w-16 h-16 rounded-full bg-gold-glow border border-gold-primary/30 flex items-center justify-center mx-auto mb-6 text-gold-primary">
                <Star size={32} />
              </div>
              <h3 className="font-display text-xl text-text-primary mb-3">Single Origin</h3>
              <p className="text-text-secondary text-sm leading-relaxed">Every jar originates from a single apiary, ensuring unique flavor profiles and complete traceability.</p>
            </motion.div>
          </div>
        </div>
      </section>
    </div>
  );
}
