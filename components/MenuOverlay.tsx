'use client';

import React from 'react';
import Link from 'next/link';
import { useCart } from '@/context/CartContext';
import { X, Volume2, VolumeX, ArrowUpRight, Youtube, Instagram, Twitter, ShieldCheck } from 'lucide-react';

export default function MenuOverlay() {
  const { isMenuOpen, setIsMenuOpen, soundEnabled, setSoundEnabled, playSound } = useCart();

  if (!isMenuOpen) return null;

  const links = [
    { label: 'HOME', href: '/', subtitle: 'Welcome to the stage' },
    { label: 'ALL PRODUCTS', href: '/products', subtitle: '27 Cult Streetwear Drops' },
    { label: 'MY ACCOUNT', href: '/account', subtitle: 'Orders, Saved Addresses & Profile' },
    { label: 'ADMIN CONSOLE', href: '/admin', subtitle: 'Fulfillment, Stock & Analytics' },
    { label: 'EPISODES', href: '/#episodes', subtitle: 'Revision Kar Lo' },
    { label: 'TERMS & CONDITIONS', href: '/terms', subtitle: 'Legal & Shipping Rules' },
    { label: 'RETURNS & EXCHANGES', href: '/returns', subtitle: '7-Day Policy' },
    { label: 'CONTACT US', href: '/contact', subtitle: 'Customer Support' },
  ];

  const handleLinkClick = () => {
    playSound('click');
    setIsMenuOpen(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-between bg-[#07080a]/95 backdrop-blur-xl text-white p-6 md:p-12 overflow-y-auto">
      {/* Top Header */}
      <div className="flex items-center justify-between border-b border-borderDark pb-6">
        <div className="flex items-center gap-3">
          <img
            src="/images/logo.svg"
            alt="India's Got Latent"
            className="h-8 md:h-10 w-auto filter invert sepia saturate-[300%] hue-rotate-[5deg]"
          />
          <span className="hidden sm:inline-block px-2.5 py-0.5 bg-[#dfb86c] text-black text-[10px] font-anton uppercase tracking-widest">
            MENU
          </span>
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={() => {
              setSoundEnabled(!soundEnabled);
              playSound('click');
            }}
            className="flex items-center gap-2 px-3 py-1.5 rounded-none bg-white/10 hover:bg-white/20 text-xs font-mono tracking-wider uppercase transition-colors"
          >
            {soundEnabled ? (
              <>
                <Volume2 className="w-3.5 h-3.5 text-accentYellow" />
                <span>SFX: ON</span>
              </>
            ) : (
              <>
                <VolumeX className="w-3.5 h-3.5 text-white/40" />
                <span>SFX: OFF</span>
              </>
            )}
          </button>

          <button
            onClick={() => {
              setIsMenuOpen(false);
              playSound('click');
            }}
            className="w-10 h-10 rounded-full bg-white/10 hover:bg-[#dfb86c] hover:text-black flex items-center justify-center transition-colors"
            aria-label="Close menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Main Navigation Links */}
      <div className="my-auto py-8 max-w-5xl mx-auto w-full grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12">
        <nav className="flex flex-col space-y-3 sm:space-y-4">
          {links.map((item, idx) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={handleLinkClick}
              className="group flex flex-col transition-all"
            >
              <div className="flex items-baseline gap-3">
                <span className="text-xs font-mono text-white/30 group-hover:text-crimson transition-colors">
                  0{idx + 1}
                </span>
                <span className="font-anton text-2xl sm:text-3xl md:text-4xl uppercase tracking-wider text-[#dfb86c] group-hover:text-white group-hover:translate-x-2 transition-all">
                  {item.label}
                </span>
                <ArrowUpRight className="w-4 h-4 opacity-0 group-hover:opacity-100 group-hover:text-[#dfb86c] transition-all" />
              </div>
              <span className="text-[11px] font-mono text-white/40 pl-7 uppercase tracking-wider">
                {item.subtitle}
              </span>
            </Link>
          ))}
        </nav>

        {/* Right Info Box */}
        <div className="hidden md:flex flex-col justify-between p-6 bg-surface border border-borderDark font-mono">
          <div>
            <span className="text-xs text-crimson font-bold uppercase tracking-widest">
              OFFICIAL DROP NOTICE
            </span>
            <h4 className="font-anton text-2xl uppercase mt-1 mb-2 text-[#dfb86c]">
              SEASON 2 FINALS COLLECTION
            </h4>
            <p className="text-xs text-white/60 leading-relaxed">
              Every garment is created in strictly finite quantities. Free delivery nationwide on all orders exceeding ₹499 with genuine Razorpay test integration.
            </p>
          </div>

          <div className="pt-4 border-t border-borderDark/80">
            <span className="text-[11px] text-white/40 uppercase block mb-2 font-bold">
              PORTAL SHORTCUTS
            </span>
            <div className="flex gap-2">
              <Link
                href="/login"
                onClick={handleLinkClick}
                className="flex-1 py-2 text-center bg-black/60 border border-borderDark text-white hover:border-[#dfb86c] text-xs font-bold uppercase"
              >
                Sign In
              </Link>
              <Link
                href="/register"
                onClick={handleLinkClick}
                className="flex-1 py-2 text-center bg-[#dfb86c] text-black font-anton uppercase text-xs"
              >
                Register
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Footer / Socials */}
      <div className="border-t border-borderDark pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 font-mono text-xs text-white/50">
        <p>© 2026 INDIA&apos;S GOT LATENT • MANAGED BY SAMAY RAINA</p>
        <div className="flex items-center gap-6">
          <a
            href="https://www.youtube.com/@samayraina"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-crimson flex items-center gap-1.5 transition-colors"
          >
            <Youtube className="w-4 h-4" />
            <span>YOUTUBE</span>
          </a>
          <a
            href="https://www.instagram.com/samayraina"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-crimson flex items-center gap-1.5 transition-colors"
          >
            <Instagram className="w-4 h-4" />
            <span>INSTAGRAM</span>
          </a>
          <a
            href="https://twitter.com/samayraina"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-crimson flex items-center gap-1.5 transition-colors"
          >
            <Twitter className="w-4 h-4" />
            <span>X / TWITTER</span>
          </a>
        </div>
      </div>
    </div>
  );
}
