import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/app/lib/auth";
import { prisma } from "@/app/lib/prisma";
import { stripe, formatAmountForStripe } from "@/app/lib/stripe";

// POST /api/payments/create-checkout - Create Stripe Checkout Session
export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only tenants can pay invoices
    if (session.user.role !== "TENANT") {
      return NextResponse.json(
        { error: "Only tenants can pay invoices" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { invoiceId } = body;

    if (!invoiceId) {
      return NextResponse.json(
        { error: "Invoice ID is required" },
        { status: 400 }
      );
    }

    // Get invoice details
    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: {
        property: true,
        tenant: true,
      },
    });

    if (!invoice) {
      return NextResponse.json(
        { error: "Invoice not found" },
        { status: 404 }
      );
    }

    // Verify the invoice belongs to this tenant
    if (invoice.tenantId !== session.user.id) {
      return NextResponse.json(
        { error: "You don't have access to this invoice" },
        { status: 403 }
      );
    }

    // Check if invoice is already paid
    if (invoice.status === "PAID") {
      return NextResponse.json(
        { error: "This invoice has already been paid" },
        { status: 400 }
      );
    }

    // Create Stripe Checkout Session
    const checkoutSession = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",
      customer_email: invoice.tenant.email,
      line_items: [
        {
          price_data: {
            currency: "aud", // Australian dollars
            product_data: {
              name: `Rent Payment - ${invoice.property.title}`,
              description: `Rent for ${new Date(invoice.billingMonth).toLocaleDateString("en-AU", { year: "numeric", month: "long" })}`,
            },
            unit_amount: formatAmountForStripe(Number(invoice.amount)),
          },
          quantity: 1,
        },
      ],
      metadata: {
        invoiceId: invoice.id,
        tenantId: invoice.tenantId,
        propertyId: invoice.propertyId,
      },
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/invoices?success=true&invoice=${invoice.id}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/invoices?canceled=true`,
    });

    return NextResponse.json({
      success: true,
      checkoutUrl: checkoutSession.url,
      sessionId: checkoutSession.id,
    });
  } catch (error) {
    console.error("Failed to create checkout session:", error);
    return NextResponse.json(
      { error: "Failed to create payment session" },
      { status: 500 }
    );
  }
}
