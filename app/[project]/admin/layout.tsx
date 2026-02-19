import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import ProjectAdminSidebar from "@/components/project-admin/ProjectAdminSidebar";
import { ThemeProvider } from "@/components/theme/ThemeProvider";

export default async function ProjectAdminLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ project: string }>;
}) {
  const session = await getSession();

  if (!session) {
    redirect("/");
  }

  // Await params before accessing properties
  const { project } = await params;

  // Verificar se usuário é ADMIN ou SUPER_ADMIN
  if (session.user?.role !== "ADMIN" && session.user?.role !== "SUPER_ADMIN") {
    redirect(`/${project}`);
  }

  return (
    <ThemeProvider>
      <div className="flex h-screen bg-slate-950">
        <ProjectAdminSidebar />
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </ThemeProvider>
  );
}
