/**
 * KMZ/KML Processing Service
 * 
 * Handles conversion and processing of KMZ/KML files to GeoJSON
 * and splitting traces by rodovia and segment
 */

import JSZip from 'jszip';
import { DOMParser } from '@xmldom/xmldom';
import * as toGeoJSON from '@tmcw/togeojson';
import * as turf from '@turf/turf';
import { lineSlice } from '@turf/line-slice';
import { appendFile } from 'fs/promises';
import { join } from 'path';

async function logDebug(message: string) {
    try {
        const path = join(process.cwd(), 'public', 'uploads', 'kmz_debug.txt');
        await appendFile(path, new Date().toISOString() + ': ' + message + '\n');
    } catch (e) { console.error(e); }
}

export interface ProcessedKMZ {
  geojson: GeoJSON.FeatureCollection;
  lengthKm: number;
  bounds: {
    minLat: number;
    maxLat: number;
    minLng: number;
    maxLng: number;
  };
}

export interface SegmentTrace {
  kmInicial: number;
  kmFinal: number;
  geojson: GeoJSON.Feature<GeoJSON.LineString>;
}

/**
 * Parse KMZ file and extract GeoJSON
 */
export async function parseKMZ(buffer: Buffer): Promise<ProcessedKMZ> {
  try {
    // Load ZIP file
    const zip = await JSZip.loadAsync(buffer);
    
    // Find KML file (usually doc.kml or the first .kml file)
    let kmlFile = zip.file('doc.kml');
    if (!kmlFile) {
      const kmlFiles = Object.keys(zip.files).filter(name => name.endsWith('.kml'));
      if (kmlFiles.length === 0) {
        throw new Error('No KML file found in KMZ');
      }
      kmlFile = zip.file(kmlFiles[0]);
    }

    if (!kmlFile) {
      throw new Error('Could not read KML file from KMZ');
    }

    // Extract KML content
    const kmlText = await kmlFile.async('text');
    
    // Parse KML to GeoJSON
    const geojson = parseKML(kmlText);
    
    // Calculate metadata
    const lengthKm = calculateTotalLength(geojson);
    const bounds = calculateBounds(geojson);
    
    return {
      geojson,
      lengthKm,
      bounds
    };
  } catch (error) {
    console.error('Error parsing KMZ:', error);
    throw new Error(`Failed to parse KMZ file: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Parse KML string to GeoJSON
 */
export function parseKML(kmlText: string): GeoJSON.FeatureCollection {
  try {
    const parser = new DOMParser();
    const kmlDoc = parser.parseFromString(kmlText, 'text/xml');
    const geojson = toGeoJSON.kml(kmlDoc);
    
    return geojson as GeoJSON.FeatureCollection;
  } catch (error) {
    console.error('Error parsing KML:', error);
    throw new Error(`Failed to parse KML: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Calculate total length of all LineStrings in kilometers
 */
export function calculateTotalLength(geojson: GeoJSON.FeatureCollection): number {
  let totalLength = 0;
  
  geojson.features.forEach(feature => {
    if (feature.geometry.type === 'LineString') {
      const line = turf.lineString(feature.geometry.coordinates);
      totalLength += turf.length(line, { units: 'kilometers' });
    } else if (feature.geometry.type === 'MultiLineString') {
      feature.geometry.coordinates.forEach(coords => {
        const line = turf.lineString(coords);
        totalLength += turf.length(line, { units: 'kilometers' });
      });
    }
  });
  
  return totalLength;
}

/**
 * Calculate bounding box
 */
export function calculateBounds(geojson: GeoJSON.FeatureCollection) {
  const bbox = turf.bbox(geojson);
  return {
    minLng: bbox[0],
    minLat: bbox[1],
    maxLng: bbox[2],
    maxLat: bbox[3]
  };
}


/**
 * Extract distinct Points with properties (Markers)
 */
export function extractMarkers(geojson: GeoJSON.FeatureCollection | GeoJSON.Feature | GeoJSON.Geometry): GeoJSON.Feature<GeoJSON.Point>[] {
  const markers: GeoJSON.Feature<GeoJSON.Point>[] = [];

  const processFeature = (feature: GeoJSON.Feature) => {
    if (feature.geometry && feature.geometry.type === 'Point') {
        markers.push(feature as GeoJSON.Feature<GeoJSON.Point>);
    } else if (feature.geometry && feature.geometry.type === 'MultiPoint') {
       feature.geometry.coordinates.forEach((coord, idx) => {
          markers.push({
              type: 'Feature',
              geometry: { type: 'Point', coordinates: coord },
              properties: { ...feature.properties, id_sub: idx }
          });
       });
    } else if (feature.geometry && feature.geometry.type === 'GeometryCollection') {
        feature.geometry.geometries.forEach(geom => {
            if (geom.type === 'Point') {
                markers.push({
                    type: 'Feature',
                    geometry: geom,
                    properties: feature.properties
                });
            }
        });
    }
  };

  if (geojson.type === 'FeatureCollection') {
    geojson.features.forEach(f => processFeature(f));
  } else if (geojson.type === 'Feature') {
    processFeature(geojson);
  }

  return markers;
}

/**
 * Extract main LineString from GeoJSON
 * Recursively searches through FeatureCollections, GeometryCollections, and Features
 * and merges ALL found LineStrings into one continuous path.
 * 
 * PERFORMANCE: Uses grid-based spatial index for O(n) nearest-neighbor instead of O(n²).
 */
export function extractMainLineString(geojson: GeoJSON.FeatureCollection | GeoJSON.Feature | GeoJSON.Geometry): GeoJSON.Feature<GeoJSON.LineString | GeoJSON.MultiLineString> | null {
  let longestLine: GeoJSON.Feature<GeoJSON.LineString | GeoJSON.MultiLineString> | null = null;
  const pointCoordinates: number[][] = [];
  const allLineCoordinates: number[][] = [];

  const processGeometry = (geometry: GeoJSON.Geometry, properties: any = {}) => {
    if (geometry.type === 'LineString') {
      geometry.coordinates.forEach(coord => allLineCoordinates.push(coord));
    } else if (geometry.type === 'MultiLineString') {
      geometry.coordinates.forEach(coords => {
         coords.forEach(coord => allLineCoordinates.push(coord));
      });
    } else if (geometry.type === 'Point') {
      const name = properties?.name || 'unnamed';
      let km: number | null = null;
      const kmMatch = name.match(/(?:km\s*)?(\d+(?:[.,]\d+)?)/i);
      if (kmMatch) {
        km = parseFloat(kmMatch[1].replace(',', '.'));
      }
      pointCoordinates.push([...geometry.coordinates, km ?? -1]);
    } else if (geometry.type === 'MultiPoint') {
      geometry.coordinates.forEach(coord => pointCoordinates.push([...coord, -1]));
    } else if (geometry.type === 'GeometryCollection') {
      geometry.geometries.forEach(geom => processGeometry(geom, properties));
    }
  };

  const processFeature = (feature: GeoJSON.Feature) => {
    if (feature.geometry) {
      processGeometry(feature.geometry, feature.properties);
    }
  };

  if (geojson.type === 'FeatureCollection') {
    geojson.features.forEach(feature => processFeature(feature));
  } else if (geojson.type === 'Feature') {
    processFeature(geojson);
  } else if (geojson.type === 'GeometryCollection') { 
     geojson.geometries.forEach(geom => processGeometry(geom));
  } else {
    processGeometry(geojson as GeoJSON.Geometry);
  }
  
  const lineScore = allLineCoordinates.length;
  const pointScore = pointCoordinates.length;

  if (pointScore > lineScore * 1.5 || (lineScore < 10 && pointScore > 5)) {
     allLineCoordinates.length = 0;
     pointCoordinates.forEach(p => allLineCoordinates.push(p));
  } else if (lineScore === 0 && pointScore > 1) {
     pointCoordinates.forEach(p => allLineCoordinates.push(p));
  }

  if (allLineCoordinates.length < 2) {
    return null;
  }

  try {
     // Remove adjacent duplicates
     const cleanCoords = allLineCoordinates.filter((coord, i) => {
        if (i === 0) return true;
        const prev = allLineCoordinates[i-1];
        return prev[0] !== coord[0] || prev[1] !== coord[1];
     });
     
     if (cleanCoords.length <= 2) {
        longestLine = turf.lineString(cleanCoords);
        return longestLine;
     }

     // ---------------------------------------------------------
     // FAST SPATIAL NEAREST-NEIGHBOR USING GRID INDEX
     // Grid cells are ~0.01 degrees (~1km). Neighbor search checks
     // only the current cell + surrounding cells: O(1) amortized per lookup.
     // Total: O(n) amortized instead of O(n²).
     // ---------------------------------------------------------
     const CELL_SIZE = 0.01; // ~1km grid cells
     const GAP_THRESHOLD_DEG_SQ = Math.pow(0.05, 2);

     // Build spatial grid index
     const grid = new Map<string, number[]>(); // cell key -> array of indices
     const cellKey = (lng: number, lat: number) => 
       `${Math.floor(lng / CELL_SIZE)},${Math.floor(lat / CELL_SIZE)}`;
     
     for (let i = 0; i < cleanCoords.length; i++) {
       const key = cellKey(cleanCoords[i][0], cleanCoords[i][1]);
       if (!grid.has(key)) grid.set(key, []);
       grid.get(key)!.push(i);
     }

     // Helper: find nearest unvisited point using grid
     const visited = new Set<number>();
     
     const findNearest = (point: number[]): { index: number; distSq: number } => {
       const cx = Math.floor(point[0] / CELL_SIZE);
       const cy = Math.floor(point[1] / CELL_SIZE);
       
       let bestIndex = -1;
       let bestDistSq = Infinity;
       
       // Search expanding rings of grid cells until we find something
       for (let radius = 0; radius <= 10; radius++) {
         for (let dx = -radius; dx <= radius; dx++) {
           for (let dy = -radius; dy <= radius; dy++) {
             // Only check border cells of current ring (optimization)
             if (radius > 0 && Math.abs(dx) < radius && Math.abs(dy) < radius) continue;
             
             const key = `${cx + dx},${cy + dy}`;
             const indices = grid.get(key);
             if (!indices) continue;
             
             for (const idx of indices) {
               if (visited.has(idx)) continue;
               const d = Math.pow(cleanCoords[idx][0] - point[0], 2) + 
                         Math.pow(cleanCoords[idx][1] - point[1], 2);
               if (d < bestDistSq) {
                 bestDistSq = d;
                 bestIndex = idx;
               }
             }
           }
         }
         // If we found something in this ring and the next ring can't be closer, stop
         if (bestIndex !== -1) {
           const nextRingMinDist = Math.pow((radius + 1) * CELL_SIZE, 2);
           if (bestDistSq <= nextRingMinDist) break;
         }
       }
       
       // Fallback: if grid search didn't find anything (very sparse data), linear scan
       if (bestIndex === -1) {
         for (let i = 0; i < cleanCoords.length; i++) {
           if (visited.has(i)) continue;
           const d = Math.pow(cleanCoords[i][0] - point[0], 2) + 
                     Math.pow(cleanCoords[i][1] - point[1], 2);
           if (d < bestDistSq) {
             bestDistSq = d;
             bestIndex = i;
           }
         }
       }
       
       return { index: bestIndex, distSq: bestDistSq };
     };

     // Remove visited index from the grid
     const removeFromGrid = (idx: number) => {
       const key = cellKey(cleanCoords[idx][0], cleanCoords[idx][1]);
       const indices = grid.get(key);
       if (indices) {
         const pos = indices.indexOf(idx);
         if (pos !== -1) indices.splice(pos, 1);
         if (indices.length === 0) grid.delete(key);
       }
     };

     // Find starting point (western-most)
     let currentIndex = 0;
     let minLng = Infinity;
     cleanCoords.forEach((c, i) => {
       if (c[0] < minLng) { minLng = c[0]; currentIndex = i; }
     });

     const resultLines: number[][][] = [];
     let currentSegment: number[][] = [cleanCoords[currentIndex]];
     visited.add(currentIndex);
     removeFromGrid(currentIndex);

     // Chain nearest neighbors using grid
     while (visited.size < cleanCoords.length) {
       const currentPoint = currentSegment[currentSegment.length - 1];
       const { index: nearestIndex, distSq: minDistance } = findNearest(currentPoint);

       if (nearestIndex === -1) break;

       if (minDistance > GAP_THRESHOLD_DEG_SQ) {
         // Gap detected - start new segment
         resultLines.push([...currentSegment]);
         currentSegment = [cleanCoords[nearestIndex]];
       } else {
         currentSegment.push(cleanCoords[nearestIndex]);
       }
       
       visited.add(nearestIndex);
       removeFromGrid(nearestIndex);
     }
     
     if (currentSegment.length > 0) {
       resultLines.push(currentSegment);
     }

     if (resultLines.length === 1) {
       longestLine = turf.lineString(resultLines[0]);
     } else if (resultLines.length > 1) {
       longestLine = turf.multiLineString(resultLines) as any;
     }
  } catch(e) {
     console.error("Error merging lines:", e);
     return null;
  }
  
  return longestLine;
}



/**
 * Split trace by kilometer range
 * This is a simplified version - assumes the trace has kilometer markers
 * or uses proportional distance along the line
 */
export function sliceTraceByKm(
  lineFeature: GeoJSON.Feature<GeoJSON.LineString | GeoJSON.MultiLineString>,
  kmInicial: number,
  kmFinal: number,
  totalKm: number
): GeoJSON.Feature<GeoJSON.LineString | GeoJSON.MultiLineString> {
  try {
    let line: any; // Turf creates different objects
    const isMulti = lineFeature.geometry.type === 'MultiLineString';

    if (isMulti) {
        line = turf.multiLineString((lineFeature.geometry as GeoJSON.MultiLineString).coordinates);
    } else {
        line = turf.lineString((lineFeature.geometry as GeoJSON.LineString).coordinates);
    }
    
    // Calculate total length in km from turf (should match input totalKm approx)
    const totalLength = turf.length(line, { units: 'kilometers' });
    
    logDebug(`[SliceTrace] slicing ${kmInicial}-${kmFinal} (TotalKM: ${totalKm}, GeomLen: ${totalLength.toFixed(3)})`);

    // Calculate proportional distances
    const startDistance = (kmInicial / totalKm) * totalLength;
    const endDistance = (kmFinal / totalKm) * totalLength;
    
    logDebug(`[SliceTrace] Calculated dists: ${startDistance.toFixed(3)} - ${endDistance.toFixed(3)}`);

    if (startDistance >= endDistance) {
        logDebug(`[SliceTrace] Invalid range: start >= end`);
        throw new Error(`Invalid range: start (${startDistance}) >= end (${endDistance})`);
    }

    // ---------------------------------------------------------
    // SLICING LOGIC
    // ---------------------------------------------------------
    
    if (!isMulti) {
        // Simple case: LineString
        const startPoint = turf.along(line, startDistance, { units: 'kilometers' });
        const endPoint = turf.along(line, endDistance, { units: 'kilometers' });
        return lineSlice(startPoint, endPoint, line);
    } else {
        // Complex case: MultiLineString
        // We need to traverse the segments and collect the parts that fall within [startDistance, endDistance]
        
        const segments: any[] = [];
        let currentDist = 0;
        
        // Flatten MultiLineString into segments
        // Note: We treat the MultiLineString as a continuous sequence for KM calculation purposes
        // even if there are spatial gaps. This assumes the KM markers follow the sequence of lines.
        
        const coords = (lineFeature.geometry as GeoJSON.MultiLineString).coordinates;
        
        for (const segmentCoords of coords) {
            const segmentLine = turf.lineString(segmentCoords);
            const segLen = turf.length(segmentLine, { units: 'kilometers' });
            
            const segStart = currentDist;
            const segEnd = currentDist + segLen;
            
            // Check overlap
            if (segEnd < startDistance) {
                // Segment is completely before range
            } else if (segStart > endDistance) {
                // Segment is completely after range -> We can stop if ordered? 
                // Don't stop if data isn't perfectly ordered, but usually it is.
            } else {
                // Overlap!
                // Calculate local slice points
                const localStartDist = Math.max(0, startDistance - segStart);
                const localEndDist = Math.min(segLen, endDistance - segStart);
                
                if (localEndDist > localStartDist) {
                    // Re-calculate points SPECIFIC to this segment to ensure they snap correctly
                    const p1 = turf.along(segmentLine, localStartDist, { units: 'kilometers' });
                    const p2 = turf.along(segmentLine, localEndDist, { units: 'kilometers' });
                    
                    const slicedFeature = lineSlice(p1, p2, segmentLine);
                    if (slicedFeature.geometry.coordinates.length > 1) {
                         segments.push(slicedFeature.geometry.coordinates);
                    }
                }
            }
            currentDist += segLen;
        }
        
        if (segments.length === 0) {
            console.warn("Slice resulted in empty geometry. Returning original.");
             return lineFeature; 
        }

        if (segments.length === 1) {
             return turf.lineString(segments[0]);
        }
        
        return turf.multiLineString(segments);
    }

  } catch (error) {
    console.error('Error slicing trace:', error);
    // Fallback: return full trace
    return lineFeature;
  }
}

/**
 * Convert GeoJSON to KML string
 */
export function geojsonToKML(geojson: GeoJSON.FeatureCollection | GeoJSON.Feature): string {
  // Simple KML generation
  const features = 'type' in geojson && geojson.type === 'FeatureCollection' 
    ? geojson.features 
    : [geojson];
  
  const placemarks = features.map((feature, index) => {
    const coords = feature.geometry.type === 'LineString'
      ? feature.geometry.coordinates.map(c => `${c[0]},${c[1]},0`).join(' ')
      : '';
    
    const name = feature.properties?.name || `Trace ${index + 1}`;
    
    return `
    <Placemark>
      <name>${name}</name>
      <LineString>
        <coordinates>${coords}</coordinates>
      </LineString>
    </Placemark>`;
  }).join('\n');
  
  return `<?xml version="1.0" encoding="UTF-8"?>
<kml xmlns="http://www.opengis.net/kml/2.2">
  <Document>
    ${placemarks}
  </Document>
</kml>`;
}

/**
 * Create KMZ buffer from KML string
 */
export async function createKMZ(kmlString: string): Promise<Buffer> {
  const zip = new JSZip();
  zip.file('doc.kml', kmlString);
  const buffer = await zip.generateAsync({ type: 'nodebuffer' });
  return buffer;
}
