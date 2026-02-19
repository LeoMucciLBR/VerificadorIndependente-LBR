"use client";

import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet.markercluster";
import "leaflet.markercluster/dist/MarkerCluster.css";
import "leaflet.markercluster/dist/MarkerCluster.Default.css";

// Fix Leaflet default icon issue
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

interface HighwayMapViewProps {
  geojson: any;
  filtroAplicado?: boolean;
  kmInicial?: number | null;
  kmFinal?: number | null;
  loading?: boolean;
  onBaseLayerChange?: (theme: 'dark' | 'light') => void;
  theme?: 'dark' | 'light';
  onMapLoad?: (map: L.Map) => void;
  fullTrace?: any;
  skipAutoFit?: boolean; // Skip auto fitBounds when true (e.g., user is hovering on a card)
}

// Palette de cores para segmentos (Visualmente distintas)
const SEGMENT_COLORS = [
    "#ef4444", // red-500
    "#f97316", // orange-500
    "#f59e0b", // amber-500
    "#84cc16", // lime-500
    "#10b981", // emerald-500
    "#06b6d4", // cyan-500
    "#3b82f6", // blue-500
    "#8b5cf6", // violet-500
    "#d946ef", // fuchsia-500
    "#f43f5e"  // rose-500
];

const getSegmentColor = (id: any) => {
    if (!id) return "#64748b"; // Default Slate
    // Extrair números do ID para fazer hash/index
    const numId = typeof id === 'number' ? id : (parseInt(id.toString().replace(/\D/g, '')) || 0);
    return SEGMENT_COLORS[numId % SEGMENT_COLORS.length];
};

