import { redirect, notFound } from 'next/navigation';
import { getSession } from '@/lib/session';
import { validateProjectAccess } from '@/lib/project-context';
import { ProjectProvider } from '@/contexts/ProjectContext';
import { DashboardHeader } from '@/components/home/DashboardHeader';

interface ProjectLayoutProps {
  children: React.ReactNode;
  params: Promise<{ project: string }>;
}

export default async function ProjectLayout({
  children,
  params,
}: ProjectLayoutProps) {
  const { project: projectSlug } = await params;
  
  const session = await getSession();
  
  if (!session || !session.user) {
    redirect('/');
  }

  const access = await validateProjectAccess(projectSlug, BigInt(session.user.id));
  
  if (!access) {
    notFound();
  }

  // Serializar para o client component
  const serializedProject = {
    id: access.project.id.toString(),
    uuid: access.project.uuid,
    codigo: access.project.codigo,
    nome: access.project.nome,
    slug: access.project.slug,
    descricao: access.project.descricao,
  };

  const serializedMember = {
    papel: access.member.papel,
  };

  return (
    <ProjectProvider project={serializedProject} member={serializedMember}>
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col transition-colors duration-300">
        {/* Subtle Background Pattern */}
        <div className="fixed inset-0 pointer-events-none opacity-[0.03] z-0">
          <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="road-pattern" x="0" y="0" width="100" height="100" patternUnits="userSpaceOnUse">
                <line x1="50" y1="0" x2="50" y2="100" stroke="currentColor" strokeWidth="2" strokeDasharray="10,15" />
              </pattern>
            </defs>
            <rect fill="url(#road-pattern)" width="100%" height="100%" className="text-foreground" />
          </svg>
        </div>

        <div className="relative z-10 flex flex-col min-h-screen">
          <DashboardHeader user={session.user} />
          <main className="flex-1 flex flex-col">
            {children}
          </main>
        </div>
      </div>
    </ProjectProvider>
  );
}
