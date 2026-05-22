import { Clock3, ExternalLink, FileText, RefreshCw } from "lucide-react";
import Link from "next/link";
import type { CheckoutPaymentMethod, CheckoutSessionStatus } from "../../../lib/services/checkoutSessionService";

type PaymentWaitingCardProps = {
  sessionId: string;
  paymentMethod: CheckoutPaymentMethod;
  status: CheckoutSessionStatus;
  paymentStatus: string | null;
  invoiceUrl: string | null;
  checkoutUrl: string | null;
};

export const PaymentWaitingCard = ({
  sessionId,
  paymentMethod,
  status,
  paymentStatus,
  invoiceUrl,
  checkoutUrl,
}: PaymentWaitingCardProps): JSX.Element => {
  const paymentUrl = invoiceUrl ?? checkoutUrl;
  const isBoleto = paymentMethod === "boleto";

  return (
    <div className="w-full rounded-[28px] border border-sky-100 bg-white p-6 shadow-[0_24px_80px_rgba(14,165,233,0.12)] sm:p-8">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-sky-50 text-sky-600">
        {isBoleto ? <FileText className="h-7 w-7" /> : <Clock3 className="h-7 w-7" />}
      </div>

      <div className="mt-6 space-y-3">
        <h1 className="text-2xl font-bold tracking-tight text-slate-950">Aguardando confirmação</h1>
        <p className="text-sm leading-6 text-slate-600">
          Assim que o pagamento for confirmado, esta tela libera o cadastro da clínica automaticamente.
        </p>
      </div>

      <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
        <p>
          Código da sessão: <span className="font-mono text-slate-900">{sessionId}</span>
        </p>
        <p className="mt-1">
          Status: <span className="font-semibold text-slate-900">{paymentStatus ?? status}</span>
        </p>
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        <Link
          href={`/primeiro-acesso?sessionId=${encodeURIComponent(sessionId)}`}
          className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-sky-500 px-5 text-sm font-semibold text-white transition hover:bg-sky-600"
        >
          <RefreshCw className="h-4 w-4" />
          Verificar novamente
        </Link>
        {paymentUrl !== null ? (
          <a
            href={paymentUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl border border-sky-200 bg-white px-5 text-sm font-semibold text-sky-900 transition hover:bg-sky-50"
          >
            Abrir pagamento
            <ExternalLink className="h-4 w-4" />
          </a>
        ) : null}
      </div>
    </div>
  );
};
