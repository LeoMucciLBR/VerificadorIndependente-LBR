"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, 
  Building2,
  Users,
  Database,
  Settings as SettingsIcon
} from "lucide-react";
import { cn } from "@/lib/utils";

const navigationItems = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/admin" },
  { icon: Building2, label: "Projetos", href: "/admin/projects" },
  { icon: Users, label: "Usuários", href: "/admin/users" },
  { icon: Database, label: "Auditoria", href: "/admin/mysql" },
  { icon: SettingsIcon, label: "Configurações", href: "/admin/settings" },
];

export default function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col">
      {/* Header */}
      <div className="p-6 border-b border-slate-800">
        <h2 className="text-lg font-bold text-white">Super Admin</h2>
        <p className="text-sm text-slate-400 mt-1">Sistema ViaBrasil</p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1">
        {navigationItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-lg transition-colors",
                isActive
                  ? "bg-blue-600 text-white"
                  : "text-slate-300 hover:bg-slate-800 hover:text-white"
              )}
            >
              <Icon className="w-5 h-5" />
              <span className="font-medium">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-slate-800">
        <Link
          href="/"
          className="flex items-center justify-center gap-2 px-4 py-2 text-sm text-slate-400 hover:text-white transition-colors"
        >
          ← Voltar ao Início
        </Link>
      </div>
    </aside>
  );
}
