"use client";

import { useState } from "react";
import { Upload, Map as MapIcon, FileArchive, Check, X, Loader2, Search, Plus } from "lucide-react";
import { toast } from "sonner";
import dynamic from "next/dynamic";

// Dynamic import to avoid SSR issues with Leaflet
const MapView = dynamic(() => import("@/components/geolocation/MapView"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[600px] bg-slate-100 dark:bg-black/20 rounded-[1.5rem] flex items-center justify-center border border-slate-200 dark:border-white/5">
      <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
    </div>
  ),
});

interface RouteData {
  id: string;
  routeName: string;
  description: string | null;
  lengthKm: number | null;
  geojson: {
    type: string;
    features: Array<{
      type: string;
      geometry: {
        type: string;
        coordinates: number[][] | number[][][];
      };
      properties: Record<string, unknown>;
    }>;
  };
  createdAt: string;
}

export default function RodoviaAdminPage() {
  const [uploading, setUploading] = useState(false);
  const [routes, setRoutes] = useState<RouteData[]>([]);
  const [selectedRoute, setSelectedRoute] = useState<RouteData | null>(null);
  const [loading, setLoading] = useState(false);
  const [segments, setSegments] = useState<any[]>([]);
  const [loadingSegments, setLoadingSegments] = useState(false);

  // Load routes on component mount
  const loadRoutes = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/rodovia");
      if (!response.ok) throw new Error("Erro ao carregar rodovias");
      const data = await response.json();
      setRoutes(data);
      if (data.length > 0 && !selectedRoute) {
        setSelectedRoute(data[0]);
      }
    } catch (error) {
      toast.error("Erro ao carregar rodovias");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // Load segments
  const loadSegments = async () => {
    setLoadingSegments(true);
    try {
      const response = await fetch("/api/rodovia/segmentos");
      if (!response.ok) throw new Error("Erro ao carregar segmentos");
      const data = await response.json();
      setSegments(data);
      console.log(`📍 ${data.length} segmentos carregados`);
    } catch (error) {
      toast.error("Erro ao carregar segmentos");
      console.error(error);
    } finally {
      setLoadingSegments(false);
    }
  };

  // Load routes and segments on mount
  useState(() => {
    loadRoutes();
    loadSegments();
  });

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith(".kmz") && !file.name.endsWith(".kml") && !file.name.endsWith(".geojson")) {
      toast.error("Por favor, selecione um arquivo KMZ, KML ou GeoJSON");
      return;
    }

    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      // Choose endpoint based on file type
      const endpoint = file.name.endsWith(".geojson") 
        ? "/api/rodovia/upload-geojson"
        : "/api/rodovia/upload";
      
      const response = await fetch(endpoint, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Erro ao fazer upload");
      }

      const result = await response.json();
      toast.success("Rodovia importada com sucesso!");
      
      // Reload routes
      await loadRoutes();
      
      // Select the newly uploaded route
      if (result.route) {
        setSelectedRoute(result.route);
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro ao processar arquivo");
      console.error(error);
    } finally {
      setUploading(false);
      // Reset input
      event.target.value = "";
    }
  };

  const handleStructuredImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith(".geojson")) {
      toast.error("Por favor, selecione um arquivo GeoJSON exportado do QGIS");
      return;
    }

    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch("/api/rodovia/import-structured", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Erro ao fazer upload");
      }

      const result = await response.json();
      
      toast.success(
        `✅ Importação concluída!\n${result.summary.rodovias} rodovias, ${result.summary.segmentos} segmentos criados.`
      );
      
      // Reload routes and segments
      await loadRoutes();
      await loadSegments();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro ao processar arquivo");
      console.error(error);
    } finally {
      setUploading(false);
      // Reset input
      event.target.value = "";
    }
  };

  // Convert GeoJSON to map coordinates
  const getMapData = (route: RouteData | null) => {
    const routeCoordinates: [number, number][] = [];
    const polygons: [number, number][][] = [];
    const markers: Array<{ position: [number, number]; name: string; description?: string }> = [];

    // Add old route data if exists
    if (route) {
      route.geojson.features.forEach((feature) => {
        const { type, coordinates } = feature.geometry;
        const properties = feature.properties;

        if (type === "LineString") {
          (coordinates as number[][]).forEach((coord) => {
            routeCoordinates.push([coord[1], coord[0]]);
          });
        } else if (type === "Polygon") {
          const polygonCoords = (coordinates as number[][][])[0].map((coord) => [
            coord[1],
            coord[0],
          ] as [number, number]);
          polygons.push(polygonCoords);
        } else if (type === "Point") {
          const coord = coordinates as unknown as number[];
          markers.push({
            position: [coord[1], coord[0]],
            name: properties.name as string || "Ponto",
            description: properties.description as string,
          });
        }
      });
    }

    // Add segments from database
    segments.forEach((segment) => {
      if (!segment.geojson) return;
      
      const { type, coordinates } = segment.geojson;
      
      if (type === "LineString") {
        // Each segment is a LineString, add to route
        (coordinates as number[][]).forEach((coord) => {
          routeCoordinates.push([coord[1], coord[0]]);
        });
      } else if (type === "Point") {
        const coord = coordinates as number[];
        markers.push({
          position: [coord[1], coord[0]],
          name: `KM ${segment.kmInicial}`,
          description: segment.descricao || `${segment.rodovia?.nome}`,
        });
      }
    });

    return { routeCoordinates, polygons, markers };
  };

  const mapData = getMapData(selectedRoute);

  return (
    <div className="space-y-6 animate-in fade-in duration-500 font-sans">
      
      {/* --- HEADER --- */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
               <div className="p-2 rounded-xl bg-orange-100 dark:bg-orange-500/20 text-orange-600 dark:text-orange-500">
                  <MapIcon className="w-6 h-6" />
               </div>
               Ativos Rodoviários
            </h1>
            <p className="text-slate-500 dark:text-slate-400 mt-1 font-medium ml-14">
               Gerencie as rodovias, geometria e segmentação do projeto.
            </p>
          </div>
          
          <div className="flex items-center gap-3">
             {/* Upload Buttons */}
             <label className="group relative px-5 py-2.5 rounded-xl bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-white font-bold text-sm shadow-sm hover:shadow-md hover:border-green-500/50 transition-all cursor-pointer flex items-center gap-2">
                 {uploading ? <Loader2 className="w-4 h-4 animate-spin text-green-500" /> : <FileArchive className="w-4 h-4 text-green-500" />}
                 <span>Importar QGIS</span>
                 <input type="file" accept=".geojson" onChange={handleStructuredImport} disabled={uploading} className="hidden" />
             </label>

             <label className="group relative px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm shadow-lg shadow-blue-500/20 transition-all cursor-pointer flex items-center gap-2">
                 {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                 <span>Nova Importação</span>
                 <input type="file" accept=".kmz,.kml,.geojson" onChange={handleFileUpload} disabled={uploading} className="hidden" />
             </label>
          </div>
      </div>

      {/* --- MAIN GLASS CONTAINER --- */}
      <div className="relative bg-white/60 dark:bg-slate-900/50 rounded-[2rem] border border-slate-200 dark:border-white/5 overflow-hidden shadow-2xl backdrop-blur-xl min-h-[600px]">
         
         <div className="grid grid-cols-1 lg:grid-cols-4 h-full min-h-[600px]">
            {/* Sidebar List */}
            <div className="lg:col-span-1 border-r border-slate-200 dark:border-white/5 bg-slate-50/50 dark:bg-black/20 p-4 overflow-y-auto max-h-[800px]">
               <div className="relative mb-4">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input 
                    type="text" 
                    placeholder="Buscar rodovia..." 
                    className="w-full pl-10 pr-4 py-2 rounded-xl bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  />
               </div>

               {loading ? (
                  <div className="text-center py-8">
                     <Loader2 className="w-6 h-6 animate-spin text-blue-500 mx-auto" />
                     <p className="text-xs text-slate-500 mt-2">Carregando...</p>
                  </div>
               ) : routes.length > 0 ? (
                  <div className="space-y-2">
                     {routes.map((route) => (
                        <button
                           key={route.id}
                           onClick={() => setSelectedRoute(route)}
                           className={`w-full text-left p-3 rounded-xl transition-all border group relative overflow-hidden ${
                              selectedRoute?.id === route.id
                              ? "bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-500/20"
                              : "bg-white dark:bg-white/5 border-slate-200 dark:border-white/5 text-slate-700 dark:text-slate-300 hover:border-blue-500/30"
                           }`}
                        >
                           <div className="relative z-10">
                              <span className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-md mb-2 inline-block ${
                                 selectedRoute?.id === route.id ? "bg-white/20 text-white" : "bg-slate-100 dark:bg-white/10 text-slate-500 dark:text-slate-400"
                              }`}>
                                 {route.id.substring(0,6)}...
                              </span>
                              <h3 className="font-bold text-sm truncate">{route.routeName}</h3>
                              <p className={`text-xs mt-1 truncate ${selectedRoute?.id === route.id ? "text-blue-100" : "text-slate-500"}`}>
                                 {route.description || "Sem descrição"}
                              </p>
                              {route.lengthKm && (
                                <div className="flex items-center gap-1 mt-2 text-[10px] font-mono opacity-80">
                                   <MapIcon className="w-3 h-3" />
                                   {route.lengthKm} km
                                </div>
                              )}
                           </div>
                           {selectedRoute?.id === route.id && (
                              <div className="absolute right-0 top-0 bottom-0 w-24 bg-gradient-to-l from-blue-500 to-transparent opacity-20" />
                           )}
                        </button>
                     ))}
                  </div>
               ) : (
                  <div className="text-center py-10 opacity-50">
                     <FileArchive className="w-8 h-8 mx-auto mb-2" />
                     <p className="text-xs">Nenhum registro.</p>
                  </div>
               )}
            </div>

            {/* Map Area */}
            <div className="lg:col-span-3 bg-slate-100 dark:bg-[#0f172a]/50 p-1 relative">
                {selectedRoute ? (
                    <div className="h-full w-full rounded-tr-[1.5rem] rounded-br-[1.5rem] overflow-hidden shadow-inner">
                        <MapView
                           routeCoordinates={mapData.routeCoordinates}
                           polygons={mapData.polygons}
                           markers={mapData.markers}
                        />
                    </div>
                ) : (
                    <div className="h-full flex flex-col items-center justify-center text-slate-400">
                        <MapIcon className="w-16 h-16 mb-4 opacity-20" />
                        <p>Selecione uma rodovia para visualizar</p>
                    </div>
                )}
                
                {/* Floating Map Controls */}
                <div className="absolute top-4 right-4 flex gap-2">
                   <div className="bg-white/90 dark:bg-black/80 backdrop-blur px-3 py-1.5 rounded-lg border border-white/10 text-xs font-bold shadow-lg">
                      Modo Visualização
                   </div>
                </div>
            </div>
         </div>
      </div>
    </div>
  );
}
