import { useRef, useEffect, useLayoutEffect, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Navbar from '../components/layout/Navbar';
import { Link } from 'react-router-dom';
import { ChevronDown, Play } from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

// ── Cinematic Google Fonts ──────────────────────────────────────────────────
const fontLink = document.createElement('link');
fontLink.rel = 'stylesheet';
fontLink.href = 'https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Anton&family=Oswald:wght@600;700&display=swap';
if (!document.head.querySelector('[href*="Bebas+Neue"]')) document.head.appendChild(fontLink);

const processSteps = [
  { time: 'PHASE 01', title: 'Wild Foraging', sub: 'Free-range colonies in pesticide-free habitats', note: 'The Origin' },
  { time: 'PHASE 02', title: 'Comb Matrix', sub: 'Bees condense nectar into thick raw honey', note: 'Inside the Hive' },
  { time: 'PHASE 03', title: 'Cold Extraction', sub: 'Centrifugal force, zero heat — enzymes preserved', note: 'Cold Process' },
  { time: 'PHASE 04', title: 'Raw Bottling', sub: 'Unfiltered, unpasteurized, poured into glass', note: 'Pure Form' },
  { time: 'PHASE 05', title: 'Farm Harvest', sub: 'Amla, turmeric & coconut sourced beside the hive', note: 'Full Collection' },
  { time: 'PHASE 06', title: 'Delivered Fresh', sub: 'Straight from VRK Farms to your doorstep', note: 'Zero Middlemen' },
];

export default function Process() {
  const containerRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const descRef = useRef<HTMLParagraphElement>(null);
  const metaRef = useRef<HTMLDivElement>(null);
  const portalRef = useRef<HTMLDivElement>(null);
  const glassInnerRef = useRef<HTMLDivElement>(null);
  const glowRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const [isFullyEntered, setIsFullyEntered] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLowEnd, setIsLowEnd] = useState(false);

  // Detect low-end devices
  useEffect(() => {
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    const hasLowMemory = 'deviceMemory' in navigator ? (navigator as any).deviceMemory < 4 : false;
    const hasFewCores = navigator.hardwareConcurrency < 4;
    setIsLowEnd(isMobile || hasLowMemory || hasFewCores);
  }, []);

  const handleManualUnmute = () => {
    if (videoRef.current) {
      videoRef.current.muted = false;
      videoRef.current.play();
      setIsPlaying(true);
    }
  };

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {

      // ─── SECTION 1: HERO ───────────────────────────────────────────────
      const heroTl = gsap.timeline({
        scrollTrigger: {
          trigger: '#bee-section-1',
          start: 'top top',
          end: '+=220%',
          pin: true,
          scrub: 1.6,
          anticipatePin: 1,
        }
      });

      gsap.set([metaRef.current, titleRef.current, descRef.current], {
        opacity: 0,
        visibility: 'hidden',
      });

      heroTl
        .to('.hero-bg-zoom', { scale: 1.4, ease: 'none' }, 0)
        .fromTo(metaRef.current,
          { y: -40, opacity: 0, filter: 'blur(12px)', visibility: 'hidden' },
          { y: 0, opacity: 1, filter: 'blur(0px)', visibility: 'visible', duration: 1 }, 0.15)
        .fromTo(titleRef.current,
          { rotateX: 80, z: -300, opacity: 0, visibility: 'hidden' },
          { rotateX: 0, z: 0, opacity: 1, visibility: 'visible', duration: 1.8, ease: 'power4.out' }, '>-=0.6')
        .fromTo(descRef.current,
          { x: -120, opacity: 0, filter: 'blur(10px)', visibility: 'hidden' },
          { x: 0, opacity: 1, filter: 'blur(0px)', visibility: 'visible', duration: 1.2 }, '>-=0.5');

      // ─── SECTION 2: PORTAL ─────────────────────────────────────────────
      if (!isLowEnd) {
        const glassTl = gsap.timeline({ repeat: -1, yoyo: true, ease: 'sine.inOut' });
        glassTl
          .to(glassInnerRef.current, { rotationY: 1.2, rotationX: 0.6, scale: 1.012, duration: 4, boxShadow: '0 0 40px rgba(212,175,55,0.5), 0 0 80px rgba(212,175,55,0.25)' })
          .to(glassInnerRef.current, { rotationY: -1.2, rotationX: -0.6, scale: 0.988, duration: 4, boxShadow: '0 0 60px rgba(212,175,55,0.7), 0 0 120px rgba(212,175,55,0.35)' }, '+=0.1');

        gsap.to(glowRef.current, { scale: 1.12, opacity: 0.55, duration: 3, repeat: -1, yoyo: true, ease: 'sine.inOut' });
      }

      const portalTl = gsap.timeline({
        scrollTrigger: {
          trigger: '#bee-section-2',
          start: 'top top',
          end: '+=600%',
          pin: true,
          scrub: isLowEnd ? 1 : 1.5,
          onUpdate: (self) => {
            const p = self.progress;
            if (p > 0.45 && p < 0.85) {
              setIsFullyEntered(true);
              if (videoRef.current?.paused) videoRef.current.play().catch(() => {});
            } else {
              setIsFullyEntered(false);
              setIsPlaying(false);
              videoRef.current?.pause();
            }
          }
        }
      });

      portalTl
        .set(portalRef.current, { willChange: 'transform' })
        .to(portalRef.current, { scale: 45, opacity: 0, duration: 2, ease: 'power2.inOut' }, 0)
        .fromTo('.bee-video-layer',
          { scale: 1.25, filter: 'blur(24px)', opacity: 0 },
          { scale: 1, filter: 'blur(0px)', opacity: 1, duration: 1.5 }, 0.5)
        .fromTo('.bee-hud',
          { opacity: 0, y: 30 },
          { opacity: 1, y: 0, stagger: 0.12, duration: 0.5 }, 1.5)
        .to({}, { duration: 1 })
        .to('.bee-hud', { opacity: 0, y: -30, duration: 0.5 }, '>')
        .to('.bee-video-layer', { scale: 1.25, filter: 'blur(24px)', opacity: 0, duration: 1 }, '>')
        .to(portalRef.current, { scale: 1, opacity: 1, duration: 2, ease: 'power2.inOut' }, '<0.5');

      // ─── SECTION 3.1: MORPH HERO ───────────────────────────────────────
      const morphTl = gsap.timeline({
        scrollTrigger: {
          trigger: '#bee-section-3 .hero-morph',
          start: 'top top',
          end: '+=180%',
          pin: true,
          scrub: 1.5,
        }
      });

      morphTl
        .from('.liquid-char', {
          y: (i: number) => i % 2 === 0 ? -600 : 600,
          z: () => Math.random() * -2000,
          rotateY: () => Math.random() * 360,
          opacity: 0,
          stagger: 0.08,
          ease: 'expo.inOut',
        })
        .to('.liquid-char', {
          color: '#D4AF37',
          textShadow: '0 0 40px rgba(212,175,55,0.5)',
          duration: 1
        }, 0.4)
        .to('.background-mesh', { scale: 1.2, opacity: 0.05, rotate: 4, duration: 2 }, 0);

      // ─── SECTION 3.2: GLASS PARALLAX ───────────────────────────────────
      gsap.to('.glass-pane', {
        y: -280,
        x: (i: number) => i % 2 === 0 ? 40 : -40,
        rotateZ: (i: number) => i % 2 === 0 ? 4 : -4,
        scrollTrigger: {
          trigger: '#bee-section-3 .glass-section',
          start: 'top bottom',
          end: 'bottom top',
          scrub: 2,
        }
      });

      // ─── SECTION 3.3: CINEMATIC AGENDA ─────────────────────────────────
      const agendaTl = gsap.timeline({
        scrollTrigger: {
          trigger: '#bee-section-3 .agenda-wrapper',
          start: 'top top',
          end: '+=600%',
          pin: true,
          scrub: 1,
        }
      });

      agendaTl.to('.flow-line', { height: '100%', ease: 'none' }, 0);

      gsap.utils.toArray<HTMLElement>('.agenda-item').forEach((item, i) => {
        agendaTl
          .fromTo(item,
            { y: 600, opacity: 0, rotateX: -90, z: -1000, pointerEvents: 'none' },
            { y: 0, opacity: 1, rotateX: 0, z: 0, pointerEvents: 'auto', duration: 1, ease: 'power4.out' },
            i * 0.8)
          .to(item,
            { y: -600, opacity: 0, rotateX: 90, z: -500, pointerEvents: 'none', duration: 1, ease: 'power4.in' },
            (i + 1) * 0.8);
      });

      // ─── SECTION 3.4: CTA REVEAL ───────────────────────────────────────
      gsap.from('.welded-btn-wrap', {
        scale: 0.5,
        opacity: 0,
        y: 100,
        rotateX: -45,
        scrollTrigger: {
          trigger: '#bee-section-3 .cta-section',
          start: 'top 85%',
          end: 'top 50%',
          scrub: 1,
        }
      });

    }, containerRef);

    return () => {
      ctx.revert();
      ScrollTrigger.getAll().forEach(t => t.kill());
    };
  }, [isLowEnd]);

  return (
    <div ref={containerRef} className="relative bg-black text-white font-sans overflow-x-hidden">
      <Navbar />

      {/* ══════════════════════════════════════════
          SECTION 1 — CINEMATIC HERO
      ══════════════════════════════════════════ */}
      <section
        id="bee-section-1"
        className="relative w-screen h-screen overflow-hidden bg-black"
      >
        {/* Background image that zooms on scroll */}
        <div
          className="hero-bg-zoom absolute inset-0 z-0 bg-[url('https://images.unsplash.com/photo-1473973266408-ed4e27abdd47?q=80&w=2670&auto=format&fit=crop')] bg-cover bg-center opacity-50"
          style={{ transformOrigin: 'center center' }}
        />
        <div className="absolute inset-0 z-0 bg-gradient-to-l from-black via-black/40 to-transparent" />
        <div className="absolute inset-0 z-0 bg-gradient-to-t from-black via-transparent to-black/60" />

        {/* Content */}
        <div className="absolute inset-0 z-20 flex items-center justify-end px-8 md:px-24 lg:px-36">
          <div className="flex flex-col items-end text-right max-w-4xl gap-6" style={{ perspective: '1000px' }}>

            {/* Meta badge */}
            <div
              ref={metaRef}
              
            >
              
              {/* <span className="text-yellow-500 text-[10px] tracking-[0.5em] uppercase" style={{ fontFamily: '"Oswald", sans-serif', fontWeight: 700, letterSpacing: '0.45em' }}>Pure Honey · VRK F</span> */}
            </div>

            {/* Main title */}
            <h1
              ref={titleRef}
              className="text-5xl md:text-8xl lg:text-9xl bg-gradient-to-br from-yellow-200 via-yellow-400 to-yellow-700 bg-clip-text text-transparent leading-none drop-shadow-2xl"
              style={{ fontFamily: '"Bebas Neue", "Anton", sans-serif', letterSpacing: '0.04em', willChange: 'transform' }}
            >
              BEE FARMING<br />
              <span className="text-white/80" style={{ fontFamily: '"Oswald", sans-serif', fontWeight: 300, fontSize: '0.45em', letterSpacing: '0.35em', display: 'block' }}>BY NATURE</span>
            </h1>

            {/* Description */}
            <p
              ref={descRef}
              className="text-lg md:text-xl text-white/70 leading-relaxed max-w-xl drop-shadow-lg"
              style={{ fontFamily: '"Oswald", sans-serif', fontWeight: 300, letterSpacing: '0.06em' }}
            >
              From <strong className="text-yellow-300" style={{ fontWeight: 700 }}>wild habitats</strong> to glass jars —{' '}
              <em>zero heat, zero compromise</em>. Pure raw honey extracted
              the way nature intended.
            </p>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-30 flex flex-col items-center gap-3">
          <span className="text-[10px] animate-pulse uppercase whitespace-nowrap text-yellow-500" style={{ fontFamily: '"Oswald", sans-serif', fontWeight: 600, letterSpacing: '0.9em' }}>
            Keep Scrolling
          </span>
          <div className="w-px h-16 bg-gradient-to-b from-yellow-500 to-transparent" />
        </div>
      </section>

      {/* ══════════════════════════════════════════
          SECTION 2 — IMMERSIVE GOLDEN PORTAL
      ══════════════════════════════════════════ */}
      <section id="bee-section-2" className="relative w-full h-screen bg-white overflow-hidden">

        {/* Video Layer */}
        <div
          className="bee-video-layer absolute inset-0 z-10 overflow-hidden"
          style={{ opacity: isPlaying ? 1 : 0, transition: 'opacity 0.6s ease' }}
        >
          <video
            ref={videoRef}
            className="w-full h-full object-cover"
            src="https://www.w3schools.com/html/mov_bbb.mp4"
            muted loop playsInline
            preload={isLowEnd ? 'metadata' : 'auto'}
          />
        </div>

        {/* HUD Elements */}
        <div
          className="absolute inset-0 z-30 flex flex-col justify-between p-10 pointer-events-none"
          style={{
            opacity: isFullyEntered && !isPlaying ? 1 : 0,
            transform: isFullyEntered && !isPlaying ? 'scale(1)' : 'scale(0.95)',
            transition: 'all 0.6s ease',
          }}
        >
          <div className="flex justify-between items-start">
            <div className="bee-hud">
              <div className="backdrop-blur-2xl border border-yellow-600/30 p-5 rounded-[2.5rem] bg-black/40">
                <p className="text-yellow-500 font-mono text-[10px] tracking-[0.4em] uppercase">Explore</p>
              </div>
            </div>
            <div className="bee-hud text-yellow-600/10 font-black text-[12vw] tracking-tighter italic select-none">HONEY</div>
          </div>

          <div
            className="flex flex-col items-center gap-8 pointer-events-auto bee-hud"
            style={{ opacity: isPlaying ? 0 : 1, transition: 'opacity 0.4s ease' }}
          >
            <button
              onClick={handleManualUnmute}
              className="group relative flex flex-col items-center gap-4 transition-transform hover:scale-110 active:scale-95"
            >
              <div className="w-24 h-24 rounded-full border border-yellow-500/40 flex items-center justify-center backdrop-blur-2xl bg-yellow-500/10 transition-all duration-500 group-hover:bg-yellow-400 group-hover:border-yellow-400">
                <Play className="text-yellow-400 group-hover:text-black fill-current ml-1" size={32} />
              </div>
              <span className="text-yellow-500/60 font-black tracking-[0.6em] text-[10px] uppercase">
                Watch The Farm Story
              </span>
            </button>
          </div>

          <div className="bee-hud w-full flex justify-center pb-4" style={{ opacity: isPlaying ? 0 : 1, transition: 'opacity 0.4s ease' }}>
            <ChevronDown className="text-yellow-500/40 animate-bounce" size={32} />
          </div>
        </div>

        {/* The Golden Portal Lens */}
        <div
          ref={portalRef}
          className="absolute inset-0 z-40 pointer-events-none flex items-center justify-center"
          style={{
            perspective: isLowEnd ? 'none' : '1200px',
            opacity: isPlaying ? 0 : 1,
            transform: isPlaying ? 'scale(1.5)' : 'scale(1)',
            transition: 'all 0.6s ease',
          }}
        >
          {/* Glow */}
          <div
            ref={glowRef}
            className="absolute"
            style={{
              width: '90vw', height: '52vw',
              maxWidth: '1000px', maxHeight: '570px',
              borderRadius: '260px 260px 200px 200px',
              filter: 'blur(24px)',
              background: 'radial-gradient(circle at 35% 30%, rgba(212,175,55,0.95) 0%, rgba(212,175,55,0.6) 25%, rgba(160,130,20,0.3) 55%, rgba(80,60,10,0.1) 80%, transparent 95%)',
              mixBlendMode: 'overlay',
              opacity: isPlaying ? 0 : 1,
              transform: isPlaying ? 'scale(2)' : isFullyEntered ? 'scale(1.15)' : 'scale(1)',
              transition: 'all 0.6s ease',
            }}
          />

          {/* Glass Inner */}
          <div
            ref={glassInnerRef}
            className="relative flex items-center justify-center overflow-hidden"
            style={{
              width: '85vw', height: '48vw',
              maxWidth: '950px', maxHeight: '520px',
              borderRadius: '240px 240px 180px 180px',
              border: '2px solid rgba(212,175,55,0.5)',
              background: 'linear-gradient(145deg, rgba(212,175,55,0.18) 0%, rgba(255,255,255,0.35) 45%, rgba(255,255,255,0.25) 65%, rgba(212,175,55,0.15) 100%)',
              backdropFilter: `blur(${isLowEnd ? '8px' : '16px'})`,
              boxShadow: '0 25px 50px -12px rgba(0,0,0,0.6), 0 0 50px rgba(212,175,55,0.4)',
              transform: isPlaying ? 'scale(0)' : isFullyEntered ? 'perspective(1000px) rotateX(14deg) rotateY(8deg) rotateZ(3deg) scale(0.85) translateY(-20px)' : 'none',
              transformStyle: 'preserve-3d',
              transition: 'all 0.6s ease',
              opacity: isPlaying ? 0 : 1,
            }}
          >
            {/* Reflections */}
            {!isLowEnd && (
              <>
                <div className="absolute inset-0 opacity-60 animate-pulse" style={{ background: 'linear-gradient(to top right, rgba(255,255,255,0.6), transparent)', animationDuration: '4s' }} />
                <div className="absolute inset-0 opacity-40" style={{ background: 'linear-gradient(to bottom left, rgba(212,175,55,0.3), transparent)' }} />
              </>
            )}

            {/* Particles */}
            {!isLowEnd && (
              <div className="absolute inset-0 overflow-hidden">
                {[...Array(10)].map((_, i) => (
                  <div
                    key={i}
                    className="absolute w-1 h-1 bg-yellow-300 rounded-full animate-ping"
                    style={{
                      left: `${10 + (i * 8) % 80}%`,
                      top: `${15 + (i * 13) % 70}%`,
                      animationDuration: `${3 + (i * 0.7)}s`,
                      animationDelay: `${i * 0.3}s`,
                      opacity: 0.25,
                    }}
                  />
                ))}
              </div>
            )}

            {/* Content */}
            <div className="text-center px-10 relative z-10" style={{ opacity: isPlaying ? 0 : 1, transition: 'all 0.6s ease' }}>
              <div className="mb-8 inline-block px-6 py-2 rounded-full border border-yellow-600/50 bg-black/80 backdrop-blur-sm">
                <span className="text-yellow-400 text-[10px] uppercase tracking-[0.5em]" style={{ fontFamily: '"Oswald", sans-serif', fontWeight: 600 }}>
                   Scroll to Explore
                </span>
              </div>
              <h2 className="text-black leading-[0.85] mb-8" style={{ fontFamily: '"Bebas Neue", "Anton", sans-serif', fontSize: '8vw', letterSpacing: '0.05em' }}>
                PURE<br />Bliss
              </h2>
              <p className="text-black/60 text-[9px] uppercase tracking-[1em]" style={{ fontFamily: '"Oswald", sans-serif', fontWeight: 400 }}>
               
              </p>
            </div>

            {/* Border ring */}
            <div className="absolute inset-0 pointer-events-none" style={{ borderRadius: '240px 240px 180px 180px', border: '3px solid rgba(255,255,255,0.2)' }} />
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          SECTION 3 — MERCURIAL ARCHITECT
      ══════════════════════════════════════════ */}
      <section id="bee-section-3" className="bg-[#fafafa] text-zinc-900 font-sans overflow-x-hidden selection:bg-yellow-400">

        {/* 3.1 — Morph Hero */}
        <div className="hero-morph h-screen flex items-center justify-center bg-black overflow-hidden relative">
          <div className="background-mesh absolute inset-0 opacity-0 pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]" />

          <h1
            className="flex flex-wrap justify-center uppercase leading-none z-20 px-4"
            style={{ fontFamily: '"Bebas Neue", "Anton", sans-serif', fontSize: 'clamp(4rem, 13vw, 14rem)', letterSpacing: '0.03em' }}
          >
            {'RAW HONEY'.split('').map((c, i) => (
              <span key={i} className="liquid-char inline-block" style={{ transformStyle: 'preserve-3d', color: c === ' ' ? 'transparent' : 'white' }}>
                {c === ' ' ? '\u00A0' : c}
              </span>
            ))}
          </h1>

          <div className="absolute bottom-10 flex flex-col items-center gap-4">
            <div className="w-px h-20 bg-gradient-to-b from-zinc-700 to-yellow-500" />
            <span className="text-[10px] text-yellow-500 uppercase animate-pulse" style={{ fontFamily: '"Oswald", sans-serif', fontWeight: 600, letterSpacing: '1.4em' }}>Keep Scrolling</span>
          </div>
        </div>

        {/* 3.2 — Glass Refraction Grid */}
        <div className="glass-section min-h-screen bg-[#f4f4f4] flex items-center justify-center relative py-20 px-6 md:px-10">
          <div className="absolute inset-0 flex items-center justify-center opacity-[0.07] select-none overflow-hidden pointer-events-none">
            <h2 className="text-black" style={{ fontFamily: '"Bebas Neue", sans-serif', fontSize: '40vw', lineHeight: 1 }}>FARM</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 z-10 w-full max-w-7xl">
            {[
              {
                session: '',
                products: ['Pure Raw Honey', 'Honey Comb Cake'],
                tagline: 'Extracted before dawn — rich, thick & alive.',
              },
              {
                session: '',
                products: ['Amla Murabba', 'Turmeric Powder','Coconut'],
                tagline: 'From pesticide-free soil, untouched by chemicals.',
              }
            ].map((item, i) => (
              <div
                key={i}
                className="glass-pane relative w-full min-h-[500px] bg-white/40 backdrop-blur-xl border border-white shadow-2xl rounded-[40px] p-8 md:p-12 flex flex-col justify-between overflow-hidden group"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-white/60 via-transparent to-yellow-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
                <div className="relative">
                  <span className="text-yellow-600 text-sm uppercase tracking-widest" style={{ fontFamily: '"Oswald", sans-serif', fontWeight: 600 }}>{item.session}</span>
                  <div className="h-12" />
                  {item.products.map((p, j) => (
                    <h3 key={j} className="mt-4 leading-none uppercase" style={{ fontFamily: '"Bebas Neue", "Anton", sans-serif', fontSize: 'clamp(2.5rem, 5vw, 4rem)', letterSpacing: '0.04em' }}>{p}</h3>
                  ))}
                  <p className="mt-6 text-zinc-500 text-sm leading-relaxed" style={{ fontFamily: '"Oswald", sans-serif', fontWeight: 300, letterSpacing: '0.08em' }}>{item.tagline}</p>
                </div>
                <div className="relative flex items-center gap-4 mt-8">
                  <div className="w-12 h-12 bg-zinc-900 rounded-full flex items-center justify-center">
                    <div className="w-2 h-2 bg-yellow-500 rounded-full animate-ping" />
                  </div>
                  <p className="text-xs uppercase text-zinc-400" style={{ fontFamily: '"Oswald", sans-serif', fontWeight: 600, letterSpacing: '0.3em' }}>Pure</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 3.3 — Cinematic Process Agenda */}
        <div className="agenda-wrapper relative h-screen w-full flex items-center justify-center overflow-hidden bg-white">
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none">
            <h2 className="text-zinc-50" style={{ fontFamily: '"Bebas Neue", sans-serif', fontSize: '20vw', letterSpacing: '0.05em', lineHeight: 1 }}>PROCESS</h2>
          </div>

          {/* Vertical flow line */}
          <div className="absolute left-1/2 -translate-x-1/2 top-0 w-[2px] h-0 bg-zinc-100 z-0">
            <div className="flow-line absolute top-0 left-0 w-full h-0 bg-yellow-500 shadow-[0_0_20px_#D4AF37]" />
          </div>

          <div className="relative z-10 w-full max-w-5xl h-[550px] md:h-[650px] px-6" style={{ perspective: '2000px' }}>
            {processSteps.map((item, i) => (
              <div
                key={i}
                className="agenda-item absolute inset-0 flex flex-col items-center justify-center text-center p-10"
                style={{ transformStyle: 'preserve-3d' }}
              >
                <span className="text-yellow-500 mb-4 block" style={{ fontFamily: '"Oswald", sans-serif', fontWeight: 700, fontSize: '1.4rem', letterSpacing: '0.35em' }}>{item.time}</span>
                <h3 className="agenda-title uppercase text-center leading-[0.85] mb-6" style={{ fontFamily: '"Bebas Neue", "Anton", sans-serif', fontSize: 'clamp(3rem, 8vw, 7rem)', letterSpacing: '0.04em' }}>
                  {item.title}
                </h3>
                <div className="flex items-center gap-6">
                  <div className="h-px w-12 bg-yellow-500" />
                  <p className="text-sm uppercase text-zinc-400" style={{ fontFamily: '"Oswald", sans-serif', fontWeight: 400, letterSpacing: '0.45em' }}>{item.sub}</p>
                  <div className="h-px w-12 bg-yellow-500" />
                </div>
                <div className="absolute bottom-0 right-0 flex flex-col items-end opacity-30">
                  <span className="text-[10px] uppercase tracking-widest" style={{ fontFamily: '"Oswald", sans-serif', fontWeight: 700 }}>{item.note}</span>
                  <span className="text-[10px] text-yellow-600" style={{ fontFamily: '"Oswald", sans-serif', fontWeight: 700 }}>VRK FARMS</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 3.4 — Welded CTA */}
        <div className="cta-section h-screen bg-white flex flex-col items-center justify-center relative" style={{ perspective: '2000px' }}>
          <h2 className="mb-16 text-center leading-none text-black uppercase" style={{ fontFamily: '"Bebas Neue", "Anton", sans-serif', fontSize: 'clamp(4rem, 10vw, 10rem)', letterSpacing: '0.04em' }}>
            Taste the<br />
            <span className="text-transparent" style={{ WebkitTextStroke: '2px #D4AF37' }}>Difference</span>
          </h2>

          <div className="welded-btn-wrap relative group z-30" style={{ transformStyle: 'preserve-3d' }}>
            <div className="absolute -top-4 -left-4 w-4 h-4 bg-yellow-400 rounded-full group-hover:animate-ping z-0" />
            <div className="absolute -bottom-4 -right-4 w-4 h-4 bg-yellow-400 rounded-full group-hover:animate-ping z-0" style={{ animationDelay: '75ms' }} />

            <Link
              to="/shop"
              className="relative inline-block px-24 py-12 bg-yellow-500 text-black shadow-[0_40px_80px_rgba(212,175,55,0.3)] hover:shadow-[0_20px_40px_rgba(212,175,55,0.7)] transition-all duration-700 overflow-hidden rounded-2xl group active:scale-95"
            >
              <span className="relative z-10 group-hover:text-black transition-colors uppercase" style={{ fontFamily: '"Bebas Neue", "Anton", sans-serif', fontSize: 'clamp(1.6rem, 3vw, 2.4rem)', letterSpacing: '0.35em' }}>
                SHOP NOW
              </span>
              <div className="absolute inset-0 bg-gradient-to-t from-yellow-700/60 via-transparent to-transparent translate-y-full group-hover:translate-y-0 transition-transform duration-500" />
            </Link>
          </div>

          {/* <div className="mt-24 flex flex-col items-center">
            <span className="text-[10px] text-zinc-600 uppercase italic" style={{ fontFamily: '"Oswald", sans-serif', fontWeight: 400, letterSpacing: '0.9em' }}>VRK Farms · Raw Collection · 2026</span>
          </div> */}
        </div>
      </section>

      <style>{`
        .agenda-title {
          font-family: 'Bebas Neue', 'Anton', sans-serif;
          -webkit-text-stroke: 1.5px #111;
          text-shadow:
            0 6px 16px rgba(0,0,0,0.25),
            0 12px 40px rgba(0,0,0,0.15),
            0 0 60px rgba(212,175,55,0.25);
        }
        .liquid-char { transform-style: preserve-3d; }
        .welded-btn-wrap { transform-style: preserve-3d; }
        @keyframes ping {
          75%, 100% { transform: scale(2); opacity: 0; }
        }
        .animate-ping { animation: ping 1s cubic-bezier(0, 0, 0.2, 1) infinite; }
        @keyframes pulse {
          0%, 100% { opacity: 0.7; }
          50% { opacity: 0.35; }
        }
        .animate-pulse { animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite; }
        @media (prefers-reduced-motion: reduce) {
          .animate-bounce, .animate-ping, .animate-pulse { animation: none; }
        }
      `}</style>
    </div>
  );
}
