"use client";

import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence, Variants } from "framer-motion";
import { 
    X, Calendar, MapPin, AlertCircle, FileText, 
    Camera, User, Clock, ArrowLeftRight, Navigation,
    CheckCircle2, AlertTriangle, ShieldAlert
} from "lucide-react";
import dynamic from "next/dynamic";

const MapView = dynamic(() => import("@/components/geolocation/MapView"), { 
    ssr: false,
    loading: () => <div className="w-full h-full bg-slate-100 dark:bg-slate-800 animate-pulse rounded-2xl flex items-center justify-center text-slate-400">Carregando Mapa...</div>
});

// Dynamic import for turf to avoid heavy bundle on initial load
const loadTurf = async () => {
    const turf = await import("@turf/turf");
    return turf;
};

type OccurrenceDetailsContentProps = {
    registro: any;
    onClose: () => void;
    imageLayoutId?: string; 
    className?: string;
};

export default function OccurrenceDetailsContent({ registro, onClose, imageLayoutId, className }: OccurrenceDetailsContentProps) {
  
  const [mounted, setMounted] = useState(false);
  const [activePhotoIndex, setActivePhotoIndex] = useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [interpolatedPosition, setInterpolatedPosition] = useState<[number, number] | null>(null);
  const [highlightGeojson, setHighlightGeojson] = useState<any>(null); // New state for the red trace

  useEffect(() => {
    setMounted(true);
  }, []);

  // Data processing for Map (needed for effect below)
  const photos = registro?.ocorrencias_fotos || [];
  const currentPhoto = photos[activePhotoIndex];
  const hasPhotoCoords = !!currentPhoto?.latitude;
  
  const segmentData = registro?.ocorrencias_trechos?.[0]?.segmentos_homogeneos;
  const rodoviaData = registro?.inspecoes?.rodovias || registro?.rodovia; // Fallback for when rodovia is passed differently
  
  // Fetch GeoJSON from working API instead of using stored data
  const [segmentGeojson, setSegmentGeojson] = useState<any>(null);
  const [fullRodoviaGeojson, setFullRodoviaGeojson] = useState<any>(null);
  
  useEffect(() => {
    if (!rodoviaData?.uuid || !segmentData) return;
    
    const kmIni = segmentData.kmInicialKML || segmentData.kmInicial;
    const kmFim = segmentData.kmFinalKML || segmentData.kmFinal;
    
    if (!kmIni || !kmFim) return;
    
    const fetchGeo = async () => {
      try {
        const url = `/api/geolocalizacao/segmentos?rodoviaId=${rodoviaData.uuid}&kmInicial=${Number(kmIni)}&kmFinal=${Number(kmFim)}`;
        const res = await fetch(url);
        if (res.ok) {
          const data = await res.json();
          
          // Store FULL RODOVIA trace (dark/faded)
          const fullTrack = data.rodoviaTrack;
          if (fullTrack) {
            let lineFeatures = [];
            if (fullTrack.type === 'FeatureCollection') {
              lineFeatures = fullTrack.features.filter((f: any) => 
                f.geometry?.type === 'LineString' || f.geometry?.type === 'MultiLineString'
              ).map((f: any) => ({
                ...f,
                properties: { ...f.properties, style: 'background', color: '#334155', weight: 4, opacity: 0.4 }
              }));
            } else if (fullTrack.geometry?.type === 'LineString' || fullTrack.geometry?.type === 'MultiLineString') {
              lineFeatures = [{ ...fullTrack, properties: { ...fullTrack.properties, style: 'background', color: '#334155', weight: 4, opacity: 0.4 }}];
            }
            if (lineFeatures.length > 0) {
              setFullRodoviaGeojson({ type: 'FeatureCollection', features: lineFeatures });
            }
          }
          
          // Store SEGMENT trace (highlighted)
          const geoData = data.tracadoCompleto || data.rodoviaTrack;
          if (geoData) {
            // Filter to only include LineString/MultiLineString, not Points
            if (geoData.type === 'FeatureCollection') {
              const lineFeatures = geoData.features.filter((f: any) => 
                f.geometry?.type === 'LineString' || f.geometry?.type === 'MultiLineString'
              ).map((f: any) => ({
                ...f,
                properties: { ...f.properties, style: 'segment', color: '#3b82f6', weight: 5, opacity: 1 }
              }));
              setSegmentGeojson({
                type: 'FeatureCollection',
                features: lineFeatures
              });
            } else {
              setSegmentGeojson({ ...geoData, properties: { ...geoData.properties, style: 'segment', color: '#3b82f6', weight: 5, opacity: 1 }});
            }
          }
        }
      } catch (e) {
        console.error("Error fetching segment geojson:", e);
      }
    };
    
    fetchGeo();
  }, [rodoviaData?.uuid, segmentData]);


  useEffect(() => {
    if (!registro) return;
    
      if (segmentGeojson && registro.ocorrencias_trechos?.[0]) {
          const calculatePos = async () => {
              try {
                  const turf = await loadTurf();
                  const trecho = registro.ocorrencias_trechos[0];
                  
                  // Segment Limits (Real KM)
                  const segKmIni = Number(segmentData?.kmInicial || 0);
                  const segKmFinal = Number(segmentData?.kmFinal || 0);
                  
                  const occKmIni = Number(trecho.kmInicial);
                  const occKmFin = Number(trecho.kmFinal);
                  
                  // Calculate RELATIVE distance from segment start
                  // occKmIni is the absolute KM (e.g., 41)
                  // segKmIni is where segment starts (e.g., 40)
                  // We need distance along geometry: 41 - 40 = 1km from start
                  let startDist = occKmIni - segKmIni;
                  let endDist = occKmFin - segKmIni;
                  
                  if (startDist < 0) startDist = 0;

                  // Find Line Geometry
                   let line;
                   if (segmentGeojson.type === 'Feature') {
                       line = segmentGeojson;
                   } else if (segmentGeojson.type === 'FeatureCollection') {
                       line = segmentGeojson.features.find((f: any) => f.geometry.type === 'LineString' || f.geometry.type === 'MultiLineString');
                   }

                   if (line) {
                       const totalLen = turf.length(line, { units: 'kilometers' });
                       
                       // Check for server-side reversal detection
                       const isReversed = line.properties?.isReversed === true;
                       
                       // Use direct distances unless reversed
                       let actualStartDist = startDist;
                       let actualEndDist = endDist;
                       
                       if (isReversed) {
                           actualStartDist = totalLen - startDist;
                           actualEndDist = totalLen - endDist;
                       }
                       
                       // Validate constraints
                       if (actualStartDist < 0) actualStartDist = 0;
                       if (actualEndDist < 0) actualEndDist = 0;
                       if (actualStartDist > totalLen) actualStartDist = totalLen;
                       if (actualEndDist > totalLen) actualEndDist = totalLen;
                       
                       // 1. POINT CALCULATION (for Marker)
                       const point = turf.along(line, actualStartDist, { units: 'kilometers' });
                       if (point && point.geometry.coordinates) {
                            if (!hasPhotoCoords) {
                                setInterpolatedPosition([point.geometry.coordinates[1], point.geometry.coordinates[0]]);
                            }
                       }

                       // 2. RANGE TRACE (Red Line)
                       const isRange = Math.abs(endDist - startDist) > 0.01; // tolerance
                       if (isRange) {
                           const p1 = turf.along(line, actualStartDist, { units: 'kilometers' });
                           const p2 = turf.along(line, actualEndDist, { units: 'kilometers' });
                           const sliced = turf.lineSlice(p1, p2, line as any);
                           
                           setHighlightGeojson({
                               ...sliced,
                               properties: {
                                   ...sliced.properties,
                                   color: '#ef4444', // Red
                                   weight: 8,         // Thicker
                                   opacity: 1,
                                   style: 'highlight'
                               }
                           });
                       } else {
                           setHighlightGeojson(null);
                       }
                   }
                  
              } catch (e) {
                  console.error("Error calculating interpolated position:", e);
              }
          };
          calculatePos();
      } else {
          setInterpolatedPosition(null);
          setHighlightGeojson(null);
      }
  }, [hasPhotoCoords, segmentGeojson, registro, segmentData]);

  // Merge GeoJSONs for Display
  // Order: 1. Full Rodovia (background/dark), 2. Segment (highlighted blue), 3. Occurrence Range (red)
  const displayGeojson = useMemo(() => {
      const features = [];
      
      // 1. Full Rodovia trace - dark/faded background
      if (fullRodoviaGeojson) {
          if (fullRodoviaGeojson.type === 'FeatureCollection') features.push(...fullRodoviaGeojson.features);
          else features.push(fullRodoviaGeojson);
      }
      
      // 2. Segment trace - highlighted blue
      if (segmentGeojson) {
           if (segmentGeojson.type === 'FeatureCollection') features.push(...segmentGeojson.features);
           else features.push(segmentGeojson);
      }
      
      // 3. Occurrence range - red highlight
      if (highlightGeojson) {
          features.push(highlightGeojson);
      }
      
      return features.length > 0 ? { type: 'FeatureCollection', features } : null;
  }, [fullRodoviaGeojson, segmentGeojson, highlightGeojson]);


  if (!registro || !mounted) return null;

  const isIndicator = registro.registroReferenteA === "Indicadores_de_desempenho";
  const status = registro.status;

  // Status Config
  const statusConfig = {
      'ABERTA': { 
          color: 'text-amber-600 dark:text-amber-500', 
          bg: 'bg-amber-50 dark:bg-amber-950/30', 
          border: 'border-amber-100 dark:border-amber-900/50',
          icon: AlertCircle
      },
      'CRITICA': { 
          color: 'text-red-600 dark:text-red-500', 
          bg: 'bg-red-50 dark:bg-red-950/30', 
          border: 'border-red-100 dark:border-red-900/50',
          icon: ShieldAlert
      },
      'ENCERRADA': { 
          color: 'text-emerald-600 dark:text-emerald-500', 
          bg: 'bg-emerald-50 dark:bg-emerald-950/30', 
          border: 'border-emerald-100 dark:border-emerald-900/50',
          icon: CheckCircle2
      },
  }[status as string] || { 
      color: 'text-slate-500 dark:text-slate-400', 
      bg: 'bg-slate-100 dark:bg-slate-800', 
      border: 'border-slate-200 dark:border-slate-700',
      icon: AlertTriangle
  };

  const StatusIcon = statusConfig.icon;

  // Data Extraction
  const rodoviaName = rodoviaData?.nome || registro.inspecoes?.rodovias?.nome || "Rodovia N/A";
  const segmentName = registro.ocorrencias_trechos?.[0]?.segmentos_homogeneos?.nome || "Segmento N/A";
  const createdBy = registro.users?.name || "Usuário Sistema";
  const lado = registro.lado || "N/A";
  const title = isIndicator ? (registro.indicadores?.sigla || "Indicador") : "Anotação de Campo";
  const description = registro.anotacoes || registro.indicadores?.nome || "Sem descrição disponível.";
  const pista = registro.pistaFaixa || "N/A";
  
  // KM Logic
  const trecho = registro.ocorrencias_trechos?.[0];
  let kmDisplay = "N/A";
  if (trecho) {
      const kmIni = trecho.kmInicial;
      const kmFin = trecho.kmFinal;
      if (kmIni !== undefined && kmIni !== null) {
          kmDisplay = `Km ${String(kmIni).replace('.', ',')}`;
          if (kmFin !== undefined && kmFin !== null && kmFin !== kmIni) {
              kmDisplay += ` - ${String(kmFin).replace('.', ',')}`;
          }
      }
  } else if (registro.kmInicial) {
       kmDisplay = `Km ${registro.kmInicial}`; // Fallback if no trecho but KM present
  } else if (registro.km) {
       kmDisplay = `Km ${registro.km}`; // Fallback for some flattened objects
  }

  // Animation Variants
  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1, delayChildren: 0.2 }
    }
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
  };

  return (
    <div className={`flex flex-col h-full min-h-0 overflow-hidden bg-white dark:bg-[#0f172a] text-slate-900 dark:text-white ${className || ''}`}>
            {/* Lightbox Overlay */}
            <AnimatePresence>
                {isLightboxOpen && (
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[10000] bg-black/95 flex items-center justify-center p-4 backdrop-blur-sm"
                        onClick={() => setIsLightboxOpen(false)}
                    >
                        <button 
                            className="absolute top-4 right-4 p-2 text-white/50 hover:text-white rounded-full hover:bg-white/10 transition-colors"
                            onClick={() => setIsLightboxOpen(false)}
                        >
                            <X className="w-8 h-8" />
                        </button>
                        <img 
                            src={getSafeUrl(photos[activePhotoIndex]?.caminhoArquivo)} 
                            className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
                            onClick={(e) => e.stopPropagation()}
                            loading="lazy"
                            decoding="async"
                        />
                         <div className="absolute bottom-6 left-0 right-0 text-center text-white/60 font-mono text-sm pointer-events-none">
                            {activePhotoIndex + 1} / {photos.length}
                         </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Header */}
            <motion.div 
                className="flex items-start justify-between p-6 border-b border-slate-100 dark:border-white/5 bg-slate-50 dark:bg-[#0f172a] shrink-0"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
            >
                <div className="space-y-3">
                     <div className="flex items-center gap-3">
                        <span className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-bold uppercase tracking-wide border ${statusConfig.bg} ${statusConfig.border} ${statusConfig.color}`}>
                            <StatusIcon className="w-3.5 h-3.5" />
                            {status || 'ABERTA'}
                        </span>
                         <span className="text-xs font-mono text-slate-500 dark:text-slate-500 px-2 py-0.5 rounded border border-slate-200 dark:border-white/5 bg-white dark:bg-white/[0.02]">
                            ID: {String(registro.id).padStart(4, '0')}
                         </span>
                         {isIndicator && (
                            <span className="text-xs font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-500/10 px-2 py-0.5 rounded border border-blue-100 dark:border-blue-500/20">
                                Indicador
                            </span>
                         )}
                         {registro.grupos && (
                             <span className="text-xs font-medium text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-500/10 px-2 py-0.5 rounded border border-purple-100 dark:border-purple-500/20">
                                 {registro.grupos.nome}
                             </span>
                         )}
                     </div>
                    
                    <div>
                        <h2 className="text-xl md:text-2xl font-bold text-slate-800 dark:text-white tracking-tight flex flex-wrap items-center gap-2 md:gap-3">
                            {title}
                            {registro.valor_medido !== null && (
                                <span className="ml-2 text-lg font-mono px-2 py-0.5 rounded-md bg-slate-100 dark:bg-white/10 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-white/5">
                                    {Number(registro.valor_medido).toFixed(2)} {registro.unidade_medida}
                                </span>
                            )}
                        </h2>
                        <div className="flex flex-wrap items-center gap-4 mt-2 text-sm text-slate-500 dark:text-slate-400">
                             <div className="flex items-center gap-1.5">
                                <Calendar className="w-4 h-4 text-violet-500" />
                                {new Date(registro.dataHoraOcorrencia).toLocaleDateString('pt-BR')}
                            </div>
                            <span className="hidden md:block w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-600" />
                            <div className="flex items-center gap-1.5">
                                <Clock className="w-4 h-4 text-slate-400" />
                                {new Date(registro.dataHoraOcorrencia).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                            </div>
                        </div>
                    </div>
                </div>
                
                <button 
                  onClick={onClose}
                  className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 rounded-lg transition-colors border border-transparent dark:hover:border-white/5"
                >
                  <X className="w-5 h-5" />
                </button>
            </motion.div>

            {/* Scrollable Content */}
            <motion.div 
                className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-6 bg-slate-50/80 dark:bg-[#0f172a]/80 backdrop-blur-3xl"
                variants={containerVariants}
                initial="hidden"
                animate="show"
            >
                
                {/* 1. Context Bento Grid */}
                <motion.div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4" variants={itemVariants}>
                    <InfoBlock 
                        icon={MapPin} 
                        label="Localização" 
                        value={kmDisplay} 
                        subValue={segmentName} 
                        iconColor="text-emerald-500" 
                        bgClass="bg-emerald-50/50 dark:bg-emerald-900/10 border-emerald-100/50 dark:border-emerald-500/10"
                    />
                    <InfoBlock 
                        icon={ArrowLeftRight} 
                        label="Lado / Pista" 
                        value={lado} 
                        subValue={`Faixa: ${pista}`} 
                        iconColor="text-orange-500" 
                        bgClass="bg-orange-50/50 dark:bg-orange-900/10 border-orange-100/50 dark:border-orange-500/10"
                    />
                    <InfoBlock 
                        icon={User} 
                        label="Responsável" 
                        value={createdBy} 
                        subValue="Fiscal de Campo" 
                        iconColor="text-blue-500" 
                        bgClass="bg-blue-50/50 dark:bg-blue-900/10 border-blue-100/50 dark:border-blue-500/10"
                    />
                    <InfoBlock 
                        icon={Navigation} 
                        label="Rodovia" 
                        value={rodoviaName} 
                        subValue="Concessão ViaBrasil" 
                        iconColor="text-indigo-500" 
                        bgClass="bg-indigo-50/50 dark:bg-indigo-900/10 border-indigo-100/50 dark:border-indigo-500/10"
                    />
                </motion.div>

                <div className="p-0 space-y-8">
                    
                    {/* 1. HERO SECTION: Visual Evidence (Photo Gallery) */}
                    <div className="w-full">
                        <Section title={`Evidências Fotográficas (${photos.length} ${photos.length === 1 ? 'foto' : 'fotos'})`} icon={Camera} accentColor="text-blue-500">
                             <div className="space-y-4">
                                {/* Main Photo Display */}
                                <div className="relative w-full bg-slate-950 rounded-2xl overflow-hidden shadow-2xl ring-1 ring-white/10 group">
                                    {photos.length > 0 ? (
                                        <motion.div 
                                            {...(imageLayoutId && activePhotoIndex === 0 ? { layoutId: imageLayoutId } : {})}
                                            className="relative aspect-[16/9] w-full max-h-[500px] bg-slate-900 flex items-center justify-center group/image cursor-zoom-in"
                                            onClick={() => setIsLightboxOpen(true)}
                                        >
                                            <img 
                                                src={getSafeUrl(photos[activePhotoIndex].caminhoArquivo)} 
                                                alt={`Evidência ${activePhotoIndex + 1}`}
                                                className="w-full h-full object-contain transition-transform duration-500 group-hover/image:scale-[1.02]"
                                                loading="lazy"
                                                decoding="async"
                                            />
                                            
                                            {/* Counter Badge */}
                                            <div className="absolute top-4 left-4 px-3 py-1.5 rounded-full bg-black/60 backdrop-blur-md text-white text-sm font-bold border border-white/10">
                                                {activePhotoIndex + 1} / {photos.length}
                                            </div>
                                            
                                            {/* Premium Gradient Overlay */}
                                            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-transparent to-transparent opacity-60 pointer-events-none" />
                                            
                                            {/* Photo Metadata Overlay */}
                                            <div className="absolute bottom-0 left-0 right-0 p-4 flex items-end justify-between pointer-events-none">
                                                <div className="flex flex-col gap-1">
                                                    <div className="flex items-center gap-2 text-white/80 text-xs font-semibold uppercase tracking-wider">
                                                        <Clock className="w-3 h-3" />
                                                        {photos[activePhotoIndex].dataHoraFoto 
                                                            ? new Date(photos[activePhotoIndex].dataHoraFoto).toLocaleString()
                                                            : "Data não registrada"}
                                                    </div>
                                                    {photos[activePhotoIndex].latitude && (
                                                        <div className="text-white/50 text-[10px] font-mono">
                                                            LAT: {Number(photos[activePhotoIndex].latitude).toFixed(6)} • LON: {Number(photos[activePhotoIndex].longitude).toFixed(6)}
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Location Button */}
                                                <div className="flex gap-2 pointer-events-auto">
                                                    {photos[activePhotoIndex].latitude && (
                                                        <button 
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                const el = document.getElementById('photo-location-map');
                                                                if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                                            }}
                                                            className="flex items-center gap-2 px-3 py-2 rounded-full bg-emerald-500 hover:bg-emerald-400 text-white text-xs font-bold shadow-lg shadow-emerald-500/20 transition-all hover:scale-105 active:scale-95 backdrop-blur-md"
                                                        >
                                                            <MapPin className="w-3.5 h-3.5" />
                                                            Ver no Mapa
                                                        </button>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Navigation Arrows (if multiple photos) */}
                                            {photos.length > 1 && (
                                                <>
                                                    <button 
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setActivePhotoIndex(prev => prev === 0 ? photos.length - 1 : prev - 1);
                                                        }}
                                                        className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/50 hover:bg-black/70 text-white flex items-center justify-center transition-all opacity-0 group-hover:opacity-100 hover:scale-110 backdrop-blur-sm border border-white/10"
                                                    >
                                                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                                                    </button>
                                                    <button 
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setActivePhotoIndex(prev => prev === photos.length - 1 ? 0 : prev + 1);
                                                        }}
                                                        className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/50 hover:bg-black/70 text-white flex items-center justify-center transition-all opacity-0 group-hover:opacity-100 hover:scale-110 backdrop-blur-sm border border-white/10"
                                                    >
                                                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                                                    </button>
                                                </>
                                            )}
                                        </motion.div>
                                    ) : (
                                        <div className="h-48 flex flex-col items-center justify-center text-slate-500">
                                            <Camera className="w-12 h-12 mb-2 opacity-50" />
                                            <p>Sem evidências fotográficas</p>
                                        </div>
                                    )}
                                </div>

                                {/* Thumbnail Grid (Below main photo) */}
                                {photos.length > 1 && (
                                    <div className="bg-slate-100 dark:bg-slate-900/50 rounded-xl p-3 border border-slate-200 dark:border-white/5">
                                        <div className="flex items-center gap-2 mb-3">
                                            <Camera className="w-4 h-4 text-blue-500" />
                                            <span className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                                                Todas as Fotos ({photos.length})
                                            </span>
                                        </div>
                                        <div className="flex gap-2 overflow-x-auto pb-2 custom-scrollbar">
                                            {photos.map((photo: any, idx: number) => (
                                                <button
                                                    key={photo.id}
                                                    onClick={() => setActivePhotoIndex(idx)}
                                                    className={`relative shrink-0 rounded-lg overflow-hidden transition-all duration-200 ${
                                                        activePhotoIndex === idx 
                                                            ? 'ring-2 ring-blue-500 ring-offset-2 ring-offset-slate-100 dark:ring-offset-slate-900 scale-105 shadow-lg' 
                                                            : 'opacity-70 hover:opacity-100 hover:scale-102 border border-slate-300 dark:border-white/10'
                                                    }`}
                                                >
                                                    <img 
                                                        src={getSafeUrl(photo.caminhoArquivo)} 
                                                        alt={`Foto ${idx + 1}`}
                                                        className="w-20 h-16 object-cover"
                                                        loading="lazy"
                                                        decoding="async"
                                                    />
                                                    {/* Index badge */}
                                                    <div className={`absolute bottom-1 right-1 w-5 h-5 rounded-full text-[10px] font-bold flex items-center justify-center ${
                                                        activePhotoIndex === idx 
                                                            ? 'bg-blue-500 text-white' 
                                                            : 'bg-black/60 text-white/80'
                                                    }`}>
                                                        {idx + 1}
                                                    </div>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}
                             </div>
                        </Section>
                    </div>

                    {/* 2. DESCRIPTION & DATA */}
                    <Section title="Detalhamento" icon={FileText} accentColor="text-indigo-500">
                         <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden">
                             <div className="prose dark:prose-invert max-w-none">
                                <p className="text-slate-600 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">
                                    {description}
                                </p>
                             </div>
                             <div className="mt-6 flex flex-wrap gap-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                                 <Badge variant="outline" className="gap-2 bg-slate-50 dark:bg-slate-800/50">
                                     <User className="w-3 h-3" />
                                     {createdBy}
                                 </Badge>
                                 <Badge variant="outline" className="gap-2 bg-slate-50 dark:bg-slate-800/50">
                                     <ArrowLeftRight className="w-3 h-3" />
                                     Lado: {lado}
                                 </Badge>
                                 <Badge variant="outline" className="gap-2 bg-slate-50 dark:bg-slate-800/50">
                                     <Navigation className="w-3 h-3" />
                                     Pista: {pista}
                                 </Badge>
                             </div>
                         </div>
                    </Section>



                    {/* 3. MAP: Photo Location & Context */}
                    {(hasPhotoCoords || segmentData) && (
                        <div id="photo-location-map" className="scroll-mt-24">
                            <Section title="📍 Localização da Ocorrência" icon={MapPin} accentColor="text-emerald-500">
                                <div className="h-[400px] w-full bg-slate-100 dark:bg-slate-900 rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-md">
                                    <MapView 
                                        markers={hasPhotoCoords ? [{
                                            position: [Number(currentPhoto.latitude), Number(currentPhoto.longitude)],
                                            name: `Evidência ${activePhotoIndex + 1}`,
                                            description: "Local exato da foto sobre o traçado"
                                        }] : interpolatedPosition ? [{
                                            position: interpolatedPosition,
                                            name: "Local Estimado",
                                            description: `Local calculado pelo Km ${kmDisplay}`
                                        }] : []}
                                        center={hasPhotoCoords 
                                            ? [Number(currentPhoto.latitude), Number(currentPhoto.longitude)]
                                            : interpolatedPosition || [-15.793889, -47.882778]} 
                                        zoom={hasPhotoCoords || interpolatedPosition ? 18 : 12}
                                        theme="light"
                                        geojson={displayGeojson}
                                        autoFitBounds={!!displayGeojson} 
                                        className={!displayGeojson && !hasPhotoCoords && !interpolatedPosition ? "opacity-50 grayscale" : ""}
                                    />
                                    {(!displayGeojson && !hasPhotoCoords) && (
                                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                            <div className="bg-white/80 dark:bg-black/80 px-4 py-2 rounded-lg text-xs font-mono text-slate-500 backdrop-blur-sm">
                                                Sem dados geográficos
                                            </div>
                                        </div>
                                    )}
                                </div>
                                    <div className="mt-2 text-xs text-slate-500 text-right">
                                        * A linha azul representa o traçado do segmento rodoviário.
                                    </div>
                            </Section>
                        </div>
                    )}


                </div>



                {/* 4. Technical Data - Premium Layout */}
                <motion.div variants={itemVariants}>
                    <div className="bg-white/60 dark:bg-[#1e293b]/40 rounded-2xl border border-white/20 dark:border-white/5 overflow-hidden backdrop-blur-md shadow-sm">
                        {/* Header */}
                        <div className="px-6 py-4 border-b border-black/5 dark:border-white/5 flex items-center gap-3 bg-black/[0.02] dark:bg-white/[0.02]">
                            <div className="p-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-500/20 text-indigo-500">
                                <ShieldAlert className="w-4 h-4" />
                            </div>
                            <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-widest">Ficha Técnica & Auditoria</h3>
                        </div>

                        {/* Content Grid - 2 Columns */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-black/5 dark:divide-white/5">
                            
                            {/* Column 1: System & Chronology */}
                            <div className="p-6 space-y-6">
                                {/* Group 1 */}
                                <div>
                                    <h4 className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-3 border-b border-slate-100 dark:border-white/5 pb-2 flex items-center gap-2">
                                        <div className="w-1.5 h-1.5 rounded-full bg-slate-400"></div>
                                        Identificação do Sistema
                                    </h4>
                                    <div className="space-y-1">
                                        <DataRow label="ID Interno" value={`#${registro.id}`} font="font-mono text-indigo-600 dark:text-indigo-400 font-bold" />
                                        <DataRow label="UUID Universal" value={registro.uuid} mono copyable />
                                        <DataRow label="Legado" value={registro.id.toString()} />
                                    </div>
                                </div>

                                {/* Group 2 */}
                                <div>
                                    <h4 className="text-[10px] font-bold text-blue-500 dark:text-blue-400 uppercase tracking-widest mb-3 border-b border-blue-100 dark:border-blue-500/20 pb-2 flex items-center gap-2">
                                        <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div>
                                        Ciclo de Vida
                                    </h4>
                                    <div className="space-y-1">
                                        <DataRow label="Data Ocorrência" value={new Date(registro.dataHoraOcorrencia).toLocaleString()} />
                                        <DataRow label="Data de Criação" value={registro.createdAt ? new Date(registro.createdAt).toLocaleString() : '-'} />
                                        <DataRow label="Última Edição" value={registro.updatedAt ? new Date(registro.updatedAt).toLocaleString() : '-'} />
                                    </div>
                                </div>
                            </div>

                            {/* Column 2: Context & Field Data */}
                            <div className="p-6 space-y-6">
                                {/* Group 3 */}
                                <div>
                                    <h4 className="text-[10px] font-bold text-purple-500 dark:text-purple-400 uppercase tracking-widest mb-3 border-b border-purple-100 dark:border-purple-500/20 pb-2 flex items-center gap-2">
                                        <div className="w-1.5 h-1.5 rounded-full bg-purple-500"></div>
                                        Dados de Inspeção
                                    </h4>
                                    <div className="space-y-1">
                                        <DataRow label="Início da Vistoria" value={registro.inspecoes?.dataInicioVistoria ? new Date(registro.inspecoes.dataInicioVistoria).toLocaleString() : "—"} />
                                        <DataRow label="Fim da Vistoria" value={registro.inspecoes?.dataFimVistoria ? new Date(registro.inspecoes.dataFimVistoria).toLocaleString() : "—"} />
                                        <DataRow 
                                            label="Status Atual" 
                                            value={registro.inspecoes?.status} 
                                            customContent={
                                                <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-bold border capitalize ${
                                                    registro.inspecoes?.status === 'EM_ANDAMENTO' ? 'bg-blue-50 text-blue-600 border-blue-200' :
                                                    registro.inspecoes?.status === 'CONCLUIDA' ? 'bg-emerald-50 text-emerald-600 border-emerald-200' :
                                                    'bg-slate-100 text-slate-600 border-slate-200'
                                                }`}>
                                                    {registro.inspecoes?.status?.toLowerCase().replace('_', ' ') || "N/A"}
                                                </span>
                                            }
                                        />
                                    </div>
                                </div>

                                {/* Group 4 */}
                                <div>
                                    <h4 className="text-[10px] font-bold text-emerald-500 dark:text-emerald-400 uppercase tracking-widest mb-3 border-b border-emerald-100 dark:border-emerald-500/20 pb-2 flex items-center gap-2">
                                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                                        Georreferenciamento
                                    </h4>
                                    <div className="space-y-1">
                                        <DataRow label="Segmento Homog." value={segmentName} highlight />
                                        <DataRow label="Latitude" value={registro.ocorrencias_fotos?.[0]?.latitude ? Number(registro.ocorrencias_fotos[0].latitude).toFixed(8) : "—"} mono />
                                        <DataRow label="Longitude" value={registro.ocorrencias_fotos?.[0]?.longitude ? Number(registro.ocorrencias_fotos[0].longitude).toFixed(8) : "—"} mono />
                                    </div>
                                </div>
                            </div>

                        </div>
                    </div>
                </motion.div>

                {/* Footer Actions */}
                 <div className="p-4 flex justify-end">
                    <button 
                        onClick={onClose}
                        className="px-6 py-2.5 bg-white dark:bg-white/5 hover:bg-slate-50 dark:hover:bg-white/10 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white text-sm font-semibold rounded-xl transition-all border border-slate-200 dark:border-white/10 hover:border-slate-300 dark:hover:border-white/20 shadow-sm hover:shadow active:scale-95"
                    >
                        Fechar
                    </button>
                 </div>

            </motion.div>
    </div>
  );
}

// Subcomponents

function InfoBlock({ icon: Icon, label, value, subValue, iconColor, bgClass }: any) {
    return (
        <div className={`p-4 rounded-2xl flex flex-col gap-1.5 hover:scale-[1.02] transition-transform duration-300 cursor-default ${bgClass || 'bg-white dark:bg-[#1e293b]/30 border border-slate-200 dark:border-white/5'}`}>
            <div className="flex items-center gap-2 mb-1">
                <div className={`p-1.5 rounded-lg bg-white/50 dark:bg-black/20 ${iconColor}`}>
                    <Icon className="w-4 h-4" />
                </div>
                <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 dark:text-slate-400">{label}</span>
            </div>
            <div className="text-slate-800 dark:text-white font-bold text-sm truncate" title={value}>{value}</div>
            {subValue && <div className="text-[11px] font-medium text-slate-500 truncate" title={subValue}>{subValue}</div>}
        </div>
    );
}

function Section({ title, icon: Icon, children, accentColor }: any) {
    return (
        <div className="h-full flex flex-col">
            <h3 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-2 pl-1">
                <Icon className={`w-3.5 h-3.5 ${accentColor}`} /> 
                {title}
            </h3>
            <div className="flex-1">
                {children}
            </div>
        </div>
    );
}

function Badge({ children, className, variant }: any) {
    return (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${className}`}>
            {children}
        </span>
    );
}

