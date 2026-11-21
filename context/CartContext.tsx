'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { Product } from '@/data/products';

export interface CartItem {
  product: Product;
  size: string;
  quantity: number;
}

interface CartContextType {
  items: CartItem[];
  addToCart: (product: Product, size?: string, quantity?: number) => void;
  removeFromCart: (productId: string, size: string) => void;
  updateQuantity: (productId: string, size: string, delta: number) => void;
  clearCart: () => void;
  isCartOpen: boolean;
  setIsCartOpen: (open: boolean) => void;
  isMenuOpen: boolean;
  setIsMenuOpen: (open: boolean) => void;
  cartCount: number;
  subtotal: number;
  discount: number;
  shipping: number;
  total: number;
  promoCode: string;
  promoError: string;
  applyPromoCode: (code: string) => boolean;
  soundEnabled: boolean;
  setSoundEnabled: (enabled: boolean) => void;
  playSound: (type: 'add' | 'click' | 'success' | 'remove') => void;
  freeShippingProgress: number;
  freeShippingRemaining: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [promoCode, setPromoCode] = useState('');
  const [promoDiscountRate, setPromoDiscountRate] = useState(0);
  const [promoError, setPromoError] = useState('');
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Initialize from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('latent_cart');
      if (saved) setItems(JSON.parse(saved));
      const savedSound = localStorage.getItem('latent_sound');
      if (savedSound !== null) setSoundEnabled(savedSound === 'true');
    } catch (e) {
      console.warn('LocalStorage error:', e);
    }
  }, []);

  // Save to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('latent_cart', JSON.stringify(items));
    } catch (e) {
      console.warn('Failed to save cart:', e);
    }
  }, [items]);

  useEffect(() => {
    try {
      localStorage.setItem('latent_sound', String(soundEnabled));
    } catch (e) {}
  }, [soundEnabled]);

  // Audio synthesis helper for dramatic feedback
  const playSound = (type: 'add' | 'click' | 'success' | 'remove') => {
    if (!soundEnabled || typeof window === 'undefined') return;
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      const now = ctx.currentTime;
      if (type === 'click') {
        osc.frequency.setValueAtTime(800, now);
        osc.frequency.exponentialRampToValueAtTime(300, now + 0.05);
        gain.gain.setValueAtTime(0.12, now);
        gain.gain.linearRampToValueAtTime(0.01, now + 0.05);
        osc.start(now);
        osc.stop(now + 0.05);
      } else if (type === 'add') {
        osc.frequency.setValueAtTime(320, now);
        osc.frequency.exponentialRampToValueAtTime(780, now + 0.15);
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.linearRampToValueAtTime(0.01, now + 0.15);
        osc.start(now);
        osc.stop(now + 0.15);
      } else if (type === 'remove') {
        osc.frequency.setValueAtTime(450, now);
        osc.frequency.exponentialRampToValueAtTime(150, now + 0.1);
        gain.gain.setValueAtTime(0.15, now);
        gain.gain.linearRampToValueAtTime(0.01, now + 0.1);
        osc.start(now);
        osc.stop(now + 0.1);
      } else if (type === 'success') {
        osc.frequency.setValueAtTime(523.25, now); // C5
        osc.frequency.setValueAtTime(659.25, now + 0.08); // E5
        osc.frequency.setValueAtTime(783.99, now + 0.16); // G5
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.linearRampToValueAtTime(0.01, now + 0.35);
        osc.start(now);
        osc.stop(now + 0.35);
      }
    } catch (e) {
      // AudioContext policy
    }
  };

  const addToCart = (product: Product, size?: string, quantity: number = 1) => {
    const chosenSize = size || product.sizes[0] || 'ONE SIZE';
    setItems(prev => {
      const idx = prev.findIndex(item => item.product.id === product.id && item.size === chosenSize);
      if (idx > -1) {
        const next = [...prev];
        next[idx].quantity += quantity;
        return next;
      }
      return [...prev, { product, size: chosenSize, quantity }];
    });
    playSound('add');
    setIsCartOpen(true);
  };

  const removeFromCart = (productId: string, size: string) => {
    setItems(prev => prev.filter(item => !(item.product.id === productId && item.size === size)));
    playSound('remove');
  };

  const updateQuantity = (productId: string, size: string, delta: number) => {
    setItems(prev => {
      return prev
        .map(item => {
          if (item.product.id === productId && item.size === size) {
            const nextQty = item.quantity + delta;
            return nextQty > 0 ? { ...item, quantity: nextQty } : null;
          }
          return item;
        })
        .filter(Boolean) as CartItem[];
    });
    playSound('click');
  };

  const clearCart = () => {
    setItems([]);
  };

  const applyPromoCode = (code: string): boolean => {
    const normalized = code.trim().toUpperCase();
    if (normalized === 'LATENT10' || normalized === 'SAMAY' || normalized === 'SUPREME') {
      setPromoCode(normalized);
      setPromoDiscountRate(0.1); // 10% off
      setPromoError('');
      playSound('success');
      return true;
    } else if (normalized === 'RHINO20') {
      setPromoCode(normalized);
      setPromoDiscountRate(0.2); // 20% off
      setPromoError('');
      playSound('success');
      return true;
    } else {
      setPromoError('Invalid promo code. Try "LATENT10" or "RHINO20"');
      playSound('click');
      return false;
    }
  };

  const cartCount = items.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = items.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  const discount = Math.round(subtotal * promoDiscountRate);
  const freeShippingThreshold = 499;
  const shipping = subtotal >= freeShippingThreshold || subtotal === 0 ? 0 : 99;
  const total = subtotal - discount + shipping;
  const freeShippingRemaining = Math.max(0, freeShippingThreshold - subtotal);
  const freeShippingProgress = Math.min(100, Math.round((subtotal / freeShippingThreshold) * 100));

  return (
    <CartContext.Provider
      value={{
        items,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        isCartOpen,
        setIsCartOpen,
        isMenuOpen,
        setIsMenuOpen,
        cartCount,
        subtotal,
        discount,
        shipping,
        total,
        promoCode,
        promoError,
        applyPromoCode,
        soundEnabled,
        setSoundEnabled,
        playSound,
        freeShippingProgress,
        freeShippingRemaining,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used within a CartProvider');
  return context;
};
