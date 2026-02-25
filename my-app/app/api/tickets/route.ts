import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/app/lib/auth";
import { ticketService } from "@/app/services/ticket.service";
import { applyRateLimit } from "@/app/lib/rate-limit";

/**
 * Controller Layer - Ticket API Routes
 * 职责：处理 HTTP 请求和响应，调用 Service 层
 */

// GET /api/tickets - Get tickets list (with pagination support)
// Query params: ?page=1&pageSize=10
export async function GET(request: NextRequest) {
  try {
    // 1. 身份验证
    const session = await auth();
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. 解析分页参数
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get("page") || "1", 10);
    const pageSize = parseInt(searchParams.get("pageSize") || "10", 10);

    // 3. 调用 Service 层（带分页）
    const result = await ticketService.getTicketsByUser(
      session.user.id,
      session.user.role,
      { page, pageSize }
    );

    // 4. 返回响应
    return NextResponse.json({
      tickets: result.data,
      pagination: result.pagination,
    });
  } catch (error) {
    console.error("Failed to fetch tickets:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch tickets" },
      { status: 500 }
    );
  }
}

// POST /api/tickets - Create new ticket (Tenant only)
export async function POST(request: NextRequest) {
  try {
    // 1. 身份验证
    const session = await auth();
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. 限流检查（防止恶意创建大量工单）
    const rateLimitResponse = await applyRateLimit(session.user.id, "createTicket");
    if (rateLimitResponse) {
      return rateLimitResponse;
    }

    // 3. 解析请求体
    const body = await request.json();
    const { title, description, isUrgent } = body;

    // 4. 调用 Service 层
    const ticket = await ticketService.createTicket(
      session.user.id,
      session.user.role,
      { title, description, isUrgent }
    );

    // 5. 返回响应
    return NextResponse.json({
      success: true,
      ticket: {
        id: ticket.id,
        title: ticket.title,
        description: ticket.description,
        isUrgent: ticket.isUrgent,
        status: ticket.status,
      },
    });
  } catch (error) {
    console.error("Failed to create ticket:", error);

    // 根据错误类型返回不同的状态码
    if (error instanceof Error) {
      if (error.message === "Only tenants can create tickets") {
        return NextResponse.json({ error: error.message }, { status: 403 });
      }
      if (error.message === "You don't have a rented property") {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }
      if (error.message === "Title and description are required") {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }
    }

    return NextResponse.json(
      { error: "Failed to create ticket" },
      { status: 500 }
    );
  }
}
