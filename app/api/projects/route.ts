import { NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { getUserProjects } from '@/lib/project-context';

export async function GET() {
  try {
    const session = await getSession();
    
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const projects = await getUserProjects(BigInt(session.user.id));
    
    // Serializar BigInt para JSON
    const serializedProjects = projects.map((p: { id: bigint; uuid: string; codigo: string; nome: string; slug: string; papel: string }) => ({
      ...p,
      id: p.id.toString(),
    }));

    return NextResponse.json({ projects: serializedProjects });
  } catch (error) {
    console.error('Erro ao buscar projetos:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar projetos' },
      { status: 500 }
    );
  }
}
