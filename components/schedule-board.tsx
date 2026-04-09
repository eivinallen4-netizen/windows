"use client";

import { Trash2 } from "lucide-react";
import { memo, useEffect, useMemo, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  SCHEDULE_SLOT_MINUTES,
  findAllowedBlockContainingMinute,
  formatDayLabel,
  formatMinuteLabel,
  getAllowedBlocksForDay,
  getWeekDateKeys,
  type ScheduleRole,
  type ScheduleShift,
  type ScheduleWindowsConfig,
  type WeeklyAllowedWindows,
} from "@/lib/schedule-types";

type WorkerOption = { id: string; name: string; email?: string };
type DragMode = "move" | "resize-start" | "resize-end";
type PreviewValidity = "valid" | "invalid-overlap" | "invalid-window";

type ScheduleBoardProps = {
  title: string;
  description: string;
  role: ScheduleRole;
  weekStart: string;
  shifts: ScheduleShift[];
  workers: WorkerOption[];
  activeUserIds: string[];
  allowedWindows: ScheduleWindowsConfig | WeeklyAllowedWindows;
  canEdit?: boolean;
  onToggleActiveUser?: (userId: string) => void;
  onCreateShift?: (args: { userId: string; day: string; startMinute: number; endMinute?: number }) => void;
  onMoveShiftGroup?: (args: { shiftIds: string[]; day: string; startMinute: number }) => void;
  onResizeShiftGroup?: (args: { shiftIds: string[]; day: string; startMinute: number; endMinute: number }) => void;
  onDeleteShift?: (shiftId: string) => void;
};

const SLOT_HEIGHT = 40;
const BLOCK_GAP = 12;

type BlockLayout = { startMinute: number; endMinute: number; top: number; height: number };
type DayLayout = { day: string; blocks: BlockLayout[]; totalHeight: number };
type ShiftLane = { left: string; width: string };
type ShiftBlob = { key: string; day: string; startMinute: number; endMinute: number; shifts: ScheduleShift[] };
type PreviewState = {
  blobKey: string;
  shiftIds: string[];
  day: string;
  startMinute: number;
  endMinute: number;
  mode: DragMode;
  validity: PreviewValidity;
};
type DragState = {
  blobKey: string;
  shifts: Array<{ id: string; userId: string }>;
  day: string;
  mode: DragMode;
  duration: number;
  originalStartMinute: number;
  originalEndMinute: number;
  pointerOffsetMinutes: number;
};

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function getBlockHeight(startMinute: number, endMinute: number) {
  return ((endMinute - startMinute) / SCHEDULE_SLOT_MINUTES) * SLOT_HEIGHT;
}

function getMinuteFromY(dayLayout: DayLayout, y: number) {
  if (dayLayout.blocks.length === 0) return null;
  for (const block of dayLayout.blocks) {
    if (y >= block.top && y <= block.top + block.height) {
      const slots = Math.round((y - block.top) / SLOT_HEIGHT);
      return clamp(
        block.startMinute + slots * SCHEDULE_SLOT_MINUTES,
        block.startMinute,
        block.endMinute - SCHEDULE_SLOT_MINUTES
      );
    }
  }

  const first = dayLayout.blocks[0];
  const last = dayLayout.blocks[dayLayout.blocks.length - 1];
  if (y < first.top) return first.startMinute;
  if (y > last.top + last.height) return last.endMinute - SCHEDULE_SLOT_MINUTES;

  for (let index = 0; index < dayLayout.blocks.length - 1; index += 1) {
    const current = dayLayout.blocks[index];
    const next = dayLayout.blocks[index + 1];
    const gapStart = current.top + current.height;
    const gapEnd = next.top;
    if (y > gapStart && y < gapEnd) {
      return y - gapStart < gapEnd - y ? current.endMinute - SCHEDULE_SLOT_MINUTES : next.startMinute;
    }
  }

  return first.startMinute;
}

