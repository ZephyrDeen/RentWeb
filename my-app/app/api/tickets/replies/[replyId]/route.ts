import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/app/lib/auth";
import { ticketReplyService } from "@/app/services/ticket-reply.service";

/**
 * Controller Layer - Individual TicketReply API Routes
 * 职责：处理单个回复的 HTTP 请求和响应
 */

// PUT /api/tickets/replies/[replyId] - Update a reply
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ replyId: string }> }
) {
  try {
    // 1. 身份验证
    const session = await auth();
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. 获取参数和请求体
    const { replyId } = await params;
    const body = await request.json();
    const { content } = body;

    // 3. 调用 Service 层
    const updatedReply = await ticketReplyService.updateReply(
      replyId,
      session.user.id,
      content
    );

    // 4. 返回响应
    return NextResponse.json({
      success: true,
      reply: {
        id: updatedReply.id,
        content: updatedReply.content,
        updatedAt: updatedReply.updatedAt,
      },
    });
  } catch (error) {
    console.error("Failed to update reply:", error);

    if (error instanceof Error) {
      if (error.message === "Reply not found") {
        return NextResponse.json({ error: error.message }, { status: 404 });
      }
      if (error.message === "You can only edit your own replies") {
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
      { error: "Failed to update reply" },
      { status: 500 }
    );
  }
}

// DELETE /api/tickets/replies/[replyId] - Delete a reply
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ replyId: string }> }
) {
  try {
    // 1. 身份验证
    const session = await auth();
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. 获取参数
    const { replyId } = await params;

    // 3. 调用 Service 层
    await ticketReplyService.deleteReply(replyId, session.user.id);

    // 4. 返回响应
    return NextResponse.json({
      success: true,
      message: "Reply deleted successfully",
    });
  } catch (error) {
    console.error("Failed to delete reply:", error);

    if (error instanceof Error) {
      if (error.message === "Reply not found") {
        return NextResponse.json({ error: error.message }, { status: 404 });
      }
      if (error.message === "You can only delete your own replies") {
        return NextResponse.json({ error: error.message }, { status: 403 });
      }
    }

    return NextResponse.json(
      { error: "Failed to delete reply" },
      { status: 500 }
    );
  }
}
