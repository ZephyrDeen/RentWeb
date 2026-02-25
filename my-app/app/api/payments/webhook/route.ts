import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/app/lib/stripe";
import { invoiceService } from "@/app/services/invoice.service";
import Stripe from "stripe";

// Disable body parsing, we need the raw body for webhook verification
export const dynamic = "force-dynamic";

// POST /api/payments/webhook - Handle Stripe webhook events
export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get("stripe-signature");

    if (!signature) {
      return NextResponse.json(
        { error: "Missing stripe-signature header" },
        { status: 400 }
      );
    }

    // Verify webhook signature
    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(
        body,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET!
      );
    } catch (err) {
      console.error("Webhook signature verification failed:", err);
      return NextResponse.json(
        { error: "Invalid signature" },
        { status: 400 }
      );
    }

    // Handle the event
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;

        // Get invoice ID from metadata
        const invoiceId = session.metadata?.invoiceId;

        if (!invoiceId) {
          console.error("No invoice ID in session metadata");
          break;
        }

        // Update invoice status to PAID (通过 Service 层)
        await invoiceService.markInvoiceAsPaid(
          invoiceId,
          session.payment_intent as string
        );

        console.log(`✅ Invoice ${invoiceId} marked as PAID`);
        console.log(`   Payment ID: ${session.payment_intent}`);
        console.log(`   Amount: $${(session.amount_total || 0) / 100}`);

        break;
      }

      case "checkout.session.expired": {
        const session = event.data.object as Stripe.Checkout.Session;
        console.log(`⚠️ Checkout session expired: ${session.id}`);
        break;
      }

      case "payment_intent.payment_failed": {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        console.log(`❌ Payment failed: ${paymentIntent.id}`);
        console.log(`   Reason: ${paymentIntent.last_payment_error?.message}`);
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Webhook error:", error);
    return NextResponse.json(
      { error: "Webhook handler failed" },
      { status: 500 }
    );
  }
}
