import React from 'react';
import { Star, Quote } from 'lucide-react';

const REVIEWS_DATA = [
  {
    id: 1,
    name: 'Chinedu Okafor',
    location: 'Lekki Phase 1, Lagos',
    rating: 5,
    date: '3 days ago',
    comment:
      'The Royal Golden Smash Burger is hands down the best burger in Lagos. The toasted brioche bun, the caramelized onions, and the golden cheddar cheese sauce are simply perfection.',
    favoriteMeal: 'The Royal Golden Smash Burger',
  },
  {
    id: 2,
    name: 'Hadiza Mohammed',
    location: 'Victoria Island, Lagos',
    rating: 5,
    date: '1 week ago',
    comment:
      'Ordering through WhatsApp was remarkably effortless. Within 30 minutes, my Artisanal Pepperoni Truffle Pizza arrived piping hot with that gorgeous blistered crust and stretchy cheese pull.',
    favoriteMeal: 'Artisanal Pepperoni Truffle Pizza',
  },
  {
    id: 3,
    name: 'Femi Adeleke',
    location: 'Ikoyi, Lagos',
    rating: 5,
    date: '2 weeks ago',
    comment:
      'Finally, a fast food brand in Nigeria that takes luxury presentation and quality seriously. The buttermilk fried chicken drumsticks were impossibly crunchy outside and juicy inside.',
    favoriteMeal: 'Golden Crunch Drumsticks',
  },
];

export const ReviewsSection: React.FC = () => {
  return (
    <section className="py-16 bg-[#08080a] border-b border-[#231e13]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-12">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#1b1911] border border-[#3e3518] text-[#e0b838] text-xs font-semibold mb-3">
            <Star className="w-3.5 h-3.5 fill-[#d4af37] text-[#d4af37]" />
            <span>4.9 / 5 RATED BY 2,400+ GUESTS</span>
          </div>
          <h2 className="font-serif-luxury text-3xl sm:text-4xl font-bold text-white tracking-tight">
            Guest Testimonials
          </h2>
          <p className="text-sm text-slate-400 mt-2">
            Read real dining impressions from burger aficionados, pizza lovers, and fast food connoisseurs across Lagos.
          </p>
        </div>

        {/* Reviews Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
          {REVIEWS_DATA.map((review) => (
            <div
              key={review.id}
              className="p-6 rounded-2xl bg-[#0e0d13] border border-[#262116] hover:border-[#d4af37]/60 transition-colors flex flex-col justify-between shadow-lg relative"
            >
              <Quote className="w-8 h-8 text-[#d4af37]/20 absolute top-5 right-5" />

              <div>
                {/* 5-Star Rating */}
                <div className="flex items-center gap-1 text-[#d4af37] mb-4">
                  {[...Array(review.rating)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-[#d4af37] text-[#d4af37]" />
                  ))}
                </div>

                <p className="text-sm text-slate-300 leading-relaxed italic">
                  "{review.comment}"
                </p>
              </div>

              <div className="pt-5 mt-4 border-t border-[#231e13] flex items-center justify-between text-xs">
                <div>
                  <h4 className="font-bold text-white text-sm">{review.name}</h4>
                  <span className="text-slate-400 text-xs">{review.location}</span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-[#F5D77F] bg-[#1a1710] px-2 py-0.5 rounded border border-[#382d12] block">
                    {review.favoriteMeal}
                  </span>
                  <span className="text-[10px] text-slate-500 mt-0.5 block">{review.date}</span>
                </div>
              </div>

            </div>
          ))}
        </div>

      </div>
    </section>
  );
};
