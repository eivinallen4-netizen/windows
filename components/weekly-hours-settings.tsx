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
  type WeekdayKey,
  type WeeklyAllowedWindows,
} from "@/lib/schedule-types";

type WeeklyHoursSettingsProps = {
  title: string;
  description: string;
  value: WeeklyAllowedWindows;
  onChange: (value: WeeklyAllowedWindows) => void;
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

export function WeeklyHoursSettings({ title, description, value, onChange }: WeeklyHoursSettingsProps) {
  function updateBlock(day: WeekdayKey, index: number, patch: Partial<AllowedTimeBlock>) {
    const nextBlocks = value[day].map((block, blockIndex) => (blockIndex === index ? { ...block, ...patch } : block));
    onChange({
      ...value,
      [day]: normalizeAllowedDayWindows(nextBlocks),
    });
  }

  function addBlock(day: WeekdayKey) {
    const nextBlocks = [...value[day], { startMinute: SCHEDULE_START_MINUTE, endMinute: SCHEDULE_END_MINUTE }];
    onChange({
      ...value,
      [day]: normalizeAllowedDayWindows(nextBlocks),
    });
  }

  function removeBlock(day: WeekdayKey, index: number) {
    const nextBlocks = value[day].filter((_, blockIndex) => blockIndex !== index);
    onChange({
      ...value,
      [day]: normalizeAllowedDayWindows(nextBlocks),
    });
  }

  return (
    <Card className="border border-slate-200 bg-white text-slate-900 shadow-sm">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription className="text-slate-600">{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {WEEKDAY_KEYS.map((day) => (
          <div key={day} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-slate-900">{formatWeekdayLabel(day)}</p>
                <p className="text-xs text-slate-500">
                  {value[day].length === 0 ? "No published hours" : `${value[day].length} block${value[day].length === 1 ? "" : "s"}`}
                </p>
              </div>
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="border-slate-300 bg-white text-slate-900 hover:bg-slate-100"
                onClick={() => addBlock(day)}
              >
                <Plus className="size-4" />
                Add Block
              </Button>
            </div>

            <div className="mt-4 space-y-3">
              {value[day].length === 0 ? (
                <p className="text-sm text-slate-500">This day will show as unavailable.</p>
              ) : (
                value[day].map((block, index) => (
                  <div key={`${day}-${index}`} className="grid gap-3 rounded-lg border border-slate-200 bg-white p-3 sm:grid-cols-[1fr_1fr_auto]">
                    <div className="space-y-2">
                      <Label htmlFor={`${day}-start-${index}`}>Start</Label>
                      <Input
                        id={`${day}-start-${index}`}
                        type="time"
                        step={SCHEDULE_SLOT_MINUTES * 60}
                        value={minuteToTimeValue(block.startMinute)}
                        onChange={(event) => updateBlock(day, index, { startMinute: timeValueToMinute(event.target.value) })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor={`${day}-end-${index}`}>End</Label>
                      <Input
                        id={`${day}-end-${index}`}
                        type="time"
                        step={SCHEDULE_SLOT_MINUTES * 60}
                        value={minuteToTimeValue(block.endMinute)}
                        onChange={(event) => updateBlock(day, index, { endMinute: timeValueToMinute(event.target.value) })}
                      />
                    </div>
                    <div className="flex items-end">
                      <Button
                        type="button"
                        size="icon"
                        variant="outline"
                        className="border-slate-300 bg-white text-slate-900 hover:bg-slate-100"
                        onClick={() => removeBlock(day, index)}
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