function DataRow({ label, value, mono, copyable, highlight, customContent, font }: any) {
    return (
        <div className="flex items-center justify-between py-1 group">
            <span className="text-xs text-slate-500 dark:text-slate-500">{label}:</span>
            {customContent ? customContent : (
                <span className={`text-xs text-slate-700 dark:text-slate-300 text-right ${mono ? 'font-mono' : ''} ${font || ''} ${highlight ? 'bg-yellow-100 dark:bg-yellow-500/20 px-1 rounded' : ''} ${copyable ? 'cursor-pointer hover:underline' : ''}`}>
                    {value}
                </span>
            )}
        </div>
    );
}


// Helper to normalize paths and handle S3 keys
function getSafeUrl(path: string) {
    if (!path) return '';
    let safePath = path.replace(/\\/g, '/');
    
    // Full URL (http/https) - return as-is (includes S3 signed URLs)
    if (safePath.startsWith('http')) return safePath;
    
    // Legacy local paths: /uploads/... or uploads/...
    if (safePath.startsWith('/uploads') || safePath.startsWith('uploads/')) {
        return safePath.startsWith('/') ? safePath : '/' + safePath;
    }
    
    // Legacy: upload/ typo -> convert to /uploads/
    if (safePath.startsWith('upload/')) {
        return '/' + safePath.replace('upload/', 'uploads/');
    }
    
    // Check for uploads somewhere in the path (legacy data)
    const uploadsIndex = safePath.toLowerCase().indexOf('uploads/');
    if (uploadsIndex !== -1) {
        safePath = safePath.substring(uploadsIndex);
        return '/' + safePath;
    }
    
    // S3 key detection: paths like "ocorrencias/123/file.jpg" or "projetos/file.jpg"
    // These paths have a folder structure but don't start with / or http
    const s3KeyPattern = /^[a-zA-Z0-9_-]+\/.*\.(jpg|jpeg|png|gif|webp|bmp|svg|kmz|kml)$/i;
    if (s3KeyPattern.test(safePath)) {
        // Route through our signed URL API
        return `/api/s3/signed-url?key=${encodeURIComponent(safePath)}&redirect=1`;
    }
    
    // Fallback: assume it's a local path
    if (!safePath.startsWith('/')) return '/' + safePath;
    return safePath;
}
