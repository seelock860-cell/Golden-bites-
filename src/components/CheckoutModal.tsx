import React, { useState } from 'react';
import { CartItem, Order, RestaurantSettings, PaymentMethod } from '../types';
import { formatNaira, generateWhatsAppOrderMessage, openWhatsAppCheckout, createOrder } from '../services/store';
import {
  X,
  MapPin,
  Phone,
  User,
  CheckCircle2,
  AlertCircle,
  ShoppingBag,
  Send,
  Building2,
  Copy,
  Check,
  Clock,
  ShieldCheck,
  CreditCard,
  MessageCircle,
} from 'lucide-react';

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: CartItem[];
  deliveryFee: number;
  whatsappNumber: string; // '2349024971419'
  displayWhatsapp: string; // '09024971419'
  settings?: RestaurantSettings;
  onOrderSuccess: (order: Order) => void;
}

export const CheckoutModal: React.FC<CheckoutModalProps> = ({
  isOpen,
  onClose,
  items,
  deliveryFee,
  whatsappNumber,
  displayWhatsapp,
  settings,
  onOrderSuccess,
}) => {
  if (!isOpen) return null;

  const bankName = settings?.bank_name || 'OPay';
  const accountName = settings?.bank_account_name || 'JOSHUA PASCHAL';
  const accountNumber = settings?.bank_account_number || '9160722818';
  const bankInstructions =
    settings?.bank_transfer_instructions ||
    'Please transfer the exact amount to the account above. Your order will be processed after we verify your payment.';

  const [deliveryType, setDeliveryType] = useState<'delivery' | 'pickup'>('delivery');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('bank_transfer');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [deliveryNotes, setDeliveryNotes] = useState('');
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [completedOrder, setCompletedOrder] = useState<Order | null>(null);
  const [copiedAccount, setCopiedAccount] = useState(false);

  const subtotal = items.reduce((sum, item) => {
    const extrasPrice = item.selected_extras
      ? item.selected_extras.reduce((acc, ex) => acc + ex.price, 0)
      : 0;
    return sum + (item.product.price + extrasPrice) * item.quantity;
  }, 0);

  const effectiveDeliveryFee = deliveryType === 'pickup' || subtotal >= 25000 ? 0 : deliveryFee;
  const grandTotal = subtotal + effectiveDeliveryFee;

  const handleCopyAccountNumber = () => {
    navigator.clipboard.writeText(accountNumber);
    setCopiedAccount(true);
    setTimeout(() => setCopiedAccount(false), 2500);
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!customerName.trim()) {
      errors.name = 'Please provide your full name.';
    }

    const cleanPhone = customerPhone.replace(/\s+/g, '');
    if (!cleanPhone) {
      errors.phone = 'Please provide your phone number.';
    } else if (cleanPhone.length < 10) {
      errors.phone = 'Please enter a valid phone number (e.g. 08012345678).';
    }

    if (deliveryType === 'delivery') {
      if (!deliveryAddress.trim()) {
        errors.address = 'Please provide your full delivery address in Lagos.';
      } else if (deliveryAddress.trim().length < 8) {
        errors.address = 'Please enter a descriptive address (Street, House number, Area).';
      }
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const prepareOrderData = (
    channel: 'whatsapp' | 'website_direct',
    chosenMethod: PaymentMethod
  ): Omit<Order, 'id' | 'order_number' | 'created_at'> => {
    const orderItems = items.map((item) => {
      const extrasTotal = item.selected_extras
        ? item.selected_extras.reduce((acc, ex) => acc + ex.price, 0)
        : 0;
      const unitPrice = item.product.price + extrasTotal;
      return {
        product_id: item.product.id,
        product_name: item.product.name,
        price: unitPrice,
        quantity: item.quantity,
        total: unitPrice * item.quantity,
        instructions: item.special_instructions,
        extras: item.selected_extras?.map((e) => e.name),
      };
    });

    return {
      customer_name: customerName.trim(),
      customer_phone: customerPhone.trim(),
      delivery_type: deliveryType,
      delivery_address:
        deliveryType === 'delivery'
          ? deliveryAddress.trim()
          : 'In-store Pickup Counter (14 Admiralty Way, Lekki)',
      delivery_notes: deliveryNotes.trim() || undefined,
      subtotal,
      delivery_fee: effectiveDeliveryFee,
      total_amount: grandTotal,
      order_channel: channel,
      payment_method: chosenMethod,
      // Payment status starts as payment_pending; only staff can verify
      payment_status: 'payment_pending',
      bank_payment_details:
        chosenMethod === 'bank_transfer'
          ? {
              bank_name: bankName,
              account_name: accountName,
              account_number: accountNumber,
            }
          : undefined,
      status: 'pending',
      items: orderItems,
    };
  };

  // Submit via Bank Transfer
  const handleBankTransferCheckout = async () => {
    if (!validateForm()) return;
    setIsSubmitting(true);

    try {
      const orderPayload = prepareOrderData('website_direct', 'bank_transfer');
      const res = await createOrder(orderPayload);
      if (res.success && res.order) {
        setCompletedOrder(res.order);
        onOrderSuccess(res.order);
      }
    } catch (err) {
      console.error('Order creation error:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Submit via WhatsApp
  const handleWhatsAppCheckout = async () => {
    if (!validateForm()) return;
    setIsSubmitting(true);

    try {
      const orderPayload = prepareOrderData('whatsapp', 'whatsapp');
      const res = await createOrder(orderPayload);
      if (res.success && res.order) {
        const message = generateWhatsAppOrderMessage(
          { ...orderPayload, order_number: res.order.order_number },
          'GOLDEN BITE RESTAURANT'
        );
        openWhatsAppCheckout(whatsappNumber, message);
        setCompletedOrder(res.order);
        onOrderSuccess(res.order);
      }
    } catch (err) {
      console.error('Order creation error:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Submit via Pay on Delivery / Pickup
  const handleCashCheckout = async () => {
    if (!validateForm()) return;
    setIsSubmitting(true);

    try {
      const method: PaymentMethod =
        deliveryType === 'delivery' ? 'pay_on_delivery' : 'transfer_on_pickup';
      const orderPayload = prepareOrderData('website_direct', method);
      const res = await createOrder(orderPayload);
      if (res.success && res.order) {
        setCompletedOrder(res.order);
        onOrderSuccess(res.order);
      }
    } catch (err) {
      console.error('Order creation error:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSendPaymentReceiptWhatsApp = () => {
    if (!completedOrder) return;
    const msg = `🧾 *BANK TRANSFER PAYMENT PROOF - GOLDEN BITE*
------------------------------------------
Order Ref: *#${completedOrder.order_number}*
Customer: *${completedOrder.customer_name}*
Amount Transferred: *${formatNaira(completedOrder.total_amount)}*
Paid To: *${bankName} - ${accountName} (${accountNumber})*
Status: *Payment Pending Verification*
------------------------------------------
I have transferred the exact amount to the OPay account above. Please find my transaction receipt attached.`;
    openWhatsAppCheckout(whatsappNumber, msg);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
      <div className="relative w-full max-w-2xl bg-[#0f0e14] border border-[#30291a] rounded-2xl overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200 my-8">
        
        {/* Header */}
        <div className="p-5 border-b border-[#231e13] flex items-center justify-between bg-[#131218]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#221c10] border border-[#d4af37]/40 flex items-center justify-center">
              <ShoppingBag className="w-4 h-4 text-[#d4af37]" />
            </div>
            <div>
              <h2 className="font-serif-luxury text-lg sm:text-xl font-bold text-white">
                {completedOrder ? 'Order Confirmation' : 'Checkout & Payment'}
              </h2>
              <span className="text-xs text-slate-400">
                {completedOrder
                  ? `Order Ref: #${completedOrder.order_number}`
                  : 'Complete your food order with instant bank transfer or WhatsApp'}
              </span>
            </div>
          </div>

          {!completedOrder && (
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg bg-[#1a1820] text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* BODY */}
        {completedOrder ? (
          /* SUCCESS VIEW */
          <div className="p-6 sm:p-8 space-y-6 text-center">
            
            {/* Status Icon */}
            <div className="w-16 h-16 rounded-full bg-amber-950/60 border border-amber-500/50 flex items-center justify-center mx-auto text-amber-400">
              <Clock className="w-9 h-9" />
            </div>

            <div>
              <span className="text-xs font-bold text-[#d4af37] tracking-widest uppercase block">
                ORDER PLACED SUCCESSFULLY
              </span>
              <h3 className="font-serif-luxury text-2xl sm:text-3xl font-bold text-white mt-1">
                Thank You, {completedOrder.customer_name}!
              </h3>
              <p className="text-sm text-slate-300 mt-2 max-w-md mx-auto">
                Your order <strong className="text-[#F5D77F]">#{completedOrder.order_number}</strong> has been logged in our system.
              </p>
            </div>

            {/* Bank Transfer Specific Instructions Banner */}
            {completedOrder.payment_method === 'bank_transfer' && (
              <div className="p-5 rounded-2xl bg-[#18150f] border border-[#d4af37]/60 text-left space-y-3.5 shadow-xl">
                <div className="flex items-center justify-between pb-2 border-b border-[#2d2414]">
                  <div className="flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-[#d4af37]" />
                    <span className="text-xs font-bold text-white uppercase tracking-wider">
                      OPay Transfer Account Details
                    </span>
                  </div>
                  <span className="text-[11px] font-semibold text-amber-300 bg-amber-950/60 border border-amber-500/30 px-2 py-0.5 rounded-full">
                    Payment Pending
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-slate-400 text-[11px] block">Bank Name</span>
                    <span className="text-white font-bold text-sm">{bankName}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[11px] block">Account Name</span>
                    <span className="text-white font-bold text-sm">{accountName}</span>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-black/50 border border-white/10 flex items-center justify-between">
                  <div>
                    <span className="text-slate-400 text-[10px] uppercase tracking-wider block">
                      Account Number
                    </span>
                    <span className="text-lg font-mono font-bold text-[#F5D77F] tracking-wider">
                      {accountNumber}
                    </span>
                  </div>
                  <button
                    onClick={handleCopyAccountNumber}
                    className="px-3 py-1.5 rounded-lg bg-[#241d11] hover:bg-[#342916] border border-[#d4af37]/60 text-[#F5D77F] text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors"
                  >
                    {copiedAccount ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedAccount ? 'Copied!' : 'Copy Account Number'}</span>
                  </button>
                </div>

                <div className="flex items-center justify-between text-xs pt-1">
                  <span className="text-slate-400">Exact Amount to Transfer:</span>
                  <span className="text-base font-mono font-bold text-white">
                    {formatNaira(completedOrder.total_amount)}
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-[#121118] border border-amber-500/20 text-[11px] text-amber-200/90 leading-relaxed flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <span>
                    <strong>Instruction:</strong> Please transfer the exact amount to the account above. Your order will be processed after we verify your payment.
                  </span>
                </div>
              </div>
            )}

            {/* Receipt Summary Card */}
            <div className="p-4 rounded-xl bg-[#141219] border border-[#2b2518] text-left text-xs space-y-2.5 max-w-md mx-auto">
              <div className="flex justify-between text-slate-400 pb-2 border-b border-white/5">
                <span>Payment Status:</span>
                <span className="capitalize font-bold text-amber-400 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse"></span>
                  <span>Payment Pending</span>
                </span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Payment Method:</span>
                <span className="text-white font-medium capitalize">
                  {completedOrder.payment_method === 'bank_transfer'
                    ? 'OPay Direct Bank Transfer'
                    : completedOrder.payment_method === 'whatsapp'
                    ? 'WhatsApp Checkout'
                    : 'Pay on Delivery'}
                </span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Delivery Type:</span>
                <span className="text-white font-medium capitalize">
                  {completedOrder.delivery_type === 'delivery' ? 'Home / Office Delivery' : 'In-store Pickup'}
                </span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Items Ordered:</span>
                <span className="text-white font-medium">
                  {completedOrder.items.reduce((s, i) => s + i.quantity, 0)} items
                </span>
              </div>
              <div className="flex justify-between text-sm font-bold text-white pt-2 border-t border-[#231e13]">
                <span>Total Amount:</span>
                <span className="text-[#F5D77F] font-mono tabular-nums text-base">
                  {formatNaira(completedOrder.total_amount)}
                </span>
              </div>
            </div>

            {/* Follow-up Actions */}
            <div className="space-y-3 pt-2 max-w-md mx-auto">
              {completedOrder.payment_method === 'bank_transfer' && (
                <button
                  onClick={handleSendPaymentReceiptWhatsApp}
                  className="w-full py-3.5 rounded-xl text-xs font-bold tracking-wider text-[#4ade80] bg-[#142318] border border-[#1e4627] hover:border-[#22c55e] hover:bg-[#1a3320] transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md"
                >
                  <MessageCircle className="w-4 h-4 text-[#22c55e]" />
                  <span>Send Transfer Receipt via WhatsApp</span>
                </button>
              )}

              <button
                onClick={onClose}
                className="w-full py-3 rounded-xl text-xs font-bold uppercase tracking-wider gold-gradient-bg text-black hover:brightness-110 cursor-pointer shadow-md"
              >
                Back to Food Menu
              </button>
            </div>

          </div>
        ) : (
          /* CHECKOUT FORM VIEW */
          <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
            
            {/* Delivery or Pickup Toggle */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#d4af37] mb-2">
                1. Select Delivery Method
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setDeliveryType('delivery')}
                  className={`p-3.5 rounded-xl border text-xs font-bold flex flex-col items-center gap-1.5 transition-all cursor-pointer ${
                    deliveryType === 'delivery'
                      ? 'bg-[#241c10] border-[#d4af37] text-white shadow-md'
                      : 'bg-[#141218] border-[#292318] text-slate-400 hover:text-white'
                  }`}
                >
                  <MapPin className="w-5 h-5 text-[#d4af37]" />
                  <span>Doorstep Delivery</span>
                  <span className="text-[10px] font-normal text-slate-400">
                    {subtotal >= 25000 ? 'FREE (Over ₦25,000)' : formatNaira(deliveryFee)}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setDeliveryType('pickup')}
                  className={`p-3.5 rounded-xl border text-xs font-bold flex flex-col items-center gap-1.5 transition-all cursor-pointer ${
                    deliveryType === 'pickup'
                      ? 'bg-[#241c10] border-[#d4af37] text-white shadow-md'
                      : 'bg-[#141218] border-[#292318] text-slate-400 hover:text-white'
                  }`}
                >
                  <ShoppingBag className="w-5 h-5 text-[#d4af37]" />
                  <span>In-store Pickup</span>
                  <span className="text-[10px] font-normal text-slate-400">14 Admiralty Way, Lekki · FREE</span>
                </button>
              </div>
            </div>

            {/* Customer Contact Information */}
            <div className="space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#d4af37]">
                2. Customer Information
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Full Name */}
                <div>
                  <label className="block text-xs text-slate-300 mb-1.5 font-medium">
                    Full Name <span className="text-rose-400">*</span>
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="e.g. Babatunde Fashola"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      className="w-full bg-[#131218] border border-[#2b2518] focus:border-[#d4af37] text-white pl-9 pr-3 py-2.5 rounded-xl text-xs focus:outline-none transition-colors"
                    />
                  </div>
                  {formErrors.name && (
                    <p className="text-[11px] text-rose-400 mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      <span>{formErrors.name}</span>
                    </p>
                  )}
                </div>

                {/* Phone Number */}
                <div>
                  <label className="block text-xs text-slate-300 mb-1.5 font-medium">
                    Phone Number (WhatsApp Active) <span className="text-rose-400">*</span>
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="tel"
                      placeholder="e.g. 0802 345 6789"
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      className="w-full bg-[#131218] border border-[#2b2518] focus:border-[#d4af37] text-white pl-9 pr-3 py-2.5 rounded-xl text-xs focus:outline-none transition-colors font-mono"
                    />
                  </div>
                  {formErrors.phone && (
                    <p className="text-[11px] text-rose-400 mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      <span>{formErrors.phone}</span>
                    </p>
                  )}
                </div>
              </div>

              {/* Delivery Address (if Delivery chosen) */}
              {deliveryType === 'delivery' ? (
                <div>
                  <label className="block text-xs text-slate-300 mb-1.5 font-medium">
                    Delivery Address <span className="text-rose-400">*</span>
                  </label>
                  <textarea
                    rows={2}
                    placeholder="e.g. Flat 4B, Blue Water Heights, Bisola Durosinmi Etti Drive, Lekki Phase 1, Lagos"
                    value={deliveryAddress}
                    onChange={(e) => setDeliveryAddress(e.target.value)}
                    className="w-full bg-[#131218] border border-[#2b2518] focus:border-[#d4af37] text-white p-3 rounded-xl text-xs focus:outline-none transition-colors"
                  />
                  {formErrors.address && (
                    <p className="text-[11px] text-rose-400 mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      <span>{formErrors.address}</span>
                    </p>
                  )}
                </div>
              ) : (
                <div className="p-3.5 rounded-xl bg-[#141219] border border-[#2b2518] text-xs text-slate-300 flex items-start gap-2.5">
                  <MapPin className="w-4 h-4 text-[#d4af37] shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-white block">Pickup Counter Address:</span>
                    <span>Golden Bite Restaurant, 14 Admiralty Way, Lekki Phase 1, Lagos. Estimated prep time: 15–20 mins.</span>
                  </div>
                </div>
              )}

              {/* Delivery Notes */}
              <div>
                <label className="block text-xs text-slate-300 mb-1.5 font-medium">
                  Delivery Notes / Landmarks (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Opposite the yellow gate, call security when at gate"
                  value={deliveryNotes}
                  onChange={(e) => setDeliveryNotes(e.target.value)}
                  className="w-full bg-[#131218] border border-[#2b2518] focus:border-[#d4af37] text-white px-3 py-2.5 rounded-xl text-xs focus:outline-none transition-colors"
                />
              </div>
            </div>

            {/* Payment Method Selector */}
            <div className="space-y-3">
              <label className="block text-xs font-bold uppercase tracking-wider text-[#d4af37]">
                3. Choose Payment Method
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                
                {/* Bank Transfer Option */}
                <button
                  type="button"
                  onClick={() => setPaymentMethod('bank_transfer')}
                  className={`p-3.5 rounded-xl border text-xs font-bold flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    paymentMethod === 'bank_transfer'
                      ? 'bg-[#241c10] border-[#d4af37] text-[#F5D77F] shadow-lg ring-1 ring-[#d4af37]'
                      : 'bg-[#141218] border-[#292318] text-slate-400 hover:text-white'
                  }`}
                >
                  <Building2 className="w-5 h-5 text-[#d4af37]" />
                  <span className="text-white">Bank Transfer</span>
                  <span className="text-[10px] text-amber-300/80 font-normal">OPay Instant</span>
                </button>

                {/* WhatsApp Option */}
                <button
                  type="button"
                  onClick={() => setPaymentMethod('whatsapp')}
                  className={`p-3.5 rounded-xl border text-xs font-bold flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    paymentMethod === 'whatsapp'
                      ? 'bg-[#142318] border-[#22c55e] text-[#4ade80] shadow-lg ring-1 ring-[#22c55e]'
                      : 'bg-[#141218] border-[#292318] text-slate-400 hover:text-white'
                  }`}
                >
                  <MessageCircle className="w-5 h-5 text-[#4ade80]" />
                  <span className="text-white">WhatsApp Order</span>
                  <span className="text-[10px] text-emerald-400 font-normal">Direct Chat</span>
                </button>

                {/* Pay on Delivery Option */}
                <button
                  type="button"
                  onClick={() => setPaymentMethod('pay_on_delivery')}
                  className={`p-3.5 rounded-xl border text-xs font-bold flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    paymentMethod === 'pay_on_delivery'
                      ? 'bg-[#241c10] border-[#d4af37] text-white shadow-lg ring-1 ring-[#d4af37]'
                      : 'bg-[#141218] border-[#292318] text-slate-400 hover:text-white'
                  }`}
                >
                  <CreditCard className="w-5 h-5 text-[#d4af37]" />
                  <span className="text-white">Cash / POS</span>
                  <span className="text-[10px] text-slate-400 font-normal">On Delivery / Pickup</span>
                </button>

              </div>
            </div>

            {/* BANK DETAILS DISPLAY (When Bank Transfer is selected) */}
            {paymentMethod === 'bank_transfer' && (
              <div className="p-4 sm:p-5 rounded-2xl bg-[#17140e] border border-[#d4af37] space-y-3.5 animate-in fade-in">
                <div className="flex items-center justify-between pb-2 border-b border-[#2d2414]">
                  <div className="flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-[#d4af37]" />
                    <span className="text-xs font-bold text-white uppercase tracking-wider">
                      OPay Transfer Account Details
                    </span>
                  </div>
                  <span className="text-[11px] text-[#F5D77F] font-mono font-bold">
                    Exact: {formatNaira(grandTotal)}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-slate-400 text-[11px] block">Bank Name</span>
                    <span className="text-white font-bold text-sm">{bankName}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[11px] block">Account Name</span>
                    <span className="text-white font-bold text-sm">{accountName}</span>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-black/60 border border-white/10 flex items-center justify-between">
                  <div>
                    <span className="text-slate-400 text-[10px] uppercase tracking-wider block">
                      Account Number
                    </span>
                    <span className="text-lg font-mono font-bold text-[#F5D77F] tracking-wider">
                      {accountNumber}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={handleCopyAccountNumber}
                    className="px-3 py-1.5 rounded-lg bg-[#241d11] hover:bg-[#342916] border border-[#d4af37]/60 text-[#F5D77F] text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors"
                  >
                    {copiedAccount ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedAccount ? 'Copied!' : 'Copy Account Number'}</span>
                  </button>
                </div>

                {/* Exact Instruction required */}
                <div className="p-3 rounded-xl bg-[#100f16] border border-amber-500/30 text-xs text-amber-200/90 leading-relaxed flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <span>
                    <strong>Instruction:</strong> {bankInstructions}
                  </span>
                </div>
              </div>
            )}

            {/* Order Items Review */}
            <div className="border-t border-[#231e13] pt-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#d4af37] mb-3">
                Order Review ({items.length} items)
              </h4>
              <div className="space-y-2 max-h-36 overflow-y-auto pr-1">
                {items.map((item, idx) => (
                  <div key={idx} className="flex justify-between text-xs py-1 text-slate-300">
                    <span className="truncate max-w-[260px]">
                      {item.quantity}× {item.product.name}
                      {item.selected_extras && item.selected_extras.length > 0 && (
                        <span className="text-slate-400 text-[10px] block">
                          +{item.selected_extras.map((e) => e.name).join(', ')}
                        </span>
                      )}
                    </span>
                    <span className="font-mono text-white tabular-nums">
                      {formatNaira(
                        (item.product.price +
                          (item.selected_extras?.reduce((s, e) => s + e.price, 0) || 0)) *
                          item.quantity
                      )}
                    </span>
                  </div>
                ))}
              </div>

              {/* Totals */}
              <div className="pt-3 border-t border-[#231e13] space-y-1.5 text-xs">
                <div className="flex justify-between text-slate-400">
                  <span>Subtotal:</span>
                  <span className="font-mono text-white tabular-nums">{formatNaira(subtotal)}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Delivery Fee:</span>
                  <span className="font-mono text-white tabular-nums">
                    {effectiveDeliveryFee === 0 ? (
                      <span className="text-emerald-400 font-semibold">FREE</span>
                    ) : (
                      formatNaira(effectiveDeliveryFee)
                    )}
                  </span>
                </div>
                <div className="flex justify-between text-base font-bold text-white pt-2 border-t border-[#231e13]">
                  <span>Total Due:</span>
                  <span className="font-mono text-lg text-[#F5D77F] tabular-nums">
                    {formatNaira(grandTotal)}
                  </span>
                </div>
              </div>
            </div>

            {/* Primary Action Button Based on Selected Payment Method */}
            <div className="pt-2">
              {paymentMethod === 'bank_transfer' && (
                <button
                  type="button"
                  onClick={handleBankTransferCheckout}
                  disabled={isSubmitting}
                  className="w-full py-4 px-4 rounded-xl text-xs font-bold uppercase tracking-wider gold-gradient-bg text-black hover:brightness-110 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-[#d4af37]/25"
                >
                  <Building2 className="w-4 h-4" />
                  <span>
                    {isSubmitting
                      ? 'Generating Order...'
                      : `Place Bank Transfer Order · ${formatNaira(grandTotal)}`}
                  </span>
                </button>
              )}

              {paymentMethod === 'whatsapp' && (
                <button
                  type="button"
                  onClick={handleWhatsAppCheckout}
                  disabled={isSubmitting}
                  className="w-full py-4 px-4 rounded-xl text-xs font-bold tracking-wider text-[#4ade80] bg-[#142318] border border-[#1e4627] hover:border-[#22c55e] hover:bg-[#1a3320] transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md"
                >
                  <Phone className="w-4 h-4 text-[#22c55e]" />
                  <span>
                    {isSubmitting ? 'Opening WhatsApp...' : 'Submit & Checkout via WhatsApp'}
                  </span>
                </button>
              )}

              {paymentMethod === 'pay_on_delivery' && (
                <button
                  type="button"
                  onClick={handleCashCheckout}
                  disabled={isSubmitting}
                  className="w-full py-4 px-4 rounded-xl text-xs font-bold uppercase tracking-wider gold-gradient-bg text-black hover:brightness-110 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md"
                >
                  <Send className="w-4 h-4" />
                  <span>
                    {isSubmitting
                      ? 'Submitting Order...'
                      : `Submit Order (Pay on ${deliveryType === 'delivery' ? 'Delivery' : 'Pickup'})`}
                  </span>
                </button>
              )}
            </div>

            <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-400 pt-1">
              <ShieldCheck className="w-3.5 h-3.5 text-[#d4af37]" />
              <span>Payments are verified securely by kitchen staff before meal dispatch</span>
            </div>

          </div>
        )}

      </div>
    </div>
  );
};
