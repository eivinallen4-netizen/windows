import { NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/auth";
import { readAppConfig } from "@/lib/app-config";
import {
  getAllowedBlocksForDay,
  getWeekStartDateKey,
  isShiftWithinAllowedBlocks,
  type ScheduleWindowsConfig,
  type WeeklyScheduleRecord,
} from "@/lib/schedule-types";
import { normalizeWeeklyScheduleRecord, readWeeklySchedule, writeWeeklySchedule } from "@/lib/schedules";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const weekStart = getWeekStartDateKey(searchParams.get("weekStart") ?? undefined);
    const record = await readWeeklySchedule(weekStart);
    const appConfig = await readAppConfig();

    if (session.role === "admin") {
      return NextResponse.json({ weekStart, record, scheduleWindows: appConfig.scheduleWindows });
    }

    const ownShifts = record.shifts.filter(
      (shift) => shift.userId === session.userId && shift.role === session.role
    );

    return NextResponse.json({
      weekStart,
      scheduleWindows: appConfig.scheduleWindows,
      record: {
        ...record,
        repActiveUserIds: session.role === "rep" ? record.repActiveUserIds.filter((id) => id === session.userId) : [],
        techActiveUserIds: session.role === "tech" ? record.techActiveUserIds.filter((id) => id === session.userId) : [],
        shifts: ownShifts,
      },
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Unable to load schedules." }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session || session.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const body = (await request.json()) as { record?: WeeklyScheduleRecord };
    if (!body.record) {
      return NextResponse.json({ error: "Schedule record is required." }, { status: 400 });
    }

    const normalized = normalizeWeeklyScheduleRecord(body.record, body.record.weekStart);
    const appConfig = await readAppConfig();

    const invalidShift = normalized.shifts.find((shift) => {
      const blocks = getAllowedBlocksForDay(appConfig.scheduleWindows as ScheduleWindowsConfig, shift.role, shift.day);
      return !isShiftWithinAllowedBlocks(blocks, shift.startMinute, shift.endMinute);
    });

    if (invalidShift) {
      return NextResponse.json({ error: "One or more shifts fall outside the allowed time windows." }, { status: 400 });
    }

    normalized.updated_at = new Date().toISOString();
    normalized.updated_by = session.email;
    await writeWeeklySchedule(normalized);

    return NextResponse.json({ record: normalized });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Unable to save schedule." }, { status: 500 });
  }
}
