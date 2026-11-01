import React, { useState } from 'react';
import { MapPin, Phone, Clock, Mail, MessageSquare, Send, CheckCircle2 } from 'lucide-react';
import { openWhatsAppCheckout } from '../services/store';

interface ContactSectionProps {
  whatsappNumber: string;
  displayWhatsapp: string;
  phoneNumber: string;
  address: string;
  openingHours: string;
}

export const ContactSection: React.FC<ContactSectionProps> = ({
  whatsappNumber,
  displayWhatsapp,
  phoneNumber,
  address,
  openingHours,
}) => {
  const [senderName, setSenderName] = useState('');
  const [senderEmail, setSenderEmail] = useState('');
  const [senderPhone, setSenderPhone] = useState('');
  const [message, setMessage] = useState('');
  const [inquiryType, setInquiryType] = useState('General');
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!senderName.trim() || !message.trim()) return;

    // Simulate inquiry dispatch and feedback
    setIsSubmitted(true);
    setTimeout(() => {
      // Also offer instant WhatsApp delivery
      const formatted = `👋 *NEW INQUIRY: GOLDEN BITE WEBSITE*
From: ${senderName} (${senderPhone || 'No phone'} / ${senderEmail || 'No email'})
Subject: ${inquiryType}
Message: ${message}`;
      openWhatsAppCheckout(whatsappNumber, formatted);
    }, 600);
  };

  return (
    <section id="contact-section" className="py-16 bg-[#0a0a0d] border-b border-[#231e13]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Title */}
        <div className="text-center max-w-2xl mx-auto mb-12">
          <span className="text-xs font-bold uppercase tracking-widest text-[#d4af37] block mb-2">
            VISIT & CONNECT
          </span>
          <h2 className="font-serif-luxury text-3xl sm:text-4xl font-bold text-white tracking-tight">
            Restaurant Contact & Location
          </h2>
          <p className="text-sm text-slate-400 mt-2">
            Dine in with us, order takeout at our counter, or reach our kitchen team instantly via WhatsApp.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Column: Contact Cards */}
          <div className="lg:col-span-5 space-y-4">
            
            {/* Address Card */}
            <div className="p-5 rounded-2xl bg-[#0e0d13] border border-[#262116] flex items-start gap-3.5 shadow-md">
              <div className="w-10 h-10 rounded-xl bg-[#201a10] border border-[#d4af37]/30 flex items-center justify-center shrink-0">
                <MapPin className="w-5 h-5 text-[#d4af37]" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white">Physical Address</h4>
                <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                  {address}
                </p>
                <span className="text-[11px] text-[#d4af37] mt-1 block">
                  Valet parking available · Accessible entrance
                </span>
              </div>
            </div>

            {/* Direct WhatsApp Hotline */}
            <div className="p-5 rounded-2xl bg-gradient-to-br from-[#121b14] to-[#0e1610] border border-[#1e4627] flex items-start gap-3.5 shadow-md">
              <div className="w-10 h-10 rounded-xl bg-[#142819] border border-[#22c55e]/40 flex items-center justify-center shrink-0">
                <Phone className="w-5 h-5 text-[#4ade80]" />
              </div>
              <div className="flex-1">
                <h4 className="text-sm font-bold text-white flex items-center justify-between">
                  <span>WhatsApp Orders & Inquiries</span>
                  <span className="text-[10px] bg-[#22c55e]/20 text-[#4ade80] px-2 py-0.5 rounded font-mono">
                    Instant Reply
                  </span>
                </h4>
                <p className="text-xs text-slate-300 mt-1">
                  Hotline: <strong className="text-white font-mono">{displayWhatsapp}</strong>
                </p>
                <a
                  href={`https://wa.me/${whatsappNumber}?text=Hello%20Golden%20Bite%20Restaurant!%20I%20have%20an%20inquiry.`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-3 inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold text-black bg-[#4ade80] hover:bg-[#3ecb70] transition-colors cursor-pointer"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>Start WhatsApp Chat</span>
                </a>
              </div>
            </div>

            {/* Business Hours Card */}
            <div className="p-5 rounded-2xl bg-[#0e0d13] border border-[#262116] flex items-start gap-3.5 shadow-md">
              <div className="w-10 h-10 rounded-xl bg-[#201a10] border border-[#d4af37]/30 flex items-center justify-center shrink-0">
                <Clock className="w-5 h-5 text-[#d4af37]" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white">Opening & Delivery Hours</h4>
                <p className="text-xs text-slate-300 mt-1">
                  {openingHours}
                </p>
                <p className="text-[11px] text-slate-500 mt-1">
                  Kitchen closes 30 minutes before closing time.
                </p>
              </div>
            </div>

            {/* Phone & Email */}
            <div className="p-5 rounded-2xl bg-[#0e0d13] border border-[#262116] flex items-start gap-3.5 shadow-md">
              <div className="w-10 h-10 rounded-xl bg-[#201a10] border border-[#d4af37]/30 flex items-center justify-center shrink-0">
                <Mail className="w-5 h-5 text-[#d4af37]" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white">Direct Line & Bookings</h4>
                <p className="text-xs text-slate-300 mt-1 font-mono">
                  {phoneNumber}
                </p>
                <p className="text-xs text-slate-400 mt-0.5">
                  concierge@goldenbite.ng
                </p>
              </div>
            </div>

          </div>

          {/* Right Column: Inquiry / Table Reservation Form */}
          <div className="lg:col-span-7 bg-[#0e0d13] border border-[#282216] rounded-2xl p-6 sm:p-8 shadow-xl">
            <h3 className="font-serif-luxury text-xl font-bold text-white mb-2">
              Send Kitchen / Catering Inquiry
            </h3>
            <p className="text-xs text-slate-400 mb-6">
              Have special dietary questions, event catering requests, or feedback? Send us a message and our chef concierge will respond promptly.
            </p>

            {isSubmitted ? (
              <div className="p-6 rounded-xl bg-emerald-950/40 border border-emerald-500/30 text-center space-y-3">
                <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto" />
                <h4 className="font-bold text-white text-base">Inquiry Dispatched!</h4>
                <p className="text-xs text-slate-300 max-w-sm mx-auto">
                  Thank you, {senderName}. Your message has been prepared for our team. We've also redirected it to WhatsApp for real-time response.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setIsSubmitted(false);
                    setMessage('');
                  }}
                  className="px-4 py-2 rounded-lg text-xs font-semibold gold-gradient-bg text-black cursor-pointer"
                >
                  Send Another Inquiry
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1.5">
                      Your Name <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Adebayo Oladipo"
                      value={senderName}
                      onChange={(e) => setSenderName(e.target.value)}
                      className="w-full bg-[#131218] border border-[#2b2518] focus:border-[#d4af37] text-white px-3.5 py-2.5 rounded-xl text-xs focus:outline-none transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1.5">
                      WhatsApp Phone Number
                    </label>
                    <input
                      type="tel"
                      placeholder="e.g. 0803 123 4567"
                      value={senderPhone}
                      onChange={(e) => setSenderPhone(e.target.value)}
                      className="w-full bg-[#131218] border border-[#2b2518] focus:border-[#d4af37] text-white px-3.5 py-2.5 rounded-xl text-xs focus:outline-none transition-colors font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1.5">
                      Email Address
                    </label>
                    <input
                      type="email"
                      placeholder="e.g. adebayo@example.com"
                      value={senderEmail}
                      onChange={(e) => setSenderEmail(e.target.value)}
                      className="w-full bg-[#131218] border border-[#2b2518] focus:border-[#d4af37] text-white px-3.5 py-2.5 rounded-xl text-xs focus:outline-none transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1.5">
                      Inquiry Category
                    </label>
                    <select
                      value={inquiryType}
                      onChange={(e) => setInquiryType(e.target.value)}
                      className="w-full bg-[#131218] border border-[#2b2518] focus:border-[#d4af37] text-white px-3.5 py-2.5 rounded-xl text-xs focus:outline-none transition-colors"
                    >
                      <option value="General">General Inquiry</option>
                      <option value="Catering">Event & Party Catering</option>
                      <option value="Table Booking">Table Reservation</option>
                      <option value="Dietary">Dietary / Allergen Question</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    Your Message <span className="text-rose-400">*</span>
                  </label>
                  <textarea
                    rows={4}
                    required
                    placeholder="Tell us how we can delight you..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    className="w-full bg-[#131218] border border-[#2b2518] focus:border-[#d4af37] text-white p-3.5 rounded-xl text-xs focus:outline-none transition-colors"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-3.5 rounded-xl text-xs font-bold uppercase tracking-wider gold-gradient-bg text-black hover:brightness-110 active:scale-95 shadow-lg shadow-[#d4af37]/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Send className="w-4 h-4" />
                  <span>Send Message & Chat via WhatsApp</span>
                </button>
              </form>
            )}

          </div>

        </div>

      </div>
    </section>
  );
};
