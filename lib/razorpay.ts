import Razorpay from 'razorpay';
import crypto from 'crypto';

export const getRazorpayInstance = () => {
  const key_id = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || 'rzp_test_U2qwEtvMQlXviB';
  const key_secret = process.env.RAZORPAY_KEY_SECRET || 'OJDyBtWjQkw98wduIECOS4PW';

  return new Razorpay({
    key_id,
    key_secret,
  });
};

/**
 * Validates standard Razorpay checkout payment signature
 * generated on checkout modal completion:
 * HMAC_SHA256(razorpay_order_id + "|" + razorpay_payment_id, secret) === razorpay_signature
 */
export const verifyPaymentSignature = ({
  orderId,
  paymentId,
  signature,
}: {
  orderId: string;
  paymentId: string;
  signature: string;
}): boolean => {
  try {
    const key_secret = process.env.RAZORPAY_KEY_SECRET || 'OJDyBtWjQkw98wduIECOS4PW';
    const body = `${orderId}|${paymentId}`;
    const expectedSignature = crypto
      .createHmac('sha256', key_secret)
      .update(body)
      .digest('hex');

    return expectedSignature === signature;
  } catch (error) {
    console.error('Signature verification error:', error);
    return false;
  }
};

/**
 * Validates Razorpay Webhook signature
 */
export const verifyWebhookSignature = ({
  body,
  signature,
}: {
  body: string;
  signature: string;
}): boolean => {
  try {
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET || 'latent_secret_webhook_key_2026';
    const expectedSignature = crypto
      .createHmac('sha256', webhookSecret)
      .update(body)
      .digest('hex');

    return expectedSignature === signature;
  } catch (error) {
    console.error('Webhook signature verification error:', error);
    return false;
  }
};
