'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Building2, ChevronRight, User, Sparkles, Shield, Users, BarChart3 } from 'lucide-react';
import Image from 'next/image';
import NeuralBackground from '@/components/ui/flow-field-background';
import { useTheme } from '@/components/theme/ThemeProvider';
import { ThemeToggle } from '@/components/theme/ThemeToggle';

interface Project {
  id: string;
  uuid: string;
  codigo: string;
  nome: string;
  slug: string;
  papel: string;
}

interface ProjectSelectionClientProps {
  projects: Project[];
  userName: string | null;
}

export function ProjectSelectionClient({ projects, userName }: ProjectSelectionClientProps) {
  const router = useRouter();
  const [selectedProject, setSelectedProject] = useState<string | null>(null);
  const [hoveredProject, setHoveredProject] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const { theme } = useTheme();

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleSelectProject = (slug: string) => {
    setSelectedProject(slug);
    setTimeout(() => {
      router.push(`/${slug}`);
    }, 400);
  };

  const getRoleBadgeStyles = (papel: string) => {
    switch (papel) {
      case 'ADMIN':
        return {
          bg: 'dark:bg-primary/20 bg-primary/10',
          border: 'dark:border-primary/30 border-primary/20',
          text: 'dark:text-primary text-primary-600',
          icon: Shield,
        };
      case 'FISCAL':
        return {
          bg: 'dark:bg-blue-500/20 bg-blue-500/10',
          border: 'dark:border-blue-500/30 border-blue-500/20',
          text: 'dark:text-blue-400 text-blue-600',
          icon: BarChart3,
        };
      case 'CONSULTA':
        return {
          bg: 'dark:bg-slate-500/20 bg-slate-500/10',
          border: 'dark:border-slate-500/30 border-slate-500/20',
          text: 'dark:text-slate-400 text-slate-600',
          icon: Users,
        };
      default:
        return {
          bg: 'dark:bg-slate-500/20 bg-slate-500/10',
          border: 'dark:border-slate-500/30 border-slate-500/20',
          text: 'dark:text-slate-400 text-slate-600',
          icon: Users,
        };
    }
  };

  const getRoleLabel = (papel: string) => {
    switch (papel) {
      case 'ADMIN':
        return 'Administrador';
      case 'FISCAL':
        return 'Fiscal';
      case 'CONSULTA':
        return 'Consulta';
      default:
        return papel;
    }
  };

  if (!mounted) return null;

  return (
    <div className="min-h-screen dark:bg-navy bg-slate-50 flex flex-col relative transition-colors duration-500">
      {/* Neural Flow Field Background */}
      <div className="fixed inset-0 z-0">
        <NeuralBackground 
          color={theme === 'dark' ? "#3b82f6" : "#2563eb"}
          backgroundColor={theme === 'dark' ? "27, 34, 48" : "248, 250, 252"} // navy-ish for dark, slate-50 for light
          particleCount={400}
          trailOpacity={0.08}
          speed={0.6}
        />
      </div>

      {/* Header */}
      <motion.header 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 p-4 flex justify-between items-center border-b dark:border-white/5 border-slate-200/50"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shadow-lg shadow-primary/20">
            <span className="text-white font-bold text-base">VI</span>
          </div>
          <div>
            <h2 className="text-base font-semibold dark:text-white text-slate-900">Verificador Independente</h2>
            <p className="text-xs dark:text-white/50 text-slate-500">Sistema de Auditoria Rodoviária</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <ThemeToggle />
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="flex items-center gap-2 px-3 py-1.5 rounded-full dark:bg-white/5 bg-white/50 border dark:border-white/10 border-slate-200 backdrop-blur-sm"
          >
            <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center">
              <User className="w-3.5 h-3.5 text-primary" />
            </div>
            <span className="text-sm dark:text-white/70 text-slate-700">{userName || 'Usuário'}</span>
          </motion.div>
        </div>
      </motion.header>

      {/* Main Content - Centered */}
      <main className="flex-1 flex flex-col items-center justify-center p-6 relative z-10">
        <div className="w-full max-w-2xl dark:bg-white/[0.03] bg-white/60 backdrop-blur-xl border dark:border-white/10 border-white/40 rounded-2xl p-8 shadow-2xl dark:shadow-black/20 shadow-slate-200/50">
          {/* Title Section with Logo - Compact */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-center mb-8"
          >
            {/* LBR Logo */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
              className="flex justify-center mb-4"
            >
              <div className={theme === 'light' ? 'invert brightness-0 opacity-80' : ''}>
                <Image
                  src="/LogoBranca.png"
                  alt="LBR Logo"
                  width={140}
                  height={56}
                  priority
                  className="h-auto w-auto object-contain"
                />
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full dark:bg-primary/10 bg-primary/5 border dark:border-primary/20 border-primary/10 mb-4"
            >
              <Sparkles className="w-3.5 h-3.5 text-primary" />
              <span className="text-xs text-primary font-medium">Selecione seu projeto</span>
            </motion.div>
            
            <h1 className="text-2xl md:text-3xl font-bold dark:text-white text-slate-900 mb-2">
              Bem-vindo de volta
            </h1>
            <p className="text-sm dark:text-white/50 text-slate-500">
              Escolha o projeto que deseja acessar
            </p>
          </motion.div>

          {/* Projects List */}
          <div className="space-y-3">
            <AnimatePresence>
              {projects.map((project, index) => {
                const roleStyles = getRoleBadgeStyles(project.papel);
                const RoleIcon = roleStyles.icon;
                const isSelected = selectedProject === project.slug;
                const isHovered = hoveredProject === project.slug;

                return (
                  <motion.button
                    key={project.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3, delay: index * 0.08 }}
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    onClick={() => handleSelectProject(project.slug)}
                    onMouseEnter={() => setHoveredProject(project.slug)}
                    onMouseLeave={() => setHoveredProject(null)}
                    disabled={isSelected}
                    className={`
                      w-full p-5 rounded-xl border transition-all duration-300
                      flex items-center justify-between group
                      ${isSelected
                        ? 'bg-primary/15 border-primary/40 shadow-lg shadow-primary/5'
                        : 'dark:bg-white/[0.03] bg-white border-slate-200 dark:border-white/10 hover:shadow-lg dark:hover:bg-white/[0.05] hover:bg-slate-50 dark:hover:border-primary/30 hover:border-primary/30'
                      }
                    `}
                  >
                    <div className="flex items-center gap-4">
                      {/* Project Icon */}
                      <motion.div 
                        className={`
                          w-14 h-14 rounded-lg flex items-center justify-center transition-colors duration-300
                          ${isSelected
                            ? 'bg-primary shadow-lg shadow-primary/20'
                            : 'dark:bg-white/5 bg-slate-100 group-hover:bg-primary/20'
                          }
                        `}
                        animate={{ rotate: isHovered ? [0, -3, 3, 0] : 0 }}
                        transition={{ duration: 0.4 }}
                      >
                        <Building2 className={`w-6 h-6 ${isSelected ? 'text-white' : 'dark:text-white/60 text-slate-500 group-hover:text-primary dark:group-hover:text-white'}`} />
                      </motion.div>
                      
                      <div className="text-left">
                        <h3 className={`text-lg font-semibold mb-1.5 transition-colors ${isSelected ? 'dark:text-white text-primary-900' : 'dark:text-white text-slate-900'}`}>
                          {project.nome}
                        </h3>
                        <div className="flex items-center gap-2">
                          <span className={`text-xs font-mono px-2 py-0.5 rounded transition-colors ${isSelected ? 'bg-primary/20 text-primary-700 dark:text-white/70' : 'dark:bg-white/5 bg-slate-100 dark:text-white/40 text-slate-500'}`}>
                            {project.codigo}
                          </span>
                          <div className={`
                            flex items-center gap-1.5 text-xs px-2.5 py-0.5 rounded-full border
                            ${roleStyles.bg} ${roleStyles.border} ${roleStyles.text}
                          `}>
                            <RoleIcon className="w-3 h-3" />
                            <span className="font-medium">{getRoleLabel(project.papel)}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Arrow / Loading */}
                    <motion.div
                      animate={{ x: isHovered ? 4 : 0 }}
                      transition={{ type: 'spring', stiffness: 400 }}
                    >
                      <div className={`
                        w-9 h-9 rounded-full flex items-center justify-center transition-colors duration-300
                        ${isSelected
                          ? 'bg-primary text-white shadow-lg shadow-primary/20'
                          : 'dark:bg-white/5 bg-slate-100 dark:text-white/40 text-slate-400 group-hover:bg-primary/20 group-hover:text-primary'
                        }
                      `}>
                        {isSelected ? (
                          <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
                            className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full"
                          />
                        ) : (
                          <ChevronRight className="w-4 h-4" />
                        )}
                      </div>
                    </motion.div>
                  </motion.button>
                );
              })}
            </AnimatePresence>
          </div>
        </div>
      </main>

      {/* Footer */}
      <motion.footer 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="relative z-10 p-6 text-center border-t border-white/5"
      >
        <p className="text-sm text-white/30">
          Sistema de Gestão de Qualidade Rodoviária
        </p>
      </motion.footer>
    </div>
  );
}
