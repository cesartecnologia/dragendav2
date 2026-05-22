import { NextResponse } from "next/server";
import { startPublicBoletoCheckout } from "../../../../lib/services/checkoutSessionService";

export const runtime = "nodejs";

export const POST = async (): Promise<NextResponse> => {
  try {
    const checkout = await startPublicBoletoCheckout();

    return NextResponse.json({
      ok: true,
      checkoutUrl: checkout.checkoutUrl,
      invoiceUrl: null,
      sessionId: checkout.sessionId,
    });
  } catch (error: unknown) {
    const message =
      error instanceof Error && error.message.trim().length > 0
        ? error.message
        : "Não foi possível gerar o boleto agora.";
    console.error("PUBLIC_BOLETO_CHECKOUT_FAILED", error);

    return NextResponse.json(
      { error: message },
      { status: message.includes("não configurado") ? 500 : 502 },
    );
  }
};
