"use client";

import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  SCHEDULE_END_MINUTE,
  SCHEDULE_SLOT_MINUTES,
  SCHEDULE_START_MINUTE,
  WEEKDAY_KEYS,
  formatWeekdayLabel,
  normalizeAllowedDayWindows,
  type AllowedTimeBlock,
  type ScheduleRole,
  type ScheduleWindowsConfig,
  type WeekdayKey,
} from "@/lib/schedule-types";

type ScheduleWindowSettingsProps = {
  value: ScheduleWindowsConfig;
  onChange: (value: ScheduleWindowsConfig) => void;
};

function minuteToTimeValue(minute: number) {
  const hours = Math.floor(minute / 60);
  const minutes = minute % 60;
  return `${`${hours}`.padStart(2, "0")}:${`${minutes}`.padStart(2, "0")}`;
}

function timeValueToMinute(value: string) {
  const [hours, minutes] = value.split(":").map(Number);
  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) {
    return SCHEDULE_START_MINUTE;
  }
  return hours * 60 + minutes;
}

export function ScheduleWindowSettings({ value, onChange }: ScheduleWindowSettingsProps) {
  function updateBlock(role: ScheduleRole, day: WeekdayKey, index: number, patch: Partial<AllowedTimeBlock>) {
    const nextBlocks = value[role][day].map((block, blockIndex) =>
      blockIndex === index ? { ...block, ...patch } : block
    );
    onChange({
      ...value,
      [role]: {
        ...value[role],
        [day]: normalizeAllowedDayWindows(nextBlocks),
      },
    });
  }

  function addBlock(role: ScheduleRole, day: WeekdayKey) {
    const nextBlocks = [...value[role][day], { startMinute: SCHEDULE_START_MINUTE, endMinute: SCHEDULE_END_MINUTE }];
    onChange({
      ...value,
      [role]: {
        ...value[role],
        [day]: normalizeAllowedDayWindows(nextBlocks),
      },
    });
  }

  function removeBlock(role: ScheduleRole, day: WeekdayKey, index: number) {
    const nextBlocks = value[role][day].filter((_, blockIndex) => blockIndex !== index);
    onChange({
      ...value,
      [role]: {
        ...value[role],
        [day]: normalizeAllowedDayWindows(nextBlocks),
      },
    });
  }

  function renderRole(role: ScheduleRole, title: string) {
    return (
      <Card className="border border-slate-200 bg-white text-slate-900 shadow-sm">
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          <CardDescription className="text-slate-600">Configure visible allowed schedule windows for each day.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {WEEKDAY_KEYS.map((day) => (
            <div key={`${role}-${day}`} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-slate-900">{formatWeekdayLabel(day)}</p>
                  <p className="text-xs text-slate-500">
                    {value[role][day].length === 0 ? "No available hours" : `${value[role][day].length} block${value[role][day].length === 1 ? "" : "s"}`}
                  </p>
                </div>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="border-slate-300 bg-white text-slate-900 hover:bg-slate-100"
                  onClick={() => addBlock(role, day)}
                >
                  <Plus className="size-4" />
                  Add Block
                </Button>
              </div>

              <div className="mt-4 space-y-3">
                {value[role][day].length === 0 ? (
                  <p className="text-sm text-slate-500">This day will show as unavailable.</p>
                ) : (
                  value[role][day].map((block, index) => (
                    <div key={`${role}-${day}-${index}`} className="grid gap-3 rounded-lg border border-slate-200 bg-white p-3 sm:grid-cols-[1fr_1fr_auto]">
                      <div className="space-y-2">
                        <Label htmlFor={`${role}-${day}-start-${index}`}>Start</Label>
                        <Input
                          id={`${role}-${day}-start-${index}`}
                          type="time"
                          step={SCHEDULE_SLOT_MINUTES * 60}
                          value={minuteToTimeValue(block.startMinute)}
                          onChange={(event) => updateBlock(role, day, index, { startMinute: timeValueToMinute(event.target.value) })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor={`${role}-${day}-end-${index}`}>End</Label>
                        <Input
                          id={`${role}-${day}-end-${index}`}
                          type="time"
                          step={SCHEDULE_SLOT_MINUTES * 60}
                          value={minuteToTimeValue(block.endMinute)}
                          onChange={(event) => updateBlock(role, day, index, { endMinute: timeValueToMinute(event.target.value) })}
                        />
                      </div>
                      <div className="flex items-end">
                        <Button
                          type="button"
                          size="icon"
                          variant="outline"
                          className="border-slate-300 bg-white text-slate-900 hover:bg-slate-100"
                          onClick={() => removeBlock(role, day, index)}
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-6 xl:grid-cols-2">
      {renderRole("rep", "Rep Schedule Windows")}
      {renderRole("tech", "Tech Schedule Windows")}
    </div>
  );
}
