'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import ThreeDInstallation from './ThreeDInstallation';
import { Send, CheckCircle2 } from 'lucide-react';
import { useCart } from '@/context/CartContext';

export default function Footer() {
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);
  const { playSound } = useCart();

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      playSound('success');
      setSubscribed(true);
      setTimeout(() => setSubscribed(false), 4000);
      setEmail('');
    }
  };

  return (
    <footer className="w-full bg-[#05070b] text-white pt-10 select-none overflow-hidden">
      {/* 3D Talisman Hanging Over Red Banner - Exactly as in Screenshot 2 */}
      <div className="relative w-full overflow-hidden">
        {/* The Crimson Red Banner across full width */}
        <div className="relative w-full bg-[#8b0000] py-12 md:py-20 flex items-center justify-center overflow-hidden">
          {/* Giant White Brand Text filling the banner */}
          <div className="w-full max-w-6xl px-4 flex items-center justify-center">
            <img
              src="/images/logo.svg"
              alt="INDIA'S GOT LATENT"
              className="w-full max-h-36 sm:max-h-48 md:max-h-64 object-contain filter brightness-[200%] contrast-[150%]"
            />
          </div>

          {/* Hanging 3D Talisman positioned directly over the center of the red banner */}
          <div className="absolute inset-0 z-20 flex items-center justify-center pointer-events-auto">
            <ThreeDInstallation height="100%" className="w-full max-w-lg" />
          </div>
        </div>
      </div>

      {/* Footer Navigation & Details */}
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-12">
        <nav className="mb-10 w-full flex justify-center" aria-label="Footer Navigation">
          <ul className="flex flex-wrap items-center justify-center gap-6 md:gap-10 font-anton text-base md:text-lg uppercase tracking-wider text-[#dfb86c]">
            <li>
              <Link href="/products" className="hover:text-white transition-colors">
                All Products
              </Link>
            </li>
            <li>
              <Link href="/terms" className="hover:text-white transition-colors">
                Terms &amp; Conditions
              </Link>
            </li>
            <li>
              <Link href="/returns" className="hover:text-white transition-colors">
                Returns
              </Link>
            </li>
            <li>
              <Link href="/contact" className="hover:text-white transition-colors">
                Contact Us
              </Link>
            </li>
          </ul>
        </nav>

        {/* Newsletter Box */}
        <div className="w-full max-w-md mx-auto mb-10 text-center font-mono">
          <p className="text-xs text-white/50 uppercase tracking-widest mb-3">
            SUBSCRIBE FOR NEXT DROP NOTIFICATIONS
          </p>
          <form onSubmit={handleSubscribe} className="flex gap-2">
            <input
              type="email"
              required
              placeholder="ENTER YOUR EMAIL"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="flex-1 px-4 py-2.5 bg-surface border border-white/20 text-xs font-mono text-white placeholder-white/40 outline-none focus:border-[#dfb86c]"
            />
            <button
              type="submit"
              className="px-5 py-2.5 bg-[#dfb86c] hover:bg-[#f0cf85] text-black font-anton text-sm tracking-wider uppercase transition-colors"
            >
              JOIN
            </button>
          </form>

          {subscribed && (
            <div className="mt-3 text-xs text-green-400 flex items-center justify-center gap-1.5">
              <CheckCircle2 className="w-4 h-4" />
              <span>You&apos;re subscribed to drop alerts.</span>
            </div>
          )}
        </div>

        {/* Bottom Credits */}
        <div className="pt-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4 font-mono text-xs text-white/40 uppercase">
          <p>© 2026 INDIA&apos;S GOT LATENT • ALL RIGHTS RESERVED</p>
          <p>SHIPS NATIONWIDE ACROSS INDIA</p>
        </div>
      </div>
    </footer>
  );
}
