"use client";

import { useActionState } from "react";
import type { GuestEntryAction } from "@/contracts/guest-entry";
import { LIMITS } from "@/contracts/debt-form-rules";
import { es } from "@/content/es";
import { Button } from "@/components/ui/Button";
import { Notice } from "@/components/ui/Notice";
import { PageHeading } from "@/components/ui/PageHeading";
import { Screen } from "@/components/ui/Screen";
import { TextField } from "@/components/ui/TextField";
import { Wordmark } from "@/components/ui/Wordmark";

const t = es.guestEntry;

export function GuestEntryScreen({ action }: { action: GuestEntryAction }) {
  const [state, formAction, pending] = useActionState(action, { error: null });
  return (
    <Screen>
      <Wordmark className="self-center" />
      <PageHeading title={t.title} lead={t.lead} className="mt-6" />
      <form action={formAction} className="flex w-full flex-col gap-4">
        <TextField name="name" label={t.nameLabel} hint={t.nameHint} autoComplete="given-name" maxLength={LIMITS.firstName} required />
        {state.error && <Notice tone="danger">{t.error[state.error]}</Notice>}
        <Button type="submit" disabled={pending}>
          {t.submit}
        </Button>
      </form>
    </Screen>
  );
}
