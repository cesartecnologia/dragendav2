"use client";

import { PageHeader } from "../../../../components/shared/PageHeader";

const WhatsappSettingsPage = (): JSX.Element => {
  return (
    <div className="grid gap-6">
      <PageHeader title="WhatsApp" description="API, token, número e templates de mensagem." />
      <div className="rounded-md border border-clinic-border bg-clinic-surface p-4 text-clinic-muted">Configure a integração com Evolution API ou Z-API.</div>
    </div>
  );
};

export default WhatsappSettingsPage;

