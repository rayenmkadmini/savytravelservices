import { NextResponse } from "next/server";
import { getCurrentProfile, isAdminRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { siteUrl } from "@/lib/utils";

function csv(value: string): string {
  // Quote, escape quotes and neutralise spreadsheet formula injection.
  const safe = /^[=+\-@\t\r]/.test(value) ? `'${value}` : value;
  return `"${safe.replace(/"/g, '""')}"`;
}

export async function GET() {
  const profile = await getCurrentProfile();
  if (!profile || !isAdminRole(profile.role)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const supabase = await createClient();
  const { data } = await supabase.from("newsletter_subscribers").select("*").eq("status", "subscribed").order("subscribed_at");
  const lines = [
    ["email", "locale", "subscribed_at", "unsubscribe_url"].join(","),
    ...(data ?? []).map((s) =>
      [s.email, s.locale, s.subscribed_at, siteUrl(`/${s.locale}/newsletter/unsubscribe?token=${s.unsubscribe_token}`)].map(csv).join(","),
    ),
  ];
  return new NextResponse(`﻿${lines.join("\n")}`, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="savy-newsletter-${new Date().toISOString().slice(0, 10)}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
