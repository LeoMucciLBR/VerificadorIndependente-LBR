'use client';

import { createContext, useContext, ReactNode } from 'react';

interface Project {
  id: string;
  uuid: string;
  codigo: string;
  nome: string;
  slug: string;
  descricao: string | null;
}

interface ProjectMember {
  papel: 'ADMIN' | 'FISCAL' | 'CONSULTA';
}

interface ProjectContextValue {
  project: Project;
  member: ProjectMember;
  isAdmin: boolean;
  isFiscal: boolean;
  isConsulta: boolean;
}

const ProjectContext = createContext<ProjectContextValue | null>(null);

interface ProjectProviderProps {
  children: ReactNode;
  project: Project;
  member: ProjectMember;
}

export function ProjectProvider({ children, project, member }: ProjectProviderProps) {
  const value: ProjectContextValue = {
    project,
    member,
    isAdmin: member.papel === 'ADMIN',
    isFiscal: member.papel === 'FISCAL',
    isConsulta: member.papel === 'CONSULTA',
  };

  return (
    <ProjectContext.Provider value={value}>
      {children}
    </ProjectContext.Provider>
  );
}

export function useProject() {
  const context = useContext(ProjectContext);
  
  if (!context) {
    throw new Error('useProject deve ser usado dentro de um ProjectProvider');
  }
  
  return context;
}

export function useProjectOptional() {
  return useContext(ProjectContext);
}
