import React, { useState } from 'react';
import { Product } from '../types';
import { formatNaira, openWhatsAppCheckout } from '../services/store';
import { X, Plus, Minus, Clock, Phone, Sparkles, Check } from 'lucide-react';

interface ProductDetailModalProps {
  product: Product | null;
  onClose: () => void;
  onAddToCart: (product: Product, quantity: number, instructions?: string, extras?: { name: string; price: number }[]) => void;
  whatsappNumber: string;
}

const AVAILABLE_EXTRAS = [
  { name: 'Extra Melted Cheddar Sauce', price: 1000 },
  { name: 'Crisp Smoked Beef Bacon', price: 1500 },
  { name: 'Signature House Gold Truffle Dip', price: 800 },
  { name: 'Spicy Suya Pepper Dust', price: 500 },
];

export const ProductDetailModal: React.FC<ProductDetailModalProps> = ({
  product,
  onClose,
  onAddToCart,
  whatsappNumber,
}) => {
  if (!product) return null;

  const [quantity, setQuantity] = useState(1);
  const [instructions, setInstructions] = useState('');
  const [selectedExtras, setSelectedExtras] = useState<{ name: string; price: number }[]>([]);

  const toggleExtra = (extra: { name: string; price: number }) => {
    if (selectedExtras.some((e) => e.name === extra.name)) {
      setSelectedExtras(selectedExtras.filter((e) => e.name !== extra.name));
    } else {
      setSelectedExtras([...selectedExtras, extra]);
    }
  };

  const extrasTotal = selectedExtras.reduce((sum, item) => sum + item.price, 0);
  const itemUnitPrice = product.price + extrasTotal;
  const totalPrice = itemUnitPrice * quantity;

  const handleAdd = () => {
    onAddToCart(product, quantity, instructions, selectedExtras);
    onClose();
  };

  const handleSingleWhatsAppOrder = () => {
    const extrasStr = selectedExtras.length > 0 ? ` (+ ${selectedExtras.map(e => e.name).join(', ')})` : '';
    const msg = `✨ *QUICK ORDER: GOLDEN BITE RESTAURANT* ✨
I'd like to order:
🍽️ *${product.name}* × ${quantity}${extrasStr}
Price: *${formatNaira(totalPrice)}*
${instructions ? `_Notes: ${instructions}_` : ''}

Please confirm availability for delivery / pickup!`;
    openWhatsAppCheckout(whatsappNumber, msg);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="relative w-full max-w-2xl bg-[#0e0d13] border border-[#30291a] rounded-2xl overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 p-2 rounded-full bg-black/60 hover:bg-black text-slate-300 hover:text-white transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Image */}
        <div className="relative h-64 sm:h-72 w-full overflow-hidden bg-[#16151c]">
          <img
            src={product.image_url}
            alt={product.name}
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0e0d13] via-transparent to-transparent" />

          {/* Category & Status */}
          <div className="absolute bottom-4 left-5 flex items-center gap-2">
            <span className="text-xs font-semibold text-[#F5D77F] bg-black/80 backdrop-blur-md px-3 py-1 rounded-md border border-[#d4af37]/30">
              {product.category}
            </span>
            {product.preparation_time_minutes && (
              <span className="text-xs font-medium text-slate-300 bg-black/70 backdrop-blur-md px-2.5 py-1 rounded-md flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-[#d4af37]" />
                <span>{product.preparation_time_minutes} min prep</span>
              </span>
            )}
          </div>
        </div>

        {/* Modal Content */}
        <div className="p-6 space-y-5">
          <div>
            <div className="flex items-start justify-between gap-4">
              <h2 className="font-serif-luxury text-2xl font-bold text-white">
                {product.name}
              </h2>
              <span className="text-2xl font-bold text-[#F5D77F] font-mono tabular-nums whitespace-nowrap">
                {formatNaira(product.price)}
              </span>
            </div>
            <p className="text-sm text-slate-300 mt-2 leading-relaxed">
              {product.description}
            </p>
          </div>

          {/* Add-ons / Extras Section */}
          <div className="border-t border-[#231e13] pt-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#d4af37] mb-3 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Gourmet Add-ons & Extras</span>
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {AVAILABLE_EXTRAS.map((extra) => {
                const isSelected = selectedExtras.some((e) => e.name === extra.name);
                return (
                  <button
                    key={extra.name}
                    type="button"
                    onClick={() => toggleExtra(extra)}
                    className={`flex items-center justify-between p-2.5 rounded-xl text-xs font-medium transition-all cursor-pointer border ${
                      isSelected
                        ? 'bg-[#221c10] border-[#d4af37] text-white'
                        : 'bg-[#141318] border-[#292318] text-slate-300 hover:border-slate-600'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-4 h-4 rounded flex items-center justify-center border ${
                          isSelected
                            ? 'bg-[#d4af37] border-[#d4af37] text-black'
                            : 'border-slate-600 bg-transparent'
                        }`}
                      >
                        {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                      </div>
                      <span>{extra.name}</span>
                    </div>
                    <span className="text-slate-400 font-mono">+{formatNaira(extra.price)}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Special Instructions */}
          <div className="border-t border-[#231e13] pt-4">
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Special Instructions or Dietary Preferences (Optional)
            </label>
            <textarea
              rows={2}
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              placeholder="e.g. Extra spicy toum garlic sauce, no onions, well-done fries..."
              className="w-full bg-[#121117] border border-[#2b2518] focus:border-[#d4af37] text-white p-3 rounded-xl text-xs focus:outline-none transition-colors"
            />
          </div>

          {/* Quantity Stepper & Final Total */}
          <div className="border-t border-[#231e13] pt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="text-xs text-slate-400 font-medium">Quantity:</span>
              <div className="flex items-center bg-[#15141b] border border-[#30291a] rounded-xl p-1">
                <button
                  type="button"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="p-1.5 text-slate-300 hover:text-white hover:bg-[#201d27] rounded-lg transition-colors cursor-pointer"
                  disabled={quantity <= 1}
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <span className="px-4 text-sm font-bold text-white font-mono tabular-nums">
                  {quantity}
                </span>
                <button
                  type="button"
                  onClick={() => setQuantity(quantity + 1)}
                  className="p-1.5 text-slate-300 hover:text-white hover:bg-[#201d27] rounded-lg transition-colors cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <div className="text-right">
              <span className="text-xs text-slate-400 block">Total Price</span>
              <span className="text-2xl font-bold text-[#F5D77F] font-mono tabular-nums">
                {formatNaira(totalPrice)}
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-2 grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              onClick={handleAdd}
              disabled={!product.is_available}
              className={`w-full py-3.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                product.is_available
                  ? 'gold-gradient-bg text-black hover:brightness-110 active:scale-95 shadow-lg shadow-[#d4af37]/20'
                  : 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
              }`}
            >
              Add {quantity} to Cart · {formatNaira(totalPrice)}
            </button>

            <button
              onClick={handleSingleWhatsAppOrder}
              className="w-full py-3.5 rounded-xl text-xs font-bold tracking-wider text-[#4ade80] bg-[#142318] border border-[#1e4627] hover:border-[#22c55e] hover:bg-[#1a3320] transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Phone className="w-4 h-4 text-[#22c55e]" />
              <span>Direct WhatsApp Order</span>
            </button>
          </div>

        </div>

      </div>
    </div>
  );
};
