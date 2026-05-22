import { PublicSubscriptionView } from "./_components/public-subscription-view";

const AssinaturaPage = async ({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}): Promise<JSX.Element> => {
  const params = (await searchParams) ?? {};
  const checkoutState = Array.isArray(params.checkout) ? params.checkout[0] : params.checkout;

  return (
    <div className="min-h-screen bg-[#f5f5f5] px-4 py-4 sm:px-6 sm:py-6">
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-4 sm:gap-5">
        {checkoutState === "error" ? (
          <div className="mx-auto w-fit rounded-full bg-amber-100 px-4 py-1.5 text-sm font-semibold text-amber-700">
            Não foi possível iniciar o pagamento agora. Tente novamente em instantes.
          </div>
        ) : null}
        <PublicSubscriptionView />
      </div>
    </div>
  );
};

export default AssinaturaPage;
