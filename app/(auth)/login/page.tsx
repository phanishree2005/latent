'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { ArrowLeft, Loader2, ShieldCheck } from 'lucide-react';
import Footer from '@/components/Footer';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const supabase = createClient();
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) {
        throw authError;
      }

      router.push('/account');
      router.refresh();
    } catch (err: any) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full min-h-screen flex flex-col bg-[#05070b] text-white">
      <div className="max-w-md mx-auto w-full px-4 py-16 flex-1 flex flex-col justify-center">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-xs font-mono text-white/50 hover:text-white transition-colors mb-6"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>BACK TO HOME</span>
        </Link>

        <div className="bg-surface border border-borderDark p-8 shadow-2xl">
          <div className="text-center mb-6">
            <span className="text-xs font-mono font-bold tracking-widest text-crimson uppercase block mb-1">
              CUSTOMER PORTAL
            </span>
            <h1 className="font-anton text-3xl uppercase tracking-wider text-[#dfb86c]">
              ACCOUNT LOGIN
            </h1>
            <p className="text-xs font-mono text-white/50 mt-1">
              Track orders, manage addresses &amp; access early drops.
            </p>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-crimson/20 border border-crimson text-crimson text-xs font-mono">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4 font-mono text-xs">
            <div>
              <label className="block text-white/60 uppercase mb-1">Email Address</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your.email@example.com"
                className="w-full px-3.5 py-2.5 bg-black/60 border border-borderDark text-white outline-none focus:border-[#dfb86c]"
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-white/60 uppercase">Password</label>
                <Link
                  href="/forgot-password"
                  className="text-[10px] text-[#dfb86c] hover:underline"
                >
                  Forgot Password?
                </Link>
              </div>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3.5 py-2.5 bg-black/60 border border-borderDark text-white outline-none focus:border-[#dfb86c]"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-[#dfb86c] hover:bg-[#f0cf85] disabled:bg-gray-700 text-black font-anton text-base tracking-wider uppercase flex items-center justify-center gap-2 transition-all mt-4"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>SIGNING IN...</span>
                </>
              ) : (
                <span>LOGIN TO ACCOUNT</span>
              )}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-borderDark text-center font-mono text-xs text-white/50">
            Don&apos;t have an account yet?{' '}
            <Link href="/register" className="text-[#dfb86c] font-bold hover:underline">
              Register here
            </Link>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
