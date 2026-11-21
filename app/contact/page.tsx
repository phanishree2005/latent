'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Footer from '@/components/Footer';
import { ArrowLeft, Mail, MessageSquare, Send, CheckCircle2, Loader2 } from 'lucide-react';
import { useCart } from '@/context/CartContext';

export default function ContactPage() {
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [form, setForm] = useState({ name: '', email: '', orderId: '', message: '' });
  const { playSound } = useCart();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setLoading(true);

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to submit query');

      playSound('success');
      setSubmitted(true);
      setForm({ name: '', email: '', orderId: '', message: '' });
    } catch (err: any) {
      setErrorMessage(err.message || 'Error transmitting message');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full flex flex-col bg-[#05070b] text-white">
      <div className="max-w-4xl mx-auto w-full px-4 md:px-8 py-16">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-xs font-mono text-white/50 hover:text-white transition-colors mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>BACK TO HOME</span>
        </Link>

        <span className="text-crimson font-mono text-xs font-bold uppercase tracking-widest block mb-2">
          GET IN TOUCH
        </span>
        <h1 className="font-anton text-4xl sm:text-5xl uppercase tracking-wider text-[#dfb86c] mb-8 border-b border-borderDark pb-6">
          CONTACT US
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          {/* Contact Details */}
          <div className="space-y-6 font-mono text-xs md:text-sm text-white/70">
            <p className="leading-relaxed">
              Have a question regarding your order tracking, size advice, or want to collaborate with India&apos;s Got Latent? Send a message and our operations team will reply within 24 hours.
            </p>

            <div className="p-6 bg-surface border border-borderDark space-y-4">
              <div className="flex items-center gap-3">
                <Mail className="w-5 h-5 text-crimson shrink-0" />
                <div>
                  <span className="text-[10px] text-white/40 uppercase block">EMAIL SUPPORT</span>
                  <a href="mailto:support@samayraina.co" className="text-white hover:text-[#dfb86c] font-bold">
                    support@samayraina.co
                  </a>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <MessageSquare className="w-5 h-5 text-accentYellow shrink-0" />
                <div>
                  <span className="text-[10px] text-white/40 uppercase block">HOURS OF OPERATION</span>
                  <span className="text-white font-bold">Monday - Saturday (10 AM - 7 PM IST)</span>
                </div>
              </div>
            </div>

            <div className="text-xs text-white/40 leading-relaxed">
              * Note: For immediate order queries, please include your Order ID (#IGL-xxxx) in the subject line for faster routing.
            </div>
          </div>

          {/* Contact Form */}
          <div className="bg-surface border border-borderDark p-6 md:p-8">
            <h3 className="font-anton text-base uppercase text-[#dfb86c] mb-4">
              SEND US A MESSAGE
            </h3>

            {errorMessage && (
              <div className="mb-4 p-3 bg-crimson/20 border border-crimson text-crimson text-xs font-mono">
                {errorMessage}
              </div>
            )}

            {submitted ? (
              <div className="py-12 text-center font-mono">
                <CheckCircle2 className="w-12 h-12 text-green-400 mx-auto mb-3" />
                <h4 className="text-lg font-bold uppercase text-white mb-1">MESSAGE TRANSMITTED</h4>
                <p className="text-xs text-white/60 mb-6">
                  We have logged your query and will get back to you shortly.
                </p>
                <button
                  onClick={() => setSubmitted(false)}
                  className="px-6 py-2.5 bg-[#dfb86c] text-black font-anton uppercase text-xs"
                >
                  SEND ANOTHER
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4 font-mono text-xs">
                <div>
                  <label className="block text-white/60 uppercase mb-1">Your Name</label>
                  <input
                    type="text"
                    required
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="w-full px-3 py-2.5 bg-black/60 border border-borderDark text-white outline-none focus:border-[#dfb86c]"
                    placeholder="e.g. Balraj Ghai"
                  />
                </div>

                <div>
                  <label className="block text-white/60 uppercase mb-1">Your Email</label>
                  <input
                    type="email"
                    required
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className="w-full px-3 py-2.5 bg-black/60 border border-borderDark text-white outline-none focus:border-[#dfb86c]"
                    placeholder="balraj@habitat.in"
                  />
                </div>

                <div>
                  <label className="block text-white/60 uppercase mb-1">Order ID (Optional)</label>
                  <input
                    type="text"
                    value={form.orderId}
                    onChange={(e) => setForm({ ...form, orderId: e.target.value })}
                    className="w-full px-3 py-2.5 bg-black/60 border border-borderDark text-white outline-none focus:border-[#dfb86c]"
                    placeholder="#IGL-894211"
                  />
                </div>

                <div>
                  <label className="block text-white/60 uppercase mb-1">Message</label>
                  <textarea
                    rows={4}
                    required
                    value={form.message}
                    onChange={(e) => setForm({ ...form, message: e.target.value })}
                    className="w-full px-3 py-2.5 bg-black/60 border border-borderDark text-white outline-none focus:border-[#dfb86c] resize-none"
                    placeholder="How can we help?"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 bg-[#dfb86c] hover:bg-[#f0cf85] text-black font-anton text-sm tracking-wider uppercase flex items-center justify-center gap-2 transition-colors"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>TRANSMITTING...</span>
                    </>
                  ) : (
                    <>
                      <span>SEND TRANSMISSION</span>
                      <Send className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
