'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useCart } from '@/context/CartContext';
import CheckoutModal from '@/components/CheckoutModal';
import { X, Trash2, Plus, Minus, ArrowRight, ShieldCheck, Tag, Sparkles } from 'lucide-react';

export default function CartDrawer() {
  const {
    items,
    isCartOpen,
    setIsCartOpen,
    removeFromCart,
    updateQuantity,
    cartCount,
    subtotal,
    discount,
    shipping,
    total,
    promoCode,
    promoError,
    applyPromoCode,
    freeShippingProgress,
    freeShippingRemaining,
    playSound,
  } = useCart();

  const [inputCode, setInputCode] = useState('');
  const [isCheckoutModalOpen, setIsCheckoutModalOpen] = useState(false);

  if (!isCartOpen) return null;

  const handleApplyPromo = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputCode) {
      applyPromoCode(inputCode);
    }
  };

  const handleOpenCheckout = () => {
    playSound('click');
    setIsCheckoutModalOpen(true);
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex justify-end">
        {/* Backdrop */}
        <div
          className="fixed inset-0 bg-black/80 backdrop-blur-sm transition-opacity"
          onClick={() => {
            setIsCartOpen(false);
            playSound('click');
          }}
        />

        {/* Drawer Panel */}
        <div className="relative z-10 w-full max-w-md bg-[#0e1014] text-white h-full flex flex-col border-l border-borderDark shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="p-4 md:p-6 border-b border-borderDark flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 bg-crimson" />
              <h2 className="font-anton text-lg tracking-wider uppercase text-[#dfb86c]">
                YOUR CART ({cartCount})
              </h2>
            </div>
            <button
              onClick={() => {
                setIsCartOpen(false);
                playSound('click');
              }}
              className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/20 flex items-center justify-center transition-colors"
              aria-label="Close cart"
            >
              <X className="w-4 h-4 text-white" />
            </button>
          </div>

          {/* Free Shipping Progress */}
          <div className="bg-surface px-4 py-3 border-b border-borderDark text-xs font-mono">
            <div className="flex justify-between items-center mb-1.5 font-bold">
              {freeShippingRemaining > 0 ? (
                <span className="text-white/80">
                  ADD <span className="text-accentYellow">₹{freeShippingRemaining}</span> FOR FREE SHIPPING
                </span>
              ) : (
                <span className="text-green-400 flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-accentYellow" />
                  YOU UNLOCKED FREE SHIPPING!
                </span>
              )}
              <span className="text-white/50">{freeShippingProgress}%</span>
            </div>
            <div className="w-full h-1.5 bg-black/60 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-crimson to-accentYellow transition-all duration-500"
                style={{ width: `${freeShippingProgress}%` }}
              />
            </div>
          </div>

          {/* Cart Items List */}
          <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4 divide-y divide-borderDark/60">
            {items.length === 0 ? (
              <div className="py-24 text-center font-mono">
                <p className="text-base text-white/70 mb-2">YOUR BAG IS AS EMPTY AS YOUR LATENT</p>
                <p className="text-xs text-white/40 mb-6">Explore the drops and get geared up.</p>
                <button
                  onClick={() => {
                    setIsCartOpen(false);
                    playSound('click');
                  }}
                  className="px-6 py-3 bg-[#dfb86c] text-black text-xs font-anton tracking-wider uppercase hover:bg-[#f0cf85]"
                >
                  START BROWSING
                </button>
              </div>
            ) : (
              items.map((item, idx) => (
                <div key={`${item.product.id}-${item.size}`} className={`pt-4 ${idx === 0 ? 'pt-0' : ''} flex gap-4`}>
                  {/* Product Thumbnail */}
                  <img
                    src={item.product.images[0]}
                    alt={item.product.title}
                    className="w-20 h-24 object-cover object-center bg-black/50 border border-borderDark shrink-0"
                  />

                  {/* Details */}
                  <div className="flex-1 flex flex-col justify-between font-mono">
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="text-sm font-bold text-white line-clamp-1 font-anton tracking-wide">
                          {item.product.name}
                        </h4>
                        <button
                          onClick={() => removeFromCart(item.product.id, item.size)}
                          className="text-white/40 hover:text-crimson transition-colors p-1"
                          aria-label="Remove item"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="flex items-center gap-2 mt-1">
                        <span className="px-2 py-0.5 bg-surface text-white/70 text-[10px] border border-borderDark uppercase">
                          Size: {item.size}
                        </span>
                        <span className="text-xs font-bold text-[#dfb86c]">
                          ₹{item.product.price}
                        </span>
                      </div>
                    </div>

                    {/* Quantity bar & subtotal */}
                    <div className="flex items-center justify-between mt-3 pt-2">
                      <div className="flex items-center border border-borderDark bg-surface">
                        <button
                          onClick={() => updateQuantity(item.product.id, item.size, -1)}
                          className="w-7 h-7 flex items-center justify-center hover:bg-white/10 text-white/70 hover:text-white"
                          aria-label="Decrease quantity"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="w-8 text-center text-xs font-bold">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(item.product.id, item.size, 1)}
                          className="w-7 h-7 flex items-center justify-center hover:bg-white/10 text-white/70 hover:text-white"
                          aria-label="Increase quantity"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>

                      <span className="text-sm font-bold text-white">
                        ₹{item.product.price * item.quantity}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Promo Code Input */}
          {items.length > 0 && (
            <div className="p-4 bg-surface/50 border-t border-borderDark">
              <form onSubmit={handleApplyPromo} className="flex gap-2">
                <div className="relative flex-1">
                  <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/40" />
                  <input
                    type="text"
                    placeholder="PROMO CODE (e.g. LATENT10)"
                    value={inputCode}
                    onChange={(e) => setInputCode(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-surface border border-borderDark text-xs font-mono uppercase text-white outline-none focus:border-[#dfb86c]"
                  />
                </div>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#dfb86c] text-black text-xs font-anton uppercase tracking-wider transition-colors hover:bg-[#f0cf85]"
                >
                  APPLY
                </button>
              </form>
              {promoCode && (
                <p className="text-[11px] font-mono text-green-400 mt-1">
                  ✓ Code {promoCode} applied!
                </p>
              )}
              {promoError && (
                <p className="text-[11px] font-mono text-crimson mt-1">{promoError}</p>
              )}
            </div>
          )}

          {/* Footer Summary & Checkout */}
          {items.length > 0 && (
            <div className="p-4 md:p-6 bg-surface border-t border-borderDark font-mono space-y-2">
              <div className="flex justify-between text-xs text-white/60">
                <span>SUBTOTAL</span>
                <span>₹{subtotal}</span>
              </div>

              {discount > 0 && (
                <div className="flex justify-between text-xs text-green-400 font-bold">
                  <span>DISCOUNT ({promoCode})</span>
                  <span>-₹{discount}</span>
                </div>
              )}

              <div className="flex justify-between text-xs text-white/60">
                <span>SHIPPING</span>
                <span>{shipping === 0 ? 'FREE' : `₹${shipping}`}</span>
              </div>

              <div className="flex justify-between text-base font-bold text-white pt-2 border-t border-borderDark/80">
                <span>ESTIMATED TOTAL</span>
                <span className="text-[#dfb86c]">₹{total}</span>
              </div>

              <button
                onClick={handleOpenCheckout}
                className="w-full mt-4 py-4 bg-[#dfb86c] hover:bg-[#f0cf85] text-black font-anton text-base tracking-wider uppercase flex items-center justify-center gap-2 transition-all duration-300 shadow-xl"
              >
                <span>PROCEED TO CHECKOUT • ₹{total}</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <div className="pt-2 flex items-center justify-center gap-2 text-[10px] text-white/40 uppercase text-center">
                <ShieldCheck className="w-3.5 h-3.5 text-accentYellow" />
                <span>Verified Razorpay Test Mode Gateway</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Checkout Modal with Razorpay popup */}
      <CheckoutModal
        isOpen={isCheckoutModalOpen}
        onClose={() => setIsCheckoutModalOpen(false)}
      />
    </>
  );
}
