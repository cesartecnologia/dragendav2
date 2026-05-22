import { NextResponse } from "next/server";
import { startPublicCheckout } from "../../../../lib/services/checkoutSessionService";

export const runtime = "nodejs";

export const POST = async (): Promise<NextResponse> => {
  try {
    const checkout = await startPublicCheckout("credit_card");

    return NextResponse.json({
      ok: true,
      checkoutUrl: checkout.checkoutUrl,
      sessionId: checkout.sessionId,
    });
  } catch (error: unknown) {
    console.error("PUBLIC_CARD_CHECKOUT_FAILED", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error && error.message.trim().length > 0
            ? error.message
            : "Não foi possível abrir a página de pagamento agora.",
      },
      { status: 500 },
    );
  }
};
