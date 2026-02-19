"use client";

import { MapContainer, TileLayer, Polyline, Polygon, Marker, Popup, useMap, GeoJSON } from "react-leaflet";
import { LatLngBoundsExpression, Icon, GeoJSON as LeafletGeoJSON } from "leaflet";
import "leaflet/dist/leaflet.css";
import { useEffect } from "react";

interface MapViewProps {
  routeCoordinates?: [number, number][];
  polygons?: [number, number][][]; // Array de polígonos
  markers?: Array<{ position: [number, number]; name: string; description?: string }>;
  center?: [number, number];
  zoom?: number;
  theme?: 'light' | 'dark';
  geojson?: any;
  className?: string;
  autoFitBounds?: boolean;
}

// Fix default marker icon issue with Webpack
const defaultIcon = new Icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

// Component to fit bounds when route changes
function FitBounds({ coordinates, markers, polygons, geojson }: { 
  coordinates?: [number, number][]; 
  markers?: Array<{ position: [number, number] }>;
  polygons?: [number, number][][];
  geojson?: any;
}) {
  const map = useMap();
  
  useEffect(() => {
    // Collect all points to create bounds
    const allPoints: [number, number][] = [];
    
    // 1. Route Polyline
    if (coordinates) {
        allPoints.push(...coordinates);
    }
    
    // 2. Markers
    if (markers && markers.length > 0) {
      markers.forEach(marker => allPoints.push(marker.position));
    }
    
    // 3. Polygons
    if (polygons && polygons.length > 0) {
      polygons.forEach(polygon => {
        polygon.forEach(point => allPoints.push(point));
      });
    }

    // 4. GeoJSON
    if (geojson) {
        try {
            const layer = new LeafletGeoJSON(geojson);
            const bounds = layer.getBounds();
            if (bounds.isValid()) {
                map.fitBounds(bounds, { padding: [50, 50] });
                return; // Priority to GeoJSON bounds if valid
            }
        } catch (e) {
            console.warn("Invalid GeoJSON bounds", e);
        }
    }
    
    // Fallback to manual points
    if (allPoints.length > 0) {
      const bounds: LatLngBoundsExpression = allPoints;
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [coordinates, markers, polygons, geojson, map]);
  
  return null;
}

export default function MapView({ routeCoordinates, polygons, markers, center = [-27.5969, -48.5495], zoom = 10, theme = 'light', geojson, className, autoFitBounds = true }: MapViewProps) {
  const tileUrl = theme === 'dark' 
    ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
    : "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png";

  return (
    <div className={`relative w-full h-full min-h-[400px] rounded-lg overflow-hidden border border-border shadow-xl bg-slate-100 dark:bg-slate-900 ${className || ''}`}>
      <MapContainer
        center={center}
        zoom={zoom}
        className="w-full h-full z-0"
        zoomControl={true}
        scrollWheelZoom={true}
      >
        {/* Base Map Tile Layer - Premium CartoDB */}
        <TileLayer
          attribution='&copy; CARTO'
          url={tileUrl}
        />
        
        {/* GeoJSON Layer (e.g. Segment Trace) */}
        {geojson && (
            <GeoJSON 
                key={JSON.stringify(geojson)}
                data={geojson} 
                style={(feature) => ({
                    color: feature?.properties?.color || '#3b82f6', // Dynamic color or Default Blue
                    weight: feature?.properties?.weight || 5,
                    opacity: feature?.properties?.opacity || 0.8
                })} 
            />
        )}
        
        {/* Polygons - apenas contorno, sem preenchimento */}
        {polygons && polygons.map((polygon, index) => (
          <Polygon
            key={`polygon-${index}`}
            positions={polygon}
            pathOptions={{
              color: '#10b981', // Verde
              weight: 2,
              opacity: 0.6,
              fillOpacity: 0, // SEM preenchimento
            }}
          />
        ))}
        
        {/* Highway Route Polylines */}
        {routeCoordinates && routeCoordinates.length > 0 && (
            <Polyline
              positions={routeCoordinates}
              pathOptions={{
                color: '#3b82f6', // Azul
                weight: 4,
                opacity: 0.8,
              }}
            />
        )}
        
        {/* Auto Fit Bounds Logic */}
        {autoFitBounds && (
            <FitBounds coordinates={routeCoordinates} markers={markers} polygons={polygons} geojson={geojson} />
        )}
        
        {/* Markers for Points/Placemarks */}
        {markers && markers.map((marker, index) => (
          <Marker 
            key={index} 
            position={marker.position}
            icon={defaultIcon}
          >
            <Popup>
              <div className="text-sm">
                <strong className="block mb-1">{marker.name}</strong>
                {marker.description && <p className="text-xs text-gray-600">{marker.description}</p>}
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
