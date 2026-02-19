import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import LoginPage from "@/components/LoginPage";

export default async function Home() {
  const session = await getSession();
  
  if (session?.user) {
    redirect("/select-project");
  }

  return <LoginPage />;
}
