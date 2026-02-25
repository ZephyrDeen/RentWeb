import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/app/lib/auth";
import { propertyService } from "@/app/services/property.service";

/**
 * Controller Layer - Property API Routes
 * 职责：处理 HTTP 请求和响应，调用 Service 层
 */

// GET /api/properties - Get properties list
export async function GET() {
  try {
    // 1. 身份验证
    const session = await auth();
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. 调用 Service 层
    const result = await propertyService.getPropertiesByUser(
      session.user.id,
      session.user.role
    );

    // 3. 返回响应（根据角色返回不同格式）
    if (session.user.role === "AGENT") {
      return NextResponse.json({ properties: result });
    } else {
      return NextResponse.json({ property: result });
    }
  } catch (error) {
    console.error("Failed to fetch properties:", error);
    return NextResponse.json(
      { error: "Failed to fetch properties" },
      { status: 500 }
    );
  }
}

// POST /api/properties - Add new property (Agent only)
export async function POST(request: NextRequest) {
  try {
    // 1. 身份验证
    const session = await auth();
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. 解析请求体
    const body = await request.json();
    const { title, address, rent } = body;

    // 3. 调用 Service 层
    const property = await propertyService.createProperty(
      session.user.id,
      session.user.role,
      { title, address, rent }
    );

    // 4. 返回响应
    return NextResponse.json({
      success: true,
      property: {
        id: property.id,
        title: property.title,
        address: property.address,
        rent: property.rent,
      },
    });
  } catch (error) {
    console.error("Failed to create property:", error);

    if (error instanceof Error) {
      if (error.message === "Only agents can add properties") {
        return NextResponse.json({ error: error.message }, { status: 403 });
      }
      if (
        error.message === "Title, address, and rent are required" ||
        error.message === "Rent must be a positive number"
      ) {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }
    }

    return NextResponse.json(
      { error: "Failed to create property" },
      { status: 500 }
    );
  }
}
