import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/app/lib/auth";
import { inspectionService } from "@/app/services/inspection.service";

/**
 * Controller Layer - Inspection Detail API Routes
 * 职责：处理单个 Inspection 的 HTTP 请求和响应
 */

// GET /api/inspections/[id] - Get single inspection details
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
    const inspection = await inspectionService.getInspectionById(
      id,
      session.user.id,
      session.user.role
    );

    // 4. 返回响应
    return NextResponse.json({ inspection });
  } catch (error) {
    console.error("Failed to fetch inspection:", error);

    if (error instanceof Error) {
      if (error.message === "Inspection not found") {
        return NextResponse.json({ error: error.message }, { status: 404 });
      }
      if (error.message === "You don't have access to this inspection") {
        return NextResponse.json({ error: error.message }, { status: 403 });
      }
    }

    return NextResponse.json(
      { error: "Failed to fetch inspection" },
      { status: 500 }
    );
  }
}

// PUT /api/inspections/[id] - Update inspection (schedule, complete, cancel)
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
    const { action, selectedDate, notes } = body;

    let updatedInspection;

    // 3. 根据 action 调用不同的 Service 方法
    switch (action) {
      case "schedule":
        // 租户选择查房时间
        if (!selectedDate) {
          return NextResponse.json(
            { error: "Selected date is required" },
            { status: 400 }
          );
        }
        updatedInspection = await inspectionService.scheduleInspection(
          id,
          session.user.id,
          session.user.role,
          selectedDate
        );
        break;

      case "complete":
        // 中介标记查房完成
        updatedInspection = await inspectionService.completeInspection(
          id,
          session.user.id,
          session.user.role,
          notes
        );
        break;

      case "cancel":
        // 取消查房
        updatedInspection = await inspectionService.cancelInspection(
          id,
          session.user.id,
          session.user.role
        );
        break;

      default:
        return NextResponse.json(
          { error: "Invalid action. Must be 'schedule', 'complete', or 'cancel'" },
          { status: 400 }
        );
    }

    // 4. 返回响应
    return NextResponse.json({
      success: true,
      inspection: {
        id: updatedInspection.id,
        status: updatedInspection.status,
        scheduledDate: updatedInspection.scheduledDate,
        completedAt: updatedInspection.completedAt,
      },
    });
  } catch (error) {
    console.error("Failed to update inspection:", error);

    if (error instanceof Error) {
      if (error.message === "Inspection not found") {
        return NextResponse.json({ error: error.message }, { status: 404 });
      }
      if (
        error.message === "You don't have access to this inspection" ||
        error.message === "Only tenants can schedule inspections" ||
        error.message === "Only agents can complete inspections"
      ) {
        return NextResponse.json({ error: error.message }, { status: 403 });
      }
      if (
        error.message === "Inspection is not pending schedule" ||
        error.message === "Selected date is not in the available dates list" ||
        error.message === "Inspection must be scheduled before completion" ||
        error.message === "Cannot cancel a completed inspection"
      ) {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }
    }

    return NextResponse.json(
      { error: "Failed to update inspection" },
      { status: 500 }
    );
  }
}

// DELETE /api/inspections/[id] - Delete inspection (Agent only)
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
    await inspectionService.deleteInspection(
      id,
      session.user.id,
      session.user.role
    );

    // 4. 返回响应
    return NextResponse.json({
      success: true,
      message: "Inspection deleted successfully",
    });
  } catch (error) {
    console.error("Failed to delete inspection:", error);

    if (error instanceof Error) {
      if (error.message === "Only agents can delete inspections") {
        return NextResponse.json({ error: error.message }, { status: 403 });
      }
      if (error.message === "Inspection not found") {
        return NextResponse.json({ error: error.message }, { status: 404 });
      }
      if (error.message === "You don't have access to this inspection") {
        return NextResponse.json({ error: error.message }, { status: 403 });
      }
    }

    return NextResponse.json(
      { error: "Failed to delete inspection" },
      { status: 500 }
    );
  }
}
