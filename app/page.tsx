import React from 'react';
import Hero from '@/components/Hero';
import CautionTapeMarquee from '@/components/CautionTapeMarquee';
import ProductGrid from '@/components/ProductGrid';
import TestimonialsBook from '@/components/TestimonialsBook';
import EpisodesGrid from '@/components/EpisodesGrid';
import Footer from '@/components/Footer';

export default function HomePage() {
  return (
    <div className="w-full flex flex-col bg-[#05070b]">
      {/* 1. Hero Section matching Screenshot 4 */}
      <Hero />

      {/* 2. Yellow Crossing Caution Tapes matching Screenshot 1 & 4 */}
      <CautionTapeMarquee />

      {/* 3. Product Catalog matching Screenshot 3 */}
      <ProductGrid />

      {/* 4. "KYA BOLTI PUBLIC?" Testimonials Stage */}
      <TestimonialsBook />

      {/* 5. "REVISION KAR LO" Episodes Gallery */}
      <EpisodesGrid />

      {/* 6. Footer with 3D Talisman over Crimson Banner matching Screenshot 2 */}
      <Footer />
    </div>
  );
}
