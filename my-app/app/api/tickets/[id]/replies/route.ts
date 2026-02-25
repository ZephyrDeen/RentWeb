import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/app/lib/auth";
import { ticketReplyService } from "@/app/services/ticket-reply.service";

/**
 * Controller Layer - TicketReply API Routes
 * 职责：处理 HTTP 请求和响应，调用 Service 层
 */

// GET /api/tickets/[id]/replies - Get all replies for a ticket
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
    const { id: ticketId } = await params;

    // 3. 调用 Service 层
    const replies = await ticketReplyService.getRepliesByTicketId(
      ticketId,
      session.user.id,
      session.user.role
    );

    // 4. 返回响应
    return NextResponse.json({ replies });
  } catch (error) {
    console.error("Failed to fetch ticket replies:", error);

    if (error instanceof Error) {
      if (error.message === "Ticket not found") {
        return NextResponse.json({ error: error.message }, { status: 404 });
      }
      if (error.message === "You don't have access to this ticket") {
        return NextResponse.json({ error: error.message }, { status: 403 });
      }
    }

    return NextResponse.json(
      { error: "Failed to fetch replies" },
      { status: 500 }
    );
  }
}

// POST /api/tickets/[id]/replies - Create a new reply
export async function POST(
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
    const { id: ticketId } = await params;
    const body = await request.json();
    const { content } = body;

    // 3. 调用 Service 层
    const reply = await ticketReplyService.createReply(
      ticketId,
      session.user.id,
      session.user.role,
      content
    );

    // 4. 返回响应
    return NextResponse.json({
      success: true,
      reply: {
        id: reply.id,
        content: reply.content,
        createdAt: reply.createdAt,
        user: reply.user,
      },
    });
  } catch (error) {
    console.error("Failed to create ticket reply:", error);

    if (error instanceof Error) {
      if (error.message === "Ticket not found") {
        return NextResponse.json({ error: error.message }, { status: 404 });
      }
      if (
        error.message === "You don't have access to this ticket" ||
        error.message === "Cannot reply to a closed ticket"
      ) {
        return NextResponse.json({ error: error.message }, { status: 403 });
      }
      if (
        error.message === "Reply content cannot be empty" ||
        error.message.includes("Reply content is too long")
      ) {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }
    }

    return NextResponse.json(
      { error: "Failed to create reply" },
      { status: 500 }
    );
  }
}
