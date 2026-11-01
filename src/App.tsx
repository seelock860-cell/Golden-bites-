/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  Product,
  CartItem,
  Order,
  RestaurantSettings,
  FoodCategory,
} from './types';
import {
  loadProducts,
  loadOrders,
  loadRestaurantSettings,
  loadCart,
  saveCart,
  getAdminSession,
  logoutAdmin,
  formatNaira,
} from './services/store';
import { Navbar } from './components/Navbar';
import { Hero } from './components/Hero';
import { CategoriesSection } from './components/CategoriesSection';
import { FeaturedMeals } from './components/FeaturedMeals';
import { MenuSection } from './components/MenuSection';
import { ProductDetailModal } from './components/ProductDetailModal';
import { CartDrawer } from './components/CartDrawer';
import { CheckoutModal } from './components/CheckoutModal';
import { ReviewsSection } from './components/ReviewsSection';
import { ContactSection } from './components/ContactSection';
import { Footer } from './components/Footer';
import { FloatingWhatsApp } from './components/FloatingWhatsApp';
import { AdminLoginModal } from './components/AdminLoginModal';
import { AdminDashboard } from './components/AdminDashboard';
import { CheckCircle2 } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<string>('home');
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [settings, setSettings] = useState<RestaurantSettings | null>(null);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  
  // Modals & Panels
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isAdminLoginOpen, setIsAdminLoginOpen] = useState(false);
  const [isAdminDashboardOpen, setIsAdminDashboardOpen] = useState(false);
  const [selectedProductForDetail, setSelectedProductForDetail] = useState<Product | null>(null);
  
  // Category selected for Menu filter
  const [selectedMenuCategory, setSelectedMenuCategory] = useState<string>('All');
  
  // Admin Session
  const [adminSession, setAdminSession] = useState(getAdminSession());
  
  // Feedback toast
  const [feedbackToast, setFeedbackToast] = useState<string | null>(null);

  const showToast = (message: string) => {
    setFeedbackToast(message);
    setTimeout(() => setFeedbackToast(null), 2500);
  };

  // Initial Data Load
  const refreshAllData = async () => {
    const [prods, ords, sets] = await Promise.all([
      loadProducts(),
      loadOrders(),
      loadRestaurantSettings(),
    ]);
    setProducts(prods);
    setOrders(ords);
    setSettings(sets);
  };

  useEffect(() => {
    refreshAllData();
    setCartItems(loadCart());
  }, []);

  // Save Cart Changes
  const handleUpdateCart = (newItems: CartItem[]) => {
    setCartItems(newItems);
    saveCart(newItems);
  };

  const handleAddToCart = (
    product: Product,
    quantity: number = 1,
    instructions?: string,
    extras?: { name: string; price: number }[]
  ) => {
    const existingIndex = cartItems.findIndex(
      (item) =>
        item.product.id === product.id &&
        item.special_instructions === instructions &&
        JSON.stringify(item.selected_extras) === JSON.stringify(extras)
    );

    let updated: CartItem[];
    if (existingIndex >= 0) {
      updated = [...cartItems];
      updated[existingIndex].quantity += quantity;
    } else {
      updated = [
        ...cartItems,
        {
          product,
          quantity,
          special_instructions: instructions,
          selected_extras: extras,
        },
      ];
    }

    handleUpdateCart(updated);
    showToast(`Added ${quantity}× ${product.name} to bag`);
  };

  const handleUpdateCartQuantity = (index: number, newQty: number) => {
    if (newQty <= 0) {
      handleRemoveCartItem(index);
      return;
    }
    const updated = [...cartItems];
    updated[index].quantity = newQty;
    handleUpdateCart(updated);
  };

  const handleRemoveCartItem = (index: number) => {
    const updated = cartItems.filter((_, i) => i !== index);
    handleUpdateCart(updated);
  };

  const handleClearCart = () => {
    handleUpdateCart([]);
  };

  const handleOrderSuccess = (order: Order) => {
    // Clear cart
    handleClearCart();
    refreshAllData();
  };

  const handleSelectCategoryFromHome = (category: FoodCategory) => {
    setSelectedMenuCategory(category);
    setActiveTab('menu');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Cart totals calculation
  const cartSubtotal = cartItems.reduce((sum, item) => {
    const extrasTotal = item.selected_extras
      ? item.selected_extras.reduce((acc, ex) => acc + ex.price, 0)
      : 0;
    return sum + (item.product.price + extrasTotal) * item.quantity;
  }, 0);
  const cartItemCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  const deliveryFee = settings ? settings.delivery_fee : 1500;
  const whatsappNumber = settings ? settings.whatsapp_number : '2349024971419';
  const displayWhatsapp = settings ? settings.display_whatsapp : '09024971419';

  return (
    <div className="min-h-screen bg-[#08080a] text-slate-100 flex flex-col font-sans selection:bg-[#d4af37] selection:text-black">
      
      {/* Visual Feedback Toast */}
      {feedbackToast && (
        <div className="fixed top-24 right-5 z-50 px-4 py-2.5 rounded-xl bg-[#17140e] border border-[#d4af37] text-[#F5D77F] text-xs font-semibold shadow-2xl flex items-center gap-2 animate-in fade-in slide-in-from-top-4">
          <CheckCircle2 className="w-4 h-4 text-[#d4af37]" />
          <span>{feedbackToast}</span>
        </div>
      )}

      {/* Main Luxury Navbar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        cartCount={cartItemCount}
        cartTotal={cartSubtotal}
        onOpenCart={() => setIsCartOpen(true)}
        onOpenAdminLogin={() => setIsAdminLoginOpen(true)}
        isAdminLoggedIn={adminSession.isAuthenticated}
        onOpenAdminDashboard={() => setIsAdminDashboardOpen(true)}
      />

      {/* Page Routing / Views */}
      <main className="flex-1">
        {activeTab === 'home' && (
          <>
            <Hero
              onExploreMenu={() => {
                setActiveTab('menu');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              onOrderNow={() => {
                setActiveTab('menu');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
            />

            <CategoriesSection onSelectCategory={handleSelectCategoryFromHome} />

            <FeaturedMeals
              products={products}
              onAddToCart={(p) => handleAddToCart(p, 1)}
              onViewProduct={(p) => setSelectedProductForDetail(p)}
              onExploreAll={() => {
                setActiveTab('menu');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
            />

            <ReviewsSection />

            <ContactSection
              whatsappNumber={whatsappNumber}
              displayWhatsapp={displayWhatsapp}
              phoneNumber={settings?.phone_number || '+234 902 497 1419'}
              address={settings?.address || '14 Admiralty Way, Lekki Phase 1, Lagos, Nigeria'}
              openingHours={settings?.opening_hours || 'Monday - Sunday: 10:00 AM – 11:30 PM'}
            />
          </>
        )}

        {activeTab === 'menu' && (
          <MenuSection
            products={products}
            selectedCategory={selectedMenuCategory}
            onSelectCategory={setSelectedMenuCategory}
            onAddToCart={(p) => handleAddToCart(p, 1)}
            onViewProduct={(p) => setSelectedProductForDetail(p)}
            onOpenAdminLogin={() => setIsAdminLoginOpen(true)}
          />
        )}

        {activeTab === 'featured' && (
          <div className="pt-6">
            <FeaturedMeals
              products={products}
              onAddToCart={(p) => handleAddToCart(p, 1)}
              onViewProduct={(p) => setSelectedProductForDetail(p)}
              onExploreAll={() => {
                setActiveTab('menu');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
            />
            <div className="max-w-7xl mx-auto px-4 pb-16 text-center">
              <button
                onClick={() => {
                  setSelectedMenuCategory('All');
                  setActiveTab('menu');
                }}
                className="px-6 py-3 rounded-xl gold-gradient-bg text-black text-xs font-bold uppercase tracking-wider hover:brightness-110 cursor-pointer shadow-lg"
              >
                Browse Full Menu (All 8 Categories)
              </button>
            </div>
          </div>
        )}

        {activeTab === 'reviews' && (
          <div className="pt-6">
            <ReviewsSection />
          </div>
        )}

        {activeTab === 'contact' && (
          <div className="pt-6">
            <ContactSection
              whatsappNumber={whatsappNumber}
              displayWhatsapp={displayWhatsapp}
              phoneNumber={settings?.phone_number || '+234 902 497 1419'}
              address={settings?.address || '14 Admiralty Way, Lekki Phase 1, Lagos, Nigeria'}
              openingHours={settings?.opening_hours || 'Monday - Sunday: 10:00 AM – 11:30 PM'}
            />
          </div>
        )}
      </main>

      {/* Luxury Footer */}
      <Footer
        onOpenAdminLogin={() => setIsAdminLoginOpen(true)}
        isAdminLoggedIn={adminSession.isAuthenticated}
        onOpenAdminDashboard={() => setIsAdminDashboardOpen(true)}
        onNavigateTab={(tab) => {
          setActiveTab(tab);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
      />

      {/* Floating WhatsApp CTA */}
      <FloatingWhatsApp whatsappNumber={whatsappNumber} />

      {/* --- CART DRAWER --- */}
      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        items={cartItems}
        onUpdateQuantity={handleUpdateCartQuantity}
        onRemoveItem={handleRemoveCartItem}
        onClearCart={handleClearCart}
        onProceedToCheckout={() => setIsCheckoutOpen(true)}
        deliveryFee={deliveryFee}
      />

      {/* --- CHECKOUT MODAL --- */}
      <CheckoutModal
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        items={cartItems}
        deliveryFee={deliveryFee}
        whatsappNumber={whatsappNumber}
        displayWhatsapp={displayWhatsapp}
        settings={settings || undefined}
        onOrderSuccess={handleOrderSuccess}
      />

      {/* --- PRODUCT DETAILS / CUSTOMIZE MODAL --- */}
      <ProductDetailModal
        product={selectedProductForDetail}
        onClose={() => setSelectedProductForDetail(null)}
        onAddToCart={handleAddToCart}
        whatsappNumber={whatsappNumber}
      />

      {/* --- ADMIN LOGIN MODAL --- */}
      <AdminLoginModal
        isOpen={isAdminLoginOpen}
        onClose={() => setIsAdminLoginOpen(false)}
        onLoginSuccess={() => {
          setAdminSession(getAdminSession());
          setIsAdminDashboardOpen(true);
        }}
      />

      {/* --- ADMIN DASHBOARD FULL CONSOLE --- */}
      {isAdminDashboardOpen && adminSession.isAuthenticated && settings && (
        <AdminDashboard
          onClose={() => setIsAdminDashboardOpen(false)}
          onLogout={() => {
            logoutAdmin();
            setAdminSession(getAdminSession());
            setIsAdminDashboardOpen(false);
          }}
          products={products}
          orders={orders}
          settings={settings}
          onRefreshData={refreshAllData}
        />
      )}

    </div>
  );
}
