'use client';

import React, { useRef, useState } from 'react';
import { useCart } from '@/context/CartContext';
import { Volume2, VolumeX } from 'lucide-react';

export default function Hero() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [isMuted, setIsMuted] = useState(true);
  const { playSound } = useCart();

  const toggleMute = () => {
    if (!videoRef.current) return;
    const nextMuted = !isMuted;
    videoRef.current.muted = nextMuted;
    setIsMuted(nextMuted);
    playSound('click');
  };

  const scrollToProducts = () => {
    playSound('click');
    const el = document.getElementById('products-section');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section className="relative w-full h-[70vh] min-h-[500px] max-h-[820px] bg-black text-white overflow-hidden flex flex-col justify-center items-center selection:bg-[#dfb86c] selection:text-black">
      {/* Background Video */}
      <div className="absolute inset-0 z-0">
        <video
          ref={videoRef}
          className="w-full h-full object-cover object-center filter brightness-[0.65] contrast-[1.15]"
          autoPlay
          muted
          loop
          playsInline
          poster="https://merch.samayraina.co/cdn/shop/files/preview_images/b5890205178140de97294403e5d338a2.thumbnail.0000000000.jpg"
        >
          <source
            src="https://merch.samayraina.co/cdn/shop/videos/c/vp/b5890205178140de97294403e5d338a2/b5890205178140de97294403e5d338a2.HD-1080p-3.3Mbps-101520529.mp4"
            type="video/mp4"
          />
        </video>
        {/* Subtle vignette */}
        <div className="absolute inset-0 bg-black/30 pointer-events-none" />
      </div>

      {/* Floating Audio Toggle for Hero Video */}
      <button
        onClick={toggleMute}
        className="absolute top-6 right-6 z-20 w-9 h-9 rounded-full bg-black/60 backdrop-blur-md border border-white/20 flex items-center justify-center hover:bg-[#dfb86c] hover:text-black transition-all"
        aria-label="Toggle hero video audio"
      >
        {isMuted ? <VolumeX className="w-4 h-4 text-white" /> : <Volume2 className="w-4 h-4 text-[#dfb86c]" />}
      </button>

      {/* Hero Headline & CTA Button - Exactly as in Screenshot 4 */}
      <div className="relative z-10 flex flex-col items-center justify-center text-center px-4 max-w-4xl mx-auto my-auto">
        <h1 className="font-anton text-6xl sm:text-7xl md:text-8xl lg:text-9xl uppercase tracking-normal leading-none select-none text-[#dfb86c] drop-shadow-[0_4px_25px_rgba(0,0,0,0.9)] mb-6">
          INDIA WEARS LATENT
        </h1>

        <button
          onClick={scrollToProducts}
          className="font-anton text-base sm:text-lg md:text-xl tracking-wider uppercase px-8 py-3.5 bg-[#dfb86c] hover:bg-[#f0cf85] active:scale-95 text-black rounded-none shadow-2xl transition-all duration-200"
        >
          GET YOURS
        </button>
      </div>
    </section>
  );
}
