"use client";

import { useState, useEffect } from "react";
import { ArrowLeft, Edit, Map as MapIcon, Database, Route, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getRodoviaDetails } from "@/app/actions/rodovias";
import { RodoviaForm } from "./RodoviaForm";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";

interface RodoviaDetailsProps {
    rodoviaId: string;
    onBack: () => void;
}

export function RodoviaDetails({ rodoviaId, onBack }: RodoviaDetailsProps) {
    const [rodovia, setRodovia] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState("geral");

    const loadData = async () => {
        setLoading(true);
        const res = await getRodoviaDetails(rodoviaId);
        if (res.success) {
            setRodovia(res.data);
        }
        setLoading(false);
    };

    useEffect(() => {
        loadData();
    }, [rodoviaId]);

    if (loading) return <div className="p-8 text-center text-slate-500">Carregando detalhes...</div>;
    if (!rodovia) return <div className="p-8 text-center text-red-500">Erro ao carregar rodovia.</div>;

    return (
        <div className="flex flex-col h-full gap-6">
            {/* Header */}
            <div className="flex items-center gap-4 border-b border-slate-200 dark:border-white/10 pb-4">
                <Button variant="ghost" size="icon" onClick={onBack}>
                    <ArrowLeft className="w-5 h-5" />
                </Button>
                <div>
                     <h2 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        {rodovia.nome}
                     </h2>
                     <p className="text-slate-500 dark:text-slate-400 text-sm">
                        {rodovia.concessionaria} • {rodovia.extensao} km
                     </p>
                </div>
            </div>

            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
                <TabsList className="w-full justify-start bg-transparent border-b border-slate-200 dark:border-white/10 p-0 h-auto">
                    <TabsTrigger value="geral" className="data-[state=active]:border-b-2 data-[state=active]:border-orange-500 rounded-none px-4 py-3 bg-transparent">
                        <Database className="w-4 h-4 mr-2" />
                        Geral
                    </TabsTrigger>
                    <TabsTrigger value="geometria" className="data-[state=active]:border-b-2 data-[state=active]:border-orange-500 rounded-none px-4 py-3 bg-transparent">
                        <Upload className="w-4 h-4 mr-2" />
                        Geometria (Eixo)
                    </TabsTrigger>
                    <TabsTrigger value="marcos" className="data-[state=active]:border-b-2 data-[state=active]:border-orange-500 rounded-none px-4 py-3 bg-transparent">
                        <MapIcon className="w-4 h-4 mr-2" />
                        Marcos Quilométricos
                    </TabsTrigger>
                    <TabsTrigger value="segmentos" className="data-[state=active]:border-b-2 data-[state=active]:border-orange-500 rounded-none px-4 py-3 bg-transparent">
                        <Route className="w-4 h-4 mr-2" />
                        Segmentos Homogêneos
                    </TabsTrigger>
                </TabsList>

                <div className="flex-1 mt-6 overflow-y-auto">
                    {/* --- GERAL --- */}
                    <TabsContent value="geral" className="m-0">
                         <div className="max-w-2xl">
                             <RodoviaForm 
                                initialData={rodovia} 
                                onSuccess={loadData} 
                             />
                         </div>
                    </TabsContent>

                    {/* --- GEOMETRIA --- */}
                    <TabsContent value="geometria" className="m-0">
                        <div className="p-6 bg-slate-50 dark:bg-white/5 rounded-xl border border-dashed border-slate-300 dark:border-white/10 text-center">
                            <Upload className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                            <h3 className="text-lg font-semibold mb-2">Upload do Traçado (Eixo)</h3>
                            <p className="text-slate-500 dark:text-slate-400 mb-6 max-w-md mx-auto">
                                Envie o arquivo KML ou KMZ contendo o traçado completo da rodovia. Isso servirá como base para o mapa.
                            </p>
                            <Button variant="outline">
                                Selecionar Arquivo (.kml, .kmz)
                            </Button>
                            
                            {/* Lista de arquivos atuais */}
                            {rodovia.kmlUrl && (
                                <div className="mt-8 text-left bg-white dark:bg-black/20 p-4 rounded-lg">
                                    <p className="text-xs font-bold uppercase text-slate-500 mb-2">Arquivo Atual:</p>
                                    <div className="flex items-center gap-2 text-sm text-blue-500 break-all">
                                        <Database className="w-4 h-4 shrink-0" />
                                        {rodovia.kmlUrl}
                                    </div>
                                </div>
                            )}
                        </div>
                    </TabsContent>

                    {/* --- MARCOS --- */}
                    <TabsContent value="marcos" className="m-0">
                         <div className="flex justify-between items-center mb-4">
                             <h3 className="font-semibold">Lista de Marcos ({rodovia.marcos_quilometricos?.length || 0})</h3>
                             <Button size="sm" variant="outline">Importar CSV</Button>
                         </div>
                         
                         <div className="bg-white dark:bg-white/5 rounded-xl border border-slate-200 dark:border-white/10 overflow-hidden">
                             <table className="w-full text-sm text-left">
                                 <thead className="bg-slate-50 dark:bg-white/5 border-b border-slate-200 dark:border-white/10">
                                     <tr>
                                         <th className="px-4 py-3 font-medium">Nome</th>
                                         <th className="px-4 py-3 font-medium">KM</th>
                                         <th className="px-4 py-3 font-medium">Lat/Long</th>
                                     </tr>
                                 </thead>
                                 <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                                     {rodovia.marcos_quilometricos?.map((m: any) => (
                                         <tr key={m.id}>
                                             <td className="px-4 py-3">{m.nome}</td>
                                             <td className="px-4 py-3 font-mono text-orange-600">{Number(m.km).toFixed(3)}</td>
                                             <td className="px-4 py-3 text-slate-500">{Number(m.latitude).toFixed(5)}, {Number(m.longitude).toFixed(5)}</td>
                                         </tr>
                                     ))}
                                     {(!rodovia.marcos_quilometricos || rodovia.marcos_quilometricos.length === 0) && (
                                         <tr>
                                             <td colSpan={3} className="px-4 py-8 text-center text-slate-500">
                                                 Nenhum marco cadastrado.
                                             </td>
                                         </tr>
                                     )}
                                 </tbody>
                             </table>
                         </div>
                    </TabsContent>

                    {/* --- SEGMENTOS --- */}
                    <TabsContent value="segmentos" className="m-0">
                        <div className="flex justify-between items-center mb-4">
                             <h3 className="font-semibold">Segmentos Homogêneos ({rodovia.segmentos_homogeneos?.length || 0})</h3>
                             <Button size="sm">Novo Segmento</Button>
                         </div>
                         
                         <div className="grid gap-3">
                             {rodovia.segmentos_homogeneos?.map((s: any) => (
                                 <div key={s.id} className="bg-white dark:bg-white/5 p-4 rounded-lg border border-slate-200 dark:border-white/10 flex justify-between items-center">
                                     <div>
                                         <h4 className="font-bold">{s.nome}</h4>
                                         <p className="text-sm text-slate-500">{s.descricao}</p>
                                     </div>
                                     <div className="flex items-center gap-3">
                                         <div className="text-right">
                                             <span className="block text-xs text-slate-400">Início</span>
                                             <span className="font-mono font-bold">km {Number(s.kmInicial).toFixed(3)}</span>
                                         </div>
                                         <div className="w-8 h-1 bg-slate-200 rounded-full" />
                                         <div className="text-left">
                                             <span className="block text-xs text-slate-400">Fim</span>
                                             <span className="font-mono font-bold">km {Number(s.kmFinal).toFixed(3)}</span>
                                         </div>
                                     </div>
                                 </div>
                             ))}
                             {(!rodovia.segmentos_homogeneos || rodovia.segmentos_homogeneos.length === 0) && (
                                 <div className="p-8 text-center border-2 border-dashed border-slate-200 dark:border-white/10 rounded-xl">
                                     <p className="text-slate-500">Nenhum segmento definido.</p>
                                 </div>
                             )}
                         </div>
                    </TabsContent>
                </div>
            </Tabs>
        </div>
    );
}
