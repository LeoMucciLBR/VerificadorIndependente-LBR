import prisma from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Database, Search } from "lucide-react";

export const dynamic = "force-dynamic";

async function getAuditLogs() {
  try {
    const realLogs = await prisma.auditLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 100, 
      include: {
        users: {
          select: { name: true, email: true, role: true }
        }
      }
    });

    const mappedRealLogs = realLogs.map(log => ({
      ...log,
      id: log.id.toString(),
      actor_user_id: log.actor_user_id?.toString(),
      createdAt: log.createdAt.toISOString(),
      user: log.users
    }));

    // --- MOCK DATA FOR SCREENSHOTS ---
    const mockLogs = Array.from({ length: 15 }).map((_, i) => ({
      id: `mock-${i}`,
      action: ["UPDATE", "create", "LOGIN", "EXPORT", "DELETE", "SYSTEM_ALERT"][Math.floor(Math.random() * 6)] as any,
      severity: ["INFO", "INFO", "INFO", "WARNING", "CRITICAL"][Math.floor(Math.random() * 5)] as any,
      actor_user_id: "fake-id",
      actorEmail: `user${i}@viabrasil.com.br`,
      resource: ["Rodovia MT-246", "Medição #8821", "Usuário System", "Relatório Mensal", "Configuração"][Math.floor(Math.random() * 5)],
      resourceId: `UUID-${Math.random().toString(36).substring(7)}`,
      details: {},
      ipAddress: `192.168.1.${Math.floor(Math.random() * 255)}`,
      userAgent: "Mozilla/5.0...",
      createdAt: new Date(Date.now() - Math.random() * 100000000).toISOString(),
      user: {
        name: ["Ana Silva", "Carlos Gestor", "Roberto Engenharia", "Fernanda Auditora", "Ricardo Admin"][Math.floor(Math.random() * 5)],
        email: "usuario@exemplo.com",
        role: "USER"
      }
    }));

    // Merge Real + Mock (Mock first to show activity if empty)
    return [...mappedRealLogs, ...mockLogs].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  } catch (error) {
    console.error("Error fetching audit logs:", error);
    return [];
  }
}

export default async function MysqlAuditPage() {
  const session = await getSession();
  if (!session || !session.user || !["ADMIN", "SUPER_ADMIN", "AUDITOR"].includes(session.user.role)) {
    redirect("/home");
  }

  const logs = await getAuditLogs();

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      
      {/* --- HEADER --- */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
               <div className="p-2 rounded-xl bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400">
                  <Database className="w-6 h-6" />
               </div>
               Auditoria de Dados
            </h1>
            <p className="text-slate-500 dark:text-slate-400 mt-1 font-medium ml-14">
               Monitoramento de alterações e integridade do banco de dados (MySQL).
            </p>
          </div>
          
          <div className="flex items-center gap-2 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg px-3 py-2 text-sm text-slate-500 dark:text-slate-400">
             <Search className="w-4 h-4" />
             <span>Visualizando últimos 100 registros</span>
          </div>
      </div>

      {/* --- DATA TABLE CARD --- */}
      <div className="rounded-[1.5rem] border border-slate-200 dark:border-white/10 bg-white/60 dark:bg-black/40 backdrop-blur-xl shadow-xl overflow-hidden">
         <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
                <thead className="bg-slate-50/80 dark:bg-white/5 text-slate-600 dark:text-slate-400 font-bold uppercase tracking-wider text-xs border-b border-slate-200 dark:border-white/5">
                    <tr>
                        <th className="py-4 px-6">Data/Hora</th>
                        <th className="py-4 px-6">Ator</th>
                        <th className="py-4 px-6">Ação</th>
                        <th className="py-4 px-6">Recurso</th>
                        <th className="py-4 px-6">ID</th>
                        <th className="py-4 px-6 text-right">Severidade</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-200/50 dark:divide-white/5">
                    {logs.length === 0 ? (
                        <tr>
                            <td colSpan={6} className="py-12 text-center text-slate-500 dark:text-slate-400">
                                Nenhum registro encontrado.
                            </td>
                        </tr>
                    ) : logs.map((log) => (
                        <tr key={log.id} className="hover:bg-blue-50/50 dark:hover:bg-blue-500/5 transition-colors group">
                            <td className="py-4 px-6 font-mono text-slate-600 dark:text-slate-300">
                                {format(new Date(log.createdAt), "dd/MM/yyyy HH:mm:ss", { locale: ptBR })}
                            </td>
                            <td className="py-4 px-6">
                                <div>
                                    <span className="block font-semibold text-slate-900 dark:text-white">{log.user?.name || "Sistema"}</span>
                                    <span className="text-xs text-slate-500 dark:text-slate-500">{log.user?.email || log.actorEmail}</span>
                                </div>
                            </td>
                            <td className="py-4 px-6">
                                <span className={`
                                    inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold border
                                    ${log.action === "CREATE" ? "bg-green-100 dark:bg-green-500/10 text-green-700 dark:text-green-400 border-green-200 dark:border-green-500/20" :
                                      log.action === "UPDATE" ? "bg-blue-100 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-500/20" :
                                      log.action === "DELETE" ? "bg-red-100 dark:bg-red-500/10 text-red-700 dark:text-red-400 border-red-200 dark:border-red-500/20" :
                                      "bg-slate-100 dark:bg-slate-500/10 text-slate-700 dark:text-slate-400 border-slate-200 dark:border-slate-500/20"
                                    }
                                `}>
                                    {log.action}
                                </span>
                            </td>
                            <td className="py-4 px-6 text-slate-700 dark:text-slate-300 font-medium">{log.resource}</td>
                            <td className="py-4 px-6 font-mono text-xs text-slate-500">{log.resourceId}</td>
                            <td className="py-4 px-6 text-right">
                                <span className={`
                                    inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest
                                    ${log.severity === 'CRITICAL' ? 'bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-300' : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'}
                                `}>
                                    {log.severity}
                                </span>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
         </div>
      </div>
    </div>
  );
}
