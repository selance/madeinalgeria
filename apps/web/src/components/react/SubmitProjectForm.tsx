"use client";

import { useState } from "react";
import { useForm, type SubmitHandler } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { cn } from "@mia/ui";
import { Button } from "@mia/ui/components/button";
import { Input } from "@mia/ui/components/input";
import { Textarea } from "@mia/ui/components/textarea";
import { FieldRoot, Label } from "@mia/ui/components/label";
import { ui, type Dict, type Locale } from "../../lib/i18n";

/**
 * The /submit island — canonical form anatomy (LoginForm idiom): zod schema
 * with locale-appropriate messages, react-hook-form + zodResolver, design
 * system field stack, distinct handling for 409 (duplicate) and 429 (rate).
 */

const API = import.meta.env.PUBLIC_API_BASE_URL;
const GITHUB_REPO_URL = /^https:\/\/github\.com\/[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+\/?$/;

const schemaFor = (t: Dict) =>
  z.object({
    repoUrl: z
      .string()
      .trim()
      .min(1, t.submit.errRequired)
      .regex(GITHUB_REPO_URL, t.submit.errFormat),
    // Optional-but-validated: empty string is fine, anything else must be an email.
    email: z.union([z.literal(""), z.email(t.submit.errEmail)]),
    notes: z.string().trim().max(500),
  });

interface FormValues {
  repoUrl: string;
  email: string;
  notes: string;
}

export default function SubmitProjectForm({ locale = "en" }: { locale?: Locale }) {
  const t = ui[locale];
  const [pending, setPending] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schemaFor(t)),
    defaultValues: { repoUrl: "", email: "", notes: "" },
  });

  const onSubmit: SubmitHandler<FormValues> = async (values) => {
    setPending(true);
    setServerError(null);
    try {
      const res = await fetch(`${API}/v1/projects/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          repoUrl: values.repoUrl,
          ...(values.email ? { email: values.email } : {}),
          ...(values.notes ? { notes: values.notes } : {}),
        }),
      });
      if (res.status === 409) {
        setServerError(t.submit.errConflict);
        return;
      }
      if (res.status === 429) {
        setServerError(t.submit.errRate);
        return;
      }
      if (res.status === 400) {
        setServerError(t.submit.errNotFound);
        return;
      }
      if (!res.ok) {
        setServerError(t.submit.errGeneric);
        return;
      }
      setSubmitted(true);
      reset();
    } catch {
      setServerError(t.submit.errGeneric);
    } finally {
      setPending(false);
    }
  };

  if (submitted) {
    return (
      <div className="rounded-card border !border-success-200 bg-success-50 p-8 text-center">
        <h2 className="mb-2 text-xl font-bold text-success-800">{t.submit.successTitle}</h2>
        <p className="mb-6 text-success-700">{t.submit.successBody}</p>
        <Button type="button" variant="secondary-outline" onClick={() => setSubmitted(false)}>
          {t.submit.submitAnother}
        </Button>
      </div>
    );
  }

  // Anatomy mirrors the admin LoginPage form: one FieldRoot around the whole
  // stack, each field in a gap-2 column, h-12 controls, gradient error banner,
  // full-width h-12 submit with a pending label.
  return (
    <form noValidate onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <FieldRoot className="flex w-full flex-col gap-5">
        <div className="flex flex-col gap-2">
          <Label htmlFor="repoUrl">{t.submit.repoUrlLabel}</Label>
          <Input
            id="repoUrl"
            type="url"
            dir="ltr"
            placeholder={t.submit.repoUrlPlaceholder}
            disabled={pending}
            data-invalid={errors.repoUrl}
            {...register("repoUrl")}
            className={cn(
              "h-12 bg-neutral-100/40",
              locale === "ar" && "text-left placeholder:text-right",
            )}
          />
          {errors.repoUrl && (
            <p className="text-error-600 pr-2.5 text-xs">{errors.repoUrl.message}</p>
          )}
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="email">{t.submit.emailLabel}</Label>
          <Input
            id="email"
            type="email"
            dir="ltr"
            disabled={pending}
            data-invalid={errors.email}
            {...register("email")}
            className={cn("h-12 bg-neutral-100/40", locale === "ar" && "text-left")}
          />
          <p className="text-xs text-neutral-400">{t.submit.emailHelp}</p>
          {errors.email && <p className="text-error-600 pr-2.5 text-xs">{errors.email.message}</p>}
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="notes">{t.submit.notesLabel}</Label>
          <Textarea
            id="notes"
            rows={4}
            placeholder={t.submit.notesPlaceholder}
            disabled={pending}
            data-invalid={errors.notes}
            {...register("notes")}
            className="bg-neutral-100/40"
          />
          {errors.notes && <p className="text-error-600 pr-2.5 text-xs">{errors.notes.message}</p>}
        </div>

        {serverError && (
          <div className="from-error-50 via-error-50/50 to-error-50/20 !border-error-100 text-error-600 rounded-lg border bg-gradient-to-t p-3 text-sm">
            {serverError}
          </div>
        )}
      </FieldRoot>

      <Button type="submit" className="h-12 w-full" disabled={pending} aria-busy={pending}>
        {pending ? t.submit.submitting : t.submit.submit}
      </Button>
    </form>
  );
}
