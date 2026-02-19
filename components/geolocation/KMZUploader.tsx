"use client";

import { useState, useCallback } from "react";
import { Upload, FileUp, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import JSZip from "jszip";
import { kml } from "@tmcw/togeojson";

interface KMZUploaderProps {
  onGeoJSONParsed: (geojson: any, filename: string) => void;
}

export default function KMZUploader({ onGeoJSONParsed }: KMZUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [status, setStatus] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const processKMZ = async (file: File) => {
    setIsProcessing(true);
    setStatus(null);

    try {
      // Validate file extension
      if (!file.name.toLowerCase().endsWith('.kmz') && !file.name.toLowerCase().endsWith('.kml')) {
        throw new Error("Por favor, selecione um arquivo KMZ ou KML válido");
      }

      let kmlText: string;

      if (file.name.toLowerCase().endsWith('.kmz')) {
        // Extract KML from KMZ (which is a ZIP file)
        const arrayBuffer = await file.arrayBuffer();
        const zip = await JSZip.loadAsync(arrayBuffer);
        
        // Find .kml file in the zip
        const kmlFile = Object.keys(zip.files).find(name => name.toLowerCase().endsWith('.kml'));
        
        if (!kmlFile) {
          throw new Error("Arquivo KML não encontrado dentro do KMZ");
        }

        kmlText = await zip.files[kmlFile].async('text');
      } else {
        // Direct KML file
        kmlText = await file.text();
      }

      // Parse KML to DOM
      const parser = new DOMParser();
      const kmlDom = parser.parseFromString(kmlText, 'text/xml');

      // Convert to GeoJSON
      const geojson = kml(kmlDom);

      if (!geojson || !geojson.features || geojson.features.length === 0) {
        throw new Error("Nenhuma geometria encontrada no arquivo");
      }

      setStatus({ type: "success", message: `✓ Arquivo processado com sucesso! ${geojson.features.length} feature(s) encontrada(s).` });
      onGeoJSONParsed(geojson, file.name);
    } catch (error: any) {
      console.error("Error processing KMZ:", error);
      setStatus({ type: "error", message: `✗ Erro: ${error.message}` });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files[0];
    if (file) {
      processKMZ(file);
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processKMZ(file);
    }
  };

  return (
    <div className="space-y-4">
      {/* Upload Area */}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={`
          relative border-2 border-dashed rounded-xl p-8 transition-all duration-300
          ${isDragging 
            ? 'border-primary bg-primary/5 scale-[1.02]' 
            : 'border-border hover:border-primary/50 hover:bg-muted/20'
          }
          ${isProcessing ? 'pointer-events-none opacity-60' : 'cursor-pointer'}
        `}
      >
        <input
          type="file"
          id="kmz-upload"
          accept=".kmz,.kml"
          onChange={handleFileSelect}
          className="hidden"
          disabled={isProcessing}
        />
        
        <label htmlFor="kmz-upload" className="cursor-pointer">
          <div className="flex flex-col items-center gap-4 text-center">
            {isProcessing ? (
              <Loader2 className="w-12 h-12 text-primary animate-spin" />
            ) : (
              <FileUp className="w-12 h-12 text-primary/70" />
            )}
            
            <div>
              <h3 className="text-lg font-semibold text-foreground mb-1">
                {isProcessing ? "Processando arquivo..." : "Enviar arquivo KMZ/KML"}
              </h3>
              <p className="text-sm text-foreground/60">
                Arraste e solte ou clique para selecionar
              </p>
              <p className="text-xs text-foreground/40 mt-2">
                Formatos suportados: .kmz, .kml
              </p>
            </div>
          </div>
        </label>
      </div>

      {/* Status Message */}
      {status && (
        <div
          className={`
            flex items-center gap-3 p-4 rounded-lg border
            ${status.type === "success" 
              ? "bg-success/10 border-success/30 text-success" 
              : "bg-destructive/10 border-destructive/30 text-destructive"
            }
          `}
        >
          {status.type === "success" ? (
            <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
          )}
          <p className="text-sm font-medium">{status.message}</p>
        </div>
      )}
    </div>
  );
}
