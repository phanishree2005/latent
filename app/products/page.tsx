import React from 'react';
import ProductGrid from '@/components/ProductGrid';
import Footer from '@/components/Footer';

export const metadata = {
  title: "All Products | India's Got Latent Official Merch",
  description: "Browse the full collection of tees, totes, masks, and collectibles from India's Got Latent.",
};

export default function ProductsPage() {
  return (
    <div className="w-full flex flex-col">
      <div className="py-12 bg-black border-b border-borderDark text-center px-4">
        <span className="text-crimson font-mono text-xs uppercase font-bold tracking-widest block mb-2">
          THE FULL ARCHIVE
        </span>
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-black uppercase tracking-tight text-white">
          ALL DROPS (27)
        </h1>
        <p className="text-white/60 font-mono text-xs md:text-sm mt-2 max-w-lg mx-auto">
          Every official piece released for India&apos;s Got Latent Season 2. No restocks once sold out.
        </p>
      </div>

      <ProductGrid />
      <Footer />
    </div>
  );
}