export default function HighwayMapView({
  geojson,
  filtroAplicado = false,
  kmInicial,
  kmFinal,
  loading = false,
  onBaseLayerChange,
  theme = 'dark',
  onMapLoad,
  fullTrace,
  skipAutoFit = false
}: HighwayMapViewProps) {
  const mapRef = useRef<L.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const layersRef = useRef<L.LayerGroup | null>(null);
  const clusterRef = useRef<L.MarkerClusterGroup | null>(null);
  const baseLayersRef = useRef<{ [key: string]: L.TileLayer } | null>(null);


  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    // ... baseMaps ...
    const baseMaps = {
      // ... (mantido)
      "Escuro (Dark)": L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", { attribution: '&copy; CARTO', maxZoom: 20 }),
      "Claro (Light)": L.tileLayer("https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png", { attribution: '&copy; CARTO', maxZoom: 20 }),
      "Satélite": L.tileLayer("https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}", { attribution: '&copy; Esri', maxZoom: 19 })
    };
    baseLayersRef.current = baseMaps;

    const initialLayer = theme === 'light' ? baseMaps["Claro (Light)"] : baseMaps["Escuro (Dark)"];

    const brazilBounds: L.LatLngBoundsLiteral = [
        [-34.0, -74.0], // Sudoeste
        [5.5, -34.0]    // Nordeste
    ];

    const map = L.map(mapContainerRef.current, {
      center: [-15.7801, -47.9292],
      zoom: 4,
      minZoom: 4,
      maxBounds: brazilBounds,
      maxBoundsViscosity: 1.0,
      zoomControl: false,
      scrollWheelZoom: true,
      layers: [initialLayer],
      // PERFORMANCE: Use Canvas renderer instead of SVG for better performance with complex geometries
      preferCanvas: true,
      renderer: L.canvas()
    });

    // Adicionar controle de camadas apenas
    L.control.layers(baseMaps).addTo(map);

    // Interceptar evento de scroll (wheel) para permitir rolagem da página no limite de zoom
    const container = mapContainerRef.current;
    
    // Usamos { capture: true } para pegar o evento ANTES do Leaflet
    const handleWheel = (e: WheelEvent) => {
        const currentZoom = map.getZoom();
        const minZoom = map.getMinZoom();
        
        // Detectar tentativa de Zoom Out (Scroll Down) quando já está no limite mínimo
        if (e.deltaY > 0 && currentZoom <= minZoom) {
            // Impedimos que o evento chegue aos listeners do Leaflet (que chamariam preventDefault)
            // Assim, o navegador executa a ação padrão: rolar a página
            e.stopPropagation();
            return;
        }
        
        // Em qualquer outro caso (Zoom In, ou Zoom Out quando não está no limite),
        // deixamos o evento propagar para o Leaflet lidar com o zoom
    };

    container.addEventListener('wheel', handleWheel, { capture: true });

    map.on('baselayerchange', (e: any) => {
       if (onBaseLayerChange) {
           if (e.name === "Escuro (Dark)") onBaseLayerChange('dark');
           else if (e.name === "Claro (Light)") onBaseLayerChange('light');
           else if (e.name === "Satélite") onBaseLayerChange('dark');
       }
    });

    mapRef.current = map;
    layersRef.current = L.layerGroup().addTo(map);

    // Expor instância do mapa
    if (onMapLoad) {
        onMapLoad(map);
    }
    
    return () => {
      container.removeEventListener('wheel', handleWheel, { capture: true });
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);





  // Sync Map with Theme Prop Change
  useEffect(() => {
    if (!mapRef.current || !baseLayersRef.current) return;
    
    const map = mapRef.current;
    
    // Check which layer is active to avoid redundant switches
    let activeLayerName = "";
    map.eachLayer((layer) => {
        if (layer === baseLayersRef.current!["Escuro (Dark)"]) activeLayerName = "dark";
        if (layer === baseLayersRef.current!["Claro (Light)"]) activeLayerName = "light";
    });

    if (theme === 'light' && activeLayerName !== 'light') {
        map.addLayer(baseLayersRef.current["Claro (Light)"]);
        map.removeLayer(baseLayersRef.current["Escuro (Dark)"]);
        map.removeLayer(baseLayersRef.current["Satélite"]);
    } else if (theme === 'dark' && activeLayerName !== 'dark') {
        map.addLayer(baseLayersRef.current["Escuro (Dark)"]);
        map.removeLayer(baseLayersRef.current["Claro (Light)"]);
        map.removeLayer(baseLayersRef.current["Satélite"]);
    }
  }, [theme]);
  
  // Atualizar layers de dados (geojson) e MARCOS
  useEffect(() => {
    if (!mapRef.current || !layersRef.current) return;
    
    layersRef.current.clearLayers();
    
    // Limpar cluster anterior
    if (clusterRef.current) {
      clusterRef.current.clearLayers();
      mapRef.current.removeLayer(clusterRef.current);
      clusterRef.current = null;
    }
    
    // Criar novo cluster group para ocorrências
    const clusterGroup = (L as any).markerClusterGroup({
      maxClusterRadius: 30,
      spiderfyOnMaxZoom: true,
      showCoverageOnHover: false,
      zoomToBoundsOnClick: true,
      disableClusteringAtZoom: 13,
      chunkedLoading: true,
      iconCreateFunction: (cluster: any) => {
        const count = cluster.getChildCount();
        let size = 'small';
        let diameter = 36;
        if (count >= 100) { size = 'large'; diameter = 52; }
        else if (count >= 10) { size = 'medium'; diameter = 44; }
        
        return L.divIcon({
          html: `<div class="flex items-center justify-center w-full h-full rounded-full bg-amber-500/80 border-2 border-white shadow-lg backdrop-blur-sm">
            <span class="text-white font-bold text-xs">${count}</span>
          </div>`,
          className: 'custom-cluster-icon',
          iconSize: L.point(diameter, diameter),
          iconAnchor: L.point(diameter / 2, diameter / 2)
        });
      }
    });
    clusterRef.current = clusterGroup;
    
    // 0. Renderizar Traçado Completo (Background / "Fantasma")
    // Isso mostra a rodovia inteira por baixo, para contexto
    if (fullTrace) {
        try {
            const bgLayer = L.geoJSON(fullTrace, {
                style: {
                    // AMARELO quando nada selecionado, CINZA quando segmento selecionado
                    color: !filtroAplicado ? '#f59e0b' : (theme === 'dark' ? '#334155' : '#cbd5e1'),
                    weight: !filtroAplicado ? 6 : 8,
                    opacity: !filtroAplicado ? 0.9 : 0.4,
                    lineCap: "round",
                    lineJoin: "round",
                },
                pointToLayer: (feat, latlng) => L.circleMarker(latlng, { 
                    radius: !filtroAplicado ? 5 : 0, // Mostrar pontos amarelos quando sem filtro
                    fillColor: "#f59e0b",
                    color: "#000",
                    weight: 1,
                    fillOpacity: !filtroAplicado ? 0.9 : 0,
                    opacity: !filtroAplicado ? 1 : 0
                })
            });
            bgLayer.addTo(layersRef.current);
            
            // AJUSTAR viewport APENAS se não estiver em modo skipAutoFit
            if (!skipAutoFit) {
                const bounds = bgLayer.getBounds();
                if (bounds.isValid()) {
                    mapRef.current.fitBounds(bounds, { padding: [50, 50], maxZoom: 11 });
                }
            }
        } catch (e) {
            console.error("Error rendering fullTrace:", e);
        }
    }

    // 2. Renderizar Traçado Ativo (GeoJSON filtrado ou principal)
     try {
      if (geojson && geojson.type === "FeatureCollection" && geojson.features.length > 0) {
        const bounds = L.latLngBounds([]);
        
        // Separar features: ocorrências Point vão para o cluster
        const occurrencePointFeatures: any[] = [];
        const otherFeatures: any[] = [];
        
        geojson.features.forEach((feature: any) => {
          if (!feature.geometry) return;
          const isOccurrence = feature.properties?.type === 'occurrence';
          if (isOccurrence && feature.geometry.type === 'Point') {
            occurrencePointFeatures.push(feature);
          } else {
            otherFeatures.push(feature);
          }
        });

        // PERFORMANCE: Filtrar features antes de processar
        const filteredOtherFeatures = otherFeatures.filter((feature: any) => {
          const isOccurrence = feature.properties?.type === 'occurrence';
          if (!filtroAplicado && feature.geometry.type === 'Point' && !isOccurrence) {
            return false;
          }
          return true;
        });

        // PERFORMANCE: Processar TODAS features em um ÚNICO L.geoJSON() (batch)
        if (filteredOtherFeatures.length > 0) {
          const batchedGeoJson = {
            type: 'FeatureCollection' as const,
            features: filteredOtherFeatures
          };

          const batchLayer = L.geoJSON(batchedGeoJson, {
            style: (feature) => {
                const props = feature?.properties || {};
                const isOccurrence = props.type === 'occurrence';
                
                let color = "#f59e0b";
                let opacity = 0.95;
                let weight = 5;

                if (isOccurrence) {
                    if (props.segmento_id) {
                        color = getSegmentColor(props.segmento_id);
                    }
                    if (feature?.geometry?.type === 'LineString') {
                        weight = 8;
                        opacity = 0.9;
                    }
                } else {
                    if (props.isSelectedSegment) {
                         color = "#fbbf24";
                         weight = 7;
                         opacity = 1.0;
                    } else if (props.isReference) {
                         color = "#f59e0b"; 
                         opacity = 0.85;
                    } else if (filtroAplicado && !props.isSelectedSegment) {
                         color = "#64748b";
                         opacity = 0.25;
                    }
                }

                return {
                    color,
                    weight,
                    opacity,
                    lineCap: "round",
                    lineJoin: "round",
                };
            },

            pointToLayer: (feat, latlng) => {
                const props = feat.properties || {};
                const isOccurrence = props.type === 'occurrence';
                
                if (isOccurrence) {
                    const segColor = props.segmento_id ? getSegmentColor(props.segmento_id) : "#f59e0b";
                    const bgStyle = `background-color: ${segColor};`;
                    const htmlWithTailwind = `
                        <div class="w-3 h-3 transform rotate-45 border border-white shadow-sm hover:scale-125 transition-transform cursor-pointer" style="${bgStyle}"></div>
                    `;

                    return L.marker(latlng, {
                        icon: L.divIcon({
                            className: 'bg-transparent border-none flex items-center justify-center',
                            html: htmlWithTailwind,
                            iconSize: [16, 16], 
                            iconAnchor: [8, 8]
                        }),
                        interactive: true
                    });
                }

                return L.circleMarker(latlng, {
                    radius: !filtroAplicado ? 4 : 0, 
                    fillColor: "#fbbf24", 
                    color: "#000", 
                    weight: 1,
                    opacity: !filtroAplicado ? 1 : 0, 
                    fillOpacity: !filtroAplicado ? 0.9 : 0,
                    interactive: true
                });
            },
            onEachFeature: (feat, layer) => {
              const props = feat.properties || {};
              const isOccurrence = props.type === 'occurrence' || props.source !== undefined;
              let popupContent = "";

              if (isOccurrence) {
                  popupContent = `
                    <div class="font-sans min-w-[250px] max-w-[300px]">
                      <div class="relative w-full aspect-video bg-slate-100 rounded-t-md overflow-hidden mb-2">
                        ${props.fotoUrl 
                            ? `<img src="${props.fotoUrl}" class="w-full h-full object-cover" />` 
                            : `<div class="w-full h-full flex items-center justify-center text-slate-400 bg-slate-200"><span class="text-xs">Sem foto</span></div>`
                        }
                        <div class="absolute top-1 right-1 px-1.5 py-0.5 bg-black/60 text-white text-[10px] rounded backdrop-blur-sm uppercase font-bold">
                            ${props.status || 'ABERTA'}
                        </div>
                      </div>
                      <div class="px-1 pb-1">
                        <p class="font-bold text-slate-800 text-sm mb-1 line-clamp-2">${props.descricao || "Ocorrência"}</p>
                        <div class="flex flex-col gap-1 text-xs text-slate-600">
                             <div class="flex items-center gap-1">
                                <span class="font-semibold text-slate-700">KM:</span> ${parseFloat(props.km || 0).toFixed(3)}
                             </div>
                             ${props.rodovia ? `<div class="flex items-center gap-1"><span class="font-semibold text-slate-700">Rodovia:</span> ${props.rodovia}</div>` : ''}
                             <div class="flex items-center gap-1 mt-1 text-[10px] text-slate-400">
                                <span>Fonte:</span> ${props.source === 'photo' ? 'GPS Foto' : 'Interpolação KM'}
                             </div>
                        </div>
                      </div>
                      <div class="mt-2 pt-2 border-t border-gray-100 text-center">
                          <button onclick="document.dispatchEvent(new CustomEvent('open-occurrence', { detail: '${props.id}' }))" class="text-blue-600 text-xs font-bold hover:underline">
                            Ver Detalhes
                          </button>
                      </div>
                    </div>
                  `;
              } else {
                  const kmIniProp = props.kmInicial;
                  popupContent = `
                    <div class="font-sans min-w-[200px]">
                      <div class="border-b border-gray-200 pb-2 mb-2">
                        <p class="font-bold text-slate-800 text-sm">${props.name || props.nome || "Ponto"}</p>
                        ${props.description || props.descricao ? `<p class="text-xs text-slate-600 mt-1">${props.description || props.descricao}</p>` : ''} 
                        ${props.folder ? `<p class="text-[10px] text-slate-400 mt-1 uppercase">${props.folder}</p>` : ''}
                      </div>
                      <div class="space-y-1">
                        ${
                          kmIniProp !== undefined
                            ? `<div class="flex justify-between items-center text-xs">
                                 <span class="text-slate-500">Localização</span>
                                 <span class="font-mono font-medium text-slate-700">KM ${parseFloat(kmIniProp).toFixed(1)}</span>
                               </div>`
                            : ""
                        }
                      </div>
                    </div>
                  `;
              }

              layer.bindPopup(popupContent, {
                 className: 'custom-popup-glass'
              });
            },
          });

          batchLayer.addTo(layersRef.current);
          const batchBounds = batchLayer.getBounds();
          if (batchBounds.isValid()) {
            bounds.extend(batchBounds);
          }
        }

        // Processar ocorrências Point → cluster
        occurrencePointFeatures.forEach((feature: any) => {
          const props = feature.properties || {};
          const [lng, lat] = feature.geometry.coordinates;
          const latlng = L.latLng(lat, lng);
          
          const segColor = props.segmento_id ? getSegmentColor(props.segmento_id) : "#f59e0b";
          const bgStyle = `background-color: ${segColor};`;
          const htmlWithTailwind = `
            <div class="w-3 h-3 transform rotate-45 border border-white shadow-sm hover:scale-125 transition-transform cursor-pointer" style="${bgStyle}"></div>
          `;
          
          const marker = L.marker(latlng, {
            icon: L.divIcon({
              className: 'bg-transparent border-none flex items-center justify-center',
              html: htmlWithTailwind,
              iconSize: [16, 16],
              iconAnchor: [8, 8]
            }),
            interactive: true
          });
          
          // Popup
          const popupContent = `
            <div class="font-sans min-w-[250px] max-w-[300px]">
              <div class="relative w-full aspect-video bg-slate-100 rounded-t-md overflow-hidden mb-2">
                ${props.fotoUrl 
                    ? `<img src="${props.fotoUrl}" class="w-full h-full object-cover" />` 
                    : `<div class="w-full h-full flex items-center justify-center text-slate-400 bg-slate-200"><span class="text-xs">Sem foto</span></div>`
                }
                <div class="absolute top-1 right-1 px-1.5 py-0.5 bg-black/60 text-white text-[10px] rounded backdrop-blur-sm uppercase font-bold">
                    ${props.status || 'ABERTA'}
                </div>
              </div>
              <div class="px-1 pb-1">
                <p class="font-bold text-slate-800 text-sm mb-1 line-clamp-2">${props.descricao || "Ocorrência"}</p>
                <div class="flex flex-col gap-1 text-xs text-slate-600">
                     <div class="flex items-center gap-1">
                        <span class="font-semibold text-slate-700">KM:</span> ${parseFloat(props.km || 0).toFixed(3)}
                     </div>
                     ${props.rodovia ? `<div class="flex items-center gap-1"><span class="font-semibold text-slate-700">Rodovia:</span> ${props.rodovia}</div>` : ''}
                     <div class="flex items-center gap-1 mt-1 text-[10px] text-slate-400">
                        <span>Fonte:</span> ${props.source === 'photo' ? 'GPS Foto' : 'Interpolação KM'}
                     </div>
                </div>
              </div>
              <div class="mt-2 pt-2 border-t border-gray-100 text-center">
                  <button onclick="document.dispatchEvent(new CustomEvent('open-occurrence', { detail: '${props.id}' }))" class="text-blue-600 text-xs font-bold hover:underline">
                    Ver Detalhes
                  </button>
              </div>
            </div>
          `;
          marker.bindPopup(popupContent, { className: 'custom-popup-glass' });
          
          clusterGroup.addLayer(marker);
          bounds.extend(latlng);
        });
        
        // Adicionar cluster group ao mapa
        clusterGroup.addTo(mapRef.current!);

        // Ajustar mapa para mostrar todos os segmentos
        if (bounds.isValid()) {
          mapRef.current.fitBounds(bounds, { padding: [100, 100], maxZoom: 10 });
        }
      }
    } catch (error) {
      console.error("Error rendering GeoJSON:", error);
    }

  }, [geojson, fullTrace, filtroAplicado, kmInicial, kmFinal, theme, skipAutoFit]);

  return (
    <div className="relative w-full h-full bg-slate-900">
      <div
        ref={mapContainerRef}
        className="w-full h-full z-0 outline-none"
      />
    </div>
  );
}
