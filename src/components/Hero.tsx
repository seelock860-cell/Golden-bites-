import React from 'react';
import { ArrowRight, Sparkles, Clock, ShieldCheck, Flame, Phone } from 'lucide-react';

interface HeroProps {
  onExploreMenu: () => void;
  onOrderNow: () => void;
}

export const Hero: React.FC<HeroProps> = ({ onExploreMenu, onOrderNow }) => {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-[#08080a] via-[#0d0c11] to-[#08080a] pt-8 pb-16 lg:pt-14 lg:pb-24 border-b border-[#231e13]">
      {/* Subtle ambient gold glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-[#d4af37]/8 blur-[140px] pointer-events-none rounded-full" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* Left Column: Brand Copy & Actions */}
          <div className="lg:col-span-7 flex flex-col justify-center space-y-6">
            
            {/* Elegant Kicker */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#181610] border border-[#3b3117] text-[#e0b838] text-xs font-semibold w-fit tracking-wide">
              <Sparkles className="w-3.5 h-3.5 text-[#d4af37]" />
              <span>THE GOLD STANDARD OF FAST FOOD</span>
            </div>

            {/* Headline */}
            <h1 className="font-serif-luxury text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-white leading-[1.1] text-balance">
              Taste the <span className="gold-gradient-text">Extraordinary.</span>
            </h1>

            {/* Subtitle */}
            <p className="text-lg sm:text-xl text-slate-300 font-normal leading-relaxed max-w-xl text-balance">
              Delicious fast food, made fresh for you. Indulge in artisanal double smash burgers, wood-fired pizzas, authentic shawarmas, and golden fried chicken.
            </p>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-4 pt-2">
              <button
                onClick={onOrderNow}
                className="px-7 py-3.5 rounded-xl text-sm font-bold tracking-wide uppercase gold-gradient-bg text-black hover:brightness-110 active:scale-95 shadow-xl shadow-[#d4af37]/25 transition-all flex items-center gap-2 cursor-pointer"
              >
                <span>Order Now</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                onClick={onExploreMenu}
                className="px-6 py-3.5 rounded-xl text-sm font-semibold tracking-wide text-white border border-[#4a3e20] hover:border-[#d4af37] hover:bg-[#191712] transition-all flex items-center gap-2 cursor-pointer"
              >
                <span>Explore Our Menu</span>
              </button>

              <a
                href="https://wa.me/2349024971419?text=Hello%20Golden%20Bite%20Restaurant!%20I%20would%20like%20to%20view%20the%20specials%20and%20place%20an%20order."
                target="_blank"
                rel="noopener noreferrer"
                className="px-5 py-3.5 rounded-xl text-sm font-semibold text-[#4ade80] bg-[#142318] border border-[#1e4627] hover:border-[#22c55e] hover:bg-[#1a3320] transition-all flex items-center gap-2 cursor-pointer"
              >
                <Phone className="w-4 h-4 text-[#22c55e]" />
                <span>WhatsApp Order</span>
              </a>
            </div>

            {/* Trust Highlights Strip */}
            <div className="grid grid-cols-3 gap-4 pt-6 border-t border-[#231e13] text-xs text-slate-400">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-[#d4af37] shrink-0" />
                <span>30-45 Min Fast Delivery</span>
              </div>
              <div className="flex items-center gap-2">
                <Flame className="w-4 h-4 text-[#d4af37] shrink-0" />
                <span>Cooked Fresh to Order</span>
              </div>
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-[#d4af37] shrink-0" />
                <span>Premium Halal Cuts</span>
              </div>
            </div>

          </div>

          {/* Right Column: Hero Visual Food Showcase */}
          <div className="lg:col-span-5 relative">
            <div className="relative mx-auto max-w-md lg:max-w-none">
              
              {/* Outer Luxury Gold Border Frame */}
              <div className="relative rounded-2xl p-1 bg-gradient-to-tr from-[#805915] via-[#D4AF37] to-[#AA771C] shadow-2xl shadow-[#d4af37]/20">
                <div className="relative overflow-hidden rounded-[14px] bg-[#0c0c10]">
                  <img
                    src="/src/assets/images/hero_burger_feast_1793008742785.jpg"
                    alt="The Royal Golden Smash Burger with melted aged cheddar and bacon"
                    referrerPolicy="no-referrer"
                    className="w-full h-[380px] sm:h-[450px] object-cover hover:scale-105 transition-transform duration-700"
                  />
                  {/* Subtle vignette gradient */}
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0c] via-transparent to-transparent opacity-80" />

                  {/* Overlaid Floating Badge */}
                  <div className="absolute bottom-4 left-4 right-4 p-3.5 rounded-xl bg-[#121117]/90 backdrop-blur-md border border-[#3b321a] flex items-center justify-between">
                    <div>
                      <span className="text-[11px] font-semibold text-[#d4af37] tracking-wider uppercase block">Chef's Signature</span>
                      <h4 className="text-sm font-bold text-white">The Royal Golden Smash Burger</h4>
                      <p className="text-xs text-slate-400">Double Angus beef · Brioche · Gold sauce</p>
                    </div>
                    <div className="text-right">
                      <span className="text-base font-bold text-[#F5D77F] font-mono tabular-nums block">₦7,500</span>
                      <button
                        onClick={onOrderNow}
                        className="text-[11px] font-bold text-black px-2.5 py-1 rounded bg-[#d4af37] hover:bg-[#e6be44] transition-colors mt-0.5 cursor-pointer"
                      >
                        Add to Cart
                      </button>
                    </div>
                  </div>

                </div>
              </div>

              {/* Decorative Subtle Accent Tag */}
              <div className="absolute -top-3 -right-3 bg-[#1e1b12] border border-[#d4af37]/60 text-[#d4af37] text-[11px] font-bold px-3 py-1.5 rounded-full shadow-lg flex items-center gap-1.5">
                <Sparkles className="w-3 h-3 text-[#d4af37]" />
                <span>100% Fresh Daily</span>
              </div>

            </div>
          </div>

        </div>
      </div>
    </section>
  );
};
