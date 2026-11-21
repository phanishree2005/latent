'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useCart } from '@/context/CartContext';
import { X, ShieldCheck, ArrowRight, Loader2, Sparkles, Tag } from 'lucide-react';

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CheckoutModal({ isOpen, onClose }: CheckoutModalProps) {
  const router = useRouter();
  const {
    items,
    subtotal,
    discount,
    shipping,
    total,
    promoCode,
    clearCart,
    playSound,
  } = useCart();

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    state: '',
    postalCode: '',
  });

  // Dynamically load Razorpay SDK
  useEffect(() => {
    if (typeof window !== 'undefined' && !(window as any).Razorpay) {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.async = true;
      document.body.appendChild(script);
    }
  }, []);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setLoading(true);
    playSound('click');

    try {
      // 1. Call server to create order & get Razorpay order parameters
      const res = await fetch('/api/checkout/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: items.map((i) => ({
            productId: i.product.id,
            size: i.size,
            quantity: i.quantity,
          })),
          customerName: form.name,
          customerEmail: form.email,
          customerPhone: form.phone,
          addressLine1: form.addressLine1,
          addressLine2: form.addressLine2,
          city: form.city,
          state: form.state,
          postalCode: form.postalCode,
          couponCode: promoCode || undefined,
        }),
      });

      const orderData = await res.json();
      if (!res.ok || !orderData.success) {
        throw new Error(orderData.error || 'Failed to initialize payment gateway');
      }

      // 2. Open Razorpay Checkout Window
      if (!(window as any).Razorpay) {
        throw new Error('Razorpay SDK failed to load. Please check your network connection.');
      }

      const options = {
        key: orderData.keyId,
        amount: orderData.amount,
        currency: orderData.currency,
        name: "India's Got Latent Merch",
        description: `Order #${orderData.orderNumber}`,
        image: 'https://merch.samayraina.co/cdn/shop/files/Asset_1.webp',
        order_id: orderData.razorpayOrderId,
        prefill: {
          name: form.name,
          email: form.email,
          contact: form.phone,
        },
        theme: {
          color: '#8b0000',
        },
        handler: async function (response: any) {
          // 3. Verify Payment Signature on Server
          try {
            setLoading(true);
            const verifyRes = await fetch('/api/checkout/verify-payment', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                orderNumber: orderData.orderNumber,
              }),
            });

            const verifyData = await verifyRes.json();
            if (!verifyRes.ok || !verifyData.success) {
              throw new Error(verifyData.error || 'Payment signature verification failed.');
            }

            // Success: clear cart, close modal, redirect
            playSound('success');
            clearCart();
            onClose();
            router.push(`/order-success/${orderData.orderNumber}`);
          } catch (verifyErr: any) {
            setErrorMessage(verifyErr.message || 'Payment verification encountered an issue');
            setLoading(false);
          }
        },
        modal: {
          ondismiss: function () {
            setLoading(false);
            setErrorMessage('Payment was cancelled. Your bag has been saved.');
          },
        },
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.on('payment.failed', function (response: any) {
        setErrorMessage(`Payment failed: ${response.error?.description || 'Transaction declined'}`);
        setLoading(false);
      });
      rzp.open();
    } catch (err: any) {
      setErrorMessage(err.message || 'An unexpected checkout error occurred');
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/85 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-[#0e1014] border border-borderDark text-white shadow-2xl my-8 overflow-hidden">
        {/* Header */}
        <div className="p-5 md:p-6 bg-surface border-b border-borderDark flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="w-2.5 h-2.5 bg-crimson" />
            <h2 className="font-anton text-xl tracking-wider uppercase text-[#dfb86c]">
              SECURE CHECKOUT • RAZORPAY TEST MODE
            </h2>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/20 flex items-center justify-center transition-colors"
            aria-label="Close checkout modal"
          >
            <X className="w-4 h-4 text-white" />
          </button>
        </div>

        {/* Error Notification */}
        {errorMessage && (
          <div className="p-3 bg-crimson/20 border-b border-crimson text-crimson font-mono text-xs flex items-center justify-between">
            <span>{errorMessage}</span>
            <button onClick={() => setErrorMessage('')} className="underline text-[10px]">
              Dismiss
            </button>
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-5 md:p-8 space-y-6">
          {/* Order Summary Strip */}
          <div className="p-4 bg-black/50 border border-borderDark font-mono text-xs space-y-2">
            <div className="flex justify-between text-white/60">
              <span>ITEMS ({items.reduce((s, i) => s + i.quantity, 0)})</span>
              <span>₹{subtotal}</span>
            </div>
            {discount > 0 && (
              <div className="flex justify-between text-green-400 font-bold">
                <span>COUPON DISCOUNT ({promoCode})</span>
                <span>-₹{discount}</span>
              </div>
            )}
            <div className="flex justify-between text-white/60">
              <span>SHIPPING ACROSS INDIA</span>
              <span>{shipping === 0 ? 'FREE' : `₹${shipping}`}</span>
            </div>
            <div className="flex justify-between text-base font-bold text-[#dfb86c] pt-2 border-t border-borderDark">
              <span>TOTAL PAYABLE</span>
              <span>₹{total}</span>
            </div>
          </div>

          {/* Customer Contact */}
          <div>
            <h3 className="font-anton text-sm uppercase tracking-wider text-[#dfb86c] mb-3">
              1. CONTACT INFORMATION
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 font-mono text-xs">
              <div>
                <label className="block text-white/50 uppercase mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Samay Raina"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full px-3 py-2 bg-surface border border-borderDark text-white outline-none focus:border-[#dfb86c]"
                />
              </div>
              <div>
                <label className="block text-white/50 uppercase mb-1">Email (for Receipt)</label>
                <input
                  type="email"
                  required
                  placeholder="samay@habitat.in"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full px-3 py-2 bg-surface border border-borderDark text-white outline-none focus:border-[#dfb86c]"
                />
              </div>
              <div>
                <label className="block text-white/50 uppercase mb-1">Phone Number</label>
                <input
                  type="tel"
                  required
                  placeholder="9876543210"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className="w-full px-3 py-2 bg-surface border border-borderDark text-white outline-none focus:border-[#dfb86c]"
                />
              </div>
            </div>
          </div>

          {/* Shipping Address */}
          <div>
            <h3 className="font-anton text-sm uppercase tracking-wider text-[#dfb86c] mb-3">
              2. DELIVERY ADDRESS
            </h3>
            <div className="space-y-3 font-mono text-xs">
              <div>
                <label className="block text-white/50 uppercase mb-1">Street Address</label>
                <input
                  type="text"
                  required
                  placeholder="Flat/House No., Building, Street"
                  value={form.addressLine1}
                  onChange={(e) => setForm({ ...form, addressLine1: e.target.value })}
                  className="w-full px-3 py-2 bg-surface border border-borderDark text-white outline-none focus:border-[#dfb86c]"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-white/50 uppercase mb-1">City</label>
                  <input
                    type="text"
                    required
                    placeholder="Mumbai"
                    value={form.city}
                    onChange={(e) => setForm({ ...form, city: e.target.value })}
                    className="w-full px-3 py-2 bg-surface border border-borderDark text-white outline-none focus:border-[#dfb86c]"
                  />
                </div>
                <div>
                  <label className="block text-white/50 uppercase mb-1">State</label>
                  <input
                    type="text"
                    required
                    placeholder="Maharashtra"
                    value={form.state}
                    onChange={(e) => setForm({ ...form, state: e.target.value })}
                    className="w-full px-3 py-2 bg-surface border border-borderDark text-white outline-none focus:border-[#dfb86c]"
                  />
                </div>
                <div>
                  <label className="block text-white/50 uppercase mb-1">PIN Code</label>
                  <input
                    type="text"
                    required
                    placeholder="400050"
                    value={form.postalCode}
                    onChange={(e) => setForm({ ...form, postalCode: e.target.value })}
                    className="w-full px-3 py-2 bg-surface border border-borderDark text-white outline-none focus:border-[#dfb86c]"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="pt-4 border-t border-borderDark">
            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-[#dfb86c] hover:bg-[#f0cf85] disabled:bg-gray-700 text-black font-anton text-base md:text-lg tracking-wider uppercase flex items-center justify-center gap-2 transition-all shadow-xl"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>INITIALIZING RAZORPAY GATEWAY...</span>
                </>
              ) : (
                <>
                  <span>PAY NOW • ₹{total} (UPI / CARDS / NETBANKING)</span>
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>

            <div className="mt-3 flex items-center justify-center gap-2 text-[10px] font-mono text-white/40 uppercase">
              <ShieldCheck className="w-3.5 h-3.5 text-accentYellow" />
              <span>Verified 256-Bit Razorpay Test Mode Gateway</span>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
