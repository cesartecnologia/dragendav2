import { PublicCardCheckoutStart } from "../_components/public-card-checkout-start";

const CartaoAssinaturaPage = (): JSX.Element => {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-10">
      <div className="w-full max-w-xl">
        <PublicCardCheckoutStart paymentMethod="credit_card" />
      </div>
    </main>
  );
};

export default CartaoAssinaturaPage;
