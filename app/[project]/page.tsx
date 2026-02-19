import { redirect } from 'next/navigation';
import { getSession } from '@/lib/session';

interface ProjectPageProps {
  params: Promise<{ project: string }>;
}

export default async function ProjectPage({ params }: ProjectPageProps) {
  const { project } = await params;
  const session = await getSession();
  
  if (!session || !session.user) {
    redirect('/');
  }

  // Redirect to the default view (Sintese)
  redirect(`/${project}/sintese`);
}
