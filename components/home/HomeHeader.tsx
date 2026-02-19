"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { User, ChevronDown, Menu, X, LogOut, Settings } from "lucide-react";
import { useRouter } from "next/navigation";
import { ThemeToggle } from "@/components/theme/ThemeToggle";

interface HeaderProps {
  activeTab: string;
  onTabChange?: (tab: string) => void;
  user?: {
    name: string | null;
    email: string;
    role: string;
  };
}

const tabs = [
  { id: "sintese", label: "Síntese" },
  { id: "geolocation", label: "Geolocalização" },
  { id: "execution_list", label: "Execuções" },
  { id: "report", label: "Relatório" },
  { id: "records", label: "Registros" },
  { id: "documentation", label: "Documentação" },
];

export const HomeHeader = ({ activeTab, onTabChange = () => {}, user }: HeaderProps) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

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

  return (
    <motion.header
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="sticky top-0 z-50 bg-navy border-b border-border/50"
    >
      <div className="container mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
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
              <h1 className="text-foreground font-semibold text-lg tracking-tight">
                Verificador Independente
              </h1>
              <p className="text-foreground/50 text-xs">Sistema de Auditoria</p>
            </div>
          </motion.div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1">
            {tabs.map((tab, index) => (
              <motion.button
                key={tab.id}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 * (index + 1) }}
                onClick={() => onTabChange(tab.id)}
                className={`nav-tab cursor-pointer ${activeTab === tab.id ? "active" : ""}`}
              >
                {tab.label}
              </motion.button>
            ))}
          </nav>

          {/* User Profile, Theme Toggle & Mobile Menu Toggle */}
          <div className="flex items-center gap-3">
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
                  <p className="text-foreground text-sm font-medium">
                    {user?.name || "Usuário"}
                  </p>
                  <p className="text-foreground/50 text-xs">
                    {user?.email || ""}
                  </p>
                </div>
                <div className="relative">
                  <div className="w-10 h-10 rounded-full bg-executive flex items-center justify-center border-2 border-primary/30 group-hover:border-primary transition-colors duration-300">
                    <User className="w-5 h-5 text-foreground" />
                  </div>
                  <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-success border-2 border-navy" />
                </div>
                <ChevronDown className={`w-4 h-4 text-foreground/50 group-hover:text-foreground transition-all hidden sm:block ${isUserMenuOpen ? 'rotate-180' : ''}`} />
              </motion.div>

              {/* User Dropdown Menu */}
              <AnimatePresence>
                {isUserMenuOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -10, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                    className="absolute right-0 top-full mt-2 w-64 max-w-[calc(100vw-2rem)] bg-white dark:bg-card border border-gray-200 dark:border-white/10 rounded-xl shadow-2xl overflow-hidden z-50"
                  >
                    {/* User Info */}
                    <div className="p-4 border-b border-gray-200 dark:border-white/10">
                      <p className="text-gray-900 dark:text-foreground text-sm font-semibold">
                        {user?.name || "Usuário"}
                      </p>
                      <p className="text-gray-600 dark:text-foreground/50 text-xs mt-0.5">
                        {user?.email || ""}
                      </p>
                    </div>

                    {/* Menu Items */}
                    <div className="p-2">
                      <button
                        onClick={() => {
                          setIsUserMenuOpen(false);
                          onTabChange('settings');
                        }}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-700 dark:text-foreground/70 hover:bg-gray-100 dark:hover:bg-white/5 hover:text-gray-900 dark:hover:text-foreground transition-colors text-sm"
                      >
                        <Settings className="w-4 h-4" />
                        <span>Configurações</span>
                      </button>
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
              className="md:hidden text-foreground/70 hover:text-foreground"
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
            className="absolute top-16 left-0 w-full md:hidden border-t border-white/5 bg-navy shadow-xl z-40"
          >
            <div className="p-4 flex flex-col gap-2">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => {
                    onTabChange(tab.id);
                    setIsMobileMenuOpen(false);
                  }}
                  className={`
                    w-full text-left px-4 py-3 rounded-lg text-sm font-medium transition-colors
                    ${activeTab === tab.id 
                      ? "bg-primary/20 text-primary" 
                      : "text-foreground/70 hover:bg-white/5 hover:text-foreground"}
                  `}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
};
