"use client";

import { PageHeader } from "../../../../components/shared/PageHeader";

const BillingSettingsPage = (): JSX.Element => {
  return (
    <div className="grid gap-6">
      <PageHeader title="Plano" description="Plano atual, renovação e uso mensal." />
      <div className="rounded-md border border-clinic-border bg-clinic-surface p-4 text-clinic-muted">Plano atual: Starter.</div>
    </div>
  );
};

export default BillingSettingsPage;

