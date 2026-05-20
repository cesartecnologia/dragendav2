import { redirect } from "next/navigation";

const SettingsPage = (): never => {
  redirect("/settings/company");
};

export default SettingsPage;

