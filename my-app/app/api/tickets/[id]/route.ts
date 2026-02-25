import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/app/lib/auth";
import { ticketService } from "@/app/services/ticket.service";

/**
 * Controller Layer - Ticket Detail API Routes
 * 职责：处理单个 Ticket 的 HTTP 请求和响应
 */

// GET /api/tickets/[id] - Get single ticket details
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
    const ticket = await ticketService.getTicketById(
      id,
      session.user.id,
      session.user.role
    );

    // 4. 返回响应
    return NextResponse.json({ ticket });
  } catch (error) {
    console.error("Failed to fetch ticket:", error);

    if (error instanceof Error) {
      if (error.message === "Ticket not found") {
        return NextResponse.json({ error: error.message }, { status: 404 });
      }
      if (error.message === "You don't have access to this ticket") {
        return NextResponse.json({ error: error.message }, { status: 403 });
      }
    }

    return NextResponse.json(
      { error: "Failed to fetch ticket" },
      { status: 500 }
    );
  }
}

// PUT /api/tickets/[id] - Update ticket status (Agent only)
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
    const { status } = body;

    // 3. 调用 Service 层
    const ticket = await ticketService.updateTicketStatus(
      id,
      session.user.id,
      session.user.role,
      status
    );

    // 4. 返回响应
    return NextResponse.json({
      success: true,
      ticket: {
        id: ticket.id,
        title: ticket.title,
        status: ticket.status,
      },
    });
  } catch (error) {
    console.error("Failed to update ticket:", error);

    if (error instanceof Error) {
      if (error.message === "Only agents can update tickets") {
        return NextResponse.json({ error: error.message }, { status: 403 });
      }
      if (error.message === "Ticket not found") {
        return NextResponse.json({ error: error.message }, { status: 404 });
      }
      if (error.message === "You don't have access to this ticket") {
        return NextResponse.json({ error: error.message }, { status: 403 });
      }
      if (error.message === "Invalid status") {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }
    }

    return NextResponse.json(
      { error: "Failed to update ticket" },
      { status: 500 }
    );
  }
}

// DELETE /api/tickets/[id] - Delete ticket (Agent only)
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
    await ticketService.deleteTicket(
      id,
      session.user.id,
      session.user.role
    );

    // 4. 返回响应
    return NextResponse.json({
      success: true,
      message: "Ticket deleted successfully",
    });
  } catch (error) {
    console.error("Failed to delete ticket:", error);

    if (error instanceof Error) {
      if (error.message === "Only agents can delete tickets") {
        return NextResponse.json({ error: error.message }, { status: 403 });
      }
      if (error.message === "Ticket not found") {
        return NextResponse.json({ error: error.message }, { status: 404 });
      }
      if (error.message === "You don't have access to this ticket") {
        return NextResponse.json({ error: error.message }, { status: 403 });
      }
    }

    return NextResponse.json(
      { error: "Failed to delete ticket" },
      { status: 500 }
    );
  }
}
