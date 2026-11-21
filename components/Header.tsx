'use client';

import React from 'react';
import Link from 'next/link';
import { useCart } from '@/context/CartContext';

export default function Header() {
  const { setIsMenuOpen, setIsCartOpen, cartCount, playSound } = useCart();

  return (
    <header className="sticky top-0 z-40 w-full bg-[#05070b]/95 backdrop-blur-md border-b border-white/5 px-6 md:px-12 py-4 flex items-center justify-between select-none">
      {/* Menu Trigger */}
      <button
        onClick={() => {
          playSound('click');
          setIsMenuOpen(true);
        }}
        className="font-anton text-lg md:text-xl tracking-wider uppercase text-[#dfb86c] hover:text-white transition-colors"
        aria-label="Open Navigation Menu"
      >
        MENU
      </button>

      {/* Center Brand Logo in Gold */}
      <Link href="/" className="flex items-center justify-center group" aria-label="Home">
        <div className="relative">
          <img
            src="/images/logo.svg"
            alt="India's Got Latent"
            className="h-7 sm:h-9 w-auto filter invert sepia saturate-[300%] hue-rotate-[5deg] brightness-[110%] transition-transform group-hover:scale-105"
          />
        </div>
      </Link>

      {/* Cart Trigger */}
      <button
        onClick={() => {
          playSound('click');
          setIsCartOpen(true);
        }}
        className="flex items-center gap-2 font-anton text-lg md:text-xl tracking-wider uppercase text-[#dfb86c] hover:text-white transition-colors"
        aria-label="Open Cart"
      >
        <span>CART</span>
        {cartCount > 0 && (
          <span className="w-5 h-5 rounded-full bg-[#dfb86c] text-black text-xs font-mono font-bold flex items-center justify-center">
            {cartCount}
          </span>
        )}
      </button>
    </header>
  );
}
