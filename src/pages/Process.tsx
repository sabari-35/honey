import { useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';
import Navbar from '../components/layout/Navbar';

gsap.registerPlugin(ScrollTrigger);

const products = [
  { name: 'Honey', nameTm: 'தேன்', desc: '100% Pure Raw Honey' },
  { name: 'Honey Comb Cake', nameTm: 'தேன் அடை', desc: 'Fresh from the hive' },
  { name: 'Amla Murabba', nameTm: 'தேன் நெல்லி', desc: 'Amla soaked in honey' },
  { name: 'Amla Candy', nameTm: 'நெல்லி மிட்டாய்', desc: 'Sweet & sour natural candy' },
  { name: 'Turmeric Powder', nameTm: 'மஞ்சள் தூள்', desc: 'Organic stone-ground turmeric' },
  { name: 'Country Chicken', nameTm: 'நாட்டுக்கோழி', desc: 'Free-range countryside chicken' },
  { name: 'Tender Coconut', nameTm: 'இளநீர்', desc: 'Refreshing farm tender coconut' },
  { name: 'Coconut', nameTm: 'தேங்காய்', desc: 'Fresh mature farm coconuts' }
];

export default function Process() {
  const containerRef = useRef<HTMLDivElement>(null);
  
  useGSAP(() => {
    // Hero Parallax
    gsap.to('.hero-bg', {
      yPercent: 30,
      ease: 'none',
      scrollTrigger: {
        trigger: '.hero-section',
        start: 'top top',
        end: 'bottom top',
        scrub: true
      }
    });

    // Intro Split Screen Reveal
    gsap.from('.intro-text span', {
      y: 100,
      opacity: 0,
      stagger: 0.1,
      duration: 1,
      ease: 'back.out(1.7)',
      scrollTrigger: {
        trigger: '.intro-section',
        start: 'top 70%',
      }
    });

    // Process Horizontal Scroll
    const processPanels = gsap.utils.toArray('.process-panel');
    gsap.to(processPanels, {
      xPercent: -100 * (processPanels.length - 1),
      ease: 'none',
      scrollTrigger: {
        trigger: '.process-wrapper',
        pin: true,
        scrub: 1,
        snap: 1 / (processPanels.length - 1),
        end: () => "+=" + (document.querySelector('.process-wrapper')?.scrollWidth || 2000)
      }
    });

    // Products Stagger
    gsap.from('.product-card', {
      y: 100,
      opacity: 0,
      scale: 0.8,
      duration: 0.8,
      stagger: 0.1,
      scrollTrigger: {
        trigger: '.products-section',
        start: 'top 75%',
      }
    });
  }, { scope: containerRef });

  return (
    <div ref={containerRef} className="bg-obsidian text-white overflow-hidden font-sans">
      <Navbar />

      {/* Hero Section */}
      <section className="hero-section relative h-screen flex items-center justify-center overflow-hidden">
        <div className="hero-bg absolute inset-0 z-0 bg-[url('https://images.unsplash.com/photo-1587049352847-8d4e894155db?q=80&w=2670&auto=format&fit=crop')] bg-cover bg-center opacity-30"></div>
        <div className="relative z-10 text-center px-4">
          <p className="text-gold-primary uppercase tracking-[0.4em] text-sm md:text-base mb-6 font-bold">Welcome to</p>
          <h1 className="font-display text-7xl md:text-9xl font-black tracking-widest text-[#D4AF37] mix-blend-plus-lighter shadow-gold">
            VRK FARMS
          </h1>
          <p className="text-text-muted uppercase tracking-[0.3em] mt-6 text-sm md:text-lg">Sustainable • Pure • Authentic</p>
        </div>
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center animate-bounce">
          <span className="text-[10px] uppercase tracking-widest text-text-muted mb-2">Scroll to explore</span>
          <div className="w-[1px] h-12 bg-gradient-to-b from-gold-primary to-transparent"></div>
        </div>
      </section>

      {/* Introduction Section */}
      <section className="intro-section py-32 px-4 md:px-16 lg:px-32 relative z-10 bg-obsidian">
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row gap-16 items-center">
          <div className="flex-1 space-y-8">
            <h2 className="font-display text-4xl md:text-6xl text-gold-primary intro-text flex flex-col overflow-hidden">
              <span className="inline-block">Nature's</span>
              <span className="inline-block text-white">Finest Process.</span>
            </h2>
            <p className="text-text-secondary text-lg leading-relaxed intro-text">
              <span className="inline-block">At VRK Farms, we bridge the gap between nature's untouched brilliance and your table.</span>
              <span className="inline-block">Our traditional methods preserve the absolute purity of everything we cultivate, ensuring high nutritional integrity without artificial interventions.</span>
            </p>
          </div>
          <div className="flex-1 w-full grid grid-cols-2 gap-4">
            <img src="https://images.unsplash.com/photo-1543363363-2fdbb341c9fd?q=80&w=1000&auto=format&fit=crop" className="rounded-3xl h-64 object-cover w-full rotate-3 border-2 border-gold-primary/20 hover:rotate-0 transition-transform duration-500" alt="Farm" />
            <img src="https://images.unsplash.com/photo-1473973266408-ed4e27abdd47?q=80&w=1000&auto=format&fit=crop" className="rounded-3xl h-64 object-cover w-full -rotate-3 border-2 border-white/10 hover:rotate-0 transition-transform duration-500 mt-8" alt="Bees" />
          </div>
        </div>
      </section>

      {/* Horizontal Process Section */}
      <section className="process-wrapper overflow-hidden bg-surface-2 pt-24 pb-24 border-y border-glass-border">
        <div className="pl-4 md:pl-16 lg:pl-32 mb-16">
          <h2 className="font-display text-4xl md:text-5xl text-white tracking-widest uppercase">The <span className="text-gold-primary">Honey</span> Process</h2>
        </div>
        <div className="flex w-[400vw] h-[60vh] md:h-[500px]">
          {[
            { step: '01', title: 'Foraging', desc: 'Our bees sustainably gather nectar from wild flora across pristine farm borders.', img: 'https://images.unsplash.com/photo-1629851608404-539097e93da4?q=80&w=800&auto=format&fit=crop' },
            { step: '02', title: 'Cultivation', desc: 'Inside the hive, nectar is naturally cured and sealed inside pure beeswax combs.', img: 'https://images.unsplash.com/photo-1544383187-d4fa973ff669?q=80&w=800&auto=format&fit=crop' },
            { step: '03', title: 'Extraction', desc: 'We carefully uncap the frames and extract honey at low speeds to prevent heat damage.', img: 'https://images.unsplash.com/photo-1590089851571-08173ea51fba?q=80&w=800&auto=format&fit=crop' },
            { step: '04', title: 'Bottling', desc: '100% raw and unfiltered, the golden liquid is poured straight into jars.', img: 'https://images.unsplash.com/photo-1616788880373-c36195c6fddb?q=80&w=800&auto=format&fit=crop' },
          ].map((item, i) => (
            <div key={i} className="process-panel w-screen flex-shrink-0 px-4 md:px-16 lg:px-32 flex flex-col md:flex-row items-center gap-12">
              <div className="flex-1 space-y-6">
                <p className="text-8xl font-black text-white/5 font-display tracking-tighter">{item.step}</p>
                <h3 className="font-display text-3xl md:text-5xl text-gold-primary">{item.title}</h3>
                <p className="text-gray-400 text-lg max-w-md">{item.desc}</p>
              </div>
              <div className="flex-1 w-full h-[300px] md:h-full relative overflow-hidden rounded-3xl pb-8 md:pb-0">
                <div className="absolute inset-x-8 inset-y-0 md:inset-8 border border-gold-primary/30 rounded-3xl overflow-hidden neumorphic-inset">
                  <img src={item.img} alt={item.title} className="w-full h-full object-cover" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Products Section */}
      <section className="products-section py-32 px-4 md:px-16 lg:px-32 bg-obsidian relative">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-1/2 bg-gold-primary/5 rounded-full blur-[150px] pointer-events-none"></div>
        
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-center mb-20 space-y-4">
            <h2 className="font-display text-4xl md:text-6xl text-white tracking-widest uppercase">Farm <span className="text-gold-primary">Produce</span></h2>
            <p className="text-text-muted max-w-xl mx-auto tracking-wide">Straight from VRK Farms to your daily lifestyle. A selection of unadulterated nature.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {products.map((product, i) => (
              <div key={i} className="product-card neumorphic-panel rounded-3xl p-8 hover:-translate-y-2 transition-transform duration-300 group border border-glass-border hover:border-gold-primary/40 relative overflow-hidden flex flex-col">
                <div className="absolute inset-0 bg-gradient-to-br from-gold-primary/0 to-gold-primary/0 group-hover:from-gold-primary/5 group-hover:to-transparent transition-all duration-500"></div>
                <div className="relative z-10 flex flex-col h-full">
                  <h3 className="font-display text-2xl text-gold-primary tracking-widest mb-1">{product.name}</h3>
                  <p className="text-[10px] text-white/50 uppercase tracking-widest mb-6 font-bold">{product.nameTm}</p>
                  
                  <div className="mt-auto">
                    <p className="text-text-secondary text-sm border-t border-glass-border pt-4">{product.desc}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

        </div>
      </section>
      
      {/* Footer minimal */}
      <footer className="py-12 border-t border-glass-border text-center bg-surface-2 relative z-10">
        <p className="font-display text-gold-primary tracking-[0.3em] uppercase text-xl">VRK FARMS</p>
        <p className="text-text-muted text-xs mt-2 uppercase tracking-widest">+91 98187 55177</p>
      </footer>
    </div>
  );
}
