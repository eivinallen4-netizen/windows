"use client";

import Link from "next/link";
import { ArrowRight, Briefcase, Wrench } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function ScheduleAdminLinks() {
  return (
    <div className="grid gap-6 md:grid-cols-2">
      <Link href="/admin/schedule/reps" className="block">
        <Card className="border border-slate-200 bg-white text-slate-900 shadow-lg transition hover:border-sky-200 hover:bg-sky-50/40">
          <CardHeader>
            <div className="flex items-center gap-3">
              <Briefcase className="size-5 text-sky-400" />
              <CardTitle>Rep Schedule</CardTitle>
            </div>
            <CardDescription className="text-slate-600">Manage weekly knocking hours for reps on a dedicated board.</CardDescription>
          </CardHeader>
          <CardContent className="flex items-center justify-between text-sm text-slate-600">
            <span>Open rep scheduling</span>
            <ArrowRight className="size-4" />
          </CardContent>
        </Card>
      </Link>

      <Link href="/admin/schedule/techs" className="block">
        <Card className="border border-slate-200 bg-white text-slate-900 shadow-lg transition hover:border-emerald-200 hover:bg-emerald-50/40">
          <CardHeader>
            <div className="flex items-center gap-3">
              <Wrench className="size-5 text-emerald-400" />
              <CardTitle>Tech Schedule</CardTitle>
            </div>
            <CardDescription className="text-slate-600">Manage weekly tech hours on a separate drag-and-drop board.</CardDescription>
          </CardHeader>
          <CardContent className="flex items-center justify-between text-sm text-slate-600">
            <span>Open tech scheduling</span>
            <ArrowRight className="size-4" />
          </CardContent>
        </Card>
      </Link>
    </div>
  );
}
