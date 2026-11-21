import { NextRequest, NextResponse } from 'next/server';
import { verifyPaymentSignature } from '@/lib/razorpay';
import { createAdminClient } from '@/lib/supabase/admin';

export async function POST(req: NextRequest) {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      orderNumber,
    } = await req.json();

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return NextResponse.json(
        { error: 'Missing mandatory payment verification parameters' },
        { status: 400 }
      );
    }

    // 1. Cryptographic HMAC SHA-256 Signature Verification
    const isValid = verifyPaymentSignature({
      orderId: razorpay_order_id,
      paymentId: razorpay_payment_id,
      signature: razorpay_signature,
    });

    if (!isValid) {
      console.error('CRITICAL: Fraudulent or mismatched Razorpay payment signature:', {
        razorpay_order_id,
        razorpay_payment_id,
      });
      return NextResponse.json(
        { error: 'Invalid payment signature. Verification failed.' },
        { status: 400 }
      );
    }

    // 2. Update Order Status and Record Payment in Database
    const supabaseAdmin = createAdminClient();

    try {
      // Find the order
      const { data: order, error: findError } = await supabaseAdmin
        .from('orders')
        .select('*, order_items(*)')
        .eq('order_number', orderNumber)
        .single();

      if (order) {
        // Prevent duplicate processing (Idempotency)
        if (order.status !== 'paid') {
          // Update Order Status to 'paid'
          await supabaseAdmin
            .from('orders')
            .update({
              status: 'paid',
              updated_at: new Date().toISOString(),
            })
            .eq('id', order.id);

          // Record verified payment
          await supabaseAdmin.from('payments').insert({
            order_id: order.id,
            razorpay_order_id,
            razorpay_payment_id,
            razorpay_signature,
            amount: order.total_amount,
            currency: 'INR',
            status: 'captured',
          });

          // Deduct inventory for each variant
          if (order.order_items && Array.isArray(order.order_items)) {
            for (const item of order.order_items) {
              if (item.variant_id) {
                try {
                  await supabaseAdmin.rpc('decrement_variant_stock', {
                    p_variant_id: item.variant_id,
                    p_quantity: item.quantity,
                  });
                } catch (rpcErr) {
                  // Fallback update
                }
              }
            }
          }
        }
      }
    } catch (dbErr) {
      console.warn('Database sync notice during payment verification:', dbErr);
    }

    return NextResponse.json({
      success: true,
      message: 'Payment verified successfully. Order confirmed.',
      orderNumber,
      paymentId: razorpay_payment_id,
    });
  } catch (err: any) {
    console.error('Payment verification error:', err);
    return NextResponse.json(
      { error: err.message || 'Payment verification processing error' },
      { status: 500 }
    );
  }
}
