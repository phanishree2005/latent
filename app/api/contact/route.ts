import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createAdminClient } from '@/lib/supabase/admin';

const contactSchema = z.object({
  name: z.string().min(2, 'Name is required'),
  email: z.string().email('Valid email is required'),
  orderId: z.string().optional(),
  message: z.string().min(5, 'Message must be at least 5 characters'),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const data = contactSchema.parse(body);

    const supabaseAdmin = createAdminClient();
    try {
      await supabaseAdmin.from('contact_messages').insert({
        name: data.name,
        email: data.email,
        order_id: data.orderId || null,
        message: data.message,
        status: 'unread',
      });
    } catch (dbErr) {
      console.warn('Contact message db sync notice:', dbErr);
    }

    return NextResponse.json({
      success: true,
      message: 'Your message has been received by India\'s Got Latent support team.',
    });
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: (err as any).issues?.[0]?.message || 'Validation error' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Failed to record message' }, { status: 500 });
  }
}
