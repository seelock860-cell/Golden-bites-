import React from 'react';
import { CartItem } from '../types';
import { formatNaira } from '../services/store';
import { X, Plus, Minus, Trash2, ShoppingBag, ArrowRight, ShieldCheck } from 'lucide-react';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  items: CartItem[];
  onUpdateQuantity: (index: number, newQty: number) => void;
  onRemoveItem: (index: number) => void;
  onClearCart: () => void;
  onProceedToCheckout: () => void;
  deliveryFee: number;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({
  isOpen,
  onClose,
  items,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
  onProceedToCheckout,
  deliveryFee,
}) => {
  if (!isOpen) return null;

  const subtotal = items.reduce((sum, item) => {
    const extrasPrice = item.selected_extras
      ? item.selected_extras.reduce((acc, ex) => acc + ex.price, 0)
      : 0;
    return sum + (item.product.price + extrasPrice) * item.quantity;
  }, 0);

  const totalCount = items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/75 backdrop-blur-sm flex justify-end">
      <div className="w-full max-w-md bg-[#0d0c11] border-l border-[#2e2617] h-full flex flex-col shadow-2xl animate-in slide-in-from-right duration-300">
        
        {/* Cart Header */}
        <div className="p-5 border-b border-[#231e13] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#221c10] border border-[#d4af37]/40 flex items-center justify-center">
              <ShoppingBag className="w-4 h-4 text-[#d4af37]" />
            </div>
            <div>
              <h2 className="font-serif-luxury text-lg font-bold text-white">
                Your Order Bag
              </h2>
              <span className="text-xs text-slate-400">
                {totalCount} {totalCount === 1 ? 'item' : 'items'} selected
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {items.length > 0 && (
              <button
                onClick={onClearCart}
                className="text-xs text-slate-400 hover:text-rose-400 transition-colors px-2 py-1"
                title="Clear all items"
              >
                Clear
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg bg-[#18161f] text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Cart Items List */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {items.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center py-12">
              <div className="w-16 h-16 rounded-full bg-[#18161f] border border-[#2b2518] flex items-center justify-center mb-4 text-slate-500">
                <ShoppingBag className="w-8 h-8" />
              </div>
              <h3 className="font-bold text-white text-base">Your cart is empty</h3>
              <p className="text-xs text-slate-400 mt-1 max-w-xs">
                Explore our luxury burger, pizza, shawarma, and chicken selections to start your feast.
              </p>
              <button
                onClick={onClose}
                className="mt-5 px-5 py-2.5 rounded-xl gold-gradient-bg text-black text-xs font-bold uppercase tracking-wider cursor-pointer"
              >
                Browse Food Menu
              </button>
            </div>
          ) : (
            items.map((item, index) => {
              const extrasTotal = item.selected_extras
                ? item.selected_extras.reduce((acc, ex) => acc + ex.price, 0)
                : 0;
              const unitPrice = item.product.price + extrasTotal;
              const itemTotal = unitPrice * item.quantity;

              return (
                <div
                  key={`${item.product.id}-${index}`}
                  className="p-3.5 rounded-xl bg-[#141219] border border-[#282216] flex gap-3.5"
                >
                  {/* Thumbnail */}
                  <img
                    src={item.product.image_url}
                    alt={item.product.name}
                    referrerPolicy="no-referrer"
                    className="w-16 h-16 rounded-lg object-cover bg-black shrink-0 border border-white/5"
                  />

                  {/* Details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="text-sm font-bold text-white truncate">
                        {item.product.name}
                      </h4>
                      <button
                        onClick={() => onRemoveItem(index)}
                        className="text-slate-500 hover:text-rose-400 transition-colors p-0.5 cursor-pointer"
                        title="Remove"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <span className="text-xs text-[#F5D77F] font-mono tabular-nums block mt-0.5">
                      {formatNaira(unitPrice)}
                    </span>

                    {/* Extras and instructions display */}
                    {item.selected_extras && item.selected_extras.length > 0 && (
                      <p className="text-[11px] text-slate-400 truncate mt-1">
                        + {item.selected_extras.map((e) => e.name).join(', ')}
                      </p>
                    )}
                    {item.special_instructions && (
                      <p className="text-[10px] text-amber-300/80 italic truncate mt-0.5">
                        "{item.special_instructions}"
                      </p>
                    )}

                    {/* Quantity Stepper & Item Total */}
                    <div className="flex items-center justify-between mt-2.5 pt-2 border-t border-white/5">
                      <div className="flex items-center bg-[#1e1c25] rounded-lg p-0.5 border border-[#30291a]">
                        <button
                          onClick={() => onUpdateQuantity(index, item.quantity - 1)}
                          className="p-1 text-slate-400 hover:text-white cursor-pointer"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="px-2.5 text-xs font-bold text-white font-mono tabular-nums">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => onUpdateQuantity(index, item.quantity + 1)}
                          className="p-1 text-slate-400 hover:text-white cursor-pointer"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>

                      <span className="text-xs font-bold text-white font-mono tabular-nums">
                        {formatNaira(itemTotal)}
                      </span>
                    </div>

                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Cart Footer Calculation & CTA */}
        {items.length > 0 && (
          <div className="p-5 border-t border-[#231e13] bg-[#111016] space-y-3">
            <div className="space-y-1.5 text-xs">
              <div className="flex items-center justify-between text-slate-400">
                <span>Subtotal</span>
                <span className="font-mono text-slate-200 tabular-nums">{formatNaira(subtotal)}</span>
              </div>
              <div className="flex items-center justify-between text-slate-400">
                <span>Estimated Delivery (Lekki / Lagos)</span>
                <span className="font-mono text-slate-200 tabular-nums">
                  {subtotal >= 25000 ? (
                    <span className="text-emerald-400 font-semibold">FREE</span>
                  ) : (
                    formatNaira(deliveryFee)
                  )}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm font-bold text-white pt-2 border-t border-[#231e13]">
                <span>Estimated Total</span>
                <span className="font-mono text-lg text-[#F5D77F] tabular-nums">
                  {formatNaira(subtotal + (subtotal >= 25000 ? 0 : deliveryFee))}
                </span>
              </div>
            </div>

            <button
              onClick={() => {
                onClose();
                onProceedToCheckout();
              }}
              className="w-full py-3.5 rounded-xl text-xs font-bold uppercase tracking-wider gold-gradient-bg text-black hover:brightness-110 active:scale-95 shadow-lg shadow-[#d4af37]/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Proceed to Checkout</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-400 pt-1">
              <ShieldCheck className="w-3.5 h-3.5 text-[#d4af37]" />
              <span>Direct WhatsApp & Pay on Delivery options available</span>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
