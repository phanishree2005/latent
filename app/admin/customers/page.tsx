'use client';

import React, { useState } from 'react';
import { Users, Mail, Phone, Calendar } from 'lucide-react';

export default function AdminCustomersPage() {
  const [customers] = useState([
    {
      id: '1',
      name: 'Balraj Ghai',
      email: 'balraj@habitat.in',
      phone: '+91 9820011223',
      totalOrders: 4,
      totalSpent: 4796,
      joined: '12 Nov 2026',
    },
    {
      id: '2',
      name: 'Sakshi Jha',
      email: 'sakshi@gmail.com',
      phone: '+91 9819998877',
      totalOrders: 2,
      totalSpent: 1398,
      joined: '14 Nov 2026',
    },
    {
      id: '3',
      name: 'Sarthak Mudgal',
      email: 'sarthak@beatbox.in',
      phone: '+91 9810055443',
      totalOrders: 3,
      totalSpent: 2997,
      joined: '15 Nov 2026',
    },
    {
      id: '4',
      name: 'Sharon Verma',
      email: 'sharon@latent.in',
      phone: '+91 9900012345',
      totalOrders: 6,
      totalSpent: 6294,
      joined: '08 Nov 2026',
    },
  ]);

  return (
    <div className="space-y-6 font-mono text-xs">
      <div className="border-b border-borderDark pb-6">
        <span className="text-xs text-crimson font-bold uppercase tracking-widest block mb-1">
          USER DATABASE
        </span>
        <h1 className="font-anton text-3xl sm:text-4xl uppercase tracking-wider text-[#dfb86c]">
          REGISTERED CUSTOMERS ({customers.length})
        </h1>
      </div>

      <div className="bg-surface border border-borderDark overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-black/50 border-b border-borderDark text-white/50 uppercase text-[10px]">
            <tr>
              <th className="p-3.5">Customer Name</th>
              <th className="p-3.5">Contact Details</th>
              <th className="p-3.5">Total Orders</th>
              <th className="p-3.5">Lifetime Value (LTV)</th>
              <th className="p-3.5">Member Since</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-borderDark/40">
            {customers.map((c) => (
              <tr key={c.id} className="hover:bg-white/5">
                <td className="p-3.5 font-bold text-white">{c.name}</td>
                <td className="p-3.5">
                  <p className="text-white/80">{c.email}</p>
                  <p className="text-[10px] text-white/40">{c.phone}</p>
                </td>
                <td className="p-3.5 text-white/70">{c.totalOrders} drops</td>
                <td className="p-3.5 font-bold text-[#dfb86c]">₹{c.totalSpent.toLocaleString()}</td>
                <td className="p-3.5 text-white/50">{c.joined}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
