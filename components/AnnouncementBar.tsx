'use client';

import React from 'react';
import { Volume2, VolumeX } from 'lucide-react';
import { useCart } from '@/context/CartContext';

export default function AnnouncementBar() {
  const { soundEnabled, setSoundEnabled, playSound } = useCart();

  const messages = [
    'FREE SHIPPING ACROSS INDIA OVER ₹499',
    'SHIPS FROM 15TH DECEMBER',
    'FREE SHIPPING ACROSS INDIA OVER ₹499',
    'SHIPS FROM 15TH DECEMBER',
    'FREE SHIPPING ACROSS INDIA OVER ₹499',
    'SHIPS FROM 15TH DECEMBER',
  ];

  return (
    <div className="relative z-40 bg-[#dfb86c] text-black border-b border-black/10 overflow-hidden text-xs md:text-sm font-bold tracking-wider uppercase select-none">
      <div className="flex items-center justify-between">
        {/* Infinite Marquee */}
        <div className="flex-1 overflow-hidden whitespace-nowrap py-2 flex">
          <div className="flex animate-marquee shrink-0 items-center">
            {messages.map((msg, i) => (
              <span key={`a1-${i}`} className="inline-flex items-center mx-5 font-mono font-bold text-xs md:text-sm text-black">
                <span className="w-2 h-2 bg-black rounded-none mr-3 inline-block" />
                <span>{msg}</span>
              </span>
            ))}
          </div>
          <div className="flex animate-marquee shrink-0 items-center" aria-hidden="true">
            {messages.map((msg, i) => (
              <span key={`a2-${i}`} className="inline-flex items-center mx-5 font-mono font-bold text-xs md:text-sm text-black">
                <span className="w-2 h-2 bg-black rounded-none mr-3 inline-block" />
                <span>{msg}</span>
              </span>
            ))}
          </div>
        </div>

        {/* Audio Toggle */}
        <div className="flex items-center px-4 shrink-0 bg-[#dfb86c] z-10 border-l border-black/10">
          <button
            onClick={() => {
              setSoundEnabled(!soundEnabled);
              playSound('click');
            }}
            title={soundEnabled ? 'Mute Sound FX' : 'Enable Sound FX'}
            className="flex items-center gap-1.5 px-2.5 py-1 bg-black text-[#dfb86c] hover:bg-black/80 transition-colors text-[11px] font-mono font-bold tracking-wider"
            aria-label="Toggle Sound FX"
          >
            {soundEnabled ? (
              <>
                <Volume2 className="w-3.5 h-3.5 text-accentYellow animate-pulse" />
                <span className="hidden sm:inline">SFX</span>
              </>
            ) : (
              <>
                <VolumeX className="w-3.5 h-3.5 text-white/50" />
                <span className="hidden sm:inline text-white/50">MUTE</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
