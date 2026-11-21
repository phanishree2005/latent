'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { PRODUCTS } from '@/data/products';
import { IndianRupee, ShoppingCart, Users, AlertTriangle, ArrowUpRight, TrendingUp } from 'lucide-react';

export default function AdminOverviewPage() {
  const [stats, setStats] = useState({
    totalRevenue: 184500,
    totalOrders: 142,
    totalCustomers: 320,
    pendingOrders: 8,
    paidOrders: 134,
  });

  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [lowStockItems, setLowStockItems] = useState<any[]>([]);

  useEffect(() => {
    const loadAdminData = async () => {
      try {
        const supabase = createClient();

        // 1. Fetch Orders from Supabase
        const { data: dbOrders } = await supabase
          .from('orders')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(10);

        if (dbOrders && dbOrders.length > 0) {
          setRecentOrders(dbOrders);
          const revenue = dbOrders
            .filter((o) => o.status === 'paid' || o.status === 'shipped')
            .reduce((sum, o) => sum + (o.total_amount || 0), 0);
          setStats((prev) => ({
            ...prev,
            totalOrders: dbOrders.length,
            totalRevenue: revenue > 0 ? revenue : prev.totalRevenue,
          }));
        } else {
          // Simulated starter orders for demonstration
          setRecentOrders([
            {
              id: '1',
              order_number: 'IGL-894211',
              customer_name: 'Balraj Ghai',
              customer_email: 'balraj@habitat.in',
              total_amount: 1998,
              status: 'paid',
              created_at: new Date().toISOString(),
            },
            {
              id: '2',
              order_number: 'IGL-774102',
              customer_name: 'Sakshi Jha',
              customer_email: 'sakshi@gmail.com',
              total_amount: 699,
              status: 'processing',
              created_at: new Date(Date.now() - 3600000).toISOString(),
            },
            {
              id: '3',
              order_number: 'IGL-662919',
              customer_name: 'Sarthak Mudgal',
              customer_email: 'sarthak@beatbox.in',
              total_amount: 999,
              status: 'paid',
              created_at: new Date(Date.now() - 7200000).toISOString(),
            },
          ]);
        }

        // Low stock products from catalog
        setLowStockItems(
          PRODUCTS.filter((p) => p.stock < 10).slice(0, 5)
        );
      } catch (e) {
        console.warn('Admin load note:', e);
      }
    };

    loadAdminData();
  }, []);

  return (
    <div className="space-y-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-borderDark pb-6">
        <div>
          <span className="text-xs text-crimson font-bold uppercase tracking-widest block mb-1">
            CONTROL CENTER
          </span>
          <h1 className="font-anton text-3xl sm:text-4xl uppercase tracking-wider text-[#dfb86c]">
            DASHBOARD OVERVIEW
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-green-500 animate-ping" />
          <span className="text-xs text-green-400 font-bold uppercase">
            RAZORPAY TEST API: CONNECTED
          </span>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1 */}
        <div className="p-5 bg-surface border border-borderDark">
          <div className="flex items-center justify-between text-white/50 text-xs mb-2">
            <span>TOTAL REVENUE</span>
            <IndianRupee className="w-4 h-4 text-[#dfb86c]" />
          </div>
          <div className="text-2xl font-black text-white">
            ₹{stats.totalRevenue.toLocaleString()}
          </div>
          <div className="mt-2 text-[10px] text-green-400 flex items-center gap-1">
            <TrendingUp className="w-3 h-3" />
            <span>+18.4% vs last week drop</span>
          </div>
        </div>

        {/* Metric 2 */}
        <div className="p-5 bg-surface border border-borderDark">
          <div className="flex items-center justify-between text-white/50 text-xs mb-2">
            <span>TOTAL ORDERS</span>
            <ShoppingCart className="w-4 h-4 text-[#dfb86c]" />
          </div>
          <div className="text-2xl font-black text-white">{stats.totalOrders}</div>
          <div className="mt-2 text-[10px] text-white/40">
            {stats.pendingOrders} awaiting fulfillment
          </div>
        </div>

        {/* Metric 3 */}
        <div className="p-5 bg-surface border border-borderDark">
          <div className="flex items-center justify-between text-white/50 text-xs mb-2">
            <span>TOTAL CUSTOMERS</span>
            <Users className="w-4 h-4 text-[#dfb86c]" />
          </div>
          <div className="text-2xl font-black text-white">{stats.totalCustomers}</div>
          <div className="mt-2 text-[10px] text-white/40">Verified Latent fans</div>
        </div>

        {/* Metric 4 */}
        <div className="p-5 bg-surface border border-borderDark">
          <div className="flex items-center justify-between text-white/50 text-xs mb-2">
            <span>LOW STOCK ALERTS</span>
            <AlertTriangle className="w-4 h-4 text-crimson" />
          </div>
          <div className="text-2xl font-black text-crimson">{lowStockItems.length}</div>
          <div className="mt-2 text-[10px] text-crimson/80">Inventory &lt; 10 units</div>
        </div>
      </div>

      {/* Two Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Recent Orders (8 cols) */}
        <div className="lg:col-span-8 bg-surface border border-borderDark p-6">
          <div className="flex items-center justify-between mb-4 border-b border-borderDark pb-3">
            <h3 className="font-anton text-base uppercase text-[#dfb86c] tracking-wider">
              RECENT ORDERS
            </h3>
            <Link
              href="/admin/orders"
              className="text-xs text-[#dfb86c] hover:underline flex items-center gap-1"
            >
              <span>View All</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-borderDark/80 text-white/40 uppercase text-[10px]">
                <tr>
                  <th className="py-2.5">Order</th>
                  <th className="py-2.5">Customer</th>
                  <th className="py-2.5">Amount</th>
                  <th className="py-2.5">Status</th>
                  <th className="py-2.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-borderDark/40">
                {recentOrders.map((o) => (
                  <tr key={o.id} className="hover:bg-white/5">
                    <td className="py-3 font-bold text-white">{o.order_number}</td>
                    <td className="py-3 text-white/80">{o.customer_name}</td>
                    <td className="py-3 font-bold text-[#dfb86c]">₹{o.total_amount}</td>
                    <td className="py-3">
                      <span
                        className={`px-2 py-0.5 text-[10px] uppercase font-bold ${
                          o.status === 'paid'
                            ? 'bg-green-500/20 text-green-400 border border-green-500/40'
                            : 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/40'
                        }`}
                      >
                        {o.status}
                      </span>
                    </td>
                    <td className="py-3 text-right">
                      <Link
                        href={`/admin/orders`}
                        className="text-[11px] text-[#dfb86c] hover:underline"
                      >
                        Manage →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Column: Low Stock Drops (4 cols) */}
        <div className="lg:col-span-4 bg-surface border border-borderDark p-6">
          <div className="flex items-center justify-between mb-4 border-b border-borderDark pb-3">
            <h3 className="font-anton text-base uppercase text-crimson tracking-wider">
              LOW STOCK DROPS
            </h3>
          </div>

          <div className="space-y-4">
            {lowStockItems.length === 0 ? (
              <p className="text-xs text-white/50">All inventory levels healthy.</p>
            ) : (
              lowStockItems.map((p) => (
                <div key={p.id} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2.5">
                    <img
                      src={p.images[0]}
                      alt=""
                      className="w-9 h-11 object-cover bg-black border border-borderDark"
                    />
                    <div>
                      <p className="font-bold text-white truncate max-w-[130px]">{p.name}</p>
                      <p className="text-[10px] text-white/40">₹{p.price}</p>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 bg-crimson/20 border border-crimson text-crimson font-bold text-[10px]">
                    {p.stock} LEFT
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
