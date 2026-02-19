"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
// motion removido para estabilidade
import { Globe, Layers, Menu, Plus, Minus, ChevronRight } from "lucide-react";
import { motion } from "framer-motion";
import dynamic from "next/dynamic";
// Removed: HighwaySelector - replaced with segments
import KmFilter from "@/components/geolocalizacao/KmFilter";
import { Button } from "@/components/ui/button";

// Restaurando o Mapa
const HighwayMapView = dynamic(
  () => import("@/components/geolocalizacao/HighwayMapView"),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500 mx-auto mb-3"></div>
          <p className="text-sm text-white/60 font-medium tracking-wide">CARREGANDO MAPA...</p>
        </div>
      </div>
    ),
  }
);

import { useTheme } from "@/components/theme/ThemeProvider";
import { toast } from "sonner";
import OccurrencesMapSection from "@/components/geolocalizacao/OccurrencesMapSection";

// ... previous imports ...

interface Segment {
  id: string;
  uuid: string;
  nome: string;
  kmInicial: number;
  kmFinal: number;
  kmInicialKML: number | null;  // KM real da rodovia (para mapa)
  kmFinalKML: number | null;    // KM real da rodovia (para mapa)
  geojson?: any;                // Traçado próprio do segmento
  rodovia: {
    id: string;
    nome: string;
  };
}

