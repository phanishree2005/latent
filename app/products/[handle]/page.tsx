'use client';

import React, { useState } from 'react';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { PRODUCTS } from '@/data/products';
import { useCart } from '@/context/CartContext';
import Footer from '@/components/Footer';
import { ShoppingBag, ArrowLeft, ShieldCheck, Truck, RefreshCw, Star, Check } from 'lucide-react';

export default function ProductDetailPage({ params }: { params: { handle: string } }) {
  const { handle } = params;
  const product = PRODUCTS.find((p) => p.handle === handle);
  const { addToCart, playSound } = useCart();

  if (!product) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-8 text-center font-mono">
        <h1 className="text-4xl font-black text-white mb-4">PRODUCT NOT FOUND</h1>
        <p className="text-white/60 text-sm mb-6">This drop might have vanished into the void.</p>
        <Link
          href="/products"
          className="px-6 py-3 bg-crimson text-white text-xs font-bold uppercase tracking-wider"
        >
          BACK TO ALL DROPS
        </Link>
      </div>
    );
  }

  const [activeImage, setActiveImage] = useState(0);
  const [selectedSize, setSelectedSize] = useState(product.sizes[0] || 'ONE SIZE');
  const [quantity, setQuantity] = useState(1);
  const [isAdded, setIsAdded] = useState(false);

  const related = PRODUCTS.filter((p) => p.id !== product.id && p.category === product.category).slice(0, 4);

  const handleAdd = () => {
    addToCart(product, selectedSize, quantity);
    setIsAdded(true);
    setTimeout(() => setIsAdded(false), 2000);
  };

  const discountPercent = Math.round(
    ((product.originalPrice - product.price) / product.originalPrice) * 100
  );

  return (
    <div className="w-full flex flex-col bg-[#08090b] text-white">
      {/* Back button breadcrumb */}
      <div className="max-w-7xl mx-auto w-full px-4 md:px-8 py-4 border-b border-borderDark flex items-center justify-between text-xs font-mono text-white/50">
        <Link
          href="/products"
          className="flex items-center gap-1.5 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>BACK TO CATALOG</span>
        </Link>
        <span className="uppercase">{product.category} / {product.name}</span>
      </div>

      {/* Main PDP Grid */}
      <div className="max-w-7xl mx-auto w-full px-4 md:px-8 py-10 grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* Gallery Column (7 cols) */}
        <div className="lg:col-span-7 flex flex-col-reverse md:flex-row gap-4">
          {/* Thumbnails */}
          {product.images.length > 1 && (
            <div className="flex md:flex-col gap-3 overflow-x-auto md:overflow-y-auto shrink-0">
              {product.images.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setActiveImage(idx);
                    playSound('click');
                  }}
                  className={`w-16 h-20 md:w-20 md:h-24 overflow-hidden border transition-all ${
                    activeImage === idx
                      ? 'border-white opacity-100 scale-105'
                      : 'border-borderDark opacity-50 hover:opacity-80'
                  }`}
                >
                  <img src={img} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}

          {/* Main Stage Image */}
          <div className="flex-1 relative aspect-[4/5] bg-black/60 border border-borderDark overflow-hidden">
            <img
              src={product.images[activeImage]}
              alt={product.title}
              className="w-full h-full object-cover object-center filter contrast-105 transition-all duration-300"
            />
            {product.featured && (
              <span className="absolute top-4 left-4 px-3 py-1 bg-crimson text-white font-mono text-xs font-bold uppercase tracking-wider">
                FEATURED DROP
              </span>
            )}
          </div>
        </div>

        {/* Product Details Column (5 cols) */}
        <div className="lg:col-span-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2 font-mono text-xs text-crimson font-bold uppercase tracking-widest">
              <span>LATENT MERCH</span>
              <span>•</span>
              <span className="text-white/40">{product.category}</span>
            </div>

            <h1 className="text-3xl sm:text-4xl md:text-5xl font-black uppercase tracking-tight leading-tight">
              {product.name}
            </h1>

            <p className="text-sm font-mono text-white/50 uppercase mt-1 mb-6">
              {product.subtitle}
            </p>

            {/* Price section */}
            <div className="flex items-baseline gap-3 mb-6 p-4 bg-surface border border-borderDark">
              <span className="text-3xl font-black font-mono text-white">
                ₹{product.price}
              </span>
              {product.originalPrice > product.price && (
                <span className="text-base text-white/40 line-through font-mono">
                  ₹{product.originalPrice}
                </span>
              )}
              {discountPercent > 0 && (
                <span className="px-2 py-0.5 bg-accentYellow text-black text-xs font-mono font-bold uppercase">
                  SAVE {discountPercent}%
                </span>
              )}
            </div>

            {/* Size Selector */}
            {product.sizes.length > 1 && (
              <div className="mb-6">
                <div className="flex justify-between items-center mb-2 font-mono text-xs">
                  <span className="text-white/70 uppercase font-bold">SELECT SIZE:</span>
                  <span className="text-accentYellow cursor-pointer underline">Size Chart (Oversized)</span>
                </div>
                <div className="grid grid-cols-4 sm:grid-cols-5 gap-2">
                  {product.sizes.map((sz) => (
                    <button
                      key={sz}
                      onClick={() => {
                        setSelectedSize(sz);
                        playSound('click');
                      }}
                      className={`py-3 text-xs font-mono font-bold uppercase border transition-all ${
                        selectedSize === sz
                          ? 'bg-white text-black border-white'
                          : 'bg-surface text-white/70 border-borderDark hover:border-white/50'
                      }`}
                    >
                      {sz}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Quantity Stepper & Add to Cart */}
            <div className="flex gap-3 mb-6">
              <div className="flex items-center border border-borderDark bg-surface">
                <button
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  className="w-10 h-12 flex items-center justify-center text-white/70 hover:text-white"
                >
                  -
                </button>
                <span className="w-10 text-center font-mono font-bold text-sm">
                  {quantity}
                </span>
                <button
                  onClick={() => setQuantity((q) => q + 1)}
                  className="w-10 h-12 flex items-center justify-center text-white/70 hover:text-white"
                >
                  +
                </button>
              </div>

              <button
                onClick={handleAdd}
                className={`flex-1 py-4 font-mono text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-2 transition-all ${
                  isAdded
                    ? 'bg-green-600 text-white'
                    : 'bg-crimson hover:bg-bloodRed text-white shadow-xl'
                }`}
              >
                {isAdded ? (
                  <>
                    <Check className="w-4 h-4" />
                    <span>ADDED TO BAG</span>
                  </>
                ) : (
                  <>
                    <ShoppingBag className="w-4 h-4" />
                    <span>ADD TO CART • ₹{product.price * quantity}</span>
                  </>
                )}
              </button>
            </div>

            {/* Description */}
            <div className="prose prose-invert max-w-none text-xs md:text-sm font-mono text-white/70 leading-relaxed border-t border-borderDark pt-6 mb-6">
              <p>{product.description}</p>
            </div>

            {/* Shipping & Guarantees */}
            <div className="space-y-3 border-t border-borderDark pt-6 font-mono text-xs text-white/60">
              <div className="flex items-center gap-3">
                <Truck className="w-4 h-4 text-accentYellow shrink-0" />
                <span>Free shipping across India on orders over ₹499.</span>
              </div>
              <div className="flex items-center gap-3">
                <RefreshCw className="w-4 h-4 text-accentYellow shrink-0" />
                <span>Hassle-free 7-day size exchange &amp; returns.</span>
              </div>
              <div className="flex items-center gap-3">
                <ShieldCheck className="w-4 h-4 text-accentYellow shrink-0" />
                <span>100% Official merchandise authorized by Samay Raina.</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Related Products */}
      {related.length > 0 && (
        <div className="max-w-7xl mx-auto w-full px-4 md:px-8 py-16 border-t border-borderDark">
          <h2 className="text-2xl font-black uppercase tracking-tight text-white mb-6">
            YOU MIGHT ALSO DIG
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {related.map((item) => (
              <Link
                key={item.id}
                href={`/products/${item.handle}`}
                className="group bg-surface border border-borderDark hover:border-white transition-all p-3"
              >
                <div className="aspect-[4/5] bg-black/40 overflow-hidden mb-3">
                  <img
                    src={item.images[0]}
                    alt={item.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                  />
                </div>
                <h4 className="text-xs font-bold text-white group-hover:text-accentYellow truncate">
                  {item.name}
                </h4>
                <p className="text-xs font-mono text-white/50">₹{item.price}</p>
              </Link>
            ))}
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