function fitStartMinuteIntoBlocks(blocks: BlockLayout[], requestedStartMinute: number, duration: number) {
  const candidates = blocks
    .map((block) => {
      const latestStart = block.endMinute - duration;
      if (latestStart < block.startMinute) return null;
      const startMinute = clamp(requestedStartMinute, block.startMinute, latestStart);
      return { startMinute, endMinute: startMinute + duration, distance: Math.abs(startMinute - requestedStartMinute) };
    })
    .filter((candidate): candidate is { startMinute: number; endMinute: number; distance: number } => Boolean(candidate))
    .toSorted((a, b) => a.distance - b.distance);
  return candidates[0] ?? null;
}

function hasAnyGroupOverlap(
  shifts: ScheduleShift[],
  movingShifts: Array<{ id: string; userId: string }>,
  day: string,
  startMinute: number,
  endMinute: number
) {
  return movingShifts.some((movingShift) =>
    shifts.some(
      (shift) =>
        shift.id !== movingShift.id &&
        shift.userId === movingShift.userId &&
        shift.day === day &&
        shift.startMinute < endMinute &&
        startMinute < shift.endMinute
    )
  );
}

function isPreviewInvalid(preview: PreviewState | null) {
  return preview !== null && preview.validity !== "valid";
}

function getPreviewStatusLabel(preview: PreviewState | null) {
  if (!preview) return "Scheduled";
  if (preview.validity === "invalid-overlap") return "Overlap blocked";
  if (preview.validity === "invalid-window") return "Window locked";
  return preview.mode === "move" ? "Moving" : "Stretching";
}

function getShiftPosition(shift: { startMinute: number; endMinute: number }, blocks: BlockLayout[]) {
  const block = findAllowedBlockContainingMinute(blocks, shift.startMinute);
  const blockLayout = blocks.find((entry) => entry.startMinute === block?.startMinute && entry.endMinute === block?.endMinute);
  if (!block || !blockLayout) return null;
  return {
    top: blockLayout.top + ((shift.startMinute - block.startMinute) / SCHEDULE_SLOT_MINUTES) * SLOT_HEIGHT,
    height: Math.max(((shift.endMinute - shift.startMinute) / SCHEDULE_SLOT_MINUTES) * SLOT_HEIGHT, SLOT_HEIGHT),
  };
}

function getDayFromPointer(
  refs: Record<string, HTMLDivElement | null>,
  dayLayouts: DayLayout[],
  clientX: number,
  fallbackDay: string
) {
  for (const layout of dayLayouts) {
    const node = refs[layout.day];
    if (!node) continue;
    const rect = node.getBoundingClientRect();
    if (clientX >= rect.left && clientX <= rect.right) return layout.day;
  }
  return fallbackDay;
}

function getShiftLaneMap(blobs: Array<{ key: string; startMinute: number; endMinute: number }>) {
  const laneMap = new Map<string, ShiftLane>();
  if (blobs.length === 0) return laneMap;
  const sorted = [...blobs].toSorted((a, b) =>
    a.startMinute !== b.startMinute ? a.startMinute - b.startMinute : a.endMinute !== b.endMinute ? a.endMinute - b.endMinute : a.key.localeCompare(b.key)
  );
  const groups: typeof sorted[] = [];
  let currentGroup: typeof sorted = [];
  let currentGroupEnd = -1;
  for (const blob of sorted) {
    if (currentGroup.length === 0 || blob.startMinute < currentGroupEnd) {
      currentGroup.push(blob);
      currentGroupEnd = Math.max(currentGroupEnd, blob.endMinute);
    } else {
      groups.push(currentGroup);
      currentGroup = [blob];
      currentGroupEnd = blob.endMinute;
    }
  }
  if (currentGroup.length > 0) groups.push(currentGroup);
  for (const group of groups) {
    const columnEndMinutes: number[] = [];
    const assignments = new Map<string, number>();
    for (const blob of group) {
      let columnIndex = columnEndMinutes.findIndex((endMinute) => endMinute <= blob.startMinute);
      if (columnIndex === -1) {
        columnIndex = columnEndMinutes.length;
        columnEndMinutes.push(blob.endMinute);
      } else {
        columnEndMinutes[columnIndex] = blob.endMinute;
      }
      assignments.set(blob.key, columnIndex);
    }
    const columnCount = Math.max(columnEndMinutes.length, 1);
    const gapPercent = columnCount > 1 ? 1.2 : 0;
    const widthPercent = (100 - gapPercent * (columnCount - 1)) / columnCount;
    for (const blob of group) {
      const columnIndex = assignments.get(blob.key) ?? 0;
      laneMap.set(blob.key, {
        left: `${columnIndex * (widthPercent + gapPercent)}%`,
        width: `${widthPercent}%`,
      });
    }
  }
  return laneMap;
}

