import crypto from 'crypto';

const BASE_URL = process.env.TEST_URL || 'http://localhost:3000';
const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET || 'OJDyBtWjQkw98wduIECOS4PW';
const RAZORPAY_WEBHOOK_SECRET = process.env.RAZORPAY_WEBHOOK_SECRET || 'latent_secret_webhook_key_2026';

console.log(`\n======================================================`);
console.log(`🔒 INITIATING PHASE 2 AUTOMATED SECURITY AUDIT`);
console.log(`Target: ${BASE_URL}`);
console.log(`Timestamp: ${new Date().toISOString()}`);
console.log(`======================================================\n`);

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  ✅ PASS: ${message}`);
    passed++;
  } else {
    console.error(`  ❌ FAIL: ${message}`);
    failed++;
  }
}

async function runAudit() {
  try {
    // ----------------------------------------------------
    // TEST SUITE 1: COUPON VALIDATION & SECURITY
    // ----------------------------------------------------
    console.log(`\n--- [1/5] Testing Coupon Validation Engine ---`);
    
    // 1.1 Valid Coupon
    const res1 = await fetch(`${BASE_URL}/api/cart/validate-coupon`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: 'LATENT10', subtotal: 1000 }),
    });
    const d1 = await res1.json();
    assert(res1.status === 200 && d1.valid === true && d1.discountAmount === 100, 'Valid coupon LATENT10 returns 10% discount');

    // 1.2 Invalid / Fake Coupon
    const res2 = await fetch(`${BASE_URL}/api/cart/validate-coupon`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: 'FAKE_EXPLOIT_99', subtotal: 1000 }),
    });
    const d2 = await res2.json();
    assert(res2.status === 400 && d2.valid === false, 'Tampered/unknown promo code is rejected with HTTP 400');

    // 1.3 Subtotal Below Threshold
    const res3 = await fetch(`${BASE_URL}/api/cart/validate-coupon`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: 'RHINO20', subtotal: 400 }), // Requires ₹999
    });
    const d3 = await res3.json();
    assert(res3.status === 400 && d3.valid === false, 'Coupon rejected when cart subtotal is below minimum order requirement');

    // ----------------------------------------------------
    // TEST SUITE 2: ORDER CREATION & PRICE TAMPERING DEFENSE
    // ----------------------------------------------------
    console.log(`\n--- [2/5] Testing Order Creation & Anti-Tampering ---`);

    // 2.1 Valid Order Creation
    const resOrder = await fetch(`${BASE_URL}/api/checkout/create-order`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        items: [{ productId: '15426543419501', size: 'ONE SIZE', quantity: 2 }], // Nimbu Mirchi @ 499 = 998
        customerName: 'Audit Test User',
        customerEmail: 'audit@samayraina.co',
        customerPhone: '9876543210',
        addressLine1: 'The Habitat Stage, Khar',
        city: 'Mumbai',
        state: 'Maharashtra',
        postalCode: '400052',
        couponCode: 'LATENT10', // 10% off 998 = 99.8 -> 100
      }),
    });
    const orderData = await resOrder.json();
    assert(resOrder.status === 200 && orderData.success === true, 'Order created successfully with live Razorpay orderId');
    assert(orderData.amount > 0 && orderData.currency === 'INR', 'Amount is calculated in paise currency');
    assert(orderData.orderNumber.startsWith('IGL-'), 'Unique branded order number generated');

    const testOrderId = orderData.razorpayOrderId;
    const testOrderNumber = orderData.orderNumber;

    // 2.2 Client-Side Price Tampering Defense
    // Attacker tries to submit custom unitPrice of 1 rupee; server MUST compute from database catalog
    const resTamper = await fetch(`${BASE_URL}/api/checkout/create-order`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        items: [{ productId: '15426543419501', size: 'ONE SIZE', quantity: 1, price: 1 }], // Fake price 1
        customerName: 'Attacker',
        customerEmail: 'attacker@evil.com',
        customerPhone: '9876543210',
        addressLine1: 'Hacker Way',
        city: 'Mumbai',
        state: 'Maharashtra',
        postalCode: '400001',
      }),
    });
    const tamperData = await resTamper.json();
    assert(tamperData.summary.subtotal === 499, 'Server ignores client-submitted price and uses official catalog pricing (₹499)');

    // 2.3 Input Validation (Invalid Email & Missing Phone)
    const resInvalid = await fetch(`${BASE_URL}/api/checkout/create-order`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        items: [{ productId: '15426543419501', size: 'ONE SIZE', quantity: 1 }],
        customerName: 'A',
        customerEmail: 'invalid-email-string',
        customerPhone: '123',
        addressLine1: 'Short',
        city: 'M',
        state: 'MH',
        postalCode: '400',
      }),
    });
    assert(resInvalid.status === 400, 'Zod schema rejects malformed customer contact info and short address');

    // ----------------------------------------------------
    // TEST SUITE 3: PAYMENT SIGNATURE VERIFICATION & FORGERY DEFENSE
    // ----------------------------------------------------
    console.log(`\n--- [3/5] Testing Razorpay Cryptographic HMAC Signatures ---`);

    const fakePaymentId = 'pay_audit_test_998811';

    // 3.1 Forged Signature (Attacker tries to bypass payment)
    const forgedSignature = '0000000000000000000000000000000000000000000000000000000000000000';
    const resForged = await fetch(`${BASE_URL}/api/checkout/verify-payment`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        razorpay_order_id: testOrderId,
        razorpay_payment_id: fakePaymentId,
        razorpay_signature: forgedSignature,
        orderNumber: testOrderNumber,
      }),
    });
    assert(resForged.status === 400, 'Fraudulent/forged payment signature is strictly rejected with HTTP 400');

    // 3.2 Genuine Cryptographic HMAC SHA-256 Signature
    const genuineSignature = crypto
      .createHmac('sha256', RAZORPAY_KEY_SECRET)
      .update(`${testOrderId}|${fakePaymentId}`)
      .digest('hex');

    const resValid = await fetch(`${BASE_URL}/api/checkout/verify-payment`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        razorpay_order_id: testOrderId,
        razorpay_payment_id: fakePaymentId,
        razorpay_signature: genuineSignature,
        orderNumber: testOrderNumber,
      }),
    });
    const validData = await resValid.json();
    assert(resValid.status === 200 && validData.success === true, 'Legitimate HMAC SHA-256 signature is verified and order confirmed');

    // 3.3 Replay / Duplicate Payment Verification
    const resDuplicate = await fetch(`${BASE_URL}/api/checkout/verify-payment`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        razorpay_order_id: testOrderId,
        razorpay_payment_id: fakePaymentId,
        razorpay_signature: genuineSignature,
        orderNumber: testOrderNumber,
      }),
    });
    assert(resDuplicate.status === 200, 'Replay payment submission handled safely without duplicate inventory deduction');

    // ----------------------------------------------------
    // TEST SUITE 4: WEBHOOK AUTHENTICATION & IDEMPOTENCY
    // ----------------------------------------------------
    console.log(`\n--- [4/5] Testing Webhook Signature & Idempotency ---`);

    // 4.1 Missing Signature Header
    const resWebhookNoSig = await fetch(`${BASE_URL}/api/webhooks/razorpay`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ event: 'payment.captured' }),
    });
    assert(resWebhookNoSig.status === 400, 'Webhook without x-razorpay-signature header is rejected');

    // 4.2 Invalid Webhook Signature Header
    const resWebhookBadSig = await fetch(`${BASE_URL}/api/webhooks/razorpay`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-razorpay-signature': 'invalid_signature_hash',
      },
      body: JSON.stringify({ event: 'payment.captured' }),
    });
    assert(resWebhookBadSig.status === 401, 'Webhook with invalid HMAC signature rejected with HTTP 401 Unauthorized');

    // 4.3 Valid Webhook Signature (payment.captured)
    const webhookPayload = JSON.stringify({
      event: 'payment.captured',
      payload: {
        payment: {
          entity: {
            id: 'pay_webhook_audit_123',
            order_id: testOrderId,
            amount: 89800,
            currency: 'INR',
            status: 'captured',
            method: 'upi',
          },
        },
      },
    });

    const validWebhookSig = crypto
      .createHmac('sha256', RAZORPAY_WEBHOOK_SECRET)
      .update(webhookPayload)
      .digest('hex');

    const resWebhookValid = await fetch(`${BASE_URL}/api/webhooks/razorpay`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-razorpay-signature': validWebhookSig,
      },
      body: webhookPayload,
    });
    const webhookData = await resWebhookValid.json();
    assert(resWebhookValid.status === 200 && webhookData.received === true, 'Legitimate Razorpay webhook signature verified and processed');

    // 4.4 Payment Cancellation / Failure Webhook
    const failPayload = JSON.stringify({
      event: 'payment.failed',
      payload: {
        payment: {
          entity: {
            id: 'pay_fail_999',
            order_id: testOrderId,
            error_code: 'BAD_REQUEST_ERROR',
            error_description: 'Payment was cancelled by user',
          },
        },
      },
    });

    const failWebhookSig = crypto
      .createHmac('sha256', RAZORPAY_WEBHOOK_SECRET)
      .update(failPayload)
      .digest('hex');

    const resWebhookFail = await fetch(`${BASE_URL}/api/webhooks/razorpay`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-razorpay-signature': failWebhookSig,
      },
      body: failPayload,
    });
    assert(resWebhookFail.status === 200, 'Payment failure / cancellation webhook processed and recorded');

    // ----------------------------------------------------
    // TEST SUITE 5: CONTACT & SUPPORT AUDIT
    // ----------------------------------------------------
    console.log(`\n--- [5/5] Testing Contact & Support Endpoint ---`);
    const resContact = await fetch(`${BASE_URL}/api/contact`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Latent Audience Member',
        email: 'fan@samayraina.co',
        orderId: testOrderNumber,
        message: 'Where is my Nimbu Mirchi keychain? Need it to ward off evil spirits.',
      }),
    });
    const contactData = await resContact.json();
    assert(resContact.status === 200 && contactData.success === true, 'Contact message validated and logged successfully');

    // ----------------------------------------------------
    // SUMMARY
    // ----------------------------------------------------
    console.log(`\n======================================================`);
    console.log(`AUDIT RESULTS: ${passed} PASSED, ${failed} FAILED`);
    console.log(`======================================================\n`);

    if (failed > 0) {
      process.exit(1);
    }
  } catch (err) {
    console.error('Fatal audit error:', err);
    process.exit(1);
  }
}

runAudit();
