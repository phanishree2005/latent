import { NextRequest, NextResponse } from 'next/server';
import { verifyWebhookSignature } from '@/lib/razorpay';
import { createAdminClient } from '@/lib/supabase/admin';

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get('x-razorpay-signature');

    if (!signature) {
      return NextResponse.json({ error: 'Missing x-razorpay-signature header' }, { status: 400 });
    }

    // 1. Validate Webhook Signature
    const isValid = verifyWebhookSignature({
      body: rawBody,
      signature,
    });

    if (!isValid) {
      console.warn('Rejected invalid Razorpay webhook signature');
      return NextResponse.json({ error: 'Invalid webhook signature' }, { status: 401 });
    }

    const payload = JSON.parse(rawBody);
    const event = payload.event;
    const entity = payload.payload?.payment?.entity || payload.payload?.order?.entity;

    console.log(`[Razorpay Webhook] Received event: ${event}`);

    const supabaseAdmin = createAdminClient();

    // 2. Handle Payment Captured / Order Paid
    if (event === 'payment.captured' || event === 'order.paid') {
      const razorpayOrderId = entity.order_id || entity.id;
      const razorpayPaymentId = entity.id;

      // Find order by Razorpay order notes or id
      const { data: order } = await supabaseAdmin
        .from('orders')
        .select('*')
        .ilike('notes', `%${razorpayOrderId}%`)
        .single();

      if (order && order.status !== 'paid') {
        await supabaseAdmin
          .from('orders')
          .update({
            status: 'paid',
            updated_at: new Date().toISOString(),
          })
          .eq('id', order.id);

        // Record payment
        await supabaseAdmin.from('payments').insert({
          order_id: order.id,
          razorpay_order_id: razorpayOrderId,
          razorpay_payment_id: razorpayPaymentId,
          razorpay_signature: signature,
          amount: entity.amount ? entity.amount / 100 : order.total_amount,
          currency: entity.currency || 'INR',
          status: 'captured',
          method: entity.method || 'online',
        });
      }
    } else if (event === 'payment.failed') {
      const razorpayOrderId = entity.order_id;
      if (razorpayOrderId) {
        await supabaseAdmin
          .from('orders')
          .update({
            status: 'cancelled',
            updated_at: new Date().toISOString(),
          })
          .ilike('notes', `%${razorpayOrderId}%`);
      }
    }

    return NextResponse.json({ status: 'ok', received: true });
  } catch (err: any) {
    console.error('Webhook error:', err);
    return NextResponse.json({ error: err.message || 'Webhook processing failed' }, { status: 500 });
  }
}
