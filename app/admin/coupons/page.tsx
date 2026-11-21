'use client';

import React, { useState } from 'react';
import { Tag, Plus, Check, Trash2 } from 'lucide-react';

export default function AdminCouponsPage() {
  const [coupons, setCoupons] = useState([
    { id: '1', code: 'LATENT10', discount_type: 'percentage', discount_value: 10, times_used: 148, is_active: true },
    { id: '2', code: 'RHINO20', discount_type: 'percentage', discount_value: 20, times_used: 94, is_active: true },
    { id: '3', code: 'SUPREMELEADER', discount_type: 'percentage', discount_value: 15, times_used: 61, is_active: true },
  ]);

  const [newCode, setNewCode] = useState('');
  const [newDiscount, setNewDiscount] = useState(10);

  const handleAddCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCode) return;
    setCoupons((prev) => [
      ...prev,
      {
        id: String(Date.now()),
        code: newCode.trim().toUpperCase(),
        discount_type: 'percentage',
        discount_value: newDiscount,
        times_used: 0,
        is_active: true,
      },
    ]);
    setNewCode('');
    alert(`Created coupon ${newCode.toUpperCase()} (${newDiscount}% off)`);
  };

  const toggleStatus = (id: string) => {
    setCoupons((prev) =>
      prev.map((c) => (c.id === id ? { ...c, is_active: !c.is_active } : c))
    );
  };

  return (
    <div className="space-y-6 font-mono text-xs">
      <div className="border-b border-borderDark pb-6">
        <span className="text-xs text-crimson font-bold uppercase tracking-widest block mb-1">
          DISCOUNT ENGINE
        </span>
        <h1 className="font-anton text-3xl sm:text-4xl uppercase tracking-wider text-[#dfb86c]">
          COUPON MANAGEMENT ({coupons.length})
        </h1>
      </div>

      {/* Create Coupon Form */}
      <div className="bg-surface border border-borderDark p-5">
        <h3 className="font-anton text-base uppercase text-[#dfb86c] mb-3">
          CREATE PROMO CODE
        </h3>
        <form onSubmit={handleAddCoupon} className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            required
            placeholder="COUPON CODE (e.g. FLASH30)"
            value={newCode}
            onChange={(e) => setNewCode(e.target.value)}
            className="flex-1 bg-black border border-borderDark px-3 py-2 text-white uppercase outline-none focus:border-[#dfb86c]"
          />
          <div className="flex items-center gap-2">
            <span className="text-white/50">DISCOUNT %:</span>
            <input
              type="number"
              min={1}
              max={90}
              value={newDiscount}
              onChange={(e) => setNewDiscount(Number(e.target.value))}
              className="w-20 bg-black border border-borderDark px-3 py-2 text-white outline-none"
            />
          </div>
          <button
            type="submit"
            className="px-5 py-2 bg-[#dfb86c] text-black font-anton uppercase tracking-wider text-xs"
          >
            CREATE COUPON
          </button>
        </form>
      </div>

      {/* Coupons Table */}
      <div className="bg-surface border border-borderDark overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-black/50 border-b border-borderDark text-white/50 uppercase text-[10px]">
            <tr>
              <th className="p-3.5">Coupon Code</th>
              <th className="p-3.5">Type &amp; Value</th>
              <th className="p-3.5">Redemptions</th>
              <th className="p-3.5">Status</th>
              <th className="p-3.5 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-borderDark/40">
            {coupons.map((c) => (
              <tr key={c.id} className="hover:bg-white/5">
                <td className="p-3.5 font-bold text-[#dfb86c]">{c.code}</td>
                <td className="p-3.5 text-white/80">{c.discount_value}% OFF</td>
                <td className="p-3.5 text-white/50">{c.times_used} uses</td>
                <td className="p-3.5">
                  <span
                    className={`px-2 py-0.5 text-[10px] font-bold uppercase ${
                      c.is_active
                        ? 'bg-green-500/20 text-green-400 border border-green-500/40'
                        : 'bg-red-500/20 text-red-400 border border-red-500/40'
                    }`}
                  >
                    {c.is_active ? 'ACTIVE' : 'DISABLED'}
                  </span>
                </td>
                <td className="p-3.5 text-right">
                  <button
                    onClick={() => toggleStatus(c.id)}
                    className="px-2.5 py-1 bg-white/10 hover:bg-white/20 text-white uppercase text-[10px]"
                  >
                    {c.is_active ? 'Disable' : 'Enable'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