function buildShiftBlobs(shifts: ScheduleShift[], preview: PreviewState | null) {
  const grouped = new Map<string, ShiftBlob>();
  for (const shift of shifts) {
    const effectivePreview = preview?.shiftIds.includes(shift.id) ? preview : null;
    const day = effectivePreview?.day ?? shift.day;
    const startMinute = effectivePreview?.startMinute ?? shift.startMinute;
    const endMinute = effectivePreview?.endMinute ?? shift.endMinute;
    const key = `${day}:${startMinute}:${endMinute}`;
    const existing = grouped.get(key);
    if (existing) {
      existing.shifts.push(shift);
    } else {
      grouped.set(key, { key, day, startMinute, endMinute, shifts: [shift] });
    }
  }
  return [...grouped.values()].map((blob) => ({ ...blob, shifts: blob.shifts.toSorted((a, b) => a.userId.localeCompare(b.userId)) }));
}

type ScheduleShiftBlobCardProps = {
  activeMemberId: string | null;
  blob: ShiftBlob;
  canEdit: boolean;
  isActivePreview: boolean;
  isRejected: boolean;
  lane: ShiftLane;
  onCreateShift?: (args: { userId: string; day: string; startMinute: number; endMinute?: number }) => void;
  onDeleteShift?: (shiftId: string) => void;
  onSelectMember: (shiftId: string) => void;
  onStartDrag: (
    mode: DragMode,
    blob: ShiftBlob,
    selectedShiftId: string | null,
    event: ReactPointerEvent<HTMLDivElement>
  ) => void;
  preview: PreviewState | null;
  role: ScheduleRole;
  workerMap: Map<string, WorkerOption>;
};

