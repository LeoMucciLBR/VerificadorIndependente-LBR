  "use client";

import { motion } from "framer-motion";
import { FileText, Filter, LayoutGrid } from "lucide-react"; 
import CreateOccurrenceModal from "@/components/registros/CreateOccurrenceModal";
import OccurrenceList from "@/components/registros/OccurrenceList";

type RegistrosViewProps = {
    ocorrencias: any[];
    pagination: any;
    activeInspection: any;
    indicadores: any[];
    projectSlug: string;
};

export default function RegistrosView({ ocorrencias, pagination, activeInspection, indicadores, projectSlug }: RegistrosViewProps) {
    
    return (
        <div className="flex-1 flex flex-col h-full relative overflow-hidden transition-colors duration-300">
             {/* Background - Clean Technical Grid (Matching Execucoes) */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#e2e8f0_1px,transparent_1px),linear-gradient(to_bottom,#e2e8f0_1px,transparent_1px)] dark:bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-[0.4] dark:opacity-[0.2] pointer-events-none" />
            
            {/* Top Gradient Glow */}
            <div className="absolute top-0 left-0 right-0 h-96 bg-primary/5 blur-[100px] pointer-events-none" />

            <div className="relative container mx-auto px-6 py-8 flex flex-col gap-8 h-full z-10">
                
                {/* Header Section */}
                <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-6 shrink-0">
                    <div className="flex items-center gap-5">
                         <div className="p-4 rounded-2xl bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-primary/20 shadow-lg shadow-slate-200/50 dark:shadow-primary/5">
                            <LayoutGrid className="w-8 h-8 text-primary" />
                        </div>
                        <div>
                             <h2 className="text-3xl font-bold text-slate-800 dark:text-white tracking-tight">
                                Registros de Campo
                            </h2>
                            <p className="text-slate-500 dark:text-slate-400 mt-1 max-w-lg text-sm">
                                Visualize e gerencie não-conformidades e indicadores coletados em campo.
                            </p>
                        </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                         {/* We can re-add filter button here if needed, but the list has filter controls inside */}
                        <CreateOccurrenceModal activeInspection={activeInspection} indicadores={indicadores} projectSlug={projectSlug} />
                    </div>
                </div>

                 {/* Content Area */}
                 <div className="flex-1 min-h-0 relative">
                    <OccurrenceList registros={ocorrencias} pagination={pagination} />
                 </div>

            </div>
        </div>
    );
}
