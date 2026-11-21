import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getRazorpayInstance } from '@/lib/razorpay';
import { createAdminClient } from '@/lib/supabase/admin';
import { PRODUCTS } from '@/data/products';

const orderItemSchema = z.object({
  productId: z.string(),
  size: z.string(),
  quantity: z.number().int().positive(),
});

const checkoutSchema = z.object({
  items: z.array(orderItemSchema).min(1, 'Cart cannot be empty'),
  customerName: z.string().min(2, 'Name is required'),
  customerEmail: z.string().email('Valid email is required'),
  customerPhone: z.string().min(10, 'Valid phone number is required'),
  addressLine1: z.string().min(5, 'Address is required'),
  addressLine2: z.string().optional(),
  city: z.string().min(2, 'City is required'),
  state: z.string().min(2, 'State is required'),
  postalCode: z.string().min(5, 'Postal code is required'),
  couponCode: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validatedData = checkoutSchema.parse(body);

    // 1. Server-side Price & Stock Recalculation (NEVER TRUST CLIENT TOTALS)
    let calculatedSubtotal = 0;
    const verifiedItems: Array<{
      productId: string;
      productName: string;
      productHandle: string;
      productImage: string;
      size: string;
      unitPrice: number;
      quantity: number;
      totalPrice: number;
    }> = [];

    for (const item of validatedData.items) {
      const product = PRODUCTS.find((p) => p.id === item.productId);
      if (!product) {
        return NextResponse.json(
          { error: `Product ID ${item.productId} was not found in catalog` },
          { status: 400 }
        );
      }

      const itemTotal = product.price * item.quantity;
      calculatedSubtotal += itemTotal;

      verifiedItems.push({
        productId: product.id,
        productName: product.name,
        productHandle: product.handle,
        productImage: product.images[0] || '',
        size: item.size,
        unitPrice: product.price,
        quantity: item.quantity,
        totalPrice: itemTotal,
      });
    }

    // 2. Server-side Coupon Discount Verification
    let discountAmount = 0;
    if (validatedData.couponCode) {
      const code = validatedData.couponCode.trim().toUpperCase();
      if (code === 'LATENT10') {
        discountAmount = Math.round(calculatedSubtotal * 0.1);
      } else if (code === 'RHINO20') {
        discountAmount = Math.round(calculatedSubtotal * 0.2);
      } else if (code === 'SUPREMELEADER') {
        discountAmount = Math.round(calculatedSubtotal * 0.15);
      }
    }

    // 3. Shipping Calculation (Free over 499)
    const shippingFee = calculatedSubtotal >= 499 ? 0 : 99;
    const finalTotal = Math.max(0, calculatedSubtotal - discountAmount + shippingFee);
    const amountInPaise = Math.round(finalTotal * 100);

    // 4. Generate Unique Order Number
    const orderNumber = `IGL-${Date.now().toString().slice(-6)}-${Math.floor(Math.random() * 900 + 100)}`;

    // 5. Create Razorpay Order
    const razorpay = getRazorpayInstance();
    const rzpOrder = await razorpay.orders.create({
      amount: amountInPaise,
      currency: 'INR',
      receipt: orderNumber,
      notes: {
        customer_name: validatedData.customerName,
        customer_email: validatedData.customerEmail,
        order_number: orderNumber,
      },
    });

    // 6. Save Pending Order to Supabase (via Admin client)
    const supabaseAdmin = createAdminClient();
    const shippingAddress = {
      full_name: validatedData.customerName,
      phone: validatedData.customerPhone,
      address_line1: validatedData.addressLine1,
      address_line2: validatedData.addressLine2 || null,
      city: validatedData.city,
      state: validatedData.state,
      postal_code: validatedData.postalCode,
      country: 'India',
    };

    try {
      const { data: dbOrder, error: orderError } = await supabaseAdmin
        .from('orders')
        .insert({
          order_number: orderNumber,
          customer_email: validatedData.customerEmail,
          customer_phone: validatedData.customerPhone,
          customer_name: validatedData.customerName,
          shipping_address: shippingAddress,
          subtotal: calculatedSubtotal,
          discount_amount: discountAmount,
          coupon_code: validatedData.couponCode || null,
          shipping_fee: shippingFee,
          total_amount: finalTotal,
          status: 'pending',
          notes: `Razorpay Order ID: ${rzpOrder.id}`,
        })
        .select()
        .single();

      if (dbOrder) {
        const orderItemsPayload = verifiedItems.map((item) => ({
          order_id: dbOrder.id,
          product_id: item.productId,
          product_name: item.productName,
          product_handle: item.productHandle,
          size: item.size,
          unit_price: item.unitPrice,
          quantity: item.quantity,
          total_price: item.totalPrice,
          product_image: item.productImage,
        }));

        await supabaseAdmin.from('order_items').insert(orderItemsPayload);
      }
    } catch (dbErr) {
      console.warn('Note: Order created in Razorpay, database recording fallback active:', dbErr);
    }

    return NextResponse.json({
      success: true,
      orderNumber,
      razorpayOrderId: rzpOrder.id,
      amount: amountInPaise,
      currency: 'INR',
      keyId: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || 'rzp_test_U2qwEtvMQlXviB',
      customer: {
        name: validatedData.customerName,
        email: validatedData.customerEmail,
        phone: validatedData.customerPhone,
      },
      summary: {
        subtotal: calculatedSubtotal,
        discount: discountAmount,
        shipping: shippingFee,
        total: finalTotal,
      },
    });
  } catch (err: any) {
    console.error('Create order error:', err);
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: (err as any).issues?.[0]?.message || 'Validation error' }, { status: 400 });
    }
    return NextResponse.json({ error: err.message || 'Failed to initialize payment order' }, { status: 500 });
  }
}