const ScheduleShiftBlobCard = memo(function ScheduleShiftBlobCard({
  activeMemberId,
  blob,
  canEdit,
  isActivePreview,
  isRejected,
  lane,
  onCreateShift,
  onDeleteShift,
  onSelectMember,
  onStartDrag,
  preview,
  role,
  workerMap,
}: ScheduleShiftBlobCardProps) {
  const invalid = isPreviewInvalid(preview);
  const isResizing = isActivePreview && (preview?.mode === "resize-start" || preview?.mode === "resize-end");
  const selectedShiftId = activeMemberId && blob.shifts.some((shift) => shift.id === activeMemberId) ? activeMemberId : null;
  const deleteTargetShiftId = selectedShiftId ?? (blob.shifts.length === 1 ? blob.shifts[0]?.id : null);

  return (
    <div
      className={`schedule-shift-card absolute z-10 overflow-hidden rounded-[22px] border px-3 py-3 text-white ${
        invalid
          ? "border-rose-400/70 bg-rose-500/18"
          : role === "rep"
            ? "border-[#0ea5e9]/35 bg-[#0ea5e9]/18"
            : "border-emerald-400/30 bg-emerald-400/15"
      } ${canEdit ? "touch-none" : ""}`}
      data-dragging={isActivePreview}
      data-invalid={invalid}
      data-rejected={isRejected}
      data-resizing={isResizing}
      style={{ top: 0, left: lane.left, width: lane.width, height: "100%" }}
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.16),transparent_48%),linear-gradient(180deg,rgba(255,255,255,0.08),transparent_40%,rgba(15,23,42,0.2)_100%)]" />
      {canEdit ? (
        <>
          <div
            onPointerDown={(event) => onStartDrag("resize-start", blob, selectedShiftId, event)}
            className="schedule-resize-handle absolute inset-x-2 top-0 z-20 h-5 cursor-ns-resize"
            data-active={isActivePreview && preview?.mode === "resize-start"}
          >
            <div className="mx-auto mt-1 h-1.5 w-16 rounded-full bg-white/25" />
          </div>
          <div
            onPointerDown={(event) => onStartDrag("resize-end", blob, selectedShiftId, event)}
            className="schedule-resize-handle absolute inset-x-2 bottom-0 z-20 h-5 cursor-ns-resize"
            data-active={isActivePreview && preview?.mode === "resize-end"}
          >
            <div className="mx-auto mt-[11px] h-1.5 w-16 rounded-full bg-white/25" />
          </div>
        </>
      ) : null}
      <div
        onPointerDown={canEdit ? (event) => onStartDrag("move", blob, selectedShiftId, event) : undefined}
        onDragOver={(event) => {
          if (canEdit) event.preventDefault();
        }}
        onDrop={(event) => {
          if (!canEdit) return;
          event.preventDefault();
          const payload = event.dataTransfer.getData("text/plain");
          if (!payload) return;
          try {
            const parsed = JSON.parse(payload) as { kind?: string; userId?: string; role?: ScheduleRole };
            if (parsed.kind === "worker" && parsed.role === role && parsed.userId) {
              onCreateShift?.({ userId: parsed.userId, day: blob.day, startMinute: blob.startMinute, endMinute: blob.endMinute });
            }
          } catch {
            // Ignore malformed payloads.
          }
        }}
        className={`relative flex h-full flex-col justify-between gap-3 rounded-[18px] border border-white/8 bg-black/10 px-1 ${
          canEdit ? "cursor-grab active:cursor-grabbing" : ""
        } ${canEdit ? "pb-2 pt-3" : ""}`}
      >
        <div className="space-y-2">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-white/55">
              {blob.shifts.length > 1 ? `${blob.shifts.length} people on shift` : "1 person on shift"}
            </p>
            <p className="text-xs text-white/75">
              {formatMinuteLabel(preview?.startMinute ?? blob.startMinute)} - {formatMinuteLabel(preview?.endMinute ?? blob.endMinute)}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {blob.shifts.length > 1 ? (
              <button
                type="button"
                onPointerDown={(event) => event.stopPropagation()}
                onClick={() => onSelectMember("")}
                className={`rounded-full border px-2.5 py-1 text-xs font-semibold transition ${
                  selectedShiftId === null
                    ? "border-white/60 bg-white/18 text-white"
                    : "border-white/15 bg-white/6 text-white/75 hover:border-white/35 hover:text-white"
                }`}
              >
                All
              </button>
            ) : null}
            {blob.shifts.map((shift) => {
              const isSelected = shift.id === selectedShiftId;
              return (
                <button
                  key={shift.id}
                  type="button"
                  onPointerDown={(event) => event.stopPropagation()}
                  onClick={() => onSelectMember(shift.id)}
                  className={`rounded-full border px-2.5 py-1 text-xs font-semibold transition ${
                    isSelected
                      ? "border-white/60 bg-white/18 text-white"
                      : "border-white/15 bg-white/6 text-white/75 hover:border-white/35 hover:text-white"
                  }`}
                >
                  {workerMap.get(shift.userId)?.name ?? "Assigned"}
                </button>
              );
            })}
          </div>
        </div>
        <div className="flex items-center justify-between gap-2">
          <span
            className={`text-[10px] font-semibold uppercase tracking-[0.22em] transition-opacity duration-200 ${
              invalid ? "text-rose-100" : "text-white/55"
            } ${isResizing || isActivePreview ? "opacity-100" : "opacity-70"}`}
          >
            {selectedShiftId && blob.shifts.length > 1 ? `${getPreviewStatusLabel(preview)} Selected` : getPreviewStatusLabel(preview)}
          </span>
          {canEdit && deleteTargetShiftId ? (
            <Button
              type="button"
              size="icon-xs"
              variant="secondary"
              className="rounded-full bg-black/20 text-white hover:bg-black/30"
              onPointerDown={(event) => event.stopPropagation()}
              onClick={() => onDeleteShift?.(deleteTargetShiftId)}
            >
              <Trash2 className="size-3" />
            </Button>
          ) : null}
        </div>
      </div>
    </div>
  );
});

