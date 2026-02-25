import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import bcrypt from "bcryptjs";

// POST /api/auth/register - Tenant registers via invitation link
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token, name, password, phone } = body;

    // Validate required fields
    if (!token || !name || !password) {
      return NextResponse.json(
        { error: "Invitation token, name, and password are required" },
        { status: 400 }
      );
    }

    // Validate password length
    if (password.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters" },
        { status: 400 }
      );
    }

    // Find invitation
    const invitation = await prisma.invitation.findUnique({
      where: { token },
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
      // Update invitation status to expired
      await prisma.invitation.update({
        where: { id: invitation.id },
        data: { status: "EXPIRED" },
      });
      return NextResponse.json(
        { error: "Invitation link has expired" },
        { status: 410 }
      );
    }

    // Check if email is already registered
    const existingUser = await prisma.user.findUnique({
      where: { email: invitation.email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "This email is already registered" },
        { status: 409 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user (transaction: create user + update invitation + optionally link property)
    const user = await prisma.$transaction(async (tx) => {
      // Create tenant user
      const newUser = await tx.user.create({
        data: {
          email: invitation.email,
          password: hashedPassword,
          name,
          phone,
          role: "TENANT",
        },
      });

      // Update invitation status to accepted
      await tx.invitation.update({
        where: { id: invitation.id },
        data: { status: "ACCEPTED" },
      });

      // If property was specified in invitation, link tenant to property
      if (invitation.propertyId) {
        await tx.property.update({
          where: { id: invitation.propertyId },
          data: { tenantId: newUser.id },
        });
      }

      return newUser;
    });

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Registration failed:", error);
    return NextResponse.json(
      { error: "Registration failed, please try again" },
      { status: 500 }
    );
  }
}
