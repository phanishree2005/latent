import React from 'react';
import Link from 'next/link';
import { LayoutDashboard, ShoppingBag, ShoppingCart, Users, Tag, ArrowLeft, ShieldAlert } from 'lucide-react';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#07080a] text-white flex flex-col md:flex-row font-mono">
      {/* Sidebar */}
      <aside className="w-full md:w-64 bg-[#0d0f13] border-b md:border-b-0 md:border-r border-borderDark flex flex-col justify-between shrink-0">
        <div>
          {/* Brand header */}
          <div className="p-6 border-b border-borderDark flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 text-crimson text-xs font-bold uppercase tracking-widest mb-1">
                <ShieldAlert className="w-4 h-4" />
                <span>SUPERADMIN</span>
              </div>
              <h1 className="font-anton text-xl tracking-wider text-[#dfb86c]">
                LATENT CONSOLE
              </h1>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="p-4 space-y-1.5 text-xs">
            <Link
              href="/admin"
              className="flex items-center gap-3 px-3 py-2.5 rounded hover:bg-white/10 text-white/80 hover:text-white transition-colors"
            >
              <LayoutDashboard className="w-4 h-4 text-[#dfb86c]" />
              <span>OVERVIEW</span>
            </Link>

            <Link
              href="/admin/orders"
              className="flex items-center gap-3 px-3 py-2.5 rounded hover:bg-white/10 text-white/80 hover:text-white transition-colors"
            >
              <ShoppingCart className="w-4 h-4 text-[#dfb86c]" />
              <span>ORDERS</span>
            </Link>

            <Link
              href="/admin/products"
              className="flex items-center gap-3 px-3 py-2.5 rounded hover:bg-white/10 text-white/80 hover:text-white transition-colors"
            >
              <ShoppingBag className="w-4 h-4 text-[#dfb86c]" />
              <span>PRODUCTS &amp; STOCK</span>
            </Link>

            <Link
              href="/admin/coupons"
              className="flex items-center gap-3 px-3 py-2.5 rounded hover:bg-white/10 text-white/80 hover:text-white transition-colors"
            >
              <Tag className="w-4 h-4 text-[#dfb86c]" />
              <span>COUPONS</span>
            </Link>

            <Link
              href="/admin/customers"
              className="flex items-center gap-3 px-3 py-2.5 rounded hover:bg-white/10 text-white/80 hover:text-white transition-colors"
            >
              <Users className="w-4 h-4 text-[#dfb86c]" />
              <span>CUSTOMERS</span>
            </Link>
          </nav>
        </div>

        {/* Footer Back Button */}
        <div className="p-4 border-t border-borderDark">
          <Link
            href="/"
            className="flex items-center gap-2 px-3 py-2 text-xs text-white/50 hover:text-[#dfb86c] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>RETURN TO STOREFRONT</span>
          </Link>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 p-6 md:p-10 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
