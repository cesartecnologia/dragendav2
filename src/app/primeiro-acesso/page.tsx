import Link from "next/link";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { AppLogo } from "../../components/layout/AppLogo";
import {
  findCheckoutSessionByPublicReference,
  getCheckoutSessionById,
  getOnboardingBySessionId,
  syncCheckoutSessionWithAsaas,
} from "../../lib/services/checkoutSessionService";
import { CompletePaidSignupForm } from "./_components/complete-paid-signup-form";
import { PaymentWaitingCard } from "./_components/payment-waiting-card";

type PrimeiroAcessoPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

const Shell = ({ children }: { children: ReactNode }): JSX.Element => (
  <main className="min-h-screen bg-gradient-to-br from-sky-50 via-white to-cyan-50 px-4 py-6 sm:px-6">
    <div className="mx-auto flex min-h-[calc(100vh-3rem)] w-full max-w-2xl flex-col">
      <header className="mb-6 flex items-center justify-between rounded-3xl border border-white/80 bg-white/90 px-4 py-3 shadow-[0_18px_50px_rgba(14,165,233,0.08)] backdrop-blur">
        <Link href="/assinatura" className="flex items-center gap-3">
          <AppLogo className="h-10 w-10" />
          <span className="text-lg font-bold tracking-tight text-slate-950">Dr. Agenda</span>
        </Link>
        <Link
          href="/login"
          className="rounded-full border border-sky-200 bg-white px-4 py-2 text-sm font-semibold text-sky-900 transition hover:bg-sky-50"
        >
          Login
        </Link>
      </header>
      <div className="flex flex-1 items-center">{children}</div>
    </div>
  </main>
);

const LinkCard = ({
  title,
  description,
  href,
  label,
}: {
  title: string;
  description: string;
  href: string;
  label: string;
}): JSX.Element => (
  <div className="w-full rounded-[28px] border border-sky-100 bg-white p-6 shadow-[0_24px_80px_rgba(14,165,233,0.12)] sm:p-8">
    <h1 className="text-2xl font-bold tracking-tight text-slate-950">{title}</h1>
    <p className="mt-3 text-sm leading-6 text-slate-600">{description}</p>
    <Link
      href={href}
      className="mt-6 inline-flex h-12 w-full items-center justify-center rounded-2xl bg-sky-500 px-5 text-sm font-semibold text-white transition hover:bg-sky-600"
    >
      {label}
    </Link>
  </div>
);

const isUuid = (value: string): boolean =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);

const PrimeiroAcessoPage = async ({
  searchParams,
}: PrimeiroAcessoPageProps): Promise<JSX.Element> => {
  const params = (await searchParams) ?? {};
  const sessionIdParam = Array.isArray(params.sessionId) ? params.sessionId[0] : params.sessionId;
  const legacyIntentId = Array.isArray(params.intentId) ? params.intentId[0] : params.intentId;
  const checkoutSessionId = Array.isArray(params.checkoutSession) ? params.checkoutSession[0] : params.checkoutSession;
  const paymentLinkId = Array.isArray(params.paymentLink) ? params.paymentLink[0] : params.paymentLink;
  const paymentId = Array.isArray(params.paymentId) ? params.paymentId[0] : params.paymentId;
  const externalReference = Array.isArray(params.externalReference) ? params.externalReference[0] : params.externalReference;
  const sessionId = sessionIdParam ?? legacyIntentId;

  if (
    (sessionId === undefined || sessionId.trim().length === 0) &&
    (checkoutSessionId === undefined || checkoutSessionId.trim().length === 0) &&
    (paymentLinkId === undefined || paymentLinkId.trim().length === 0) &&
    (paymentId === undefined || paymentId.trim().length === 0) &&
    (externalReference === undefined || externalReference.trim().length === 0)
  ) {
    redirect("/assinatura");
  }

  let checkoutSession =
    sessionId !== undefined && isUuid(sessionId.trim())
      ? await getCheckoutSessionById(sessionId)
      : null;

  if (checkoutSession === null) {
    checkoutSession = await findCheckoutSessionByPublicReference({
      sessionId,
      checkoutSessionId,
      paymentLinkId,
      paymentId,
      externalReference,
    });
  }

  let onboarding =
    checkoutSession === null
      ? null
      : await getOnboardingBySessionId(checkoutSession.id);

  if (checkoutSession === null || onboarding === null) {
    return (
      <Shell>
        <LinkCard
          title="Pagamento não encontrado"
          description="Esse link não está mais disponível. Gere uma nova assinatura para continuar."
          href="/assinatura"
          label="Voltar para assinatura"
        />
      </Shell>
    );
  }

  if (checkoutSession.status !== "paid" || onboarding.status !== "completed") {
    try {
      const synced = await syncCheckoutSessionWithAsaas(checkoutSession.id);

      if (synced !== null) {
        checkoutSession = synced;
        onboarding = (await getOnboardingBySessionId(checkoutSession.id)) ?? onboarding;
      }
    } catch (error) {
      console.error("CHECKOUT_SESSION_SYNC_FAILED", error);
    }
  }

  if (onboarding.status === "completed") {
    return (
      <Shell>
        <LinkCard
          title="Cadastro concluído"
          description="Seu acesso já foi criado. Entre com o email e senha cadastrados para continuar."
          href="/login"
          label="Ir para o login"
        />
      </Shell>
    );
  }

  if (checkoutSession.status !== "paid" || onboarding.status !== "released") {
    return (
      <Shell>
        <PaymentWaitingCard
          sessionId={checkoutSession.id}
          paymentMethod={checkoutSession.paymentMethod}
          status={checkoutSession.status}
          paymentStatus={checkoutSession.paymentStatus}
          invoiceUrl={checkoutSession.invoiceUrl}
          checkoutUrl={checkoutSession.checkoutUrl}
        />
      </Shell>
    );
  }

  return (
    <Shell>
      <CompletePaidSignupForm
        sessionId={checkoutSession.id}
        defaults={{
          name: checkoutSession.payerName,
          email: checkoutSession.payerEmail,
          phone: checkoutSession.payerPhone,
        }}
      />
    </Shell>
  );
};

export default PrimeiroAcessoPage;
