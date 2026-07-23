"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@mia/ui/components/button";
import { Input } from "@mia/ui/components/input";
import { cn } from "@mia/ui";
import EmailIcon from "@mia/ui/icons/EmailIcon";
import { ui, type Dict, type Locale } from "../../lib/i18n";

/**
 * The footer newsletter opt-in — the only hydrated part of the footer (mounted
 * as its own island from Base.astro, so the rest of the footer stays zero-JS).
 *
 * Validation is the app's standard form idiom (LoginForm.tsx): react-hook-form
 * + zodResolver with Arabic messages, `data-invalid` on the control, disabled
 * while submitting. Two deviations, both to keep the block looking identical:
 * the button keeps its label while pending (swapping in "جارٍ…" would resize
 * the pill), and the invalid state is a ring rather than the design system's
 * `data-[invalid]:!border-error-500`, which cannot paint on this input's
 * `border-none`.
 */

const API = import.meta.env.PUBLIC_API_BASE_URL;

// Empty and malformed get their own message (zod v4 style — the app's older
// forms still use the deprecated `.email()` chain).
const schemaFor = (t: Dict) =>
  z.object({
    email: z.string().min(1, t.newsletter.errRequired).pipe(z.email(t.newsletter.errFormat)),
  });

type FormValues = { email: string };

type Result =
  | { tone: "success"; message: string }
  | { tone: "error"; message: string }
  | null;

export default function NewsletterForm({ locale = "en" }: { locale?: Locale }) {
  const t = ui[locale];
  const [pending, setPending] = useState(false);
  const [result, setResult] = useState<Result>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schemaFor(t)),
    defaultValues: { email: "" },
  });

  const onSubmit = async ({ email }: FormValues) => {
    setPending(true);
    setResult(null);
    try {
      const res = await fetch(`${API}/v1/newsletter/subscribe`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      if (res.status === 429) {
        setResult({ tone: "error", message: t.newsletter.errRate });
        return;
      }
      if (!res.ok) {
        setResult({ tone: "error", message: t.newsletter.error });
        return;
      }

      const body = (await res.json()) as { data: { status: "pending" | "subscribed" } };
      setResult(
        body.data.status === "subscribed"
          ? { tone: "success", message: t.newsletter.already }
          : { tone: "success", message: t.newsletter.success },
      );
      reset();
    } catch {
      setResult({ tone: "error", message: t.newsletter.error });
    } finally {
      setPending(false);
    }
  };

  // A field error outranks a stale server message.
  const status: Result = errors.email
    ? { tone: "error", message: errors.email.message ?? "" }
    : result;

  return (
    <div>
      <form className="flex w-full" noValidate onSubmit={handleSubmit(onSubmit)}>
        <Button
          type="submit"
          variant="secondary-solid"
          size="lg"
          disabled={pending}
          aria-busy={pending}
          className="shrink-0 cursor-pointer gap-2 rounded-e-none border-none before:rounded-e-none after:rounded-e-none"
        >
          <EmailIcon className="size-4 shrink-0 fill-current" />
          {/* Phone: icon only, so the field keeps its width. */}
          <span className="hidden sm:inline">{t.newsletter.button}</span>
        </Button>
        <Input
          {...register("email")}
          type="email"
          placeholder={t.newsletter.placeholder}
          disabled={pending}
          aria-label={t.newsletter.placeholder}
          data-invalid={errors.email ? true : undefined}
          className="min-w-0 flex-1 rounded-s-none border-none bg-white/10 text-white placeholder:text-primary-200/70 focus:bg-white/15 data-[invalid]:ring-2 data-[invalid]:ring-error-400"
        />
      </form>
      {status && (
        <p
          aria-live="polite"
          className={cn(
            "mt-2 text-xs",
            status.tone === "error" ? "text-error-200" : "text-success-200",
          )}
        >
          {status.message}
        </p>
      )}
    </div>
  );
}
