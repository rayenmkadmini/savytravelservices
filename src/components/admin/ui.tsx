"use client";

import { useRouter } from "next/navigation";
import { startTransition as startTransitionSubmit, useActionState, useEffect, useTransition } from "react";
import { toast } from "sonner";
import { lookup, useI18n } from "@/lib/i18n/client";
import { fmt } from "@/lib/utils";
import { idleState, type ActionState } from "@/lib/validation";
import { Button } from "../ui/button";

type ServerFn = () => Promise<ActionState>;

/** Button that runs a server action, with optional confirmation and toast feedback. */
export function ActionButton({
  action,
  children,
  confirm,
  variant = "outline",
  size = "sm",
  className,
  onDone,
}: {
  action: ServerFn;
  children: React.ReactNode;
  confirm?: string;
  variant?: "outline" | "ghost" | "danger" | "primary" | "accent";
  size?: "sm" | "md";
  className?: string;
  onDone?: (state: ActionState) => void;
}) {
  const { dict } = useI18n();
  const router = useRouter();
  const [pending, start] = useTransition();
  return (
    <Button
      type="button"
      variant={variant}
      size={size}
      pending={pending}
      className={className}
      onClick={() => {
        if (confirm && !window.confirm(confirm)) return;
        start(async () => {
          const res = await action();
          const text = fmt(lookup(dict, res.message), Object.fromEntries(Object.entries(res.data ?? {}).map(([k, v]) => [k, String(v)])));
          if (res.status === "success") toast.success(text);
          else toast.error(text);
          onDone?.(res);
          router.refresh();
        });
      }}
    >
      {children}
    </Button>
  );
}

/** Form bound to a server action (prev, formData) with toast feedback. */
export function AdminForm({
  action,
  children,
  className,
  resetOnSuccess,
  onSuccess,
}: {
  action: (prev: ActionState, form: FormData) => Promise<ActionState>;
  children: (state: ActionState, pending: boolean) => React.ReactNode;
  className?: string;
  resetOnSuccess?: boolean;
  onSuccess?: (state: ActionState) => void;
}) {
  const { dict } = useI18n();
  const router = useRouter();
  const [state, formAction, pending] = useActionState(action, idleState);
  useEffect(() => {
    if (state.status === "success") {
      toast.success(fmt(lookup(dict, state.message), Object.fromEntries(Object.entries(state.data ?? {}).map(([k, v]) => [k, String(v)]))));
      onSuccess?.(state);
      router.refresh();
    } else if (state.status === "error") {
      toast.error(lookup(dict, state.message ?? "errors.generic"));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);
  return (
    <form
      action={formAction}
      className={className}
      noValidate
      onSubmit={(e) => {
        if (!resetOnSuccess) {
          // Keep entered values: React resets uncontrolled forms after actions.
          e.preventDefault();
          const fd = new FormData(e.currentTarget);
          startTransitionSubmit(() => formAction(fd));
        }
      }}
    >
      {children(state, pending)}
    </form>
  );
}

