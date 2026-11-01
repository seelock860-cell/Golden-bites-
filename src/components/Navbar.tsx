import React, { useState } from 'react';
import { ShoppingBag, Menu as MenuIcon, X, UtensilsCrossed, Lock, Phone } from 'lucide-react';
import { formatNaira } from '../services/store';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  cartCount: number;
  cartTotal: number;
  onOpenCart: () => void;
  onOpenAdminLogin: () => void;
  isAdminLoggedIn: boolean;
  onOpenAdminDashboard: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  cartCount,
  cartTotal,
  onOpenCart,
  onOpenAdminLogin,
  isAdminLoggedIn,
  onOpenAdminDashboard,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { id: 'home', label: 'Home' },
    { id: 'menu', label: 'Food Menu' },
    { id: 'featured', label: 'Specials' },
    { id: 'reviews', label: 'Reviews' },
    { id: 'contact', label: 'Contact' },
  ];

  const handleNavClick = (id: string) => {
    setActiveTab(id);
    setMobileMenuOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <>
      {/* Main Luxury Header adhering to Top Bar Contract */}
      <header className="sticky top-0 z-40 bg-[#0A0A0C]/95 backdrop-blur-md border-b border-[#231F14] shadow-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between gap-8">
          {/* Zone 1: Brand Wordmark */}
          <div
            onClick={() => handleNavClick('home')}
            className="flex items-center gap-3 cursor-pointer select-none shrink-0"
          >
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#d4af37] via-[#AA771C] to-[#805915] p-[1.5px] shadow-lg shadow-[#d4af37]/10">
              <div className="w-full h-full bg-[#0E0E12] rounded-[7px] flex items-center justify-center">
                <UtensilsCrossed className="w-5 h-5 text-[#d4af37]" />
              </div>
            </div>
            <div className="flex flex-col">
              <span className="font-serif-luxury text-xl sm:text-2xl font-bold tracking-wider text-white whitespace-nowrap">
                GOLDEN <span className="gold-gradient-text">BITE</span>
              </span>
              <span className="text-[10px] tracking-[0.25em] text-[#d4af37]/80 uppercase -mt-1 font-medium">
                Luxury Fast Food
              </span>
            </div>
          </div>

          {/* Zone 2: Navigation Links (Single-line, clean) */}
          <nav className="hidden lg:flex items-center gap-8 text-sm font-medium">
            {navLinks.map((link) => (
              <button
                key={link.id}
                onClick={() => handleNavClick(link.id)}
                className={`transition-colors whitespace-nowrap cursor-pointer py-1 relative ${
                  activeTab === link.id
                    ? 'text-[#F5D77F] font-semibold'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                {link.label}
                {activeTab === link.id && (
                  <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#d4af37] to-transparent"></span>
                )}
              </button>
            ))}
          </nav>

          {/* Zone 3: Actions (Cart & Order Now) */}
          <div className="flex items-center gap-4 shrink-0">
            {/* Cart Trigger */}
            <button
              onClick={onOpenCart}
              className="relative p-2.5 rounded-lg border border-[#2d2719] bg-[#141318] hover:border-[#d4af37] hover:bg-[#1a1820] text-slate-200 transition-all flex items-center gap-2 cursor-pointer group"
              aria-label="View shopping cart"
            >
              <div className="relative">
                <ShoppingBag className="w-5 h-5 text-[#d4af37] group-hover:scale-105 transition-transform" />
                {cartCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-gradient-to-r from-[#d4af37] to-[#e6b800] text-black text-[11px] font-bold w-5 h-5 rounded-full flex items-center justify-center shadow-md animate-pulse">
                    {cartCount}
                  </span>
                )}
              </div>
              <span className="hidden sm:inline text-xs font-semibold text-slate-200 tabular-nums">
                {cartCount > 0 ? formatNaira(cartTotal) : 'Cart'}
              </span>
            </button>

            {isAdminLoggedIn && (
              <button
                onClick={onOpenAdminDashboard}
                className="hidden sm:inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-[#d4af37]/50 bg-[#1e1a12] text-[#F5D77F] text-xs font-semibold hover:bg-[#2b2416] transition-colors cursor-pointer"
                title="Admin Dashboard"
              >
                <Lock className="w-3.5 h-3.5 text-[#d4af37]" />
                <span>Dashboard</span>
              </button>
            )}

            {/* Quick Order Now Button */}
            <button
              onClick={() => handleNavClick('menu')}
              className="hidden sm:inline-flex items-center justify-center px-5 py-2.5 rounded-lg text-xs font-bold tracking-wide uppercase gold-gradient-bg text-black hover:brightness-110 active:scale-95 shadow-lg shadow-[#d4af37]/20 transition-all cursor-pointer whitespace-nowrap"
            >
              Order Now
            </button>

            {/* Mobile Menu Hamburger */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 text-slate-300 hover:text-white focus:outline-none"
              aria-label="Toggle mobile menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <MenuIcon className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="lg:hidden bg-[#0e0e13] border-b border-[#2d2719] px-4 pt-3 pb-6 space-y-3 animate-in fade-in slide-in-from-top-4 duration-200">
            {navLinks.map((link) => (
              <button
                key={link.id}
                onClick={() => handleNavClick(link.id)}
                className={`w-full text-left px-3 py-2.5 rounded-md text-sm font-medium transition-colors ${
                  activeTab === link.id
                    ? 'bg-[#221c10] text-[#d4af37] font-semibold'
                    : 'text-slate-300 hover:bg-[#18161f] hover:text-white'
                }`}
              >
                {link.label}
              </button>
            ))}

            <div className="pt-3 border-t border-[#231F14] flex flex-col gap-2">
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenCart();
                }}
                className="w-full flex items-center justify-between px-3 py-2.5 rounded-md bg-[#16151c] text-slate-200 text-sm font-medium"
              >
                <span className="flex items-center gap-2">
                  <ShoppingBag className="w-4 h-4 text-[#d4af37]" />
                  <span>View Shopping Cart</span>
                </span>
                <span className="text-[#d4af37] font-bold tabular-nums">
                  {cartCount} items · {formatNaira(cartTotal)}
                </span>
              </button>

              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  if (isAdminLoggedIn) {
                    onOpenAdminDashboard();
                  } else {
                    onOpenAdminLogin();
                  }
                }}
                className="w-full flex items-center gap-2 px-3 py-2 text-xs text-slate-400 hover:text-slate-200"
              >
                <Lock className="w-3.5 h-3.5 text-[#d4af37]" />
                <span>{isAdminLoggedIn ? 'Open Admin Dashboard' : 'Staff Admin Portal'}</span>
              </button>
            </div>
          </div>
        )}
      </header>
    </>
  );
};