export function ScheduleBoard({
  title,
  description,
  role,
  weekStart,
  shifts,
  workers,
  activeUserIds,
  allowedWindows,
  canEdit = false,
  onToggleActiveUser,
  onCreateShift,
  onMoveShiftGroup,
  onResizeShiftGroup,
  onDeleteShift,
}: ScheduleBoardProps) {
  const days = useMemo(() => getWeekDateKeys(weekStart), [weekStart]);
  const containerRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const dragStateRef = useRef<DragState | null>(null);
  const previewRef = useRef<PreviewState | null>(null);
  const releaseTimerRef = useRef<number | null>(null);
  const workerMap = useMemo(() => new Map(workers.map((worker) => [worker.id, worker])), [workers]);
  const activeWorkers = workers.filter((worker) => activeUserIds.includes(worker.id));
  const inactiveWorkers = workers.filter((worker) => !activeUserIds.includes(worker.id));
  const [preview, setPreview] = useState<PreviewState | null>(null);
  const [rejectedBlobKey, setRejectedBlobKey] = useState<string | null>(null);
  const [selectedShiftId, setSelectedShiftId] = useState<string | null>(null);

  const relevantShifts = useMemo(() => shifts.filter((shift) => shift.role === role), [role, shifts]);
  const dayLayouts = useMemo(
    () =>
      days.map((day) => {
        const blocks = getAllowedBlocksForDay(allowedWindows as ScheduleWindowsConfig, role, day);
        let cursor = 0;
        const blockLayouts = blocks.map((block, index) => {
          const top = cursor;
          const height = getBlockHeight(block.startMinute, block.endMinute);
          cursor += height + (index === blocks.length - 1 ? 0 : BLOCK_GAP);
          return { ...block, top, height };
        });
        return { day, blocks: blockLayouts, totalHeight: cursor };
      }),
    [allowedWindows, days, role]
  );
  const dayLayoutMap = useMemo(() => new Map(dayLayouts.map((layout) => [layout.day, layout])), [dayLayouts]);
  const shiftBlobs = useMemo(() => buildShiftBlobs(relevantShifts, preview), [preview, relevantShifts]);

  useEffect(() => {
    previewRef.current = preview;
  }, [preview]);

  useEffect(() => {
    return () => {
      if (releaseTimerRef.current) window.clearTimeout(releaseTimerRef.current);
    };
  }, []);

  useEffect(() => {
    if (!canEdit) return;

    function clearDrag() {
      dragStateRef.current = null;
      previewRef.current = null;
      setPreview(null);
    }

    function pulseRejectedBlob(blobKey: string) {
      if (releaseTimerRef.current) window.clearTimeout(releaseTimerRef.current);
      setRejectedBlobKey(blobKey);
      releaseTimerRef.current = window.setTimeout(() => setRejectedBlobKey(null), 420);
    }

    function handlePointerMove(event: PointerEvent) {
      const dragState = dragStateRef.current;
      if (!dragState) return;

      const targetDay =
        dragState.mode === "move"
          ? getDayFromPointer(containerRefs.current, dayLayouts, event.clientX, dragState.day)
          : dragState.day;
      const container = containerRefs.current[targetDay];
      const dayLayout = dayLayoutMap.get(targetDay);
      if (!container || !dayLayout) return;

      const rect = container.getBoundingClientRect();
      const relativeY = clamp(event.clientY - rect.top, 0, rect.height);
      const minuteAtPointer = getMinuteFromY(dayLayout, relativeY);
      if (minuteAtPointer === null) return;

      if (dragState.mode === "move") {
        const targetBlob =
          dragState.shifts.length === 1
            ? shiftBlobs.find(
                (blob) =>
                  blob.day === targetDay &&
                  !dragState.shifts.some((dragShift) => blob.shifts.some((blobShift) => blobShift.id === dragShift.id)) &&
                  minuteAtPointer >= blob.startMinute &&
                  minuteAtPointer < blob.endMinute
              )
            : null;
        if (targetBlob) {
          const nextPreview: PreviewState = {
            blobKey: targetBlob.key,
            shiftIds: dragState.shifts.map((shift) => shift.id),
            day: targetBlob.day,
            startMinute: targetBlob.startMinute,
            endMinute: targetBlob.endMinute,
            mode: "move",
            validity: hasAnyGroupOverlap(
              relevantShifts,
              dragState.shifts,
              targetBlob.day,
              targetBlob.startMinute,
              targetBlob.endMinute
            )
              ? "invalid-overlap"
              : "valid",
          };
          setPreview(nextPreview);
          previewRef.current = nextPreview;
          return;
        }

        const requestedStartMinute = minuteAtPointer - dragState.pointerOffsetMinutes;
        const fitted = fitStartMinuteIntoBlocks(dayLayout.blocks, requestedStartMinute, dragState.duration);
        if (!fitted) return;

        const nextPreview: PreviewState = {
          blobKey: dragState.blobKey,
          shiftIds: dragState.shifts.map((shift) => shift.id),
          day: targetDay,
          startMinute: fitted.startMinute,
          endMinute: fitted.endMinute,
          mode: "move",
          validity: hasAnyGroupOverlap(relevantShifts, dragState.shifts, targetDay, fitted.startMinute, fitted.endMinute)
            ? "invalid-overlap"
            : "valid",
        };
        setPreview(nextPreview);
        previewRef.current = nextPreview;
        return;
      }

      const allowedBlocks = getAllowedBlocksForDay(allowedWindows as ScheduleWindowsConfig, role, targetDay);
      const anchorMinute =
        dragState.mode === "resize-start" ? dragState.originalEndMinute - 1 : dragState.originalStartMinute;
      const fixedBlock = findAllowedBlockContainingMinute(allowedBlocks, anchorMinute);
      if (!fixedBlock) {
        const nextPreview: PreviewState = {
          blobKey: dragState.blobKey,
          shiftIds: dragState.shifts.map((shift) => shift.id),
          day: targetDay,
          startMinute: dragState.originalStartMinute,
          endMinute: dragState.originalEndMinute,
          mode: dragState.mode,
          validity: "invalid-window",
        };
        setPreview(nextPreview);
        previewRef.current = nextPreview;
        return;
      }

      const startMinute =
        dragState.mode === "resize-start"
          ? clamp(minuteAtPointer, fixedBlock.startMinute, dragState.originalEndMinute - SCHEDULE_SLOT_MINUTES)
          : dragState.originalStartMinute;
      const endMinute =
        dragState.mode === "resize-end"
          ? clamp(
              minuteAtPointer + SCHEDULE_SLOT_MINUTES,
              dragState.originalStartMinute + SCHEDULE_SLOT_MINUTES,
              fixedBlock.endMinute
            )
          : dragState.originalEndMinute;

      const nextPreview: PreviewState = {
        blobKey: dragState.blobKey,
        shiftIds: dragState.shifts.map((shift) => shift.id),
        day: targetDay,
        startMinute,
        endMinute,
        mode: dragState.mode,
        validity:
          endMinute - startMinute < SCHEDULE_SLOT_MINUTES
            ? "invalid-window"
            : hasAnyGroupOverlap(relevantShifts, dragState.shifts, targetDay, startMinute, endMinute)
              ? "invalid-overlap"
              : "valid",
      };
      setPreview(nextPreview);
      previewRef.current = nextPreview;
    }

    function handlePointerUp() {
      const dragState = dragStateRef.current;
      const currentPreview = previewRef.current;
      if (!dragState) return;
      if (!currentPreview) {
        clearDrag();
        return;
      }
      if (isPreviewInvalid(currentPreview)) {
        pulseRejectedBlob(dragState.blobKey);
        clearDrag();
        return;
      }

      if (dragState.mode === "move") {
        if (currentPreview.day !== dragState.day || currentPreview.startMinute !== dragState.originalStartMinute) {
          onMoveShiftGroup?.({
            shiftIds: currentPreview.shiftIds,
            day: currentPreview.day,
            startMinute: currentPreview.startMinute,
          });
        }
      } else if (
        currentPreview.startMinute !== dragState.originalStartMinute ||
        currentPreview.endMinute !== dragState.originalEndMinute
      ) {
        onResizeShiftGroup?.({
          shiftIds: currentPreview.shiftIds,
          day: currentPreview.day,
          startMinute: currentPreview.startMinute,
          endMinute: currentPreview.endMinute,
        });
      }

      clearDrag();
    }

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);
    window.addEventListener("pointercancel", handlePointerUp);
    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
      window.removeEventListener("pointercancel", handlePointerUp);
    };
  }, [allowedWindows, canEdit, dayLayoutMap, dayLayouts, onMoveShiftGroup, onResizeShiftGroup, relevantShifts, role, shiftBlobs]);

  function startDrag(
    mode: DragMode,
    blob: ShiftBlob,
    selectedShiftId: string | null,
    event: ReactPointerEvent<HTMLDivElement>
  ) {
    if (!canEdit) return;
    const dayLayout = dayLayoutMap.get(blob.day);
    const container = containerRefs.current[blob.day];
    if (!dayLayout || !container) return;
    const targetShifts =
      selectedShiftId && blob.shifts.some((shift) => shift.id === selectedShiftId)
        ? blob.shifts.filter((shift) => shift.id === selectedShiftId)
        : blob.shifts;
    const targetBlobKey =
      targetShifts.length === 1
        ? `${blob.day}:${blob.startMinute}:${blob.endMinute}:${targetShifts[0]?.id ?? "single"}`
        : blob.key;

    const rect = container.getBoundingClientRect();
    const relativeY = clamp(event.clientY - rect.top, 0, rect.height);
    const minuteAtPointer =
      mode === "move"
        ? (getMinuteFromY(dayLayout, relativeY) ?? blob.startMinute)
        : mode === "resize-start"
          ? blob.startMinute
          : blob.endMinute - SCHEDULE_SLOT_MINUTES;

    dragStateRef.current = {
      blobKey: targetBlobKey,
      shifts: targetShifts.map((shift) => ({ id: shift.id, userId: shift.userId })),
      day: blob.day,
      mode,
      duration: blob.endMinute - blob.startMinute,
      originalStartMinute: blob.startMinute,
      originalEndMinute: blob.endMinute,
      pointerOffsetMinutes: minuteAtPointer - blob.startMinute,
    };

    const nextPreview: PreviewState = {
      blobKey: targetBlobKey,
      shiftIds: targetShifts.map((shift) => shift.id),
      day: blob.day,
      startMinute: blob.startMinute,
      endMinute: blob.endMinute,
      mode,
      validity: "valid",
    };
    setPreview(nextPreview);
    previewRef.current = nextPreview;

    event.currentTarget.setPointerCapture(event.pointerId);
    event.preventDefault();
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-xl font-black tracking-tight text-slate-900">{title}</h3>
          <p className="mt-1 text-sm text-slate-600">{description}</p>
        </div>
        <Badge variant="secondary" className="rounded-full bg-slate-100 text-slate-700">
          {activeWorkers.length} active
        </Badge>
      </div>

      <div className="grid gap-5 lg:grid-cols-[280px_minmax(0,1fr)]">
        {canEdit ? (
          <aside className="lg:sticky lg:top-6 lg:self-start">
            <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Working This Week</p>
                <div className="flex flex-col gap-2">
                  {workers.map((worker) => {
                    const isActive = activeUserIds.includes(worker.id);
                    return (
                      <button
                        key={worker.id}
                        type="button"
                        onClick={() => onToggleActiveUser?.(worker.id)}
                        className={`rounded-xl border px-3 py-3 text-left text-sm transition ${
                          isActive
                            ? "border-primary/25 bg-primary/8 text-slate-900 shadow-sm"
                            : "border-slate-200 bg-slate-50 text-slate-600 hover:border-slate-300 hover:bg-white hover:text-slate-900"
                        }`}
                      >
                        <span className="block font-medium">{worker.name}</span>
                        {worker.email ? <span className="mt-1 block text-xs text-inherit/80">{worker.email}</span> : null}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-2 border-t border-slate-200 pt-4">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Drag Active Workers</p>
                {activeWorkers.length === 0 ? (
                  <p className="text-sm text-slate-500">Select who is working first.</p>
                ) : (
                  <div className="flex flex-col gap-2">
                    {activeWorkers.map((worker) => (
                      <div
                        key={worker.id}
                        draggable
                        onDragStart={(event) => {
                          event.dataTransfer.effectAllowed = "copyMove";
                          event.dataTransfer.setData("text/plain", JSON.stringify({ kind: "worker", userId: worker.id, role }));
                        }}
                        className="cursor-grab rounded-xl border border-primary/25 bg-primary/10 px-3 py-3 text-sm font-medium text-slate-900 transition-transform duration-150 active:scale-[0.98] active:cursor-grabbing"
                      >
                        {worker.name}
                      </div>
                    ))}
                  </div>
                )}
                {inactiveWorkers.length > 0 ? (
                  <p className="text-xs text-slate-500">Inactive: {inactiveWorkers.map((worker) => worker.name).join(", ")}</p>
                ) : null}
              </div>
            </div>
          </aside>
        ) : null}

        <div className="overflow-x-auto">
          <div className="grid min-w-[980px] grid-cols-7 gap-4">
            {dayLayouts.map((layout) => {
              const dayBlobs = shiftBlobs.filter((blob) => blob.day === layout.day);
              const laneMap = getShiftLaneMap(dayBlobs.map((blob) => ({ key: blob.key, startMinute: blob.startMinute, endMinute: blob.endMinute })));

              return (
                <div key={layout.day} className="space-y-3">
                  <div className="rounded-xl border border-slate-200 bg-white px-3 py-3 text-center text-sm font-semibold text-slate-900 shadow-sm">
                    {formatDayLabel(layout.day)}
                  </div>

                  {layout.blocks.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">
                      Unavailable
                    </div>
                  ) : (
                    <div
                      ref={(node) => {
                        containerRefs.current[layout.day] = node;
                      }}
                      className="relative space-y-3 touch-none px-2"
                      style={{ minHeight: layout.totalHeight }}
                    >
                      {layout.blocks.map((block, blockIndex) => (
                        <div
                          key={`${layout.day}-${blockIndex}`}
                          className="relative rounded-2xl border border-slate-200 bg-white shadow-[inset_0_1px_0_rgba(255,255,255,0.6)]"
                          style={{ height: block.height }}
                        >
                          {Array.from({ length: (block.endMinute - block.startMinute) / SCHEDULE_SLOT_MINUTES }, (_, slotIndex) => {
                            const minute = block.startMinute + slotIndex * SCHEDULE_SLOT_MINUTES;
                            return (
                              <div
                                key={`${layout.day}-${blockIndex}-${minute}`}
                                className="absolute inset-x-0 border-t border-slate-200 first:border-t-0"
                                style={{ top: slotIndex * SLOT_HEIGHT, height: SLOT_HEIGHT }}
                                onDragOver={(event) => {
                                  if (canEdit) event.preventDefault();
                                }}
                                onDrop={(event) => {
                                  if (!canEdit) return;
                                  event.preventDefault();
                                  const payload = event.dataTransfer.getData("text/plain");
                                  if (!payload) return;
                                  try {
                                    const parsed = JSON.parse(payload) as { kind?: string; userId?: string; role?: ScheduleRole };
                                    if (parsed.kind === "worker" && parsed.role === role && parsed.userId) {
                                      onCreateShift?.({ userId: parsed.userId, day: layout.day, startMinute: minute });
                                    }
                                  } catch {
                                    // Ignore malformed payloads.
                                  }
                                }}
                              >
                                <div className="pointer-events-none flex h-full items-start justify-start px-2 pt-1 text-[10px] text-slate-400">
                                  {slotIndex === 0 ? formatMinuteLabel(minute) : ""}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ))}

                      {dayBlobs.map((blob) => {
                        const position = getShiftPosition({ startMinute: blob.startMinute, endMinute: blob.endMinute }, layout.blocks);
                        if (!position) return null;
                        return (
                          <div key={blob.key} className="absolute" style={{ top: position.top, height: position.height, left: 0, right: 0, willChange: "top, height" }}>
                            <ScheduleShiftBlobCard
                              activeMemberId={selectedShiftId}
                              blob={blob}
                              canEdit={canEdit}
                              isActivePreview={preview?.blobKey === blob.key}
                              isRejected={rejectedBlobKey === blob.key}
                              lane={laneMap.get(blob.key) ?? { left: "0%", width: "100%" }}
                              onCreateShift={onCreateShift}
                              onDeleteShift={onDeleteShift}
                              onSelectMember={setSelectedShiftId}
                              onStartDrag={startDrag}
                              preview={preview?.blobKey === blob.key ? preview : null}
                              role={role}
                              workerMap={workerMap}
                            />
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
