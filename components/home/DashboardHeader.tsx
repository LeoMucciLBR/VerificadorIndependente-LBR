"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { User, ChevronDown, Menu, X, LogOut, Settings, Building2 } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { useProjectOptional } from "@/contexts/ProjectContext";

interface HeaderProps {
  user?: {
    name: string | null;
    email: string;
    role: string;
  };
}

const baseTabs = [
  { path: "sintese", label: "Síntese" },
  { path: "geolocalizacao", label: "Geolocalização" },
  { path: "execucoes", label: "Execuções" },
  { path: "relatorio", label: "Relatório" },
  { path: "registros", label: "Registros" },
  { path: "documentacao", label: "Documentação" },
];

export const DashboardHeader = ({ user }: HeaderProps) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const pathname = usePathname();
  
  // Get project context if available
  const projectContext = useProjectOptional();
  const projectSlug = projectContext?.project?.slug;
  
  // Generate tabs with proper hrefs based on project context
  const tabs = baseTabs.map(tab => ({
    ...tab,
    href: projectSlug ? `/${projectSlug}/${tab.path}` : `/${tab.path}`,
  }));

  // Close user menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
    }

    if (isUserMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isUserMenuOpen]);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      const response = await fetch("/api/auth/logout", {
        method: "POST",
      });

      if (response.ok) {
        router.push("/");
      } else {
        alert("Erro ao fazer logout");
        setIsLoggingOut(false);
      }
    } catch (error) {
      console.error("Logout error:", error);
      alert("Erro ao fazer logout");
      setIsLoggingOut(false);
    }
  };

  const isActive = (path: string) => pathname === path || pathname?.startsWith(`${path}/`);
  
  const homeHref = projectSlug ? `/${projectSlug}/sintese` : "/sintese";
  const settingsHref = projectSlug ? `/${projectSlug}/settings` : "/settings";

  return (
    <motion.header
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="sticky top-0 z-50 bg-slate-900 border-b border-white/10"
    >
      <div className="container mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href={homeHref}>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="flex items-center gap-3 cursor-pointer"
            >
              <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-lg">VI</span>
              </div>
              <div className="hidden sm:block">
                <h1 className="text-white font-semibold text-lg tracking-tight">
                  {projectContext?.project?.nome || "Verificador Independente"}
                </h1>
                <p className="text-white/50 text-xs">
                  {projectContext ? `${projectContext.member.papel}` : "Sistema de Auditoria"}
                </p>
              </div>
            </motion.div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1">
            {tabs.map((tab, index) => (
              <Link key={tab.href} href={tab.href}>
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 * (index + 1) }}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all relative
                    ${isActive(tab.href) 
                      ? "text-white" 
                      : "text-white/60 hover:text-white hover:bg-white/5"}
                  `}
                >
                  {tab.label}
                  {isActive(tab.href) && (
                    <motion.div
                      layoutId="activeTab"
                      className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary"
                    />
                  )}
                </motion.div>
              </Link>
            ))}
          </nav>

          {/* User Profile, Theme Toggle & Mobile Menu Toggle */}
          <div className="flex items-center gap-3">
            {/* Project Switcher Button */}
            {projectContext && (
              <Link
                href="/select-project"
                className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 transition-colors text-white/70 hover:text-white text-sm"
              >
                <Building2 className="w-4 h-4" />
                <span>Trocar Projeto</span>
              </Link>
            )}
            
            {/* Theme Toggle */}
            <ThemeToggle />
            
            <div className="relative" ref={userMenuRef}>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                className="flex items-center gap-3 cursor-pointer group"
              >
                <div className="hidden sm:block text-right">
                  <p className="text-white text-sm font-medium">
                    {user?.name || "Usuário"}
                  </p>
                  <p className="text-white/50 text-xs">
                    {user?.email || ""}
                  </p>
                </div>
                <div className="relative">
                  <div className="w-10 h-10 rounded-full bg-[#0f172a] flex items-center justify-center border-2 border-primary/30 group-hover:border-primary transition-colors duration-300">
                    <User className="w-5 h-5 text-white" />
                  </div>
                  <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-500 border-2 border-slate-900" />
                </div>
                <ChevronDown className={`w-4 h-4 text-white/50 group-hover:text-white transition-all hidden sm:block ${isUserMenuOpen ? 'rotate-180' : ''}`} />
              </motion.div>

              {/* User Dropdown Menu */}
              <AnimatePresence>
                {isUserMenuOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -10, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                    className="absolute right-0 top-full mt-2 w-64 max-w-[calc(100vw-2rem)] bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl shadow-xl overflow-hidden z-50"
                  >
                    {/* User Info */}
                    <div className="p-4 border-b border-slate-200 dark:border-white/10">
                      <p className="text-slate-900 dark:text-white text-sm font-semibold">
                        {user?.name || "Usuário"}
                      </p>
                      <p className="text-slate-500 dark:text-white/50 text-xs mt-0.5">
                        {user?.email || ""}
                      </p>
                    </div>

                    {/* Menu Items */}
                    <div className="p-2">
                      <button
                        onClick={() => {
                          setIsUserMenuOpen(false);
                          router.push(settingsHref);
                        }}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-700 dark:text-white/70 hover:bg-slate-100 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-white transition-colors text-sm"
                      >
                        <Settings className="w-4 h-4" />
                        <span>Configurações</span>
                      </button>
                      {projectContext && (
                        <button
                          onClick={() => {
                            setIsUserMenuOpen(false);
                            router.push('/select-project');
                          }}
                          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-700 dark:text-white/70 hover:bg-slate-100 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-white transition-colors text-sm"
                        >
                          <Building2 className="w-4 h-4" />
                          <span>Trocar Projeto</span>
                        </button>
                      )}
                      <button
                        onClick={handleLogout}
                        disabled={isLoggingOut}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>{isLoggingOut ? 'Saindo...' : 'Sair'}</span>
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden text-white/70 hover:text-white"
            >
              {isMobileMenuOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="absolute top-16 left-0 w-full md:hidden border-t border-white/5 bg-slate-900 shadow-xl z-40"
          >
            <div className="p-4 flex flex-col gap-2">
              {tabs.map((tab) => (
                <Link
                  key={tab.href}
                  href={tab.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`
                    w-full text-left px-4 py-3 rounded-lg text-sm font-medium transition-colors
                    ${isActive(tab.href) 
                      ? "bg-primary/20 text-primary" 
                      : "text-white/70 hover:bg-white/5 hover:text-white"}
                  `}
                >
                  {tab.label}
                </Link>
              ))}
              {projectContext && (
                <Link
                  href="/select-project"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="w-full text-left px-4 py-3 rounded-lg text-sm font-medium transition-colors text-white/70 hover:bg-white/5 hover:text-white border-t border-white/10 mt-2 pt-4"
                >
                  <Building2 className="w-4 h-4 inline mr-2" />
                  Trocar Projeto
                </Link>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
};
