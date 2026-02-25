import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/app/lib/auth";
import { propertyService } from "@/app/services/property.service";

/**
 * Controller Layer - Property Detail API Routes
 * 职责：处理单个 Property 的 HTTP 请求和响应
 */

// GET /api/properties/[id] - Get single property details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 1. 身份验证
    const session = await auth();
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. 获取参数
    const { id } = await params;

    // 3. 调用 Service 层
    const property = await propertyService.getPropertyById(
      id,
      session.user.id,
      session.user.role
    );

    // 4. 返回响应
    return NextResponse.json({ property });
  } catch (error) {
    console.error("Failed to fetch property:", error);

    if (error instanceof Error) {
      if (error.message === "Property not found") {
        return NextResponse.json({ error: error.message }, { status: 404 });
      }
      if (error.message === "You don't have access to this property") {
        return NextResponse.json({ error: error.message }, { status: 403 });
      }
    }

    return NextResponse.json(
      { error: "Failed to fetch property" },
      { status: 500 }
    );
  }
}

// PUT /api/properties/[id] - Update property (Agent only)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 1. 身份验证
    const session = await auth();
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. 获取参数和请求体
    const { id } = await params;
    const body = await request.json();
    const { title, address, rent, tenantId } = body;

    // 3. 调用 Service 层
    const property = await propertyService.updateProperty(
      id,
      session.user.id,
      session.user.role,
      { title, address, rent, tenantId }
    );

    // 4. 返回响应
    return NextResponse.json({
      success: true,
      property: {
        id: property.id,
        title: property.title,
        address: property.address,
        rent: property.rent,
        tenantId: property.tenantId,
      },
    });
  } catch (error) {
    console.error("Failed to update property:", error);

    if (error instanceof Error) {
      if (error.message === "Only agents can update properties") {
        return NextResponse.json({ error: error.message }, { status: 403 });
      }
      if (error.message === "Property not found") {
        return NextResponse.json({ error: error.message }, { status: 404 });
      }
      if (error.message === "You don't have access to this property") {
        return NextResponse.json({ error: error.message }, { status: 403 });
      }
    }

    return NextResponse.json(
      { error: "Failed to update property" },
      { status: 500 }
    );
  }
}

// DELETE /api/properties/[id] - Delete property (Agent only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 1. 身份验证
    const session = await auth();
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. 获取参数
    const { id } = await params;

    // 3. 调用 Service 层
    await propertyService.deleteProperty(
      id,
      session.user.id,
      session.user.role
    );

    // 4. 返回响应
    return NextResponse.json({
      success: true,
      message: "Property deleted successfully",
    });
  } catch (error) {
    console.error("Failed to delete property:", error);

    if (error instanceof Error) {
      if (error.message === "Only agents can delete properties") {
        return NextResponse.json({ error: error.message }, { status: 403 });
      }
      if (error.message === "Property not found") {
        return NextResponse.json({ error: error.message }, { status: 404 });
      }
      if (error.message === "You don't have access to this property") {
        return NextResponse.json({ error: error.message }, { status: 403 });
      }
    }

    return NextResponse.json(
      { error: "Failed to delete property" },
      { status: 500 }
    );
  }
}
