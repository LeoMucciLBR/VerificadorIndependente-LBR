import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import AdminSidebar from "@/components/admin/AdminSidebar";
import { ThemeProvider } from "@/components/theme/ThemeProvider";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();

  if (!session || session.user?.role !== "SUPER_ADMIN") {
    redirect("/");
  }

  return (
    <ThemeProvider>
      <div className="flex h-screen bg-slate-950">
        <AdminSidebar />
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </ThemeProvider>
  );
}
