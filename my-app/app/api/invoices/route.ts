import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/app/lib/auth";
import { invoiceService } from "@/app/services/invoice.service";

/**
 * Controller Layer - Invoice API Routes
 * 职责：处理 HTTP 请求和响应，调用 Service 层
 */

// GET /api/invoices - Get invoices list
export async function GET() {
  try {
    // 1. 身份验证
    const session = await auth();
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. 调用 Service 层
    const invoices = await invoiceService.getInvoicesByUser(
      session.user.id,
      session.user.role
    );

    // 3. 返回响应
    return NextResponse.json({ invoices });
  } catch (error) {
    console.error("Failed to fetch invoices:", error);
    return NextResponse.json(
      { error: "Failed to fetch invoices" },
      { status: 500 }
    );
  }
}

// POST /api/invoices - Create new invoice (Agent only)
export async function POST(request: NextRequest) {
  try {
    // 1. 身份验证
    const session = await auth();
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. 解析请求体
    const body = await request.json();
    const { propertyId, amount, dueDate, billingMonth } = body;

    // 3. 调用 Service 层
    const invoice = await invoiceService.createInvoice(
      session.user.id,
      session.user.role,
      { propertyId, amount, dueDate, billingMonth }
    );

    // 4. 返回响应
    return NextResponse.json({
      success: true,
      invoice: {
        id: invoice.id,
        amount: invoice.amount,
        dueDate: invoice.dueDate,
        status: invoice.status,
      },
    });
  } catch (error) {
    console.error("Failed to create invoice:", error);

    if (error instanceof Error) {
      if (error.message === "Only agents can create invoices") {
        return NextResponse.json({ error: error.message }, { status: 403 });
      }
      if (
        error.message === "Property, amount, due date, and billing month are required" ||
        error.message === "Property has no tenant assigned"
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
      { error: "Failed to create invoice" },
      { status: 500 }
    );
  }
}
