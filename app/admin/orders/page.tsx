'use client';

import React, { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Search, Filter, Truck, Check, Edit, Loader2 } from 'lucide-react';

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);
  const [trackingNumber, setTrackingNumber] = useState('');
  const [carrier, setCarrier] = useState('Bluedart');
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const supabase = createClient();
        const { data } = await supabase
          .from('orders')
          .select('*, order_items(*)')
          .order('created_at', { ascending: false });

        if (data && data.length > 0) {
          setOrders(data);
        } else {
          // Default mock orders
          setOrders([
            {
              id: '1',
              order_number: 'IGL-894211',
              customer_name: 'Balraj Ghai',
              customer_email: 'balraj@habitat.in',
              customer_phone: '9820011223',
              subtotal: 1998,
              total_amount: 1998,
              status: 'paid',
              created_at: new Date().toISOString(),
              shipping_address: {
                address_line1: 'The Habitat, Khar West',
                city: 'Mumbai',
                state: 'Maharashtra',
                postal_code: '400052',
              },
              order_items: [
                { id: 'item-1', product_name: 'Nazar Naa Lage Tee', size: 'L', quantity: 2, total_price: 1998 },
              ],
            },
            {
              id: '2',
              order_number: 'IGL-774102',
              customer_name: 'Sakshi Jha',
              customer_email: 'sakshi@gmail.com',
              customer_phone: '9819998877',
              subtotal: 699,
              total_amount: 699,
              status: 'processing',
              created_at: new Date(Date.now() - 3600000).toISOString(),
              shipping_address: {
                address_line1: 'Flat 402, Sunset Heights',
                city: 'Delhi',
                state: 'Delhi',
                postal_code: '110001',
              },
              order_items: [
                { id: 'item-2', product_name: 'I Hate Mens Tote Bag', size: 'ONE SIZE', quantity: 1, total_price: 699 },
              ],
            },
          ]);
        }
      } catch (e) {
        console.warn('Orders fetch error:', e);
      }
    };

    fetchOrders();
  }, []);

  const handleUpdateStatus = async (orderId: string, newStatus: string) => {
    setUpdating(true);
    try {
      const supabase = createClient();
      await supabase
        .from('orders')
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq('id', orderId);

      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o))
      );
      if (selectedOrder?.id === orderId) {
        setSelectedOrder((prev: any) => ({ ...prev, status: newStatus }));
      }
    } catch (e) {
      console.warn('Status update note:', e);
    } finally {
      setUpdating(false);
    }
  };

  const handleSaveTracking = async (orderId: string) => {
    setUpdating(true);
    try {
      const supabase = createClient();
      await supabase
        .from('orders')
        .update({
          tracking_carrier: carrier,
          tracking_number: trackingNumber,
          status: 'shipped',
          updated_at: new Date().toISOString(),
        })
        .eq('id', orderId);

      setOrders((prev) =>
        prev.map((o) =>
          o.id === orderId
            ? { ...o, tracking_carrier: carrier, tracking_number: trackingNumber, status: 'shipped' }
            : o
        )
      );
      alert('Tracking details assigned and status updated to SHIPPED.');
    } catch (e) {
      console.warn('Tracking update note:', e);
    } finally {
      setUpdating(false);
    }
  };

  const filteredOrders = orders.filter((o) => {
    const matchSearch =
      o.order_number.toLowerCase().includes(search.toLowerCase()) ||
      o.customer_name.toLowerCase().includes(search.toLowerCase()) ||
      o.customer_email.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'all' || o.status === statusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b border-borderDark pb-6">
        <span className="text-xs text-crimson font-bold uppercase tracking-widest block mb-1">
          FULFILLMENT &amp; LOGISTICS
        </span>
        <h1 className="font-anton text-3xl sm:text-4xl uppercase tracking-wider text-[#dfb86c]">
          ORDER MANAGEMENT ({orders.length})
        </h1>
      </div>

      {/* Filters Toolbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-surface p-4 border border-borderDark">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
          <input
            type="text"
            placeholder="Search by order #, customer name, email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-black/60 border border-borderDark text-xs text-white outline-none focus:border-[#dfb86c]"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-white/40" />
          <span className="text-xs text-white/50 uppercase">Filter Status:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-black/60 border border-borderDark text-xs text-white px-3 py-2 outline-none"
          >
            <option value="all">ALL STATUSES</option>
            <option value="pending">PENDING</option>
            <option value="paid">PAID</option>
            <option value="processing">PROCESSING</option>
            <option value="shipped">SHIPPED</option>
            <option value="delivered">DELIVERED</option>
          </select>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-surface border border-borderDark overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="border-b border-borderDark bg-black/40 text-white/50 uppercase text-[10px]">
            <tr>
              <th className="p-3.5">Order Number</th>
              <th className="p-3.5">Customer</th>
              <th className="p-3.5">Date</th>
              <th className="p-3.5">Amount</th>
              <th className="p-3.5">Status</th>
              <th className="p-3.5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-borderDark/40 font-mono">
            {filteredOrders.map((order) => (
              <tr key={order.id} className="hover:bg-white/5">
                <td className="p-3.5 font-bold text-[#dfb86c]">{order.order_number}</td>
                <td className="p-3.5">
                  <p className="font-bold text-white">{order.customer_name}</p>
                  <p className="text-[10px] text-white/40">{order.customer_email}</p>
                </td>
                <td className="p-3.5 text-white/60">
                  {new Date(order.created_at).toLocaleDateString()}
                </td>
                <td className="p-3.5 font-bold text-white">₹{order.total_amount}</td>
                <td className="p-3.5">
                  <select
                    value={order.status}
                    onChange={(e) => handleUpdateStatus(order.id, e.target.value)}
                    className="bg-black border border-borderDark text-[11px] px-2 py-1 uppercase text-[#dfb86c] outline-none"
                  >
                    <option value="pending">pending</option>
                    <option value="paid">paid</option>
                    <option value="processing">processing</option>
                    <option value="shipped">shipped</option>
                    <option value="delivered">delivered</option>
                    <option value="cancelled">cancelled</option>
                  </select>
                </td>
                <td className="p-3.5 text-right">
                  <button
                    onClick={() => setSelectedOrder(order)}
                    className="px-3 py-1 bg-white/10 hover:bg-[#dfb86c] hover:text-black transition-colors font-bold uppercase text-[10px]"
                  >
                    Details &amp; Tracking
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Selected Order Drawer / Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#0e1014] border border-borderDark max-w-lg w-full p-6 text-xs font-mono space-y-4 shadow-2xl">
            <div className="flex justify-between items-center border-b border-borderDark pb-3">
              <h3 className="font-anton text-base uppercase text-[#dfb86c]">
                ORDER #{selectedOrder.order_number}
              </h3>
              <button
                onClick={() => setSelectedOrder(null)}
                className="text-white/50 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2">
              <p className="text-white/40 uppercase text-[10px]">Customer &amp; Shipping</p>
              <p className="font-bold text-white">{selectedOrder.customer_name} ({selectedOrder.customer_phone})</p>
              <p className="text-white/70">
                {selectedOrder.shipping_address?.address_line1}, {selectedOrder.shipping_address?.city},{' '}
                {selectedOrder.shipping_address?.state} - {selectedOrder.shipping_address?.postal_code}
              </p>
            </div>

            {/* Tracking Input */}
            <div className="p-4 bg-surface border border-borderDark space-y-3">
              <div className="flex items-center gap-2 text-accentYellow font-bold uppercase">
                <Truck className="w-4 h-4" />
                <span>Assign Logistics Tracking (AWB)</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] text-white/50 uppercase mb-1">Carrier</label>
                  <select
                    value={carrier}
                    onChange={(e) => setCarrier(e.target.value)}
                    className="w-full bg-black border border-borderDark p-2 text-white outline-none"
                  >
                    <option value="Bluedart">Bluedart Express</option>
                    <option value="Delhivery">Delhivery</option>
                    <option value="Shadowfax">Shadowfax</option>
                    <option value="Shiprocket">Shiprocket</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] text-white/50 uppercase mb-1">Tracking Number</label>
                  <input
                    type="text"
                    placeholder="e.g. BD9842104"
                    value={trackingNumber}
                    onChange={(e) => setTrackingNumber(e.target.value)}
                    className="w-full bg-black border border-borderDark p-2 text-white outline-none"
                  />
                </div>
              </div>
              <button
                onClick={() => handleSaveTracking(selectedOrder.id)}
                disabled={updating}
                className="w-full py-2 bg-[#dfb86c] text-black font-anton uppercase text-xs tracking-wider"
              >
                {updating ? 'SAVING...' : 'DISPATCH & UPDATE TO SHIPPED'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
