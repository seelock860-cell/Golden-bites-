import React from 'react';
import { UtensilsCrossed, Phone, MapPin, Clock, Lock, Heart } from 'lucide-react';

interface FooterProps {
  onOpenAdminLogin: () => void;
  isAdminLoggedIn: boolean;
  onOpenAdminDashboard: () => void;
  onNavigateTab: (tab: string) => void;
}

export const Footer: React.FC<FooterProps> = ({
  onOpenAdminLogin,
  isAdminLoggedIn,
  onOpenAdminDashboard,
  onNavigateTab,
}) => {
  return (
    <footer className="bg-[#060608] border-t border-[#201c13] text-slate-400 text-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
          
          {/* Column 1: Brand & Bio */}
          <div className="space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#d4af37] to-[#805915] p-[1px]">
                <div className="w-full h-full bg-[#0a0a0d] rounded-[7px] flex items-center justify-center">
                  <UtensilsCrossed className="w-4 h-4 text-[#d4af37]" />
                </div>
              </div>
              <span className="font-serif-luxury text-lg font-bold text-white tracking-wider">
                GOLDEN <span className="gold-gradient-text">BITE</span>
              </span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Lagos' premier luxury fast-food dining experience. Gourmet smash burgers, wood-fired artisanal pizza, authentic shawarma wraps, and golden fried chicken prepared fresh to order.
            </p>
            <div className="pt-2 flex items-center gap-3 text-slate-400">
              <a
                href="https://wa.me/2349024971419"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-[#d4af37] transition-colors"
                title="WhatsApp"
              >
                WhatsApp
              </a>
              <span>·</span>
              <a href="#instagram" className="hover:text-[#d4af37] transition-colors">
                Instagram
              </a>
              <span>·</span>
              <a href="#twitter" className="hover:text-[#d4af37] transition-colors">
                X / Twitter
              </a>
              <span>·</span>
              <a href="#facebook" className="hover:text-[#d4af37] transition-colors">
                Facebook
              </a>
            </div>
          </div>

          {/* Column 2: Quick Links */}
          <div className="space-y-3">
            <h4 className="font-bold text-white text-sm uppercase tracking-wider text-[#d4af37]">
              Explore
            </h4>
            <ul className="space-y-2">
              <li>
                <button
                  onClick={() => onNavigateTab('home')}
                  className="hover:text-white transition-colors cursor-pointer"
                >
                  Home Showcase
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigateTab('menu')}
                  className="hover:text-white transition-colors cursor-pointer"
                >
                  Full Fast-Food Menu
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigateTab('featured')}
                  className="hover:text-white transition-colors cursor-pointer"
                >
                  Chef Specials & Combos
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigateTab('reviews')}
                  className="hover:text-white transition-colors cursor-pointer"
                >
                  Guest Reviews
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigateTab('contact')}
                  className="hover:text-white transition-colors cursor-pointer"
                >
                  Lekki Location & Hours
                </button>
              </li>
            </ul>
          </div>

          {/* Column 3: Contact & Hours */}
          <div className="space-y-3">
            <h4 className="font-bold text-white text-sm uppercase tracking-wider text-[#d4af37]">
              Direct Contact
            </h4>
            <div className="space-y-2 text-xs">
              <div className="flex items-start gap-2">
                <MapPin className="w-3.5 h-3.5 text-[#d4af37] shrink-0 mt-0.5" />
                <span>14 Admiralty Way, Lekki Phase 1, Lagos</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-3.5 h-3.5 text-[#d4af37] shrink-0" />
                <span className="font-mono">Hotline: 09024971419</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-3.5 h-3.5 text-[#d4af37] shrink-0" />
                <span>Open Daily: 10:00 AM – 11:30 PM</span>
              </div>
            </div>
          </div>

          {/* Column 4: Kitchen Integrity & Discreet Admin Access */}
          <div className="space-y-3">
            <h4 className="font-bold text-white text-sm uppercase tracking-wider text-[#d4af37]">
              Kitchen & Staff
            </h4>
            <p className="text-xs text-slate-400">
              100% Halal certified beef and poultry. Strict food safety standards and temperature control.
            </p>
            <div className="pt-3">
              {isAdminLoggedIn ? (
                <button
                  onClick={onOpenAdminDashboard}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#221c10] border border-[#d4af37]/50 text-[#F5D77F] hover:bg-[#2d2516] font-semibold text-xs cursor-pointer transition-colors"
                >
                  <Lock className="w-3 h-3 text-[#d4af37]" />
                  <span>Admin Dashboard (Logged In)</span>
                </button>
              ) : (
                <button
                  onClick={onOpenAdminLogin}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#121117] border border-[#2b2518] text-slate-400 hover:text-white hover:border-slate-600 text-xs cursor-pointer transition-colors"
                >
                  <Lock className="w-3 h-3 text-[#d4af37]" />
                  <span>Staff Portal</span>
                </button>
              )}
            </div>
          </div>

        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-6 border-t border-[#1a1710] flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-slate-400">
          <div>
            &copy; {new Date().getFullYear()} GOLDEN BITE RESTAURANT. All rights reserved.
          </div>
          <div className="flex items-center gap-1 text-slate-400">
            <span>Crafted with</span>
            <Heart className="w-3 h-3 text-[#d4af37] fill-[#d4af37]" />
            <span>for Nigerian Food Lovers</span>
          </div>
        </div>

      </div>
    </footer>
  );
};
