'use client';

import React, { useState } from 'react';
import { TESTIMONIALS } from '@/data/products';
import { ChevronLeft, ChevronRight, Quote } from 'lucide-react';
import { useCart } from '@/context/CartContext';

export default function TestimonialsBook() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const { playSound } = useCart();

  const handlePrev = () => {
    playSound('click');
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : TESTIMONIALS.length - 1));
  };

  const handleNext = () => {
    playSound('click');
    setCurrentIndex((prev) => (prev < TESTIMONIALS.length - 1 ? prev + 1 : 0));
  };

  const current = TESTIMONIALS[currentIndex];

  return (
    <section className="w-full bg-[#050608] text-white py-20 px-4 md:px-8 border-b border-borderDark relative overflow-hidden">
      {/* Background Watermark */}
      <div className="absolute right-0 top-1/2 -translate-y-1/2 opacity-5 select-none pointer-events-none text-[20vw] font-black uppercase text-white font-mono leading-none">
        LATENT
      </div>

      <div className="max-w-5xl mx-auto relative z-10">
        {/* Section Heading */}
        <div className="flex items-center justify-between mb-12 border-b border-borderDark pb-6">
          <div>
            <span className="text-crimson font-mono text-xs font-bold uppercase tracking-widest block mb-1">
              THE UNFILTERED WORD
            </span>
            <h2 className="text-4xl sm:text-5xl md:text-6xl font-black uppercase tracking-tight">
              KYA BOLTI PUBLIC?
            </h2>
          </div>

          {/* Stepper Controls */}
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrev}
              className="w-12 h-12 rounded-full border border-borderDark bg-surface hover:bg-white hover:text-black flex items-center justify-center transition-colors"
              aria-label="Previous quote"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <span className="font-mono text-xs text-white/50 px-2">
              0{currentIndex + 1} / 0{TESTIMONIALS.length}
            </span>
            <button
              onClick={handleNext}
              className="w-12 h-12 rounded-full border border-borderDark bg-surface hover:bg-white hover:text-black flex items-center justify-center transition-colors"
              aria-label="Next quote"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Testimonial Stage Card */}
        <div className="relative bg-[#0f1115] border border-borderDark p-8 md:p-14 shadow-2xl flex flex-col md:flex-row items-center gap-8 md:gap-12 min-h-[340px]">
          {/* Quote Icon */}
          <div className="absolute top-6 left-6 text-crimson/20 pointer-events-none">
            <Quote className="w-16 h-16" />
          </div>

          {/* Text Content */}
          <div className="flex-1 relative z-10">
            <blockquote className="text-2xl sm:text-3xl md:text-4xl font-extrabold uppercase leading-snug tracking-tight text-white mb-6">
              &ldquo;{current.quote}&rdquo;
            </blockquote>

            <div className="flex items-center gap-3 pt-4 border-t border-borderDark/80">
              <span className="w-3 h-0.5 bg-crimson" />
              <div>
                <h4 className="text-base font-bold font-mono uppercase text-accentYellow">
                  {current.name}
                </h4>
                <p className="text-xs font-mono text-white/50 uppercase">
                  {current.role}
                </p>
              </div>
            </div>
          </div>

          {/* Portrait Corner Avatar */}
          <div className="shrink-0 w-36 h-36 md:w-48 md:h-48 relative border-2 border-borderDark bg-black/60 overflow-hidden shadow-lg">
            <img
              src={current.corner}
              alt={current.name}
              className="w-full h-full object-cover filter grayscale contrast-125 hover:grayscale-0 transition-all duration-500"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent pointer-events-none" />
          </div>
        </div>
      </div>
    </section>
  );
}
