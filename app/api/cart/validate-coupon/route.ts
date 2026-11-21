import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(req: NextRequest) {
  try {
    const { code, subtotal } = await req.json();
    if (!code || typeof code !== 'string') {
      return NextResponse.json({ valid: false, message: 'Please enter a coupon code' }, { status: 400 });
    }

    const normalizedCode = code.trim().toUpperCase();

    // 1. Try querying Supabase coupons table
    try {
      const supabase = createClient();
      const { data: coupon, error } = await supabase
        .from('coupons')
        .select('*')
        .eq('code', normalizedCode)
        .eq('is_active', true)
        .single();

      if (!error && coupon) {
        if (coupon.min_order_amount && subtotal < coupon.min_order_amount) {
          return NextResponse.json({
            valid: false,
            message: `Minimum order of ₹${coupon.min_order_amount} required for this coupon`,
          });
        }

        if (coupon.expires_at && new Date(coupon.expires_at) < new Date()) {
          return NextResponse.json({ valid: false, message: 'This coupon has expired' });
        }

        let discount = 0;
        if (coupon.discount_type === 'percentage') {
          discount = Math.round((subtotal * coupon.discount_value) / 100);
          if (coupon.max_discount_amount) {
            discount = Math.min(discount, coupon.max_discount_amount);
          }
        } else {
          discount = Math.min(coupon.discount_value, subtotal);
        }

        return NextResponse.json({
          valid: true,
          code: coupon.code,
          discountType: coupon.discount_type,
          discountValue: coupon.discount_value,
          discountAmount: discount,
        });
      }
    } catch (dbErr) {
      // Fallback to static coupons if Supabase is still connecting
    }

    // 2. Fallback in-memory coupons
    if (normalizedCode === 'LATENT10') {
      const discount = Math.round(subtotal * 0.1);
      return NextResponse.json({
        valid: true,
        code: 'LATENT10',
        discountType: 'percentage',
        discountValue: 10,
        discountAmount: discount,
      });
    }

    if (normalizedCode === 'RHINO20') {
      const discount = Math.round(subtotal * 0.2);
      return NextResponse.json({
        valid: true,
        code: 'RHINO20',
        discountType: 'percentage',
        discountValue: 20,
        discountAmount: discount,
      });
    }

    if (normalizedCode === 'SUPREMELEADER') {
      const discount = Math.round(subtotal * 0.15);
      return NextResponse.json({
        valid: true,
        code: 'SUPREMELEADER',
        discountType: 'percentage',
        discountValue: 15,
        discountAmount: discount,
      });
    }

    return NextResponse.json({
      valid: false,
      message: 'Invalid coupon code. Try "LATENT10" or "RHINO20"',
    }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ valid: false, message: err.message || 'Internal error' }, { status: 500 });
  }
}
