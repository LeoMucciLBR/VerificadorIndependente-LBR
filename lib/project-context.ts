import { cache } from 'react';
import prisma from './prisma';

export interface ProjectContext {
  id: bigint;
  uuid: string;
  codigo: string;
  nome: string;
  slug: string;
  descricao: string | null;
  ativo: boolean;
}

export interface ProjectMember {
  userId: bigint;
  projectId: bigint;
  papel: 'ADMIN' | 'FISCAL' | 'CONSULTA';
  ativo: boolean;
}

/**
 * Busca um projeto pelo slug (nome sem espaços, lowercase)
 */
export const getProjectBySlug = cache(async (slug: string): Promise<ProjectContext | null> => {
  const project = await (prisma as any).projects.findFirst({
    where: { 
      slug: slug.toLowerCase(),
      ativo: true 
    },
  });
  
  if (!project) return null;
  
  return {
    id: project.id,
    uuid: project.uuid,
    codigo: project.codigo,
    nome: project.nome,
    slug: project.slug || slug,
    descricao: project.descricao,
    ativo: project.ativo,
  };
});

/**
 * Verifica se o usuário é SUPER_ADMIN
 */
export const isSuperAdmin = cache(async (userId: bigint): Promise<boolean> => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });
  return user?.role === 'SUPER_ADMIN';
});

/**
 * Valida se o usuário tem acesso ao projeto
 * SUPER_ADMIN tem acesso automático a todos os projetos
 */
export const validateProjectAccess = cache(async (
  projectSlug: string, 
  userId: bigint
): Promise<{ project: ProjectContext; member: ProjectMember } | null> => {
  const project = await getProjectBySlug(projectSlug);
  if (!project) return null;
  
  // SUPER_ADMIN tem acesso automático como ADMIN
  const superAdmin = await isSuperAdmin(userId);
  if (superAdmin) {
    return { 
      project, 
      member: {
        userId: userId,
        projectId: project.id,
        papel: 'ADMIN',
        ativo: true,
      }
    };
  }
  
  // Verificar membership normal
  const membership = await (prisma as any).user_projects.findUnique({
    where: {
      user_id_project_id: {
        user_id: userId,
        project_id: project.id,
      },
    },
  });
  
  if (!membership || !membership.ativo) return null;
  
  return { 
    project, 
    member: {
      userId: membership.user_id,
      projectId: membership.project_id,
      papel: membership.papel as 'ADMIN' | 'FISCAL' | 'CONSULTA',
      ativo: membership.ativo ?? true,
    }
  };
});

/**
 * Lista todos os projetos que o usuário tem acesso
 * SUPER_ADMIN vê todos os projetos
 */
export const getUserProjects = cache(async (userId: bigint) => {
  // SUPER_ADMIN vê todos os projetos
  const superAdmin = await isSuperAdmin(userId);
  
  if (superAdmin) {
    const allProjects = await (prisma as any).projects.findMany({
      where: { ativo: true },
    });
    
    return allProjects.map((p: any) => ({
      id: p.id as bigint,
      uuid: p.uuid as string,
      codigo: p.codigo as string,
      nome: p.nome as string,
      slug: (p.slug || p.nome.toLowerCase().replace(/\s+/g, '')) as string,
      papel: 'ADMIN' as string,
    }));
  }
  
  // Usuário normal: busca por membership
  const memberships = await (prisma as any).user_projects.findMany({
    where: {
      user_id: userId,
      ativo: true,
    },
    include: {
      projects: true,
    },
  });
  
  return memberships
    .filter((m: any) => m.projects.ativo)
    .map((m: any) => ({
      id: m.projects.id as bigint,
      uuid: m.projects.uuid as string,
      codigo: m.projects.codigo as string,
      nome: m.projects.nome as string,
      slug: (m.projects.slug || m.projects.nome.toLowerCase().replace(/\s+/g, '')) as string,
      papel: m.papel as string,
    }));
});

/**
 * Gera slug a partir do nome do projeto
 */
export function generateSlug(nome: string): string {
  return nome
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove acentos
    .replace(/[^a-z0-9]+/g, '')      // Remove caracteres especiais
    .replace(/^-+|-+$/g, '');         // Remove hifens do início/fim
}

