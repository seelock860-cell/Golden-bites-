import React from 'react';
import { FoodCategory } from '../types';
import { ArrowRight } from 'lucide-react';

interface CategoriesSectionProps {
  onSelectCategory: (cat: FoodCategory) => void;
}

interface CategoryCardInfo {
  name: FoodCategory;
  tagline: string;
  image: string;
  itemCount: string;
}

const CATEGORIES_DATA: CategoryCardInfo[] = [
  {
    name: 'Burgers',
    tagline: 'Double Smash & Brioche Stacks',
    image: '/src/assets/images/hero_burger_feast_1793008742785.jpg',
    itemCount: '3 Varieties',
  },
  {
    name: 'Pizza',
    tagline: 'Artisanal Wood-Fired Crusts',
    image: '/src/assets/images/category_pizza_truffle_1793008743551.jpg',
    itemCount: '2 Varieties',
  },
  {
    name: 'Shawarma',
    tagline: 'Authentic Toum & Suya Spiced',
    image: '/src/assets/images/category_shawarma_wrap_1793008744646.jpg',
    itemCount: '2 Varieties',
  },
  {
    name: 'Fried chicken',
    tagline: 'Golden Buttermilk Crunch',
    image: '/src/assets/images/category_fried_chicken_1793008743791.jpg',
    itemCount: '2 Varieties',
  },
  {
    name: 'French fries',
    tagline: 'Paprika Seasoned & Cheese Dusted',
    image: '/src/assets/images/category_fries_loaded_1793008743969.jpg',
    itemCount: '2 Varieties',
  },
  {
    name: 'Sandwiches',
    tagline: 'Philly Cheesesteak & Royale Club',
    image: '/src/assets/images/hero_burger_feast_1793008742785.jpg',
    itemCount: '2 Varieties',
  },
  {
    name: 'Snacks',
    tagline: 'Spicy Asun Pies & Mozzarella Sticks',
    image: '/src/assets/images/category_fries_loaded_1793008743969.jpg',
    itemCount: '2 Varieties',
  },
  {
    name: 'Soft drinks',
    tagline: 'Chilled Chapman & Zobo Citrus',
    image: '/src/assets/images/category_pizza_truffle_1793008743551.jpg',
    itemCount: '2 Varieties',
  },
];

export const CategoriesSection: React.FC<CategoriesSectionProps> = ({ onSelectCategory }) => {
  return (
    <section className="py-16 bg-[#0a0a0d] border-b border-[#231e13]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-10">
          <div>
            <span className="text-xs font-bold uppercase tracking-widest text-[#d4af37] block mb-2">
              CURATED FAST FOOD COLLECTIONS
            </span>
            <h2 className="font-serif-luxury text-3xl sm:text-4xl font-bold text-white tracking-tight">
              Popular Food Categories
            </h2>
          </div>
          <p className="text-sm text-slate-400 max-w-md mt-2 md:mt-0">
            From signature beef smash burgers and wood-fired artisanal pizza to authentic Lagos shawarma and crispy chicken.
          </p>
        </div>

        {/* Categories Grid - 8 categories */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
          {CATEGORIES_DATA.map((cat) => (
            <div
              key={cat.name}
              onClick={() => onSelectCategory(cat.name)}
              className="group relative rounded-xl overflow-hidden bg-[#121217] border border-[#2a2417] hover:border-[#d4af37] transition-all duration-300 cursor-pointer shadow-lg hover:shadow-xl hover:shadow-[#d4af37]/10"
            >
              {/* Category Image */}
              <div className="h-36 sm:h-44 w-full overflow-hidden relative">
                <img
                  src={cat.image}
                  alt={cat.name}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0d0c11] via-[#0d0c11]/50 to-transparent" />
                
                {/* Item count tag */}
                <span className="absolute top-3 right-3 text-[11px] font-medium text-slate-300 bg-black/60 backdrop-blur-md px-2 py-0.5 rounded border border-white/10">
                  {cat.itemCount}
                </span>
              </div>

              {/* Card Content */}
              <div className="p-3.5 sm:p-4 relative">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-white text-base sm:text-lg group-hover:text-[#F5D77F] transition-colors">
                    {cat.name}
                  </h3>
                  <div className="w-6 h-6 rounded-full bg-[#1e1b15] flex items-center justify-center text-slate-400 group-hover:bg-[#d4af37] group-hover:text-black transition-colors">
                    <ArrowRight className="w-3.5 h-3.5" />
                  </div>
                </div>
                <p className="text-xs text-slate-400 mt-1 line-clamp-1">
                  {cat.tagline}
                </p>
              </div>

            </div>
          ))}
        </div>

      </div>
    </section>
  );
};
