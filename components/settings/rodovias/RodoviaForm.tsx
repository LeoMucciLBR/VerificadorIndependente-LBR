"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createRodovia, updateRodovia } from "@/app/actions/rodovias";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

interface RodoviaFormProps {
    initialData?: any;
    onSuccess: () => void;
}

export function RodoviaForm({ initialData, onSuccess }: RodoviaFormProps) {
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsLoading(true);
        
        const formData = new FormData(e.currentTarget);
        
        try {
            const res = initialData 
                ? await updateRodovia(initialData.id, formData)
                : await createRodovia(formData);

            if (res.success) {
                toast.success(initialData ? "Rodovia atualizada!" : "Rodovia criada!");
                onSuccess();
            } else {
                toast.error(res.error || "Erro ao salvar");
            }
        } catch (error) {
            toast.error("Erro inesperado");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
                <h3 className="text-lg font-bold">
                    {initialData ? "Editar Rodovia" : "Nova Rodovia"}
                </h3>
                <p className="text-sm text-slate-500">
                    Preencha os dados cadastrais da rodovia.
                </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2 space-y-2">
                    <Label htmlFor="nome">Nome da Rodovia *</Label>
                    <Input 
                        id="nome" 
                        name="nome" 
                        placeholder="Ex: BR-101 Sul - Trecho Florianópolis" 
                        defaultValue={initialData?.nome} 
                        required 
                    />
                </div>
                
                <div className="space-y-2">
                    <Label htmlFor="codigo">Código (Sigla)</Label>
                    <Input 
                        id="codigo" 
                        name="codigo" 
                        placeholder="Ex: BR-101" 
                        defaultValue={initialData?.codigo} 
                    />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="extensao">Extensão (km)</Label>
                    <Input 
                        id="extensao" 
                        name="extensao" 
                        type="number" 
                        step="0.01" 
                        placeholder="0.00" 
                        defaultValue={initialData?.extensao} 
                    />
                </div>

                <div className="col-span-2 space-y-2">
                    <Label htmlFor="concessionaria">Concessionária</Label>
                    <Input 
                        id="concessionaria" 
                        name="concessionaria" 
                        placeholder="Ex: CCR ViaCosteira" 
                        defaultValue={initialData?.concessionaria} 
                    />
                </div>
                
                {/* URLs for raw files (optional override) */}
                <div className="col-span-2 space-y-2">
                    <Label htmlFor="kmlUrl">URL do KML (Opcional)</Label>
                    <Input 
                        id="kmlUrl" 
                        name="kmlUrl" 
                        placeholder="https://..." 
                        defaultValue={initialData?.kmlUrl} 
                    />
                    <p className="text-[10px] text-slate-500">
                        O upload de arquivos será feito na aba de Geometria.
                    </p>
                </div>
            </div>

            <div className="flex justify-end gap-2 pt-4">
                <Button type="submit" disabled={isLoading} className="bg-orange-600 hover:bg-orange-700 text-white">
                    {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    {initialData ? "Salvar Alterações" : "Criar Rodovia"}
                </Button>
            </div>
        </form>
    );
}
