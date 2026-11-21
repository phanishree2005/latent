'use client';

import React from 'react';

export default function CautionTapeMarquee() {
  const items = [
    'LOREM IPSUM',
    'LAURA LASUN',
    'LOREM IPSUM',
    'LAURA LASUN',
    'LOREM IPSUM',
    'LAURA LASUN',
    'LOREM IPSUM',
    'LAURA LASUN',
  ];

  return (
    <div className="relative w-full overflow-hidden py-10 bg-[#08090b] select-none pointer-events-none">
      <div className="relative flex flex-col items-center justify-center -my-6 scale-105">
        {/* Strip 1: Tilted -2.5 degrees, scrolling to the left */}
        <div
          className="w-[120%] -ml-[10%] py-2 md:py-3.5 bg-[#ffe72f] text-black shadow-2xl z-10 flex overflow-hidden whitespace-nowrap transform -rotate-[2.5deg]"
          style={{ transformOrigin: 'left bottom' }}
        >
          <div className="flex animate-marquee shrink-0 items-center">
            {items.concat(items).map((text, i) => (
              <span key={`s1-${i}`} className="inline-flex items-center mx-4 md:mx-6 font-anton text-2xl sm:text-4xl md:text-5xl lg:text-6xl tracking-tight text-black uppercase leading-none">
                <span>{text}</span>
                <span className="w-2.5 h-2.5 md:w-3.5 md:h-3.5 rounded-full bg-black ml-4 md:ml-6 shrink-0 inline-block" />
              </span>
            ))}
          </div>
          <div className="flex animate-marquee shrink-0 items-center" aria-hidden="true">
            {items.concat(items).map((text, i) => (
              <span key={`s1-dup-${i}`} className="inline-flex items-center mx-4 md:mx-6 font-anton text-2xl sm:text-4xl md:text-5xl lg:text-6xl tracking-tight text-black uppercase leading-none">
                <span>{text}</span>
                <span className="w-2.5 h-2.5 md:w-3.5 md:h-3.5 rounded-full bg-black ml-4 md:ml-6 shrink-0 inline-block" />
              </span>
            ))}
          </div>
        </div>

        {/* Strip 2: Tilted +2.5 degrees, scrolling in opposite direction (to the right) */}
        <div
          className="w-[120%] -ml-[10%] py-2 md:py-3.5 bg-[#ffe72f] text-black shadow-2xl z-20 flex overflow-hidden whitespace-nowrap transform rotate-[2.5deg] -mt-6 sm:-mt-8 md:-mt-10"
          style={{ transformOrigin: 'left top' }}
        >
          <div className="flex animate-marquee-reverse shrink-0 items-center">
            {items.concat(items).map((text, i) => (
              <span key={`s2-${i}`} className="inline-flex items-center mx-4 md:mx-6 font-anton text-2xl sm:text-4xl md:text-5xl lg:text-6xl tracking-tight text-black uppercase leading-none">
                <span>{text}</span>
                <span className="w-2.5 h-2.5 md:w-3.5 md:h-3.5 rounded-full bg-black ml-4 md:ml-6 shrink-0 inline-block" />
              </span>
            ))}
          </div>
          <div className="flex animate-marquee-reverse shrink-0 items-center" aria-hidden="true">
            {items.concat(items).map((text, i) => (
              <span key={`s2-dup-${i}`} className="inline-flex items-center mx-4 md:mx-6 font-anton text-2xl sm:text-4xl md:text-5xl lg:text-6xl tracking-tight text-black uppercase leading-none">
                <span>{text}</span>
                <span className="w-2.5 h-2.5 md:w-3.5 md:h-3.5 rounded-full bg-black ml-4 md:ml-6 shrink-0 inline-block" />
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
