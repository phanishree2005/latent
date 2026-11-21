import React from 'react';
import Link from 'next/link';
import Footer from '@/components/Footer';
import { ArrowLeft, RefreshCw, CheckCircle2, AlertCircle } from 'lucide-react';

export const metadata = {
  title: "Returns & Exchanges | India's Got Latent Official Merch",
};

export default function ReturnsPage() {
  return (
    <div className="w-full flex flex-col bg-[#08090b] text-white">
      <div className="max-w-4xl mx-auto w-full px-4 md:px-8 py-16">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-xs font-mono text-white/50 hover:text-white transition-colors mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>BACK TO HOME</span>
        </Link>

        <span className="text-crimson font-mono text-xs font-bold uppercase tracking-widest block mb-2">
          CUSTOMER SATISFACTION
        </span>
        <h1 className="text-4xl sm:text-5xl font-black uppercase tracking-tight text-white mb-8 border-b border-borderDark pb-6">
          RETURNS &amp; EXCHANGES
        </h1>

        <div className="space-y-8 font-mono text-xs md:text-sm text-white/70 leading-relaxed">
          <div className="p-6 bg-surface border border-borderDark flex items-start gap-4">
            <RefreshCw className="w-6 h-6 text-accentYellow shrink-0 mt-1" />
            <div>
              <h3 className="text-sm font-bold text-white uppercase mb-1">
                7-DAY HASSLE-FREE REPLACEMENT
              </h3>
              <p className="text-xs text-white/60">
                Wrong size? Damaged in transit? We offer hassle-free size replacement and returns within 7 calendar days from the date of delivery.
              </p>
            </div>
          </div>

          <section>
            <h2 className="text-base font-bold text-white uppercase mb-2">ELIGIBILITY CRITERIA</h2>
            <ul className="space-y-2 list-disc pl-5">
              <li>Item must be unused, unwashed, and in the exact condition received.</li>
              <li>Original tags, polybags, and stickers must be intact.</li>
              <li>Talisman bobble heads and keychains are eligible for return only if defective on arrival.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-bold text-white uppercase mb-2">HOW TO INITIATE AN EXCHANGE</h2>
            <p className="mb-3">
              1. Drop an email to <span className="text-accentYellow">support@samayraina.co</span> with your Order ID (#IGL-xxxx) and images of the tags/garment.
            </p>
            <p className="mb-3">
              2. Our logistics partner will schedule a reverse pickup from your doorstep within 48 hours.
            </p>
            <p>
              3. Once verified at our warehouse, your fresh size or full store credit will be dispatched immediately.
            </p>
          </section>

          <section>
            <h2 className="text-base font-bold text-white uppercase mb-2">REFUND TIMELINE</h2>
            <p>
              Prepaid orders paid via UPI, Net Banking, or Credit/Debit Card will be refunded directly to the original payment source within 5 to 7 business days following inspection.
            </p>
          </section>
        </div>
      </div>

      <Footer />
    </div>
  );
}
