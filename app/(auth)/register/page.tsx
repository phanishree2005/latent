'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { ArrowLeft, Loader2, CheckCircle2 } from 'lucide-react';
import Footer from '@/components/Footer';

export default function RegisterPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [registered, setRegistered] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);

    try {
      const supabase = createClient();
      const { data, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
        },
      });

      if (authError) {
        throw authError;
      }

      setRegistered(true);
      setTimeout(() => {
        router.push('/account');
        router.refresh();
      }, 1500);
    } catch (err: any) {
      setError(err.message || 'Registration failed. Please try again.');
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
              JOIN THE CULT
            </span>
            <h1 className="font-anton text-3xl uppercase tracking-wider text-[#dfb86c]">
              CREATE ACCOUNT
            </h1>
            <p className="text-xs font-mono text-white/50 mt-1">
              Instant access to order tracking &amp; exclusive member drops.
            </p>
          </div>

          {registered ? (
            <div className="py-8 text-center font-mono">
              <CheckCircle2 className="w-12 h-12 text-green-400 mx-auto mb-3" />
              <h3 className="text-base font-bold text-white uppercase mb-1">ACCOUNT CREATED</h3>
              <p className="text-xs text-white/60">Redirecting to your customer dashboard...</p>
            </div>
          ) : (
            <>
              {error && (
                <div className="mb-4 p-3 bg-crimson/20 border border-crimson text-crimson text-xs font-mono">
                  {error}
                </div>
              )}

              <form onSubmit={handleRegister} className="space-y-4 font-mono text-xs">
                <div>
                  <label className="block text-white/60 uppercase mb-1">Full Name</label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. Samay Raina"
                    className="w-full px-3.5 py-2.5 bg-black/60 border border-borderDark text-white outline-none focus:border-[#dfb86c]"
                  />
                </div>

                <div>
                  <label className="block text-white/60 uppercase mb-1">Email Address</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="samay@habitat.in"
                    className="w-full px-3.5 py-2.5 bg-black/60 border border-borderDark text-white outline-none focus:border-[#dfb86c]"
                  />
                </div>

                <div>
                  <label className="block text-white/60 uppercase mb-1">Password</label>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Minimum 6 characters"
                    className="w-full px-3.5 py-2.5 bg-black/60 border border-borderDark text-white outline-none focus:border-[#dfb86c]"
                  />
                </div>

                <div>
                  <label className="block text-white/60 uppercase mb-1">Confirm Password</label>
                  <input
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
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
                      <span>REGISTERING...</span>
                    </>
                  ) : (
                    <span>CREATE ACCOUNT</span>
                  )}
                </button>
              </form>

              <div className="mt-6 pt-6 border-t border-borderDark text-center font-mono text-xs text-white/50">
                Already registered?{' '}
                <Link href="/login" className="text-[#dfb86c] font-bold hover:underline">
                  Login here
                </Link>
              </div>
            </>
          )}
        </div>
      </div>

      <Footer />
    </div>
  );
}