export default function GeolocationContent() {
  const [segments, setSegments] = useState<Segment[]>([]);
  const [selectedSegment, setSelectedSegment] = useState<Segment | null>(null);
  const [selectedRodovia, setSelectedRodovia] = useState<string | null>(null);
  const { theme, toggleTheme } = useTheme(); // Use Global Theme
  // ... other states ...
  const [kmInicial, setKmInicial] = useState<number | null>(null);
  const [kmFinal, setKmFinal] = useState<number | null>(null);
  const [geojsonData, setGeojsonData] = useState<any>(null);
  const [fullTrace, setFullTrace] = useState<any>(null);
  const [rodoviaInfo, setRodoviaInfo] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [mapInstance, setMapInstance] = useState<any>(null); // Guardar instância do Leaflet


  
  // Note: local 'theme' state removed

  // Extrair projectSlug da URL (ex: /viabrasil1/geolocalizacao -> viabrasil1)
  const pathname = usePathname();
  const projectSlug = pathname?.split('/')[1] || '';

  // Carregar segmentos homogêneos ao montar
  useEffect(() => {
    loadSegmentosHomogeneos();
  }, [projectSlug]);

  // Carregar dados do mapa quando segmento ou rodovia mudar
  useEffect(() => {
    if (selectedRodovia) {
      loadSegmentos();
    }
  }, [selectedRodovia, kmInicial, kmFinal]);

  const loadSegmentosHomogeneos = async () => {
    try {
      const url = new URL("/api/geolocalizacao/segmentos-homogeneos", window.location.origin);
      if (projectSlug) {
        url.searchParams.set("projectSlug", projectSlug);
      }
      const response = await fetch(url.toString());
      if (!response.ok) throw new Error("Erro ao carregar segmentos");
      const data = await response.json();
      const segmentos = data.segmentos || [];
      setSegments(segmentos);
      
      // Auto-selecionar primeira rodovia para mostrar traçado ao carregar
      if (segmentos.length > 0 && !selectedRodovia) {
        const primeiraRodovia = segmentos[0].rodovia?.id;
        if (primeiraRodovia) {
          setSelectedRodovia(primeiraRodovia);
        }
      }
    } catch (error) {
      console.error("Error loading segments:", error);
    }
  };

  const loadSegmentos = async () => {
    if (!selectedRodovia) return;

    try {
      setLoading(true);
      setError(null);

      const url = new URL(
        "/api/geolocalizacao/segmentos",
        window.location.origin
      );
      url.searchParams.set("rodoviaId", selectedRodovia);

      if (kmInicial !== null && kmFinal !== null) {
        url.searchParams.set("kmInicial", kmInicial.toString());
        url.searchParams.set("kmFinal", kmFinal.toString());
      }

      const response = await fetch(url.toString());

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Erro ao carregar segmentos");
      }

      const data = await response.json();
      setGeojsonData(data.tracadoCompleto);
      setFullTrace(data.rodoviaTrack);
      setRodoviaInfo(data.rodovia);
    } catch (err: any) {
      console.error("Error loading segmentos:", err);
      setError(err.message || "Erro ao carregar dados");
      setGeojsonData(null);
    } finally {
      setLoading(false);
    }
  };

  const handleSegmentClick = (segment: Segment) => {
    if (selectedSegment?.id === segment.id) {
        // Deselect logic
        setSelectedSegment(null);
        // Mantém a rodovia selecionada, mas limpa os filtros de KM para mostrar tudo
        setKmInicial(null);
        setKmFinal(null);
        setGeojsonData(null); // Limpar geojson do segmento
    } else {
        setSelectedSegment(segment);
        setSelectedRodovia(segment.rodovia.id);
        
        // SEMPRE usar filtro de KM para recortar traçado da rodovia
        // (ignorar geojson do segmento pois pode conter traçado completo incorreto)
        const kmIni = segment.kmInicialKML ?? segment.kmInicial;
        const kmFim = segment.kmFinalKML ?? segment.kmFinal;
        setKmInicial(kmIni);
        setKmFinal(kmFim);
        setGeojsonData(null); // Forçar recarga via loadSegmentos
    }
  };

  const handleRodoviaSelect = (rodoviaUuid: string) => {
    setSelectedRodovia(rodoviaUuid);
    setKmInicial(null);
    setKmFinal(null);
  };

  const handleFilter = (kmIni: number | null, kmFim: number | null) => {
    setKmInicial(kmIni);
    setKmFinal(kmFim);
  };


  
  const handleBaseLayerChange = (layerTheme: 'dark' | 'light') => {
      // Se o layer escolhido for diferente do tema atual, inverte
      if (layerTheme !== theme) {
          toggleTheme();
      }
  };

  const filtroAplicado = kmInicial !== null && kmFinal !== null;
  const isDark = theme === 'dark';

  return (
    <div className={`relative w-full flex flex-col transition-colors duration-500 overflow-y-auto ${isDark ? 'bg-slate-900' : 'bg-slate-100'}`}>
      
      {/* 1. Map Hero Section (100vh) - Standard Scroll */}
      <div className="relative w-full h-screen shrink-0 z-0">
        <HighwayMapView
            geojson={geojsonData}
            fullTrace={fullTrace}
            filtroAplicado={filtroAplicado}
            kmInicial={kmInicial}
            kmFinal={kmFinal}
            loading={loading}
            theme={theme}

            onBaseLayerChange={handleBaseLayerChange}
            onMapLoad={setMapInstance}
        />
        
        
        {/* Overlay gradient for better text visibility */}
        <div className={`absolute inset-0 bg-gradient-to-r pointer-events-none ${isDark ? 'from-slate-950/80' : 'from-white/80'} via-transparent to-transparent`} />
        

      </div>

      {/* 2. Top Bar (HUD Header) */}
      <div className="absolute top-0 left-0 right-0 z-20 p-4 flex justify-between items-start pointer-events-none">
         <div className="flex items-center gap-3 pointer-events-auto">
            <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                className={`backdrop-blur-md border ${isDark ? 'bg-black/40 border-white/10 text-white hover:bg-white/10' : 'bg-white/40 border-black/10 text-slate-900 hover:bg-black/5'}`}
            >
                <Menu className="w-5 h-5" />
            </Button>
            
            <div className={`glass-panel px-4 py-2 rounded-lg flex items-center gap-3 ${!isDark && 'glass-panel-light'}`}>
                <Globe className="w-4 h-4 text-blue-500 animate-pulse" />
                <span className={`text-sm font-medium tracking-wide ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    VIA<span className="text-blue-500 font-bold">BRASIL</span> GEOLOCALIZAÇÃO
                </span>
            </div>
         </div>

         {/* Status Indicators */}
         <div className="flex gap-2">
            <div className={`glass-panel px-3 py-1.5 rounded-full flex items-center gap-2 ${!isDark && 'glass-panel-light'}`}>
                <div className={`w-2 h-2 rounded-full ${loading ? 'bg-amber-400 animate-ping' : 'bg-blue-500'}`} />
                <span className={`text-xs font-mono font-bold ${isDark ? 'text-white/80' : 'text-blue-900/80'}`}>
                    {loading ? "BUSCANDO DADOS..." : "SISTEMA ONLINE"}
                </span>
            </div>
         </div>
      </div>

      {/* 3. Sidebar Panel (Floating Glass) */}
      {isSidebarOpen && (
          <div className="absolute top-20 left-4 w-80 max-h-[calc(100vh-120px)] z-20 flex flex-col gap-4 pointer-events-none transition-all duration-300">
              {/* Selector Panel - Height Dynamic */}
              <div className={`glass-panel p-5 rounded-xl border pointer-events-auto shrink-0 flex flex-col max-h-[60vh] overflow-hidden ${isDark ? 'border-white/10' : 'glass-panel-light border-black/10'}`}>
                  <div className={`flex items-center gap-2 mb-4 shrink-0 ${isDark ? 'text-white/80' : 'text-slate-700'}`}>
                      <Layers className="w-4 h-4 text-blue-500" />
                      <h3 className="text-sm font-semibold uppercase tracking-wider">Segmentos Homogêneos</h3>
                  </div>
                  
                   <div className="overflow-y-auto custom-scrollbar -mr-2 pr-2 space-y-2">
                       {[...segments].sort((a, b) => {
                          // Ordenar pelo número do segmento (ex: "Segmento 1" → 1, "Segmento 11" → 11)
                          const numA = parseInt(a.nome.match(/\d+/)?.[0] || '0');
                          const numB = parseInt(b.nome.match(/\d+/)?.[0] || '0');
                          return numA - numB;
                        }).map((segment) => (
                         <div
                           key={segment.id}
                           onClick={() => handleSegmentClick(segment)}
                           className={`p-3 rounded-lg cursor-pointer transition-all ${
                             selectedSegment?.id === segment.id
                               ? isDark 
                                 ? 'bg-blue-500/20 border border-blue-500/50' 
                                 : 'bg-blue-100 border border-blue-300'
                               : isDark
                               ? 'bg-white/5 border border-white/10 hover:bg-white/10'
                               : 'bg-slate-100 border border-slate-200 hover:bg-slate-200'
                           }`}
                         >
                           <div className="flex items-start justify-between gap-2">
                             <div className="flex-1">
                               <h4 className={`font-semibold text-sm mb-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                                 {segment.nome}
                               </h4>
                               <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                                 {segment.rodovia.nome}
                               </p>
                             </div>
                             {selectedSegment?.id === segment.id && (
                               <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                             )}
                           </div>
                           <div className={`flex items-center justify-between mt-2 text-xs font-mono ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>
                             <span>KM {segment.kmInicial.toFixed(1)}</span>
                             <ChevronRight className="w-3 h-3" />
                             <span>KM {segment.kmFinal.toFixed(1)}</span>
                           </div>
                           {/* KMs do KML (se existirem) */}
                           {(segment.kmInicialKML !== null && segment.kmInicialKML !== undefined) && (
                             <div className={`flex items-center justify-between mt-1 text-xs font-mono ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>
                               <span>KM {segment.kmInicialKML.toFixed(1)}</span>
                               <ChevronRight className="w-3 h-3" />
                               <span>KM {segment.kmFinalKML?.toFixed(1)}</span>
                             </div>
                           )}
                         </div>
                       ))}
                       {segments.length === 0 && (
                         <div className={`text-center py-8 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                           <p className="text-sm">Nenhum segmento cadastrado</p>
                         </div>
                       )}
                  </div>
                  

              </div>

              {/* Filter Panel (Only shows when Highway selected) */}
              {selectedRodovia && (
                  <div className={`glass-panel p-5 rounded-xl border pointer-events-auto shrink-0 ${isDark ? 'border-white/10' : 'glass-panel-light border-black/10'}`}>
                      <KmFilter onFilter={handleFilter} isLoading={loading} />
                  </div>
              )}
          </div>
      )}



      {/* Custom Zoom Controls (Right Side) */}
      <div className="absolute right-4 top-24 flex flex-col gap-2 z-20 pointer-events-auto">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => mapInstance?.zoomIn()} 
            className={`glass-panel rounded-lg hover:scale-105 transition-transform ${isDark ? 'text-blue-400 hover:bg-white/10' : 'glass-panel-light text-blue-600 hover:bg-blue-50'}`}
          >
              <Plus className="w-5 h-5" />
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => mapInstance?.zoomOut()} 
            className={`glass-panel rounded-lg hover:scale-105 transition-transform ${isDark ? 'text-blue-400 hover:bg-white/10' : 'glass-panel-light text-blue-600 hover:bg-blue-50'}`}
          >
              <Minus className="w-5 h-5" />
          </Button>
      </div>



       
       <OccurrencesMapSection />
     </div>
  );
}
