import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { randomBytes } from "crypto";
import { Resend } from "resend";

// Only initialize Resend if API key exists
const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

// POST /api/invitations - Agent creates invitation
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, agentId, propertyId } = body;

    // Validate required fields
    if (!email || !agentId || !propertyId) {
      return NextResponse.json(
        { error: "Email, agent ID, and property ID are required" },
        { status: 400 }
      );
    }

    // Verify agent exists
    const agent = await prisma.user.findUnique({
      where: { id: agentId },
    });

    if (!agent || agent.role !== "AGENT") {
      return NextResponse.json(
        { error: "Invalid agent account" },
        { status: 403 }
      );
    }

    // Check for existing pending invitation
    const existingInvitation = await prisma.invitation.findFirst({
      where: {
        email,
        status: "PENDING",
        expiresAt: { gt: new Date() },
      },
    });

    if (existingInvitation) {
      return NextResponse.json(
        { error: "A pending invitation already exists for this email" },
        { status: 409 }
      );
    }

    // If propertyId provided, fetch property details
    let property = null;
    if (propertyId) {
      property = await prisma.property.findUnique({
        where: { id: propertyId },
        select: { id: true, title: true, address: true, rent: true },
      });

      if (!property) {
        return NextResponse.json(
          { error: "Property not found" },
          { status: 404 }
        );
      }
    }

    // Generate invitation token
    const token = randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // Expires in 7 days

    // Create invitation
    const invitation = await prisma.invitation.create({
      data: {
        email,
        token,
        propertyId,
        expiresAt,
        agentId,
      },
    });

    // Generate invite URL
    const inviteUrl = `${process.env.NEXT_PUBLIC_APP_URL}/register?token=${token}`;

    // Build property info for email
    const propertyInfo = property
      ? `
        <div style="background:#f5f5f5;padding:16px;border-radius:8px;margin:16px 0;">
          <h3 style="margin:0 0 8px 0;">Property Details</h3>
          <p style="margin:4px 0;"><strong>Name:</strong> ${property.title}</p>
          <p style="margin:4px 0;"><strong>Address:</strong> ${property.address}</p>
          <p style="margin:4px 0;"><strong>Monthly Rent:</strong> $${property.rent}</p>
        </div>
      `
      : "";

    // Send invitation email (only if Resend is configured)
    if (resend) {
      await resend.emails.send({
        from: "RentWeb <noreply@yourdomain.com>",
        to: email,
        subject: "You've received a rental invitation",
        html: `
          <h2>Hello!</h2>
          <p>${agent.name} has invited you to register on RentWeb.</p>
          ${propertyInfo}
          <p>Click the link below to complete your registration:</p>
          <a href="${inviteUrl}" style="display:inline-block;padding:12px 24px;background:#10b981;color:white;text-decoration:none;border-radius:6px;">
            Accept Invitation
          </a>
          <p style="color:#666;margin-top:20px;">This link expires in 7 days.</p>
        `,
      });
    }

    return NextResponse.json({
      success: true,
      invitation: {
        id: invitation.id,
        email: invitation.email,
        expiresAt: invitation.expiresAt,
      },
      property, // Include property info in response
      inviteUrl, // Return URL for development, remove in production
    });
  } catch (error) {
    console.error("Failed to create invitation:", error);
    return NextResponse.json(
      { error: "Failed to create invitation" },
      { status: 500 }
    );
  }
}

// GET /api/invitations?token=xxx - Verify invitation token
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get("token");

    if (!token) {
      return NextResponse.json(
        { error: "Missing invitation token" },
        { status: 400 }
      );
    }

    const invitation = await prisma.invitation.findUnique({
      where: { token },
      include: {
        agent: { select: { name: true } },
        property: { select: { id: true, title: true, address: true, rent: true } },
      },
    });

    if (!invitation) {
      return NextResponse.json(
        { error: "Invalid invitation link" },
        { status: 404 }
      );
    }

    if (invitation.status !== "PENDING") {
      return NextResponse.json(
        { error: "This invitation has already been used" },
        { status: 410 }
      );
    }

    if (invitation.expiresAt < new Date()) {
      return NextResponse.json(
        { error: "Invitation link has expired" },
        { status: 410 }
      );
    }

    return NextResponse.json({
      valid: true,
      email: invitation.email,
      agentName: invitation.agent.name,
      property: invitation.property, // Full property info
    });
  } catch (error) {
    console.error("Failed to verify invitation:", error);
    return NextResponse.json(
      { error: "Failed to verify invitation" },
      { status: 500 }
    );
  }
}
