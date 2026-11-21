'use client';

import React, { useState } from 'react';
import { PRODUCTS, Product } from '@/data/products';
import { Search, Plus, Edit2, AlertCircle } from 'lucide-react';

export default function AdminProductsPage() {
  const [productsList, setProductsList] = useState<Product[]>(PRODUCTS);
  const [search, setSearch] = useState('');
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [editPrice, setEditPrice] = useState<number>(0);
  const [editStock, setEditStock] = useState<number>(0);

  const handleEdit = (p: Product) => {
    setEditingProduct(p);
    setEditPrice(p.price);
    setEditStock(p.stock);
  };

  const handleSave = () => {
    if (!editingProduct) return;
    setProductsList((prev) =>
      prev.map((item) =>
        item.id === editingProduct.id
          ? { ...item, price: editPrice, stock: editStock }
          : item
      )
    );
    setEditingProduct(null);
    alert(`Updated ${editingProduct.name} (Price: ₹${editPrice}, Stock: ${editStock})`);
  };

  const filtered = productsList.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.category.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-borderDark pb-6">
        <div>
          <span className="text-xs text-crimson font-bold uppercase tracking-widest block mb-1">
            CATALOG INVENTORY
          </span>
          <h1 className="font-anton text-3xl sm:text-4xl uppercase tracking-wider text-[#dfb86c]">
            PRODUCT CATALOG &amp; STOCK ({productsList.length})
          </h1>
        </div>

        <button
          onClick={() => alert('New product drop generator: upload images to Supabase storage and specify handle.')}
          className="px-4 py-2.5 bg-[#dfb86c] text-black font-anton uppercase text-xs tracking-wider flex items-center gap-1.5"
        >
          <Plus className="w-4 h-4" />
          <span>ADD NEW DROP</span>
        </button>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
        <input
          type="text"
          placeholder="Search products by title, category..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-3 py-2 bg-surface border border-borderDark text-xs text-white outline-none focus:border-[#dfb86c]"
        />
      </div>

      {/* Products Table */}
      <div className="bg-surface border border-borderDark overflow-x-auto">
        <table className="w-full text-left text-xs font-mono">
          <thead className="bg-black/50 border-b border-borderDark text-white/50 uppercase text-[10px]">
            <tr>
              <th className="p-3.5">Product</th>
              <th className="p-3.5">Category</th>
              <th className="p-3.5">Price</th>
              <th className="p-3.5">Stock</th>
              <th className="p-3.5">Sizes</th>
              <th className="p-3.5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-borderDark/40">
            {filtered.map((product) => (
              <tr key={product.id} className="hover:bg-white/5">
                <td className="p-3.5">
                  <div className="flex items-center gap-3">
                    <img
                      src={product.images[0]}
                      alt=""
                      className="w-10 h-12 object-cover bg-black border border-borderDark shrink-0"
                    />
                    <div>
                      <p className="font-bold text-white line-clamp-1">{product.name}</p>
                      <p className="text-[10px] text-white/40">{product.handle}</p>
                    </div>
                  </div>
                </td>
                <td className="p-3.5 text-white/70 uppercase text-[11px]">{product.category}</td>
                <td className="p-3.5 font-bold text-[#dfb86c]">₹{product.price}</td>
                <td className="p-3.5">
                  <span
                    className={`px-2 py-0.5 text-[10px] font-bold ${
                      product.stock < 10
                        ? 'bg-crimson/20 text-crimson border border-crimson'
                        : 'text-white/80'
                    }`}
                  >
                    {product.stock} units
                  </span>
                </td>
                <td className="p-3.5 text-white/50 text-[10px]">{product.sizes.join(', ')}</td>
                <td className="p-3.5 text-right">
                  <button
                    onClick={() => handleEdit(product)}
                    className="px-2.5 py-1 bg-white/10 hover:bg-[#dfb86c] hover:text-black transition-colors font-bold uppercase text-[10px] flex items-center gap-1 ml-auto"
                  >
                    <Edit2 className="w-3 h-3" />
                    <span>Edit</span>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Quick Edit Modal */}
      {editingProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm font-mono text-xs">
          <div className="bg-[#0e1014] border border-borderDark max-w-md w-full p-6 space-y-4 shadow-2xl">
            <h3 className="font-anton text-base uppercase text-[#dfb86c]">
              EDIT DROP: {editingProduct.name}
            </h3>

            <div>
              <label className="block text-white/50 uppercase mb-1">Selling Price (₹)</label>
              <input
                type="number"
                value={editPrice}
                onChange={(e) => setEditPrice(Number(e.target.value))}
                className="w-full bg-black border border-borderDark p-2 text-white outline-none"
              />
            </div>

            <div>
              <label className="block text-white/50 uppercase mb-1">Available Inventory Stock</label>
              <input
                type="number"
                value={editStock}
                onChange={(e) => setEditStock(Number(e.target.value))}
                className="w-full bg-black border border-borderDark p-2 text-white outline-none"
              />
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={handleSave}
                className="flex-1 py-2.5 bg-[#dfb86c] text-black font-anton uppercase text-xs tracking-wider"
              >
                SAVE CHANGES
              </button>
              <button
                onClick={() => setEditingProduct(null)}
                className="px-4 py-2.5 bg-surface text-white/60 hover:text-white"
              >
                CANCEL
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
