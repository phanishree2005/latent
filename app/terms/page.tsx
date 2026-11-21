import React from 'react';
import Link from 'next/link';
import Footer from '@/components/Footer';
import { ArrowLeft } from 'lucide-react';

export const metadata = {
  title: "Terms & Conditions | India's Got Latent Official Merch",
};

export default function TermsPage() {
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
          LEGAL &amp; POLICIES
        </span>
        <h1 className="text-4xl sm:text-5xl font-black uppercase tracking-tight text-white mb-8 border-b border-borderDark pb-6">
          TERMS &amp; CONDITIONS
        </h1>

        <div className="space-y-8 font-mono text-xs md:text-sm text-white/70 leading-relaxed">
          <section>
            <h2 className="text-base font-bold text-white uppercase mb-2">1. OVERVIEW</h2>
            <p>
              This website is operated by India&apos;s Got Latent / Samay Raina Merch. Throughout the site, the terms &ldquo;we&rdquo;, &ldquo;us&rdquo; and &ldquo;our&rdquo; refer to India&apos;s Got Latent. By visiting our site and/or purchasing merch from us, you engage in our &ldquo;Service&rdquo; and agree to be bound by the following terms and conditions.
            </p>
          </section>

          <section>
            <h2 className="text-base font-bold text-white uppercase mb-2">2. MERCH DROPS &amp; PRICING</h2>
            <p>
              All prices are listed in Indian Rupees (INR) and are inclusive of standard GST. We reserve the right at any time to modify or discontinue drops without notice. Drops are strictly limited in batch sizes and once sold out, will not be restocked under the same edition tag.
            </p>
          </section>

          <section>
            <h2 className="text-base font-bold text-white uppercase mb-2">3. SHIPPING &amp; DELIVERY</h2>
            <p>
              Orders over ₹499 qualify for Free Standard Delivery across India. Standard dispatch begins within 48 to 72 hours from the drop start date (Season 2 Batch dispatches from December 15th). Tracking details will be shared via SMS and Email upon fulfillment.
            </p>
          </section>

          <section>
            <h2 className="text-base font-bold text-white uppercase mb-2">4. INTELLECTUAL PROPERTY</h2>
            <p>
              All designs, slogans, logos, graphic artwork, 3D assets, video installations, and audio motifs featured on this website are the proprietary property of India&apos;s Got Latent and protected by copyright law.
            </p>
          </section>

          <section>
            <h2 className="text-base font-bold text-white uppercase mb-2">5. GOVERNING LAW</h2>
            <p>
              These Terms of Service and any separate agreements whereby we provide you Services shall be governed by and construed in accordance with the laws of India, jurisdiction Mumbai/Delhi.
            </p>
          </section>
        </div>
      </div>

      <Footer />
    </div>
  );
}
