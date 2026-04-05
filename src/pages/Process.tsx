import { useRef, useEffect } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Navbar from '../components/layout/Navbar';

gsap.registerPlugin(ScrollTrigger);

const products = [
  { name: 'Pure Honey', nameTm: 'மலைத்தேன்', desc: '100% Pure Raw Honey extracted without heat.', img: 'https://images.unsplash.com/photo-1587049352847-8d4e894155db?q=80&w=1000&auto=format&fit=crop' },
  { name: 'Honey Comb Cake', nameTm: 'தேன் அடை', desc: 'Fresh from the hive, chewy and rich in pollen.', img: 'https://images.unsplash.com/photo-1616788880373-c36195c6fddb?q=80&w=1000&auto=format&fit=crop' },
  { name: 'Amla Murabba', nameTm: 'தேன் நெல்லி', desc: 'Amla soaked organically in raw honey for months.', img: 'https://images.unsplash.com/photo-1631526437340-e14b14d59f3c?q=80&w=1000&auto=format&fit=crop' },
  { name: 'Amla Candy', nameTm: 'நெல்லி மிட்டாய்', desc: 'Sweet & sour natural candy. High Vitamin C.', img: 'https://images.unsplash.com/photo-1579619575883-7c154316d2ca?q=80&w=1000&auto=format&fit=crop' },
  { name: 'Turmeric Powder', nameTm: 'மஞ்சள் தூள்', desc: 'Organic stone-ground high curcumin turmeric.', img: 'https://images.unsplash.com/photo-1615486171447-4981d7f0ecfb?q=80&w=1000&auto=format&fit=crop' },
  { name: 'Country Chicken', nameTm: 'நாட்டுக்கோழி', desc: 'Free-range countryside chicken fed on natural grains.', img: 'https://images.unsplash.com/photo-1548550023-2bf3c49b338c?q=80&w=1000&auto=format&fit=crop' },
  { name: 'Tender Coconut', nameTm: 'இளநீர்', desc: 'Refreshing farm tender coconut direct from palms.', img: 'https://images.unsplash.com/photo-1582282577239-4dbeba4b7264?q=80&w=1000&auto=format&fit=crop' },
  { name: 'Coconut', nameTm: 'தேங்காய்', desc: 'Fresh mature farm coconuts for culinary perfection.', img: 'https://images.unsplash.com/photo-1550828520-4cb4969268d0?q=80&w=1000&auto=format&fit=crop' }
];

