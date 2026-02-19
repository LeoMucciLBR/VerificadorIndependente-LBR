"use client";

import { useState, useEffect } from "react";
import { useFormStatus } from "react-dom";
import { updateProjectSettings, getProjectSettings } from "@/app/actions/settings";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Loader2, Save, Building, Calendar, FileText, Image as ImageIcon, MapPin } from "lucide-react";
import { toast } from "sonner";
import Image from "next/image";

export function ProjectSettingsForm() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [preview, setPreview] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const info = await getProjectSettings();
      setData(info);
      if (info?.heroImageUrl) {
        setPreview(info.heroImageUrl);
      }
    } catch (error) {
      toast.error("Erro ao carregar dados do projeto");
    } finally {
      setLoading(false);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setPreview(url);
    }
  };

  const handleSubmit = async (formData: FormData) => {
    const result = await updateProjectSettings(null, formData);
    if (result?.error) {
      toast.error(result.error);
    } else {
      toast.success("Configurações atualizadas!");
      // Optionally reload data to get new image URL if needed, but preview handles visual feedback
    }
  };

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
          <div className="p-2 bg-blue-100 dark:bg-blue-500/20 rounded-xl text-blue-600 dark:text-blue-400">
            <Building className="w-8 h-8" />
          </div>
          Dados da Home
        </h1>
        <p className="text-slate-500 dark:text-slate-400 text-lg mt-2">
           Personalize o banner, títulos e informações contratuais exibidos na Dashboard.
        </p>
      </div>

      <form action={handleSubmit}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
           
           {/* --- MAIN INFO CARD --- */}
           <Card className="md:col-span-2 bg-white/50 dark:bg-white/5 border-slate-200 dark:border-white/10 backdrop-blur-sm">
              <CardHeader>
                 <CardTitle className="flex items-center gap-2">
                    <FileText className="w-5 h-5 text-blue-500" />
                    Informações do Contrato
                 </CardTitle>
                 <CardDescription>Dados principais exibidos no banner</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                 <div className="space-y-2">
                    <Label htmlFor="title">Título do Projeto</Label>
                    <Input id="title" name="title" defaultValue={data?.title} placeholder="Ex: Concessão Rodovia Centro-Oeste" />
                 </div>
                 
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="contractNumber">Nº Contrato</Label>
                        <Input id="contractNumber" name="contractNumber" defaultValue={data?.contractNumber} placeholder="Ex: CTR-001/2024" />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="clientName">Cliente / Órgão</Label>
                        <Input id="clientName" name="clientName" defaultValue={data?.clientName} placeholder="Ex: ANTT" />
                    </div>
                 </div>

                 <div className="space-y-2">
                    <Label htmlFor="segmentName">Nome do Trecho</Label>
                    <Input id="segmentName" name="segmentName" defaultValue={data?.segmentName} placeholder="Ex: Trecho Sul - BR-163" />
                 </div>
                 
                 <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="extension">Extensão (km)</Label>
                        <Input id="extension" name="extension" defaultValue={data?.extension} placeholder="Ex: 850,4 km" />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="startDate">Início</Label>
                        <Input type="date" id="startDate" name="startDate" defaultValue={data?.startDate ? new Date(data.startDate).toISOString().split('T')[0] : ''} />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="endDate">Fim</Label>
                        <Input type="date" id="endDate" name="endDate" defaultValue={data?.endDate ? new Date(data.endDate).toISOString().split('T')[0] : ''} />
                    </div>
                 </div>
              </CardContent>
           </Card>

           {/* --- IMAGE CARD --- */}
           <Card className="bg-white/50 dark:bg-white/5 border-slate-200 dark:border-white/10 backdrop-blur-sm h-fit">
              <CardHeader>
                 <CardTitle className="flex items-center gap-2">
                    <ImageIcon className="w-5 h-5 text-purple-500" />
                    Banner
                 </CardTitle>
                 <CardDescription>Imagem de fundo da Home</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                 <div className="aspect-video w-full rounded-lg overflow-hidden bg-slate-100 dark:bg-black/20 border border-slate-200 dark:border-white/10 relative group">
                    {preview ? (
                        <Image src={preview} alt="Hero Preview" fill className="object-cover transition-transform group-hover:scale-105" />
                    ) : (
                        <div className="flex items-center justify-center h-full text-slate-400">
                           <ImageIcon className="w-12 h-12 opacity-20" />
                        </div>
                    )}
                 </div>
                 
                 <div className="relative">
                    <input 
                      type="file" 
                      name="heroImageFile" 
                      id="heroImageFile" 
                      accept="image/*" 
                      className="hidden" 
                      onChange={handleImageChange}
                    />
                    <Label 
                      htmlFor="heroImageFile" 
                      className="flex items-center justify-center gap-2 w-full py-2 bg-slate-100 dark:bg-white/10 hover:bg-slate-200 dark:hover:bg-white/20 rounded-lg cursor-pointer transition-colors text-sm font-medium"
                    >
                       <UploadIcon className="w-4 h-4" />
                       Selecionar Imagem
                    </Label>
                 </div>
                 <p className="text-xs text-slate-500 text-center">
                    Recomendado: 1920x1080px (JPG/PNG)
                 </p>
              </CardContent>
           </Card>
        </div>
        
        <div className="flex justify-end pt-4">
           <SaveButton />
        </div>
      </form>
    </div>
  );
}

function SaveButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className="bg-blue-600 hover:bg-blue-500 text-white px-8 py-6 text-lg shadow-lg shadow-blue-500/20 rounded-xl">
      {pending ? (
         <>
           <Loader2 className="w-5 h-5 mr-2 animate-spin" />
           Salvando...
         </>
      ) : (
         <>
           <Save className="w-5 h-5 mr-2" />
           Salvar Alterações
         </>
      )}
    </Button>
  );
}

function UploadIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
      <polyline points="17 8 12 3 7 8"/>
      <line x1="12" x2="12" y1="3" y2="15"/>
    </svg>
  );
}
