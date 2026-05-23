import { redirect } from "next/navigation";

const SettingsPage = (): never => {
  redirect("/configuracoes/clinica");
};

export default SettingsPage;

