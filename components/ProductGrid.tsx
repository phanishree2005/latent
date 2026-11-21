'use client';

import React, { useState, useRef } from 'react';
import Link from 'next/link';
import { PRODUCTS, Product } from '@/data/products';
import { useCart } from '@/context/CartContext';
import { ShoppingCart, Play, Pause, Check } from 'lucide-react';

export default function ProductGrid() {
  const { addToCart, playSound } = useCart();
  const [activeVideoCard, setActiveVideoCard] = useState<string | null>(null);
  const [addedItem, setAddedItem] = useState<string | null>(null);

  const handleQuickAdd = (product: Product, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const size = product.sizes[0] || 'ONE SIZE';
    addToCart(product, size, 1);
    setAddedItem(product.id);
    setTimeout(() => setAddedItem(null), 1200);
  };

  const toggleVideo = (productId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    playSound('click');
    setActiveVideoCard(prev => prev === productId ? null : productId);
  };

  return (
    <section id="products-section" className="w-full bg-[#05070b] text-white py-14 px-4 md:px-8 border-b border-white/5 select-none">
      <div className="max-w-7xl mx-auto">
        {/* Section Heading matching Screenshot 1 & 4 */}
        <div className="text-center mb-12">
          <h2 className="font-anton text-5xl sm:text-6xl md:text-7xl uppercase tracking-wider text-[#dfb86c]">
            LATENT LÉ LÉ
          </h2>
        </div>

        {/* 3-Column Grid matching Screenshot 3 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
          {PRODUCTS.map((product) => {
            const hasVideo = !!product.video;
            const isPlaying = activeVideoCard === product.id;
            const isAdded = addedItem === product.id;

            return (
              <div
                key={product.id}
                className="group flex flex-col justify-between"
                onMouseEnter={() => {
                  if (hasVideo) setActiveVideoCard(product.id);
                }}
                onMouseLeave={() => {
                  if (hasVideo) setActiveVideoCard(null);
                }}
              >
                {/* Visual Stage */}
                <div className="relative aspect-[4/5] w-full bg-[#0e1014] overflow-hidden border border-white/10 group-hover:border-[#dfb86c]/50 transition-colors">
                  <Link href={`/products/${product.handle}`} className="block w-full h-full relative">
                    {/* Primary Image */}
                    <img
                      src={product.images[0]}
                      alt={product.title}
                      loading="lazy"
                      className={`w-full h-full object-cover object-center transition-opacity duration-300 ${
                        isPlaying && hasVideo ? 'opacity-0' : 'opacity-100'
                      }`}
                    />

                    {/* Secondary Image fallback on hover if no video */}
                    {!hasVideo && product.images.length > 1 && (
                      <img
                        src={product.images[1]}
                        alt=""
                        loading="lazy"
                        className="absolute inset-0 w-full h-full object-cover object-center opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                      />
                    )}

                    {/* Looping Video Preview */}
                    {hasVideo && (
                      <video
                        src={product.video}
                        loop
                        muted
                        playsInline
                        autoPlay={isPlaying}
                        className={`absolute inset-0 w-full h-full object-cover object-center transition-opacity duration-300 ${
                          isPlaying ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
                        }`}
                        ref={(el) => {
                          if (el) {
                            if (isPlaying) {
                              el.play().catch(() => {});
                            } else {
                              el.pause();
                            }
                          }
                        }}
                      />
                    )}
                  </Link>

                  {/* Top Right: Cart Button [ 🛒 ] matching Screenshot 3 */}
                  <button
                    onClick={(e) => handleQuickAdd(product, e)}
                    className="absolute top-3 right-3 z-20 w-10 h-10 bg-white hover:bg-[#dfb86c] text-black flex items-center justify-center transition-colors shadow-lg"
                    aria-label={`Add ${product.name} to cart`}
                    title="Add to Cart"
                  >
                    {isAdded ? (
                      <Check className="w-5 h-5 text-green-700 stroke-[3]" />
                    ) : (
                      <ShoppingCart className="w-5 h-5 text-black stroke-[2.2]" />
                    )}
                  </button>

                  {/* Bottom Left: Play Button [ ▶ ] matching Screenshot 3 */}
                  {hasVideo && (
                    <button
                      onClick={(e) => toggleVideo(product.id, e)}
                      className="absolute bottom-3 left-3 z-20 w-10 h-10 bg-[#dfb86c] hover:bg-[#f0cf85] text-black flex items-center justify-center transition-colors shadow-lg"
                      aria-label={isPlaying ? 'Pause preview video' : 'Play preview video'}
                      title="Play Model Video Preview"
                    >
                      {isPlaying ? (
                        <Pause className="w-4 h-4 fill-black" />
                      ) : (
                        <Play className="w-4 h-4 fill-black translate-x-0.5" />
                      )}
                    </button>
                  )}
                </div>

                {/* Typography underneath matching Screenshot 3 */}
                <div className="mt-3 flex flex-col items-center text-center">
                  <Link href={`/products/${product.handle}`} className="group-hover:opacity-80 transition-opacity">
                    <h3 className="font-anton text-lg sm:text-xl uppercase tracking-wider text-[#dfb86c] leading-tight">
                      {product.name}
                    </h3>
                  </Link>

                  <p className="font-anton text-base sm:text-lg uppercase tracking-wider text-[#dfb86c] mt-0.5">
                    RS. {product.price}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
