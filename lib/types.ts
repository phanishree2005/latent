// Type definitions for India's Got Latent E-Commerce Platform

export type UserRole = 'customer' | 'admin' | 'staff';

export interface Profile {
  id: string; // matches auth.users.id
  full_name: string | null;
  phone: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface UserRoleRecord {
  id: string;
  user_id: string;
  role: UserRole;
  created_at: string;
}

export interface Category {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  created_at: string;
}

export interface DbProduct {
  id: string;
  category_id: string | null;
  title: string;
  name: string;
  subtitle: string;
  handle: string;
  price: number;
  original_price: number;
  description: string;
  images: string[];
  tags: string[];
  video_url: string | null;
  is_featured: boolean;
  is_new: boolean;
  is_archived: boolean;
  created_at: string;
  updated_at: string;
}

export interface ProductVariant {
  id: string;
  product_id: string;
  size: string;
  sku: string;
  price_override: number | null;
  stock_quantity: number;
  created_at: string;
  updated_at: string;
}

export interface ShippingAddress {
  id: string;
  user_id: string;
  full_name: string;
  phone: string;
  address_line1: string;
  address_line2: string | null;
  city: string;
  state: string;
  postal_code: string;
  country: string;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

export type OrderStatus =
  | 'pending'
  | 'processing'
  | 'paid'
  | 'shipped'
  | 'delivered'
  | 'cancelled'
  | 'refunded';

export interface Order {
  id: string;
  order_number: string;
  user_id: string | null; // null for guest checkouts
  customer_email: string;
  customer_phone: string;
  customer_name: string;
  shipping_address: ShippingAddressSnapshot;
  subtotal: number;
  discount_amount: number;
  coupon_code: string | null;
  shipping_fee: number;
  total_amount: number;
  status: OrderStatus;
  tracking_carrier: string | null;
  tracking_number: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface ShippingAddressSnapshot {
  full_name: string;
  phone: string;
  address_line1: string;
  address_line2?: string | null;
  city: string;
  state: string;
  postal_code: string;
  country: string;
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  variant_id: string | null;
  product_name: string;
  product_handle: string;
  size: string;
  unit_price: number;
  quantity: number;
  total_price: number;
  product_image: string | null;
  created_at: string;
}

export interface Payment {
  id: string;
  order_id: string;
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
  amount: number;
  currency: string;
  status: 'captured' | 'failed' | 'refunded';
  method: string | null;
  error_code: string | null;
  error_description: string | null;
  created_at: string;
}

export interface Coupon {
  id: string;
  code: string;
  discount_type: 'percentage' | 'fixed';
  discount_value: number; // e.g. 10 for 10%, or 200 for ₹200 off
  min_order_amount: number;
  max_discount_amount: number | null;
  usage_limit: number | null;
  times_used: number;
  is_active: boolean;
  expires_at: string | null;
  created_at: string;
}

export interface ContactMessage {
  id: string;
  name: string;
  email: string;
  order_id: string | null;
  message: string;
  status: 'unread' | 'read' | 'replied';
  created_at: string;
}
