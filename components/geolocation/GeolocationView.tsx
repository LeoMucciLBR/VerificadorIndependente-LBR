"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { motion } from "framer-motion";
import { MapPin, Upload, Save, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import KMZUploader from "@/components/geolocation/KMZUploader";
import { toast } from "sonner";

// Dynamic import to avoid SSR issues with Leaflet
const MapView = dynamic(() => import("@/components/geolocation/MapView"), {
  ssr: false,
  loading: () => (
    <div className="flex flex-col h-[calc(100vh-4rem)] relative items-center justify-center">
      <p className="text-foreground/60">Carregando mapa...</p>
    </div>
  ),
});

export default function GeolocationView() {
  const [routeData, setRouteData] = useState<any>(null);
  const [routeCoordinates, setRouteCoordinates] = useState<[number, number][]>([]);
  const [polygons, setPolygons] = useState<[number, number][][]>([]);
  const [markers, setMarkers] = useState<Array<{ position: [number, number]; name: string; description?: string }>>([]);
  const [filename, setFilename] = useState<string>("");
  const [isSaving, setIsSaving] = useState(false);
  const [savedRoutes, setSavedRoutes] = useState<any[]>([]);

  // Load saved routes on mount
  useEffect(() => {
    loadSavedRoutes();
  }, []);

  const loadSavedRoutes = async () => {
    try {
      const response = await fetch("/api/routes");
      if (response.ok) {
        const data = await response.json();
        setSavedRoutes(data.routes || []);
        
        // Load the first route if available
        if (data.routes && data.routes.length > 0) {
          loadRoute(data.routes[0]);
        }
      }
    } catch (error) {
      console.error("Error loading routes:", error);
    }
  };

  const loadRoute = (route: any) => {
    setRouteData(route.geojson);
    setFilename(route.routeName);
    extractCoordinates(route.geojson);
  };

  const handleGeoJSONParsed = (geojson: any, file: string) => {
    setRouteData(geojson);
    setFilename(file.replace(/\.(kmz|kml)$/i, ""));
    extractCoordinates(geojson);
    toast.success("Arquivo carregado com sucesso!");
  };

  const extractCoordinates = (geojson: any) => {
    const coords: [number, number][] = [];
    const extractedPolygons: [number, number][][] = [];
    const extractedMarkers: Array<{ position: [number, number]; name: string; description?: string }> = [];

    if (geojson && geojson.features) {
      geojson.features.forEach((feature: any) => {
        if (feature.geometry) {
          const geomType = feature.geometry.type;
          
          // Extract properties for markers
          const name = feature.properties?.name || feature.properties?.Name || "Sem nome";
          const description = feature.properties?.description || feature.properties?.Description;
          
          if (geomType === "Point") {
            // Add to markers array - coordinates are [lon, lat] in GeoJSON
            const [lon, lat] = feature.geometry.coordinates;
            extractedMarkers.push({
              position: [lat, lon], // Leaflet uses [lat, lon]
              name,
              description,
            });
          } else if (geomType === "LineString") {
            // coordinates are [[lon, lat], [lon, lat], ...]
            feature.geometry.coordinates.forEach((coord: any) => {
              coords.push([coord[1], coord[0]]); // Convert to [lat, lon] for Leaflet
            });
          } else if (geomType === "MultiLineString") {
            feature.geometry.coordinates.forEach((line: any) => {
              line.forEach((coord: any) => {
                coords.push([coord[1], coord[0]]); // Convert to [lat, lon]
              });
            });
          } else if (geomType === "Polygon") {
            // First ring of polygon - apenas contorno
            const ring: [number, number][] = [];
            feature.geometry.coordinates[0].forEach((coord: any) => {
              ring.push([coord[1], coord[0]]); // Convert to [lat, lon]
            });
            extractedPolygons.push(ring);
          } else if (geomType === "MultiPolygon") {
            // Multiple polygons
            feature.geometry.coordinates.forEach((polygon: any) => {
              const ring: [number, number][] = [];
              polygon[0].forEach((coord: any) => {
                ring.push([coord[1], coord[0]]);
              });
              extractedPolygons.push(ring);
            });
          }
        }
      });
    }

    setRouteCoordinates(coords);
    setPolygons(extractedPolygons);
    setMarkers(extractedMarkers);
    
    console.log(`Extracted ${coords.length} route points, ${extractedPolygons.length} polygons, and ${extractedMarkers.length} markers`);
  };

  const handleSaveRoute = async () => {
    if (!routeData || !filename) {
      toast.error("Nenhuma rota para salvar");
      return;
    }

    setIsSaving(true);

    try {
      const response = await fetch("/api/routes/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          routeName: filename,
          geojson: routeData,
          projectName: "Projeto Padrão",
        }),
      });

      if (response.ok) {
        toast.success("Rota salva com sucesso!");
        loadSavedRoutes();
      } else {
        const error = await response.json();
        toast.error(error.error || "Erro ao salvar rota");
      }
    } catch (error) {
      console.error("Error saving route:", error);
      toast.error("Erro ao salvar rota");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteRoute = async (id: string) => {
    try {
      const response = await fetch(`/api/routes?id=${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        toast.success("Rota excluída com sucesso!");
        loadSavedRoutes();
        
        // Clear current route if it's the deleted one
        const deletedRoute = savedRoutes.find(r => r.id === id);
        if (deletedRoute && deletedRoute.routeName === filename) {
          setRouteData(null);
          setRouteCoordinates([]);
          setFilename("");
        }
      } else {
        toast.error("Erro ao excluir rota");
      }
    } catch (error) {
      console.error("Error deleting route:", error);
      toast.error("Erro ao excluir rota");
    }
  };

  return (
    <div className="container mx-auto px-4 sm:px-6 py-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <div className="flex items-center gap-3 mb-2">
          <MapPin className="w-8 h-8 text-primary" />
          <h1 className="text-3xl md:text-4xl font-bold text-foreground">
            Geolocalização
          </h1>
        </div>
        <p className="text-foreground/60">
          Visualize o traçado da rodovia e gerencie arquivos KMZ/KML
        </p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Map View - Main Content */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
          className="lg:col-span-2"
        >
          <MapView routeCoordinates={routeCoordinates} polygons={polygons} markers={markers} />
          
          {routeData && (
            <div className="mt-4 flex items-center justify-between bg-muted p-4 rounded-lg">
              <div>
                <p className="text-sm text-foreground/60">Rota carregada:</p>
                <p className="font-semibold text-foreground">{filename}</p>
                <p className="text-xs text-foreground/50 mt-1">
                  {routeCoordinates.length} pontos • {polygons.length} áreas • {markers.length} marcadores
                </p>
              </div>
              
              <Button
                onClick={handleSaveRoute}
                disabled={isSaving}
                className="gap-2"
              >
                <Save className="w-4 h-4" />
                {isSaving ? "Salvando..." : "Salvar Rota"}
              </Button>
            </div>
          )}
        </motion.div>

        {/* Sidebar - Upload & Saved Routes */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="space-y-6"
        >
          {/* Upload Section */}
          <div className="bg-card border border-border rounded-xl p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
              <Upload className="w-5 h-5" />
              Carregar Arquivo
            </h3>
            <KMZUploader onGeoJSONParsed={handleGeoJSONParsed} />
          </div>

          {/* Saved Routes Section */}
          <div className="bg-card border border-border rounded-xl p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4">
              Rotas Salvas
            </h3>
            
            {savedRoutes.length === 0 ? (
              <p className="text-sm text-foreground/50 text-center py-8">
                Nenhuma rota salva ainda
              </p>
            ) : (
              <div className="space-y-2">
                {savedRoutes.map((route) => (
                  <div
                    key={route.id}
                    className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors"
                  >
                    <button
                      onClick={() => loadRoute(route)}
                      className="flex-1 text-left"
                    >
                      <p className="text-sm font-medium text-foreground">
                        {route.routeName}
                      </p>
                      <p className="text-xs text-foreground/50">
                        {route.lengthKm ? `${route.lengthKm} km` : "N/A"}
                      </p>
                    </button>
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteRoute(route.id)}
                      className="text-destructive hover:text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
