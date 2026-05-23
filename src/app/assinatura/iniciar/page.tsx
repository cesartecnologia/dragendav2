import { CreditCard, FileText, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { AppLogo } from "../../../components/layout/AppLogo";
import { PublicCheckoutButton } from "../_components/public-checkout-button";

const IniciarAssinaturaPage = (): JSX.Element => {
  return (
    <main className="min-h-screen bg-[#f5fbff] px-4 py-6 sm:px-6">
      <div className="mx-auto flex min-h-[calc(100vh-48px)] w-full max-w-4xl flex-col gap-6">
        <header className="flex items-center justify-between rounded-3xl border border-white/80 bg-white/95 px-4 py-3 shadow-[0_18px_50px_rgba(14,116,144,0.08)] backdrop-blur sm:px-6">
          <Link href="/assinatura" className="flex items-center gap-3">
            <AppLogo className="h-10 w-10" />
            <span className="text-lg font-bold tracking-tight text-slate-950">Dr. Agenda</span>
          </Link>
          <Link href="/login" className="rounded-full border border-sky-200 bg-white px-4 py-2 text-sm font-semibold text-sky-900 transition hover:bg-sky-50">
            Área do cliente
          </Link>
        </header>

        <section className="my-auto rounded-[32px] border border-sky-100 bg-white p-6 shadow-[0_28px_90px_rgba(14,116,144,0.12)] sm:p-8">
          <div className="mx-auto max-w-2xl text-center">
            <div className="mx-auto inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-sky-50 text-sky-700">
              <ShieldCheck className="h-7 w-7" />
            </div>
            <h1 className="mt-5 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
              Escolha como deseja assinar
            </h1>
            <p className="mt-3 text-sm leading-7 text-slate-600 sm:text-base">
              Você será direcionado para o checkout seguro do Asaas para concluir a assinatura mensal de R$ 99,90.
            </p>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-2">
            <div className="rounded-[28px] border border-sky-100 bg-sky-50/60 p-5">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-100 text-sky-700">
                <CreditCard className="h-5 w-5" />
              </div>
              <h2 className="mt-5 text-xl font-bold text-slate-950">Cartão de crédito</h2>
              <p className="mt-2 min-h-12 text-sm leading-6 text-slate-600">
                Confirmação rápida para iniciar o cadastro da clínica.
              </p>
              <PublicCheckoutButton
                paymentMethod="credit_card"
                label="Pagar com cartão"
                className="mt-6 h-12 w-full text-sm"
              />
            </div>

            <div className="rounded-[28px] border border-amber-100 bg-amber-50/60 p-5">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-100 text-amber-700">
                <FileText className="h-5 w-5" />
              </div>
              <h2 className="mt-5 text-xl font-bold text-slate-950">Boleto bancário</h2>
              <p className="mt-2 min-h-12 text-sm leading-6 text-slate-600">
                Gere o boleto pelo Asaas e conclua o pagamento com segurança.
              </p>
              <PublicCheckoutButton
                paymentMethod="boleto"
                label="Gerar boleto"
                variant="outline"
                className="mt-6 h-12 w-full text-sm"
              />
            </div>
          </div>
        </section>
      </div>
    </main>
  );
};

export default IniciarAssinaturaPage;
