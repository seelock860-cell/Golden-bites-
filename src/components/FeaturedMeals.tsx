import React from 'react';
import { Product } from '../types';
import { formatNaira } from '../services/store';
import { Plus, Eye, Flame, Clock } from 'lucide-react';

interface FeaturedMealsProps {
  products: Product[];
  onAddToCart: (product: Product) => void;
  onViewProduct: (product: Product) => void;
  onExploreAll: () => void;
}

export const FeaturedMeals: React.FC<FeaturedMealsProps> = ({
  products,
  onAddToCart,
  onViewProduct,
  onExploreAll,
}) => {
  const featured = products.filter((p) => p.is_featured).slice(0, 6);

  return (
    <section className="py-16 bg-[#08080a] border-b border-[#231e13]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header with Title and "View All" Button */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-10">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-[#d4af37] mb-2">
              <Flame className="w-4 h-4 text-[#d4af37]" />
              <span>CHEF RECOMMENDED SELECTIONS</span>
            </div>
            <h2 className="font-serif-luxury text-3xl sm:text-4xl font-bold text-white tracking-tight">
              Featured Meals
            </h2>
          </div>
          <button
            onClick={onExploreAll}
            className="mt-3 sm:mt-0 text-sm font-semibold text-[#d4af37] hover:text-[#f3d37a] flex items-center gap-1 cursor-pointer"
          >
            <span>View Full Menu</span>
            <span aria-hidden="true">&rarr;</span>
          </button>
        </div>

        {/* Featured Products Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {featured.map((product) => (
            <div
              key={product.id}
              className="group rounded-2xl bg-[#0f0e13] border border-[#262116] hover:border-[#d4af37] transition-all duration-300 flex flex-col overflow-hidden shadow-lg hover:shadow-2xl hover:shadow-[#d4af37]/10"
            >
              {/* Product Image & Badges */}
              <div className="relative h-60 w-full overflow-hidden bg-[#16151c]">
                <img
                  src={product.image_url}
                  alt={product.name}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0f0e13] via-transparent to-transparent opacity-70" />

                {/* Dietary or Category Tag */}
                <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
                  <span className="text-[11px] font-semibold text-[#F5D77F] bg-black/70 backdrop-blur-md px-2.5 py-0.5 rounded border border-[#d4af37]/30">
                    {product.category}
                  </span>
                  {product.dietary_tags && product.dietary_tags[0] && (
                    <span className="text-[11px] font-medium text-slate-300 bg-black/60 backdrop-blur-md px-2 py-0.5 rounded">
                      {product.dietary_tags[0]}
                    </span>
                  )}
                </div>

                {/* Preparation Time */}
                {product.preparation_time_minutes && (
                  <span className="absolute top-3 right-3 text-[11px] font-medium text-slate-300 bg-black/70 backdrop-blur-md px-2 py-0.5 rounded flex items-center gap-1">
                    <Clock className="w-3 h-3 text-[#d4af37]" />
                    <span>{product.preparation_time_minutes}m</span>
                  </span>
                )}
              </div>

              {/* Product Body */}
              <div className="p-5 flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="font-bold text-lg text-white group-hover:text-[#F5D77F] transition-colors leading-snug">
                    {product.name}
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-400 mt-2 line-clamp-2 leading-relaxed">
                    {product.description}
                  </p>
                </div>

                {/* Price & Purchase Actions */}
                <div className="pt-5 mt-4 border-t border-[#231e13] flex items-center justify-between">
                  <div>
                    <span className="text-xs text-slate-400 block">Price</span>
                    <span className="text-lg sm:text-xl font-bold text-white font-mono tabular-nums">
                      {formatNaira(product.price)}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onViewProduct(product)}
                      className="p-2.5 rounded-xl border border-[#38311f] text-slate-300 hover:text-white hover:border-[#d4af37] hover:bg-[#1a1820] transition-colors cursor-pointer"
                      title="View Details"
                    >
                      <Eye className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => onAddToCart(product)}
                      disabled={!product.is_available}
                      className={`px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer ${
                        product.is_available
                          ? 'gold-gradient-bg text-black hover:brightness-110 active:scale-95 shadow-md shadow-[#d4af37]/20'
                          : 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
                      }`}
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>{product.is_available ? 'Add' : 'Sold Out'}</span>
                    </button>
                  </div>
                </div>

              </div>

            </div>
          ))}
        </div>

      </div>
    </section>
  );
};
