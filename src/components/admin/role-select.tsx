"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";
import { setUserRole } from "@/lib/actions/admin-ops";
import { lookup, useI18n } from "@/lib/i18n/client";

export function RoleSelect({ userId, role, disabled }: { userId: string; role: "super_admin" | "admin" | "customer"; disabled?: boolean }) {
  const { dict } = useI18n();
  const router = useRouter();
  const [pending, start] = useTransition();
  return (
    <select
      aria-label={dict.admin.users_.changeRole}
      defaultValue={role}
      disabled={disabled || pending}
      className="rounded-lg border border-line bg-paper px-2 py-1.5 text-sm disabled:opacity-60"
      onChange={(e) => {
        const next = e.target.value;
        if (!window.confirm(`${dict.admin.users_.changeRole} → ${dict.admin.users_.roles[next as typeof role]} ?`)) {
          e.target.value = role;
          return;
        }
        start(async () => {
          const res = await setUserRole(userId, next);
          if (res.status === "success") toast.success(lookup(dict, res.message));
          else {
            toast.error(lookup(dict, res.message));
            e.target.value = role;
          }
          router.refresh();
        });
      }}
    >
      {(["customer", "admin", "super_admin"] as const).map((r) => (
        <option key={r} value={r}>
          {dict.admin.users_.roles[r]}
        </option>
      ))}
    </select>
  );
}