export default function Process() {
  const containerRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    const ctx = gsap.context(() => {
      // 1. Hero Zoom & Disappear
      const heroTl = gsap.timeline({
        scrollTrigger: {
          trigger: '.hero-container',
          start: 'top top',
          end: 'bottom top',
          scrub: 1,
          pin: true,
        }
      });

      heroTl.to('.hero-bg-layer', { scale: 1.5, opacity: 0.2, ease: 'none' }, 0)
            .to('.hero-text-block', { yPercent: -50, opacity: 0, ease: 'none' }, 0);

      // 2. The Pinned Image Stacking (Apple-style narrative)
      const stackCards = gsap.utils.toArray<HTMLElement>('.stack-card');
      stackCards.forEach((card, i) => {
        ScrollTrigger.create({
          trigger: card,
          start: 'top top',
          pin: true,
          pinSpacing: false,
          snap: 1,
          end: () => `+=${window.innerHeight}`,
        });
      });

      // 3. Staggered Horizontal Scrub for Products Title
      gsap.to('.products-marquee', {
        xPercent: -50,
        ease: 'none',
        scrollTrigger: {
          trigger: '.products-section',
          start: 'top bottom',
          end: 'bottom top',
          scrub: 1
        }
      });

      // 4. Products entrance grid
      gsap.from('.product-pro-card', {
        y: 150,
        opacity: 0,
        rotationX: -15,
        stagger: 0.1,
        duration: 1.2,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: '.products-grid',
          start: 'top 80%',
        }
      });

    }, containerRef);

    return () => ctx.revert();
  }, []);

  return (
    <div ref={containerRef} className="bg-[#050505] text-white font-sans overflow-x-hidden selection:bg-gold-primary selection:text-obsidian">
      <Navbar />

      {/* --- HERO SECTION --- */}
      <section className="hero-container relative h-screen w-full flex flex-col items-center justify-center overflow-hidden z-10">
        <div className="hero-bg-layer absolute inset-0 z-0 bg-[url('https://images.unsplash.com/photo-1544383187-d4fa973ff669?q=80&w=2670&auto=format&fit=crop')] bg-cover bg-center opacity-40">
          <div className="absolute inset-0 bg-gradient-to-b from-[#050505]/0 via-[#050505]/20 to-[#050505] mix-blend-multiply"></div>
        </div>
        
        <div className="hero-text-block relative z-10 text-center px-4 md:px-0">
          <div className="overflow-hidden mb-6">
            <p className="text-gold-primary uppercase tracking-[0.5em] text-xs font-black backdrop-blur-sm bg-obsidian/30 inline-block px-6 py-2 rounded-full border border-gold-primary/20">The Genesis</p>
          </div>
          <h1 className="font-display text-8xl md:text-[12rem] leading-none font-black text-transparent bg-clip-text bg-gradient-to-b from-white to-white/30 tracking-tighter drop-shadow-2xl">
            VRK FARMS
          </h1>
          <p className="text-text-muted font-mono uppercase tracking-[0.4em] mt-8 text-sm md:text-xl drop-shadow-lg">Absolute Purity • Engineered by Nature</p>
        </div>
        
        <div className="absolute bottom-16 left-1/2 -translate-x-1/2 text-center animate-pulse">
           <div className="w-[1px] h-24 bg-gradient-to-b from-gold-primary to-transparent mx-auto"></div>
        </div>
      </section>

      {/* --- STACKING NARRATIVE PROCESS --- */}
      <section className="process-stack-section relative z-20 bg-[#050505]">
        {[
          { num: '01', title: 'Untouched Habitats', desc: 'Our bees roam freely across acres of wildly grown, pesticide-free flora. The nectar collected is robust, raw, and pure.', img: 'https://images.unsplash.com/photo-1473973266408-ed4e27abdd47?q=80&w=2000&auto=format&fit=crop' },
          { num: '02', title: 'The Comb Matrix', desc: 'Inside the hives, millions of bees orchestrate a complex matrix of wax and nectar, condensing it into thick, medicinal honey.', img: 'https://images.unsplash.com/photo-1587049352847-8d4e894155db?q=80&w=2000&auto=format&fit=crop' },
          { num: '03', title: 'Cold Extraction', desc: 'Combs are uncapped by hand. We use centrifugal force instead of heat to preserve the delicate enzymes and vitamins.', img: 'https://images.unsplash.com/photo-1590089851571-08173ea51fba?q=80&w=2000&auto=format&fit=crop' },
          { num: '04', title: 'Raw Bottling', desc: 'Unfiltered, unpasteurized, and undisturbed. Poured raw into glass, keeping the majestic integrity of the bee process intact.', img: 'https://images.unsplash.com/photo-1629851608404-539097e93da4?q=80&w=2000&auto=format&fit=crop' }
        ].map((step, i) => (
          <div key={i} className="stack-card h-screen w-full relative flex items-center justify-center p-4 md:p-12 overflow-hidden shadow-[0_-20px_50px_rgba(0,0,0,0.8)] origin-top">
            
            <div className="absolute inset-0 z-0">
              <img src={step.img} alt={step.title} className="w-full h-full object-cover opacity-30" />
              <div className={`absolute inset-0 bg-gradient-to-br from-[#050505] ${i % 2 === 0 ? 'via-[#050505]/80' : 'via-[#050505]/95'} to-transparent`}></div>
            </div>

            <div className={`relative z-10 max-w-7xl w-full flex flex-col ${i % 2 === 0 ? 'md:flex-row' : 'md:flex-row-reverse'} items-center gap-12 md:gap-32`}>
              <div className="flex-1 space-y-8 px-4">
                 <span className="text-gold-primary font-mono text-xl border border-gold-primary/30 px-4 py-2 rounded-full backdrop-blur-md bg-gold-primary/5">PHASE {step.num}</span>
                 <h2 className="font-display text-5xl md:text-7xl font-black text-white leading-[1.1]">{step.title}</h2>
                 <p className="text-text-secondary text-lg md:text-2xl leading-relaxed max-w-xl font-light">
                   {step.desc}
                 </p>
              </div>
              <div className="flex-1 w-full h-[40vh] md:h-[60vh] relative rounded-[3rem] overflow-hidden border border-white/10 shadow-2xl">
                 <img src={step.img} className="w-full h-full object-cover mix-blend-luminosity scale-110" alt={step.title} />
                 <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent mix-blend-overlay"></div>
              </div>
            </div>
          </div>
        ))}
      </section>

      {/* --- MASSIVE MARQUEE & PRODUCTS GRID --- */}
      <section className="products-section relative z-30 bg-[#050505] pt-32 pb-48 overflow-hidden">
        
        {/* Absolute glow */}
        <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-gold-primary/10 rounded-full blur-[200px] pointer-events-none"></div>

        <div className="whitespace-nowrap overflow-hidden mb-32 mix-blend-screen opacity-10">
          <h2 className="products-marquee font-display text-[15rem] font-black text-white px-8 uppercase">
            NATURAL PRODUCE • NATURAL PRODUCE • NATURAL PRODUCE • 
          </h2>
        </div>

        <div className="max-w-7xl mx-auto px-4 relative z-10 products-grid">
           
           <div className="flex flex-col md:flex-row justify-between items-end mb-20 gap-8">
             <h2 className="font-display text-6xl md:text-8xl text-transparent bg-clip-text bg-gradient-to-r from-gold-primary to-gold-light uppercase tracking-tighter">
               The Farm<br/>Collection
             </h2>
             <p className="text-text-secondary max-w-md text-lg border-l-2 border-gold-primary/30 pl-6 py-2">
               A meticulously cultivated selection of raw materials sourced directly from our farm borders, preserving the authenticity of native breeds and plants.
             </p>
           </div>

           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
             {products.map((p, i) => (
               <div key={i} className="product-pro-card group relative h-[450px] rounded-[2rem] overflow-hidden bg-surface-2 border border-white/5 hover:border-gold-primary/50 transition-all duration-700 cursor-pointer shadow-lg hover:shadow-gold-primary/20">
                 {/* Image BG */}
                 <div className="absolute inset-0 w-full h-full pb-32">
                   <img src={p.img} alt={p.name} className="w-full h-full object-cover filter saturate-50 group-hover:saturate-100 group-hover:scale-110 transition-all duration-[1s]" />
                   <div className="absolute inset-0 bg-gradient-to-t from-[#0F0F12] via-[#0F0F12]/80 to-transparent"></div>
                 </div>
                 
                 {/* Content overlay */}
                 <div className="absolute bottom-0 left-0 right-0 p-8 flex flex-col justify-end min-h-[50%] z-10">
                   <div className="flex gap-2 mb-4 opacity-0 group-hover:opacity-100 translate-y-4 group-hover:translate-y-0 transition-all duration-500 delay-100">
                     <span className="text-[9px] uppercase tracking-widest text-obsidian bg-gold-primary px-3 py-1 rounded-full font-black">VRK Certified</span>
                   </div>
                   <h3 className="font-display text-2xl text-white mb-1 group-hover:text-gold-primary transition-colors">{p.name}</h3>
                   <p className="text-xs text-gold-primary/50 uppercase tracking-[0.2em] mb-4 font-bold">{p.nameTm}</p>
                   <p className="text-sm text-text-secondary line-clamp-2 leading-relaxed opacity-0 group-hover:opacity-100 -translate-y-4 group-hover:translate-y-0 transition-all duration-500">{p.desc}</p>
                 </div>
               </div>
             ))}
           </div>
        </div>
      </section>

      {/* --- FOOTER / CONCLUSION --- */}
      <footer className="relative h-[50vh] flex flex-col items-center justify-center border-t border-white/10 bg-[#020202] overflow-hidden text-center">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1544383187-d4fa973ff669?q=80&w=2670&auto=format&fit=crop')] bg-cover bg-center opacity-10 mix-blend-luminosity"></div>
        <div className="relative z-10 max-w-3xl px-4">
           <h2 className="font-display text-4xl md:text-6xl text-gold-primary mb-8 tracking-wider">VRK FARMS</h2>
           <p className="text-text-muted tracking-[0.3em] uppercase text-sm md:text-base border-y border-white/10 py-6 mx-auto w-max px-12">Return to Nature • Return to Life</p>
        </div>
      </footer>

    </div>
  );
}
