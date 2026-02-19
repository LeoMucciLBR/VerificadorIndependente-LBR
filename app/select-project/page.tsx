import { redirect } from 'next/navigation';
import { getSession } from '@/lib/session';
import { getUserProjects } from '@/lib/project-context';
import { ProjectSelectionClient } from './ProjectSelectionClient';

interface UserProject {
  id: bigint;
  uuid: string;
  codigo: string;
  nome: string;
  slug: string;
  papel: string;
}

export default async function SelectProjectPage() {
  const session = await getSession();
  
  if (!session || !session.user) {
    redirect('/login');
  }

  const projects = await getUserProjects(BigInt(session.user.id));
  
  // Se só tem 1 projeto, redireciona direto
  if (projects.length === 1) {
    redirect(`/${projects[0].slug}`);
  }

  // Se não tem nenhum projeto
  if (projects.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-900">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4">
            Sem Acesso a Projetos
          </h1>
          <p className="text-zinc-400">
            Você não tem acesso a nenhum projeto. Entre em contato com o administrador.
          </p>
        </div>
      </div>
    );
  }

  // Serializar para passar ao client component
  const serializedProjects = projects.map((p: UserProject) => ({
    ...p,
    id: p.id.toString(),
  }));

  return <ProjectSelectionClient projects={serializedProjects} userName={session.user.name} />;
}
