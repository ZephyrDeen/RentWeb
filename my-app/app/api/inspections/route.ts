import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/app/lib/auth";
import { inspectionService } from "@/app/services/inspection.service";

/**
 * Controller Layer - Inspection API Routes
 * 职责：处理 HTTP 请求和响应，调用 Service 层
 */

// GET /api/inspections - Get inspections list
export async function GET() {
  try {
    // 1. 身份验证
    const session = await auth();
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. 调用 Service 层
    const inspections = await inspectionService.getInspectionsByUser(
      session.user.id,
      session.user.role
    );

    // 3. 返回响应
    return NextResponse.json({ inspections });
  } catch (error) {
    console.error("Failed to fetch inspections:", error);
    return NextResponse.json(
      { error: "Failed to fetch inspections" },
      { status: 500 }
    );
  }
}

// POST /api/inspections - Create new inspection (Agent only)
export async function POST(request: NextRequest) {
  try {
    // 1. 身份验证
    const session = await auth();
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. 解析请求体
    const body = await request.json();
    const { propertyId, availableDates, notes } = body;

    // 3. 调用 Service 层
    const inspection = await inspectionService.createInspection(
      session.user.id,
      session.user.role,
      { propertyId, availableDates, notes }
    );

    // 4. 返回响应
    return NextResponse.json({
      success: true,
      inspection: {
        id: inspection.id,
        propertyId: inspection.propertyId,
        tenantId: inspection.tenantId,
        availableDates: inspection.availableDates,
        status: inspection.status,
      },
    });
  } catch (error) {
    console.error("Failed to create inspection:", error);

    if (error instanceof Error) {
      if (error.message === "Only agents can create inspections") {
        return NextResponse.json({ error: error.message }, { status: 403 });
      }
      if (
        error.message === "Property ID and available dates are required" ||
        error.message === "Property has no tenant assigned" ||
        error.message === "All available dates must be in the future"
      ) {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }
      if (error.message === "Property not found") {
        return NextResponse.json({ error: error.message }, { status: 404 });
      }
      if (error.message === "You don't have access to this property") {
        return NextResponse.json({ error: error.message }, { status: 403 });
      }
    }

    return NextResponse.json(
      { error: "Failed to create inspection" },
      { status: 500 }
    );
  }
}
