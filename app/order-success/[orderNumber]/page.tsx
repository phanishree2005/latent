'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Footer from '@/components/Footer';
import { CheckCircle2, Package, ArrowRight, Truck, Download } from 'lucide-react';

export default function OrderSuccessPage({ params }: { params: { orderNumber: string } }) {
  const { orderNumber } = params;

  return (
    <div className="w-full min-h-screen flex flex-col bg-[#05070b] text-white">
      <div className="max-w-3xl mx-auto w-full px-4 py-16 flex-1 flex flex-col justify-center">
        {/* Success Card */}
        <div className="bg-surface border border-borderDark p-8 md:p-12 text-center shadow-2xl relative overflow-hidden">
          {/* Top Stamp */}
          <div className="w-20 h-20 mx-auto mb-6 bg-green-500/10 border-2 border-green-500/50 rounded-full flex items-center justify-center text-green-400">
            <CheckCircle2 className="w-10 h-10" />
          </div>

          <span className="text-xs font-mono font-bold tracking-widest text-[#dfb86c] uppercase block mb-1">
            PAYMENT CAPTURED VIA RAZORPAY TEST MODE
          </span>

          <h1 className="font-anton text-4xl sm:text-5xl md:text-6xl uppercase tracking-tight text-white mb-2">
            ORDER CONFIRMED
          </h1>

          <div className="inline-block px-4 py-1.5 bg-black/60 border border-borderDark font-mono text-sm font-bold text-[#dfb86c] mb-6">
            ORDER #{orderNumber}
          </div>

          <p className="text-sm font-mono text-white/70 max-w-md mx-auto mb-8 leading-relaxed">
            Samay sends his regards. Your order has been registered and inventory allocated.
            Dispatches commence from <span className="text-accentYellow">15th December 2026</span>.
          </p>

          {/* Details Box */}
          <div className="bg-black/40 border border-borderDark p-6 text-left font-mono text-xs space-y-3 mb-8">
            <div className="flex justify-between border-b border-borderDark/60 pb-2">
              <span className="text-white/50">ORDER STATUS</span>
              <span className="text-green-400 font-bold uppercase">PAID &amp; PROCESSING</span>
            </div>
            <div className="flex justify-between border-b border-borderDark/60 pb-2">
              <span className="text-white/50">PAYMENT GATEWAY</span>
              <span className="text-white">RAZORPAY TEST API</span>
            </div>
            <div className="flex justify-between border-b border-borderDark/60 pb-2">
              <span className="text-white/50">DELIVERY SPEED</span>
              <span className="text-white">STANDARD EXPRESS (3-5 DAYS POST DISPATCH)</span>
            </div>
            <div className="flex justify-between">
              <span className="text-white/50">TRACKING UPDATES</span>
              <span className="text-white">WILL BE DISPATCHED VIA SMS &amp; EMAIL</span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/products"
              className="w-full sm:w-auto px-8 py-3.5 bg-[#dfb86c] hover:bg-[#f0cf85] text-black font-anton text-base tracking-wider uppercase transition-colors"
            >
              CONTINUE SHOPPING
            </Link>

            <Link
              href="/account"
              className="w-full sm:w-auto px-6 py-3.5 bg-surface hover:bg-white/10 border border-borderDark text-white font-mono text-xs tracking-wider uppercase transition-colors"
            >
              VIEW MY ACCOUNT
            </Link>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
