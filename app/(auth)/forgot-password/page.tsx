'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { ArrowLeft, Loader2, CheckCircle2 } from 'lucide-react';
import Footer from '@/components/Footer';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const supabase = createClient();
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (resetError) throw resetError;
      setSent(true);
    } catch (err: any) {
      setError(err.message || 'Failed to send reset link.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full min-h-screen flex flex-col bg-[#05070b] text-white">
      <div className="max-w-md mx-auto w-full px-4 py-16 flex-1 flex flex-col justify-center">
        <Link
          href="/login"
          className="inline-flex items-center gap-2 text-xs font-mono text-white/50 hover:text-white transition-colors mb-6"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>BACK TO LOGIN</span>
        </Link>

        <div className="bg-surface border border-borderDark p-8 shadow-2xl">
          <div className="text-center mb-6">
            <span className="text-xs font-mono font-bold tracking-widest text-crimson uppercase block mb-1">
              RECOVERY
            </span>
            <h1 className="font-anton text-3xl uppercase tracking-wider text-[#dfb86c]">
              FORGOT PASSWORD
            </h1>
            <p className="text-xs font-mono text-white/50 mt-1">
              Enter your email and we&apos;ll dispatch a password recovery link.
            </p>
          </div>

          {sent ? (
            <div className="py-6 text-center font-mono">
              <CheckCircle2 className="w-10 h-10 text-green-400 mx-auto mb-3" />
              <h3 className="text-sm font-bold text-white uppercase mb-1">DISPATCHED</h3>
              <p className="text-xs text-white/60 mb-6">
                Check your inbox for the password reset instructions.
              </p>
              <Link
                href="/login"
                className="inline-block px-6 py-2.5 bg-[#dfb86c] text-black font-anton uppercase text-sm tracking-wider"
              >
                RETURN TO LOGIN
              </Link>
            </div>
          ) : (
            <form onSubmit={handleReset} className="space-y-4 font-mono text-xs">
              {error && (
                <div className="p-3 bg-crimson/20 border border-crimson text-crimson text-xs">
                  {error}
                </div>
              )}

              <div>
                <label className="block text-white/60 uppercase mb-1">Your Email</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="samay@habitat.in"
                  className="w-full px-3.5 py-2.5 bg-black/60 border border-borderDark text-white outline-none focus:border-[#dfb86c]"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 bg-[#dfb86c] hover:bg-[#f0cf85] text-black font-anton text-base tracking-wider uppercase flex items-center justify-center gap-2 transition-all mt-4"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <span>SEND RESET LINK</span>}
              </button>
            </form>
          )}
        </div>
      </div>

      <Footer />
    </div>
  );
}
