import { redirect } from "next/navigation";

const HomePage = (): never => {
  redirect("/dashboard");
};

export default HomePage;

