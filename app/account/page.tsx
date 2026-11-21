'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Package, User, MapPin, LogOut, ShieldAlert, ArrowRight, Loader2 } from 'lucide-react';
import Footer from '@/components/Footer';

export default function AccountPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [isAdminUser, setIsAdminUser] = useState(false);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'orders' | 'profile' | 'addresses'>('orders');

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const supabase = createClient();
        const { data: { user: currentUser }, error } = await supabase.auth.getUser();

        if (error || !currentUser) {
          // Fallback demo user if Supabase is still connecting
          setUser({
            id: 'guest-user',
            email: 'fan@samayraina.co',
            user_metadata: { full_name: 'Latent Cult Member' },
          });
          setLoading(false);
          return;
        }

        setUser(currentUser);

        // Check if admin
        const { data: roleData } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', currentUser.id)
          .single();

        if (roleData?.role === 'admin') {
          setIsAdminUser(true);
        }

        // Fetch user orders
        const { data: userOrders } = await supabase
          .from('orders')
          .select('*, order_items(*)')
          .or(`user_id.eq.${currentUser.id},customer_email.eq.${currentUser.email}`)
          .order('created_at', { ascending: false });

        if (userOrders) {
          setOrders(userOrders);
        }
      } catch (err) {
        console.warn('Account load notice:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [router]);

  const handleLogout = async () => {
    try {
      const supabase = createClient();
      await supabase.auth.signOut();
      router.push('/login');
      router.refresh();
    } catch (err) {
      router.push('/');
    }
  };

  if (loading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center bg-[#05070b] text-[#dfb86c] font-mono">
        <Loader2 className="w-8 h-8 animate-spin mr-3" />
        <span>LOADING YOUR ACCOUNT...</span>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen flex flex-col bg-[#05070b] text-white">
      {/* Account Header */}
      <div className="border-b border-borderDark bg-surface px-4 md:px-8 py-8">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 font-mono text-xs text-crimson font-bold uppercase tracking-widest mb-1">
              <span>CUSTOMER PORTAL</span>
              {isAdminUser && (
                <span className="px-2 py-0.5 bg-crimson text-white text-[10px] font-bold">
                  ADMIN
                </span>
              )}
            </div>
            <h1 className="font-anton text-3xl sm:text-4xl uppercase tracking-wider text-[#dfb86c]">
              {user?.user_metadata?.full_name || 'MY ACCOUNT'}
            </h1>
            <p className="font-mono text-xs text-white/50">{user?.email}</p>
          </div>

          <div className="flex items-center gap-3">
            {isAdminUser && (
              <Link
                href="/admin"
                className="px-4 py-2 bg-crimson hover:bg-bloodRed text-white font-mono text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-colors"
              >
                <ShieldAlert className="w-4 h-4" />
                <span>ADMIN DASHBOARD</span>
              </Link>
            )}

            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-surface hover:bg-white/10 border border-borderDark text-white/70 hover:text-white font-mono text-xs uppercase tracking-wider flex items-center gap-1.5 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span>LOGOUT</span>
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="max-w-6xl mx-auto w-full px-4 md:px-8 py-8 flex-1">
        <div className="flex gap-4 border-b border-borderDark pb-4 mb-8 font-mono text-xs">
          <button
            onClick={() => setActiveTab('orders')}
            className={`px-4 py-2 uppercase font-bold tracking-wider transition-colors border ${
              activeTab === 'orders'
                ? 'bg-[#dfb86c] text-black border-[#dfb86c]'
                : 'bg-surface text-white/60 border-borderDark hover:text-white'
            }`}
          >
            ORDER HISTORY ({orders.length})
          </button>
          <button
            onClick={() => setActiveTab('addresses')}
            className={`px-4 py-2 uppercase font-bold tracking-wider transition-colors border ${
              activeTab === 'addresses'
                ? 'bg-[#dfb86c] text-black border-[#dfb86c]'
                : 'bg-surface text-white/60 border-borderDark hover:text-white'
            }`}
          >
            SAVED ADDRESSES
          </button>
          <button
            onClick={() => setActiveTab('profile')}
            className={`px-4 py-2 uppercase font-bold tracking-wider transition-colors border ${
              activeTab === 'profile'
                ? 'bg-[#dfb86c] text-black border-[#dfb86c]'
                : 'bg-surface text-white/60 border-borderDark hover:text-white'
            }`}
          >
            PROFILE
          </button>
        </div>

        {/* Tab 1: Orders */}
        {activeTab === 'orders' && (
          <div>
            {orders.length === 0 ? (
              <div className="py-16 text-center border border-dashed border-borderDark font-mono">
                <Package className="w-12 h-12 mx-auto mb-3 text-white/30" />
                <h3 className="text-base font-bold text-white uppercase mb-1">NO ORDERS YET</h3>
                <p className="text-xs text-white/50 mb-6">
                  You haven&apos;t copped any merchandise from India&apos;s Got Latent yet.
                </p>
                <Link
                  href="/products"
                  className="px-6 py-3 bg-[#dfb86c] hover:bg-[#f0cf85] text-black font-anton uppercase text-sm tracking-wider"
                >
                  BROWSE ALL DROPS
                </Link>
              </div>
            ) : (
              <div className="space-y-6">
                {orders.map((order) => (
                  <div
                    key={order.id}
                    className="bg-surface border border-borderDark p-6 font-mono text-xs"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-borderDark gap-2">
                      <div>
                        <span className="text-white/40 block text-[10px]">ORDER NUMBER</span>
                        <span className="text-sm font-bold text-[#dfb86c]">{order.order_number}</span>
                      </div>
                      <div>
                        <span className="text-white/40 block text-[10px]">DATE PLACED</span>
                        <span>{new Date(order.created_at).toLocaleDateString()}</span>
                      </div>
                      <div>
                        <span className="text-white/40 block text-[10px]">TOTAL AMOUNT</span>
                        <span className="font-bold text-white text-sm">₹{order.total_amount}</span>
                      </div>
                      <div>
                        <span className="text-white/40 block text-[10px]">STATUS</span>
                        <span
                          className={`px-2.5 py-1 text-[10px] font-bold uppercase inline-block ${
                            order.status === 'paid'
                              ? 'bg-green-500/20 text-green-400 border border-green-500/40'
                              : order.status === 'shipped'
                              ? 'bg-blue-500/20 text-blue-400 border border-blue-500/40'
                              : 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/40'
                          }`}
                        >
                          {order.status}
                        </span>
                      </div>
                    </div>

                    {/* Items */}
                    <div className="py-4 space-y-3">
                      {(order.order_items || []).map((item: any) => (
                        <div key={item.id} className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <img
                              src={item.product_image || '/images/logo.svg'}
                              alt=""
                              className="w-12 h-14 object-cover bg-black border border-borderDark"
                            />
                            <div>
                              <p className="font-bold text-white">{item.product_name}</p>
                              <p className="text-[10px] text-white/50">Size: {item.size} • Qty: {item.quantity}</p>
                            </div>
                          </div>
                          <span className="font-bold text-white">₹{item.total_price}</span>
                        </div>
                      ))}
                    </div>

                    {order.tracking_number && (
                      <div className="pt-3 border-t border-borderDark/60 flex items-center justify-between text-[11px] text-[#dfb86c]">
                        <span>Carrier: {order.tracking_carrier || 'Bluedart'}</span>
                        <span>AWB / Tracking: #{order.tracking_number}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Addresses */}
        {activeTab === 'addresses' && (
          <div className="max-w-xl bg-surface border border-borderDark p-6 font-mono text-xs">
            <h3 className="font-anton text-base uppercase text-[#dfb86c] mb-4">
              SAVED SHIPPING ADDRESS
            </h3>
            <p className="text-white/60 mb-4">
              Your default shipping address is automatically prefilled during checkout.
            </p>
            <div className="p-4 bg-black/50 border border-borderDark space-y-1 text-white/80">
              <p className="font-bold text-white">{user?.user_metadata?.full_name || 'Customer'}</p>
              <p>Standard delivery across all pincodes in India</p>
              <p className="text-[10px] text-accentYellow mt-2">✓ Verified for fast 1-click checkout</p>
            </div>
          </div>
        )}

        {/* Tab 3: Profile */}
        {activeTab === 'profile' && (
          <div className="max-w-xl bg-surface border border-borderDark p-6 font-mono text-xs space-y-4">
            <h3 className="font-anton text-base uppercase text-[#dfb86c] mb-2">
              PROFILE DETAILS
            </h3>
            <div>
              <span className="text-white/40 block text-[10px] uppercase">Registered Email</span>
              <span className="text-sm font-bold text-white">{user?.email}</span>
            </div>
            <div>
              <span className="text-white/40 block text-[10px] uppercase">Member Status</span>
              <span className="text-sm font-bold text-[#dfb86c]">Official Cult Member (Season 2)</span>
            </div>
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}
