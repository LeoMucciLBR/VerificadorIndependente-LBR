"use client";

import { useState, useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import dynamic from "next/dynamic";
import { Map, RefreshCw, Filter, X, AlertTriangle, Calendar, MapPin, Eye } from "lucide-react";
import { getOccurrencesGeoJSON, getHighwayTraces, getFilterOptions } from "@/app/actions/mapa-ocorrencias";
import { useTheme } from "@/components/theme/ThemeProvider";
import { toast } from "sonner";
import L from "leaflet";

// Dynamic import to avoid SSR issues with Leaflet
const HighwayMapView = dynamic(
    () => import("@/components/geolocalizacao/HighwayMapView"),
    { ssr: false, loading: () => <div className="w-full h-full flex items-center justify-center"><span className="text-slate-400">Carregando mapa...</span></div> }
);

interface FilterOptions {
    segmentos: { id: number; nome: string }[];
    grupos: { id: number; nome: string }[];
    indicadores: { id: number; nome: string }[];
}

interface OccurrenceFeature {
    type: "Feature";
    geometry: {
        type: "Point";
        coordinates: [number, number];
    };
    properties: {
        id: string;
        uuid: string;
        descricao?: string;
        indicador?: string;
        grupo?: string;
        segmento?: string;
        km?: string | number;
        data?: string;
        status?: string;
        rodovia?: string;
        source?: string;
    };
}

export default function OccurrencesMapSection() {
    const { theme, toggleTheme } = useTheme();
    const isDark = theme === 'dark';
    
    // Extrair projectSlug da URL (ex: /viabrasil1/geolocalizacao -> viabrasil1)
    const pathname = usePathname();
    const projectSlug = pathname?.split('/')[1] || '';
    
    const [loading, setLoading] = useState(false);
    const [occurrencesData, setOccurrencesData] = useState<any>(null);
    const [highwayTrace, setHighwayTrace] = useState<any>(null);
    const mapInstanceRef = useRef<L.Map | null>(null);
    const [hoveredOccurrenceId, setHoveredOccurrenceId] = useState<string | null>(null);
    
    // Filter state
    const [filterOptions, setFilterOptions] = useState<FilterOptions>({ segmentos: [], grupos: [], indicadores: [] });
    const [selectedSegmento, setSelectedSegmento] = useState<number | null>(null);
    const [selectedGrupo, setSelectedGrupo] = useState<number | null>(null);
    const [selectedIndicador, setSelectedIndicador] = useState<number | null>(null);
    const [showFilters, setShowFilters] = useState(false);

    useEffect(() => {
        loadFilterOptions();
        loadMapData();

        // Listen for popup click
        const handleOpenOccurrence = (e: CustomEvent) => {
             toast.info("Ocorrência ID: " + e.detail);
        };

        document.addEventListener('open-occurrence', handleOpenOccurrence as EventListener);
        return () => document.removeEventListener('open-occurrence', handleOpenOccurrence as EventListener);
    }, [projectSlug]);

    // Reload map when filters change
    useEffect(() => {
        loadMapData();
    }, [selectedSegmento, selectedGrupo, selectedIndicador]);

    const loadFilterOptions = async () => {
        try {
            const options = await getFilterOptions();
            setFilterOptions(options);
        } catch (error) {
            console.error("Error loading filter options:", error);
        }
    };

    const loadMapData = async () => {
        try {
            setLoading(true);
            
            // Fetch both highway trace and occurrences in parallel
            const [traces, occurrences] = await Promise.all([
                getHighwayTraces(projectSlug),
                getOccurrencesGeoJSON({
                    segmentoId: selectedSegmento,
                    grupoId: selectedGrupo,
                    indicadorId: selectedIndicador,
                    projectSlug: projectSlug || null
                })
            ]);
            
            setHighwayTrace(traces);
            setOccurrencesData(occurrences);
            
        } catch (error) {
            console.error(error);
            toast.error("Erro ao carregar mapa de ocorrências");
        } finally {
            setLoading(false);
        }
    };

    const handleBaseLayerChange = (layerTheme: 'dark' | 'light') => {
        if (layerTheme !== theme) toggleTheme();
    };

    const handleMapLoad = (map: L.Map) => {
        mapInstanceRef.current = map;
    };

    // Ref for map container to scroll into view
    const mapContainerRef = useRef<HTMLDivElement>(null);

    const handleCardHover = (occurrence: OccurrenceFeature) => {
        setHoveredOccurrenceId(occurrence.properties.id);
        
        const map = mapInstanceRef.current;
        
        if (map && occurrence.geometry?.coordinates) {
            const [lng, lat] = occurrence.geometry.coordinates;
            
            // Scroll mapa para view primeiro
            if (mapContainerRef.current) {
                mapContainerRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
            
            // Usar flyTo para animação mais visível
            map.flyTo([lat, lng], 18, {
                duration: 1.0,
                easeLinearity: 0.25
            });
        } else if (!map) {
            console.warn('[OccurrencesMapSection] Map instance not available');
        } else {
            console.warn('[OccurrencesMapSection] No coordinates for this occurrence:', occurrence);
        }
    };

    const handleCardLeave = () => {
        setHoveredOccurrenceId(null);
    };

    const clearFilters = () => {
        setSelectedSegmento(null);
        setSelectedGrupo(null);
        setSelectedIndicador(null);
    };

    const hasActiveFilters = selectedSegmento || selectedGrupo || selectedIndicador;

    // Combine highway trace and occurrences into single GeoJSON for display
    const combinedGeoJSON = {
        type: "FeatureCollection",
        features: [
            ...(highwayTrace?.features || []),
            ...(occurrencesData?.features || [])
        ]
    };

    // Extract occurrences for the cards list
    const occurrencesList: OccurrenceFeature[] = occurrencesData?.features?.filter(
        (f: any) => f.geometry?.type === "Point" && f.properties?.id
    ) || [];

    // Paginação client-side para os cards
    const CARDS_PER_PAGE = 20;
    const [visibleCardCount, setVisibleCardCount] = useState(CARDS_PER_PAGE);
    const visibleOccurrences = occurrencesList.slice(0, visibleCardCount);
    const hasMoreCards = visibleCardCount < occurrencesList.length;
    
    // Reset pagination when data changes
    useEffect(() => {
        setVisibleCardCount(CARDS_PER_PAGE);
    }, [occurrencesData]);

    return (
        <section className={`relative w-full min-h-screen p-8 md:p-16 border-t ${isDark ? 'bg-slate-950 border-white/10' : 'bg-slate-50 border-slate-200'}`}>
            <div className="max-w-7xl mx-auto h-full flex flex-col">
                <div className="mb-8 flex items-end justify-between">
                    <div>
                         <h2 className={`text-3xl font-bold mb-4 flex items-center gap-3 ${isDark ? 'text-white' : 'text-blue-900'}`}>
                            <Map className="w-8 h-8 text-amber-500" />
                            Mapa de Ocorrências
                        </h2>
                        <p className={`text-lg max-w-2xl ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                            Visualização geoespacial de todas as ocorrências registradas com o traçado completo das rodovias.
                        </p>
                    </div>
                    <button 
                        onClick={loadMapData}
                        disabled={loading}
                        className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-colors ${
                            isDark 
                             ? 'bg-white/5 hover:bg-white/10 text-white border border-white/10' 
                             : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 shadow-sm'
                        }`}
                    >
                        <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                        Atualizar
                    </button>
                </div>

                {/* Card com mapa */}
                <div className={`w-full rounded-2xl overflow-hidden shadow-2xl border relative flex flex-col ${isDark ? 'border-white/10 bg-slate-900' : 'border-slate-200 bg-white'}`}>
                    
                    {/* Filter Bar */}
                    <div className={`flex items-center gap-4 px-4 py-3 border-b ${isDark ? 'bg-slate-800/50 border-white/10' : 'bg-slate-50 border-slate-200'}`}>
                        <button
                            onClick={() => setShowFilters(!showFilters)}
                            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                                showFilters || hasActiveFilters
                                    ? 'bg-amber-500/20 text-amber-500 border border-amber-500/30'
                                    : isDark ? 'bg-white/5 text-slate-300 hover:bg-white/10' : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                            }`}
                        >
                            <Filter className="w-4 h-4" />
                            Filtros
                            {hasActiveFilters && <span className="ml-1 w-2 h-2 rounded-full bg-amber-500" />}
                        </button>

                        {showFilters && (
                            <>
                                {/* Segmento */}
                                <select
                                    value={selectedSegmento || ''}
                                    onChange={(e) => setSelectedSegmento(e.target.value ? Number(e.target.value) : null)}
                                    className={`px-3 py-1.5 rounded-lg text-sm border ${
                                        isDark 
                                            ? 'bg-slate-700 border-white/10 text-white' 
                                            : 'bg-white border-slate-200 text-slate-700'
                                    }`}
                                >
                                    <option value="">Todos Segmentos</option>
                                    {filterOptions.segmentos.map(s => (
                                        <option key={s.id} value={s.id}>{s.nome}</option>
                                    ))}
                                </select>

                                {/* Grupo */}
                                <select
                                    value={selectedGrupo || ''}
                                    onChange={(e) => setSelectedGrupo(e.target.value ? Number(e.target.value) : null)}
                                    className={`px-3 py-1.5 rounded-lg text-sm border ${
                                        isDark 
                                            ? 'bg-slate-700 border-white/10 text-white' 
                                            : 'bg-white border-slate-200 text-slate-700'
                                    }`}
                                >
                                    <option value="">Todos Grupos</option>
                                    {filterOptions.grupos.map(g => (
                                        <option key={g.id} value={g.id}>{g.nome}</option>
                                    ))}
                                </select>

                                {/* Indicador */}
                                <select
                                    value={selectedIndicador || ''}
                                    onChange={(e) => setSelectedIndicador(e.target.value ? Number(e.target.value) : null)}
                                    className={`px-3 py-1.5 rounded-lg text-sm border ${
                                        isDark 
                                            ? 'bg-slate-700 border-white/10 text-white' 
                                            : 'bg-white border-slate-200 text-slate-700'
                                    }`}
                                >
                                    <option value="">Todos Indicadores</option>
                                    {filterOptions.indicadores.map(i => (
                                        <option key={i.id} value={i.id}>{i.nome}</option>
                                    ))}
                                </select>

                                {hasActiveFilters && (
                                    <button
                                        onClick={clearFilters}
                                        className="flex items-center gap-1 px-2 py-1 text-xs text-red-400 hover:text-red-300"
                                    >
                                        <X className="w-3 h-3" />
                                        Limpar
                                    </button>
                                )}
                            </>
                        )}

                        {/* Status Badge */}
                        <div className="ml-auto flex items-center gap-3">
                            <div className="flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                                <span className={`text-xs font-bold uppercase ${isDark ? 'text-white' : 'text-slate-900'}`}>Rodovias</span>
                            </div>
                            <div className={`w-px h-3 ${isDark ? 'bg-white/20' : 'bg-black/10'}`} />
                            <div className="flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-orange-500" />
                                <span className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                                    {occurrencesData?.features?.length || 0} ocorrências
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Map - fixed height for Leaflet */}
                    <div ref={mapContainerRef} className="w-full h-[650px] relative z-0">
                        <HighwayMapView 
                            geojson={combinedGeoJSON.features.length > 0 ? combinedGeoJSON : null}
                            fullTrace={highwayTrace}
                            filtroAplicado={false}
                            loading={loading}
                            theme={theme}
                            onBaseLayerChange={handleBaseLayerChange}
                            onMapLoad={handleMapLoad}
                            skipAutoFit={hoveredOccurrenceId !== null}
                        />

                         {/* Legenda */}
                        <div className="absolute bottom-6 right-6 z-10 glass-panel p-4 rounded-xl flex flex-col gap-2 max-w-[200px]">
                            <h4 className={`text-xs font-bold uppercase mb-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>Legenda</h4>
                            <div className="flex items-center gap-2">
                                <div className="w-6 h-0.5 bg-amber-500 rounded" />
                                <span className={`text-xs ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>Traçado da Rodovia</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full bg-orange-500 border border-white shadow-sm" />
                                <span className={`text-xs ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>Ocorrência</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full bg-red-500 border border-white shadow-sm" />
                                <span className={`text-xs ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>Crítica</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Occurrence Cards Grid */}
                {occurrencesList.length > 0 && (
                    <div className="mt-8">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className={`text-xl font-semibold flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                                <Eye className="w-5 h-5 text-amber-500" />
                                Lista de Ocorrências
                            </h3>
                            <span className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                                Passe o mouse para visualizar no mapa
                            </span>
                        </div>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                            {visibleOccurrences.map((occurrence) => {
                                const props = occurrence.properties;
                                const isHovered = hoveredOccurrenceId === props.id;
                                
                                return (
                                    <div
                                        key={props.id}
                                        onMouseEnter={() => handleCardHover(occurrence)}
                                        onMouseLeave={handleCardLeave}
                                        className={`p-4 rounded-xl border transition-all duration-200 cursor-pointer ${
                                            isHovered
                                                ? isDark 
                                                    ? 'bg-amber-500/20 border-amber-500/50 scale-[1.02] shadow-lg shadow-amber-500/10' 
                                                    : 'bg-amber-50 border-amber-300 scale-[1.02] shadow-lg'
                                                : isDark 
                                                    ? 'bg-slate-900 border-white/10 hover:bg-slate-800' 
                                                    : 'bg-white border-slate-200 hover:bg-slate-50'
                                        }`}
                                    >
                                        {/* Header */}
                                        <div className="flex items-start justify-between gap-2 mb-3">
                                            <div className="flex items-center gap-2">
                                                <div className={`w-2.5 h-2.5 rounded-full ${props.status === 'ABERTA' ? 'bg-orange-500' : 'bg-emerald-500'}`} />
                                                <span className={`text-xs font-bold uppercase ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                                                    #{props.id}
                                                </span>
                                            </div>
                                            {isHovered && (
                                                <MapPin className="w-4 h-4 text-amber-500 animate-bounce" />
                                            )}
                                        </div>

                                        {/* Descrição */}
                                        <h4 className={`font-semibold text-sm mb-2 line-clamp-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                                            {props.descricao || 'Ocorrência'}
                                        </h4>

                                        {/* Info Grid */}
                                        <div className="space-y-1.5">
                                            <div className="flex items-center gap-2">
                                                <AlertTriangle className={`w-3.5 h-3.5 ${isDark ? 'text-slate-500' : 'text-slate-400'}`} />
                                                <span className={`text-xs truncate ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                                                    {props.rodovia || 'Rodovia desconhecida'}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <MapPin className={`w-3.5 h-3.5 ${isDark ? 'text-slate-500' : 'text-slate-400'}`} />
                                                <span className={`text-xs font-mono ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                                                    KM {props.km || '-'}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Source Badge */}
                                        {props.source && (
                                            <div className={`mt-3 px-2 py-1 rounded-md text-xs font-medium inline-block ${
                                                isDark ? 'bg-white/5 text-slate-300' : 'bg-slate-100 text-slate-600'
                                            }`}>
                                                {props.source === 'line_interpolation' ? '📍 Interpolado' : props.source === 'photo' ? '📷 GPS Foto' : props.source}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>

                        {/* Mostrar mais / Contagem */}
                        <div className="mt-4 flex items-center justify-between">
                            <span className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                                Mostrando {Math.min(visibleCardCount, occurrencesList.length)} de {occurrencesList.length}
                            </span>
                            {hasMoreCards && (
                                <button
                                    onClick={() => setVisibleCardCount(prev => prev + CARDS_PER_PAGE)}
                                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                                        isDark
                                            ? 'bg-white/5 hover:bg-white/10 text-white border border-white/10'
                                            : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 shadow-sm'
                                    }`}
                                >
                                    Mostrar mais ({Math.min(CARDS_PER_PAGE, occurrencesList.length - visibleCardCount)})
                                </button>
                            )}
                        </div>
                    </div>
                )}

                {/* Empty State */}
                {!loading && occurrencesList.length === 0 && (
                    <div className={`mt-8 p-12 rounded-xl border text-center ${isDark ? 'bg-slate-900 border-white/10' : 'bg-white border-slate-200'}`}>
                        <MapPin className={`w-12 h-12 mx-auto mb-4 ${isDark ? 'text-slate-700' : 'text-slate-300'}`} />
                        <p className={`text-lg font-medium mb-2 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                            Nenhuma ocorrência encontrada
                        </p>
                        <p className={`text-sm ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>
                            Ajuste os filtros ou aguarde novas ocorrências serem registradas.
                        </p>
                    </div>
                )}
            </div>
        </section>
    );
}

