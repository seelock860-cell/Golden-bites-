import React, { useState } from 'react';
import { FoodCategory, Product } from '../types';
import { formatNaira } from '../services/store';
import { Search, Plus, Eye, CheckCircle2, XCircle, Info, Sparkles, Clock } from 'lucide-react';

interface MenuSectionProps {
  products: Product[];
  selectedCategory: string;
  onSelectCategory: (category: string) => void;
  onAddToCart: (product: Product) => void;
  onViewProduct: (product: Product) => void;
  onOpenAdminLogin: () => void;
}

const ALL_CATEGORIES: ('All' | FoodCategory)[] = [
  'All',
  'Burgers',
  'Pizza',
  'Shawarma',
  'Fried chicken',
  'French fries',
  'Sandwiches',
  'Snacks',
  'Soft drinks',
];

export const MenuSection: React.FC<MenuSectionProps> = ({
  products,
  selectedCategory,
  onSelectCategory,
  onAddToCart,
  onViewProduct,
  onOpenAdminLogin,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [tagFilter, setTagFilter] = useState<string>('All');

  // Filter products by category, search term, and tag
  const filteredProducts = products.filter((item) => {
    const matchesCategory =
      selectedCategory === 'All' || item.category === selectedCategory;
    const matchesSearch =
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.category.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTag =
      tagFilter === 'All' ||
      (item.dietary_tags && item.dietary_tags.some(t => t.toLowerCase().includes(tagFilter.toLowerCase())));

    return matchesCategory && matchesSearch && matchesTag;
  });

  return (
    <section id="menu-section" className="py-16 bg-[#08080a] min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header Title */}
        <div className="text-center max-w-3xl mx-auto mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#1b1911] border border-[#3e3518] text-[#e0b838] text-xs font-semibold mb-3">
            <Sparkles className="w-3.5 h-3.5 text-[#d4af37]" />
            <span>AUTHENTIC LUXURY FAST FOOD MENU</span>
          </div>
          <h2 className="font-serif-luxury text-3xl sm:text-5xl font-bold text-white tracking-tight">
            Our Complete Menu
          </h2>
          <p className="text-sm sm:text-base text-slate-400 mt-3 text-balance">
            Every dish is cooked fresh to order using premium cuts, house-baked buns, artisanal mozzarella, and signature sauces.
          </p>
        </div>

        {/* Search & Tag Filter Bar */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-8">
          {/* Search Box */}
          <div className="relative w-full md:w-96">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search burgers, pizza, shawarma, wings..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#121117] border border-[#2b2518] focus:border-[#d4af37] text-white pl-10 pr-4 py-2.5 rounded-xl text-sm focus:outline-none transition-colors"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-white"
              >
                Clear
              </button>
            )}
          </div>

          {/* Quick Dietary / Special Tags */}
          <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-2 md:pb-0 scrollbar-none">
            {['All', 'Chef', 'Best Seller', 'Spicy', 'Crispy'].map((tag) => (
              <button
                key={tag}
                onClick={() => setTagFilter(tag)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors cursor-pointer ${
                  tagFilter === tag
                    ? 'bg-[#d4af37] text-black font-semibold'
                    : 'bg-[#141318] text-slate-400 hover:text-white border border-[#242018]'
                }`}
              >
                {tag === 'All' ? 'All Tags' : tag}
              </button>
            ))}
          </div>
        </div>

        {/* Category Tabs (Segmented Buttons) */}
        <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-10 scrollbar-none border-b border-[#231e13]">
          {ALL_CATEGORIES.map((category) => (
            <button
              key={category}
              onClick={() => onSelectCategory(category)}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-medium whitespace-nowrap transition-all cursor-pointer ${
                selectedCategory === category
                  ? 'gold-gradient-bg text-black font-bold shadow-md shadow-[#d4af37]/20 scale-105'
                  : 'bg-[#121117] text-slate-300 hover:text-white hover:bg-[#1c1a23] border border-[#262116]'
              }`}
            >
              {category}
            </button>
          ))}
        </div>

        {/* Product Cards Grid */}
        {filteredProducts.length === 0 ? (
          <div className="py-20 text-center rounded-2xl bg-[#0f0e14] border border-[#262116] p-8">
            <Info className="w-10 h-10 text-slate-500 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-white">No food items found</h3>
            <p className="text-sm text-slate-400 mt-1 max-w-sm mx-auto">
              No dishes matched your filter or search query "{searchQuery}". Try selecting another category or clearing the search.
            </p>
            <button
              onClick={() => {
                setSearchQuery('');
                setTagFilter('All');
                onSelectCategory('All');
              }}
              className="mt-4 px-4 py-2 rounded-xl gold-gradient-bg text-black text-xs font-bold uppercase tracking-wider cursor-pointer"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredProducts.map((product) => (
              <div
                key={product.id}
                className="group rounded-2xl bg-[#0f0e13] border border-[#262116] hover:border-[#d4af37] transition-all duration-300 flex flex-col overflow-hidden shadow-md hover:shadow-xl hover:shadow-[#d4af37]/10"
              >
                {/* Food Image & Top Metadata */}
                <div className="relative h-48 w-full overflow-hidden bg-[#16151c]">
                  <img
                    src={product.image_url}
                    alt={product.name}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0f0e13] via-transparent to-transparent opacity-70" />

                  {/* Category Pill Tag */}
                  <span className="absolute top-2.5 left-2.5 text-[10px] font-semibold text-[#F5D77F] bg-black/75 backdrop-blur-md px-2 py-0.5 rounded border border-[#d4af37]/30">
                    {product.category}
                  </span>

                  {/* Availability Badge */}
                  <div className="absolute top-2.5 right-2.5">
                    {product.is_available ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-medium text-emerald-400 bg-black/70 backdrop-blur-md px-2 py-0.5 rounded border border-emerald-500/30">
                        <CheckCircle2 className="w-2.5 h-2.5 text-emerald-400" />
                        <span>Available</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[10px] font-medium text-rose-400 bg-black/70 backdrop-blur-md px-2 py-0.5 rounded border border-rose-500/30">
                        <XCircle className="w-2.5 h-2.5 text-rose-400" />
                        <span>Sold Out</span>
                      </span>
                    )}
                  </div>

                  {/* Preparation Time */}
                  {product.preparation_time_minutes && (
                    <span className="absolute bottom-2 right-2 text-[10px] font-medium text-slate-300 bg-black/70 backdrop-blur-md px-1.5 py-0.5 rounded flex items-center gap-1">
                      <Clock className="w-2.5 h-2.5 text-[#d4af37]" />
                      <span>{product.preparation_time_minutes}m</span>
                    </span>
                  )}
                </div>

                {/* Card Content */}
                <div className="p-4 flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="font-bold text-white text-base group-hover:text-[#F5D77F] transition-colors line-clamp-1">
                      {product.name}
                    </h3>
                    <p className="text-xs text-slate-400 mt-1.5 line-clamp-2 leading-relaxed">
                      {product.description}
                    </p>
                  </div>

                  {/* Bottom: Price in Naira & Add to Cart */}
                  <div className="pt-4 mt-3 border-t border-[#231e13] flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-slate-400 block uppercase font-medium">Price</span>
                      <span className="text-base font-bold text-white font-mono tabular-nums">
                        {formatNaira(product.price)}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => onViewProduct(product)}
                        className="p-2 rounded-lg border border-[#38311f] text-slate-300 hover:text-white hover:border-[#d4af37] hover:bg-[#1a1820] transition-colors cursor-pointer"
                        title="Customize & View Details"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => onAddToCart(product)}
                        disabled={!product.is_available}
                        className={`px-3 py-2 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center gap-1 transition-all cursor-pointer ${
                          product.is_available
                            ? 'gold-gradient-bg text-black hover:brightness-110 active:scale-95 shadow-sm'
                            : 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
                        }`}
                      >
                        <Plus className="w-3 h-3" />
                        <span>{product.is_available ? 'Add' : 'Out'}</span>
                      </button>
                    </div>
                  </div>

                </div>

              </div>
            ))}
          </div>
        )}

      </div>
    </section>
  );
};
