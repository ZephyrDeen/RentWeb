import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/app/lib/auth";
import { invoiceService } from "@/app/services/invoice.service";

/**
 * Controller Layer - Invoice Detail API Routes
 * 职责：处理单个 Invoice 的 HTTP 请求和响应
 */

// GET /api/invoices/[id] - Get single invoice details
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
    const invoice = await invoiceService.getInvoiceById(
      id,
      session.user.id,
      session.user.role
    );

    // 4. 返回响应
    return NextResponse.json({ invoice });
  } catch (error) {
    console.error("Failed to fetch invoice:", error);

    if (error instanceof Error) {
      if (error.message === "Invoice not found") {
        return NextResponse.json({ error: error.message }, { status: 404 });
      }
      if (error.message === "You don't have access to this invoice") {
        return NextResponse.json({ error: error.message }, { status: 403 });
      }
    }

    return NextResponse.json(
      { error: "Failed to fetch invoice" },
      { status: 500 }
    );
  }
}

// PUT /api/invoices/[id] - Update invoice (mark as paid, etc.)
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
    const { status, stripePaymentId } = body;

    // 3. 调用 Service 层
    const updatedInvoice = await invoiceService.updateInvoice(
      id,
      session.user.id,
      session.user.role,
      { status, stripePaymentId }
    );

    // 4. 返回响应
    return NextResponse.json({
      success: true,
      invoice: {
        id: updatedInvoice.id,
        status: updatedInvoice.status,
        paidAt: updatedInvoice.paidAt,
      },
    });
  } catch (error) {
    console.error("Failed to update invoice:", error);

    if (error instanceof Error) {
      if (error.message === "Invoice not found") {
        return NextResponse.json({ error: error.message }, { status: 404 });
      }
      if (error.message === "You don't have access to this invoice") {
        return NextResponse.json({ error: error.message }, { status: 403 });
      }
      if (error.message === "Invalid status") {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }
    }

    return NextResponse.json(
      { error: "Failed to update invoice" },
      { status: 500 }
    );
  }
}

// DELETE /api/invoices/[id] - Delete invoice (Agent only)
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
    await invoiceService.deleteInvoice(
      id,
      session.user.id,
      session.user.role
    );

    // 4. 返回响应
    return NextResponse.json({
      success: true,
      message: "Invoice deleted successfully",
    });
  } catch (error) {
    console.error("Failed to delete invoice:", error);

    if (error instanceof Error) {
      if (error.message === "Only agents can delete invoices") {
        return NextResponse.json({ error: error.message }, { status: 403 });
      }
      if (error.message === "Invoice not found") {
        return NextResponse.json({ error: error.message }, { status: 404 });
      }
      if (error.message === "You don't have access to this invoice") {
        return NextResponse.json({ error: error.message }, { status: 403 });
      }
      if (error.message === "Cannot delete a paid invoice") {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }
    }

    return NextResponse.json(
      { error: "Failed to delete invoice" },
      { status: 500 }
    );
  }
}
