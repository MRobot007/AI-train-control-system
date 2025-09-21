import { useEffect, useRef } from "react";
import L from "leaflet";
// Fix default marker icons in bundlers (Vite)
const iconRetinaUrl = new URL('leaflet/dist/images/marker-icon-2x.png', import.meta.url).toString();
const iconUrl = new URL('leaflet/dist/images/marker-icon.png', import.meta.url).toString();
const shadowUrl = new URL('leaflet/dist/images/marker-shadow.png', import.meta.url).toString();
L.Icon.Default.mergeOptions({
  iconRetinaUrl,
  iconUrl,
  shadowUrl
});
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getRandomSpeed } from "../data/mockData";
interface TrainDTO {
  id: string;
  name: string;
  lat: number;
  lng: number;
  type: string;
}

interface SimpleLeafletMapProps {
  isRunning: boolean;
  onTrainSelect?: (train: TrainDTO) => void;
}

export default function SimpleLeafletMap({ isRunning, onTrainSelect }: SimpleLeafletMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const leafletRef = useRef<L.Map | null>(null);
  const trainsLayerRef = useRef<L.LayerGroup | null>(null);
  const pollTimerRef = useRef<number | null>(null);
  const markersRef = useRef<Record<string, { marker: L.Marker; from: L.LatLngTuple; to: L.LatLngTuple; start: number; duration: number }>>({});
  const animRef = useRef<number | null>(null);

  useEffect(() => {
    if (!mapRef.current) return;
    const map = L.map(mapRef.current, {
      zoomControl: true,
      center: [22.5, 72.5],
      zoom: 7,
    });
    leafletRef.current = map;
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
      crossOrigin: true,
      detectRetina: true,
      errorTileUrl: 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw=='
    }).addTo(map);

    // Fit to Gujarat
    const bounds = L.latLngBounds([ [19.0, 68.5], [24.5, 77.5] ]);
    map.fitBounds(bounds, { padding: [24, 24] });
    [0, 80, 200, 400].forEach(ms => setTimeout(() => map.invalidateSize(), ms));

    // Layers
    const tracksLayer = L.geoJSON(undefined, {
      style: (feat: any) => {
        const t = feat?.properties?.type;
        const cong: number = typeof feat?.properties?.congestion === 'number' ? feat.properties.congestion : 0.2;
        // interpolate green (low) -> yellow (mid) -> red (high)
        const color = cong < 0.4 ? '#10b981' : cong < 0.7 ? '#f59e0b' : '#ef4444';
        return { color, weight: t === 'electrified' ? 5 : 4, opacity: 0.9 } as L.PathOptions;
      }
    }).addTo(map);
    const stationsLayer = L.layerGroup().addTo(map);
    const trainsLayer = L.layerGroup().addTo(map);
    trainsLayerRef.current = trainsLayer;
    console.log('Created trains layer:', trainsLayer);
    
    // Create 6 trains immediately and add them to the map
    const createTrainMarker = (id: string, name: string, lat: number, lng: number, type: string) => {
      const trainSymbol = type === 'express' ? '🚄' : type === 'passenger' ? '🚂' : '🚛';
      const trainColor = type === 'express' ? '#ef4444' : type === 'passenger' ? '#3b82f6' : '#f59e0b';
      const speed = Math.floor(Math.random() * 40) + 80;
      const maxSpeed = type === 'express' ? 140 : type === 'passenger' ? 100 : 80;
      const speedPercentage = Math.round((speed / maxSpeed) * 100);
      const delay = Math.random() > 0.7 ? Math.floor(Math.random() * 30) : 0;
      const status = delay > 0 ? 'delayed' : 'on-time';
      const priority = type === 'express' ? 1 : type === 'passenger' ? 3 : 4;
      
      const icon = L.divIcon({
        className: 'train-marker',
        html: `
          <div style="
            position: relative;
            width: 80px;
            height: 80px;
            background: ${trainColor};
            border: 6px solid #fff;
            border-radius: 20px;
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 0 30px rgba(0,0,0,0.9);
            animation: pulse 2s infinite;
            z-index: 9999;
          ">
            <!-- Train Symbol -->
            <div style="
              font-size: 35px;
              color: #fff;
              text-shadow: 2px 2px 4px rgba(0,0,0,0.8);
            ">${trainSymbol}</div>
            
            <!-- Priority Badge -->
            <div style="
              position: absolute;
              top: -12px;
              left: -12px;
              width: 25px;
              height: 25px;
              background: #1f2937;
              color: #fff;
              border-radius: 50%;
              border: 4px solid #fff;
              display: flex;
              align-items: center;
              justify-content: center;
              font-size: 12px;
              font-weight: bold;
              z-index: 10001;
            ">P${priority}</div>
            
            <!-- Status Indicator -->
            <div style="
              position: absolute;
              top: -12px;
              right: -12px;
              width: 25px;
              height: 25px;
              background: ${status === 'delayed' ? '#ef4444' : '#10b981'};
              border-radius: 50%;
              border: 4px solid #fff;
              animation: ${status === 'delayed' ? 'blink 0.5s infinite' : 'blink 2s infinite'};
              z-index: 10001;
            "></div>
            
            <!-- Speed Gauge -->
            <div style="
              position: absolute;
              top: -50px;
              left: 50%;
              transform: translateX(-50%);
              background: #1f2937;
              color: #fff;
              padding: 6px 12px;
              border-radius: 12px;
              font-size: 14px;
              font-weight: bold;
              border: 3px solid #fff;
              min-width: 40px;
              text-align: center;
              z-index: 10000;
              box-shadow: 0 4px 8px rgba(0,0,0,0.3);
            ">
              <div style="font-size: 16px; font-weight: 900;">${speed}</div>
              <div style="font-size: 8px; color: #9ca3af;">km/h</div>
            </div>
            
            <!-- Speed Progress Bar -->
            <div style="
              position: absolute;
              top: -35px;
              left: 50%;
              transform: translateX(-50%);
              width: 60px;
              height: 4px;
              background: #374151;
              border-radius: 2px;
              overflow: hidden;
              z-index: 10000;
            ">
              <div style="
                width: ${speedPercentage}%;
                height: 100%;
                background: ${speedPercentage > 80 ? '#ef4444' : speedPercentage > 60 ? '#f59e0b' : '#10b981'};
                transition: width 0.3s ease;
              "></div>
            </div>
            
            <!-- Train ID & Type -->
            <div style="
              position: absolute;
              bottom: -45px;
              left: 50%;
              transform: translateX(-50%);
              background: #374151;
              color: #fff;
              padding: 6px 10px;
              border-radius: 10px;
              font-size: 12px;
              font-weight: bold;
              border: 3px solid #fff;
              white-space: nowrap;
              z-index: 10000;
              box-shadow: 0 4px 8px rgba(0,0,0,0.3);
            ">
              <div style="font-size: 14px; font-weight: 900;">${id}</div>
              <div style="font-size: 8px; color: #9ca3af; text-transform: uppercase;">${type}</div>
            </div>
            
            <!-- Delay Indicator -->
            ${delay > 0 ? `
              <div style="
                position: absolute;
                bottom: -25px;
                right: -25px;
                background: #ef4444;
                color: #fff;
                padding: 4px 8px;
                border-radius: 8px;
                font-size: 10px;
                font-weight: bold;
                border: 2px solid #fff;
                z-index: 10001;
                animation: blink 1s infinite;
              ">+${delay}m</div>
            ` : ''}
            
            <!-- Route Indicator -->
            <div style="
              position: absolute;
              top: 50%;
              right: -35px;
              transform: translateY(-50%);
              background: #1f2937;
              color: #fff;
              padding: 4px 8px;
              border-radius: 8px;
              font-size: 10px;
              font-weight: bold;
              border: 2px solid #fff;
              z-index: 10000;
              writing-mode: vertical-rl;
              text-orientation: mixed;
            ">${id.includes('T001') || id.includes('T002') || id.includes('T005') ? 'MSH→ADI' : 'ADI→BRC'}</div>
          </div>
        `,
        iconSize: [80, 80],
        iconAnchor: [40, 40]
      });
      
      const marker = L.marker([lat, lng], { icon });
      marker.bindTooltip(`
        <div style="text-align:center;min-width:200px;font-size:14px;">
          <strong style="color:${trainColor};font-size:18px;">${name}</strong><br/>
          <span style="color:#666;">${id} - ${type.toUpperCase()}</span><br/>
          <span style="color:#10b981;font-weight:bold;">Speed: ${speed}/${maxSpeed} km/h (${speedPercentage}%)</span><br/>
          <span style="color:#6b7280;">Status: ${status === 'delayed' ? 'DELAYED' : 'ON TIME'}</span><br/>
          <span style="color:#6b7280;">Priority: P${priority}</span><br/>
          ${delay > 0 ? `<span style="color:#ef4444;font-weight:bold;">Delay: +${delay} minutes</span><br/>` : ''}
          <span style="color:#6b7280;">Route: ${id.includes('T001') || id.includes('T002') || id.includes('T005') ? 'Mehsana → Ahmedabad' : 'Ahmedabad → Vadodara'}</span>
        </div>
      `);
      
      return marker;
    };
    
    // Function to get position along railway line
    const getPositionAlongLine = (startLat: number, startLng: number, endLat: number, endLng: number, progress: number) => {
      return {
        lat: startLat + (endLat - startLat) * progress,
        lng: startLng + (endLng - startLng) * progress
      };
    };

    
    // Store train markers for movement
    const trainMarkers: Record<string, L.Marker> = {};
    const trains = [
      // Mehsana to Ahmedabad line - positioned at different points along the track
      { 
        id: 'T001', 
        name: 'Mehsana Express', 
        type: 'express', 
        route: 'MSH-ADI', 
        progress: 0.2,
        ...getPositionAlongLine(23.5880, 72.3693, 23.0225, 72.5714, 0.2)
      },
      { 
        id: 'T002', 
        name: 'Ahmedabad Fast', 
        type: 'express', 
        route: 'MSH-ADI', 
        progress: 0.6,
        ...getPositionAlongLine(23.5880, 72.3693, 23.0225, 72.5714, 0.6)
      },
      
      // Ahmedabad to Vadodara line - positioned at different points along the track
      { 
        id: 'T003', 
        name: 'Vadodara Passenger', 
        type: 'passenger', 
        route: 'ADI-BRC', 
        progress: 0.3,
        ...getPositionAlongLine(23.0225, 72.5714, 22.3072, 73.1812, 0.3)
      },
      { 
        id: 'T004', 
        name: 'Local Service', 
        type: 'passenger', 
        route: 'ADI-BRC', 
        progress: 0.7,
        ...getPositionAlongLine(23.0225, 72.5714, 22.3072, 73.1812, 0.7)
      },
      
      // Freight trains on main lines
      { 
        id: 'T005', 
        name: 'Freight Train', 
        type: 'freight', 
        route: 'MSH-ADI', 
        progress: 0.4,
        ...getPositionAlongLine(23.5880, 72.3693, 23.0225, 72.5714, 0.4)
      },
      { 
        id: 'T006', 
        name: 'Goods Express', 
        type: 'freight', 
        route: 'ADI-BRC', 
        progress: 0.5,
        ...getPositionAlongLine(23.0225, 72.5714, 22.3072, 73.1812, 0.5)
      }
    ];
    
    trains.forEach(train => {
      // Create both custom and standard markers for visibility
      const customMarker = createTrainMarker(train.id, train.name, train.lat, train.lng, train.type);
      customMarker.addTo(trainsLayer);
      
      // Add a simple standard marker as backup with speed info
      const trainSymbol = train.type === 'express' ? '🚄' : train.type === 'passenger' ? '🚂' : '🚛';
      const trainColor = train.type === 'express' ? '#ef4444' : train.type === 'passenger' ? '#3b82f6' : '#f59e0b';
      const speed = Math.floor(Math.random() * 40) + 80;
      const priority = train.type === 'express' ? 1 : train.type === 'passenger' ? 3 : 4;
      
      const standardIcon = L.divIcon({
        className: 'simple-train-marker',
        html: `<div style="
          position: relative;
          width: 60px; height: 60px; 
          background: ${trainColor}; 
          border: 4px solid white; 
          border-radius: 50%; 
          display: flex; 
          align-items: center; 
          justify-content: center; 
          font-size: 30px;
          box-shadow: 0 0 20px rgba(0,0,0,0.8);
          z-index: 10000;
        ">
          ${trainSymbol}
          <div style="
            position: absolute;
            top: -8px;
            right: -8px;
            background: #1f2937;
            color: white;
            border-radius: 50%;
            width: 20px;
            height: 20px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 10px;
            font-weight: bold;
            border: 2px solid white;
          ">P${priority}</div>
          <div style="
            position: absolute;
            bottom: -15px;
            left: 50%;
            transform: translateX(-50%);
            background: #1f2937;
            color: white;
            padding: 2px 6px;
            border-radius: 4px;
            font-size: 10px;
            font-weight: bold;
            border: 2px solid white;
          ">${speed}</div>
        </div>`,
        iconSize: [60, 60],
        iconAnchor: [30, 30]
      });
      
      const standardMarker = L.marker([train.lat, train.lng], { icon: standardIcon });
      standardMarker.bindTooltip(`${train.name} (${train.id}) - ${speed} km/h - P${priority}`);
      standardMarker.addTo(trainsLayer);
      
      trainMarkers[train.id] = customMarker;
      console.log(`Added train ${train.id} to map at position:`, train.lat, train.lng);
    });
    
    console.log('All 6 trains added to map. Total markers in trainsLayer:', trainsLayer.getLayers().length);
    
    // Force a redraw to ensure visibility
    setTimeout(() => {
      map.invalidateSize();
      console.log('Map invalidated and redrawn');
      
      // Ensure all trains are visible by fitting bounds
      const trainBounds = trains.map((train: any) => [train.lat, train.lng] as [number, number]);
      if (trainBounds.length > 0) {
        const bounds = L.latLngBounds(trainBounds);
        map.fitBounds(bounds, { padding: [20, 20] });
        console.log('Map bounds adjusted to show all trains');
      }
    }, 100);
    

    // Create railway network data
    const mockStations = [
      { name: 'Ahmedabad Junction', lat: 23.0225, lng: 72.5714, type: 'junction' },
      { name: 'Mehsana', lat: 23.5880, lng: 72.3693, type: 'halt' },
      { name: 'Vadodara Junction', lat: 22.3072, lng: 73.1812, type: 'junction' }
    ];
    
    // Add railway track lines connecting the stations with more detailed routes
    const railwayLines = [
      // Mehsana to Ahmedabad line (Main Line)
      { 
        coordinates: [
          [23.5880, 72.3693], // Mehsana Station
          [23.5000, 72.4000], // Intermediate point
          [23.4000, 72.4500], // Intermediate point
          [23.3000, 72.5000], // Intermediate point
          [23.2000, 72.5500], // Intermediate point
          [23.1000, 72.6000], // Intermediate point
          [23.0225, 72.5714]  // Ahmedabad Junction
        ], 
        type: 'main' 
      },
      // Ahmedabad to Vadodara line (Electrified)
      { 
        coordinates: [
          [23.0225, 72.5714], // Ahmedabad Junction
          [22.9000, 72.7000], // Intermediate point
          [22.8000, 72.8000], // Intermediate point
          [22.7000, 72.9000], // Intermediate point
          [22.6000, 73.0000], // Intermediate point
          [22.5000, 73.1000], // Intermediate point
          [22.4000, 73.1500], // Intermediate point
          [22.3072, 73.1812]  // Vadodara Junction
        ], 
        type: 'electrified' 
      }
    ];
    
    // Draw railway lines with enhanced symbols
    railwayLines.forEach((line, index) => {
      const latlngs = line.coordinates;
      const cong = line.type === 'electrified' ? 0.3 : line.type === 'main' ? 0.5 : 0.2;
      const color = cong < 0.4 ? '#10b981' : cong < 0.7 ? '#f59e0b' : '#ef4444';
      
      // Main track line
      const trackLine = L.polyline(latlngs, { 
        color, 
        weight: line.type === 'electrified' ? 6 : 5, 
        opacity: 0.9 
      }).addTo(tracksLayer);
      
      // Add track symbols along the line
      const trackSymbols = L.layerGroup();
      
      // Add kilometer markers every 25% along the track
      for (let i = 0.25; i < 1; i += 0.25) {
        const pointIndex = Math.floor(i * (latlngs.length - 1));
        const point = latlngs[pointIndex];
        
        const kmMarker = L.divIcon({
          className: 'km-marker',
          html: `
            <div style="
              background: #1f2937;
              color: white;
              border: 2px solid white;
              border-radius: 50%;
              width: 20px;
              height: 20px;
              display: flex;
              align-items: center;
              justify-content: center;
              font-size: 8px;
              font-weight: bold;
              box-shadow: 0 2px 4px rgba(0,0,0,0.3);
            ">${Math.round(i * 100)}</div>
          `,
          iconSize: [20, 20],
          iconAnchor: [10, 10]
        });
        
        L.marker(point, { icon: kmMarker }).addTo(trackSymbols);
      }
      
      // Add route direction arrows
      const midPoint = latlngs[Math.floor(latlngs.length / 2)];
      const directionArrow = L.divIcon({
        className: 'direction-arrow',
        html: `
          <div style="
            background: ${color};
            color: white;
            border: 2px solid white;
            border-radius: 4px;
            padding: 2px 6px;
            font-size: 10px;
            font-weight: bold;
            box-shadow: 0 2px 4px rgba(0,0,0,0.3);
            transform: rotate(${index === 0 ? '45deg' : '135deg'});
          ">→</div>
        `,
        iconSize: [20, 20],
        iconAnchor: [10, 10]
      });
      
      L.marker(midPoint, { icon: directionArrow }).addTo(trackSymbols);
      
      // Add track type label
      const labelPoint = latlngs[Math.floor(latlngs.length / 3)];
      const trackLabel = L.divIcon({
        className: 'track-label',
        html: `
          <div style="
            background: rgba(0,0,0,0.8);
            color: white;
            border: 1px solid white;
            border-radius: 4px;
            padding: 2px 6px;
            font-size: 8px;
            font-weight: bold;
            text-transform: uppercase;
            box-shadow: 0 2px 4px rgba(0,0,0,0.3);
          ">${line.type}</div>
        `,
        iconSize: [30, 15],
        iconAnchor: [15, 7]
      });
      
      L.marker(labelPoint, { icon: trackLabel }).addTo(trackSymbols);
      
      trackSymbols.addTo(tracksLayer);
    });
    
    // Add enhanced station markers with comprehensive information
    mockStations.forEach(s => {
      const hasLoop = s.type === 'junction'; // Junctions have loops
      const platforms = s.type === 'junction' ? 8 : s.type === 'terminal' ? 6 : 2;
      const stationCode = s.name.split(' ')[0].substring(0, 3).toUpperCase();
      
      const stationIcon = L.divIcon({
        className: 'station-marker',
        html: `
          <div style="position:relative;">
            <!-- Main station circle -->
            <div style="
              width: 40px; height: 40px; border-radius: 50%;
              background: ${s.type === 'junction' ? '#3b82f6' : s.type === 'terminal' ? '#ef4444' : '#6b7280'};
              border: 4px solid #fff;
              box-shadow: 0 0 15px rgba(0,0,0,0.6);
              display: flex;
              align-items: center;
              justify-content: center;
              font-size: 16px;
              font-weight: bold;
              color: white;
              text-shadow: 1px 1px 2px rgba(0,0,0,0.8);
            ">${stationCode}</div>
            
            <!-- Platform count indicator -->
            <div style="
              position: absolute;
              top: -8px;
              right: -8px;
              background: #1f2937;
              color: white;
              border-radius: 50%;
              width: 20px;
              height: 20px;
              display: flex;
              align-items: center;
              justify-content: center;
              font-size: 10px;
              font-weight: bold;
              border: 2px solid white;
              z-index: 10001;
            ">P${platforms}</div>
            
            <!-- Station type indicator -->
            <div style="
              position: absolute;
              bottom: -8px;
              left: -8px;
              background: ${s.type === 'junction' ? '#10b981' : s.type === 'terminal' ? '#ef4444' : '#6b7280'};
              color: white;
              border-radius: 50%;
              width: 20px;
              height: 20px;
              display: flex;
              align-items: center;
              justify-content: center;
              font-size: 10px;
              font-weight: bold;
              border: 2px solid white;
              z-index: 10001;
            ">${s.type === 'junction' ? 'J' : s.type === 'terminal' ? 'T' : 'H'}</div>
            
            <!-- Loop indicator -->
            ${hasLoop ? `
              <div style="
                position: absolute;
                top: -12px;
                left: -12px;
                width: 64px;
                height: 64px;
                border: 3px solid #10b981;
                border-radius: 50%;
                animation: spin 4s linear infinite;
                opacity: 0.8;
                z-index: 10000;
              ">
                <div style="
                  position: absolute;
                  top: 0;
                  left: 50%;
                  transform: translateX(-50%);
                  width: 6px;
                  height: 6px;
                  background: #10b981;
                  border-radius: 50%;
                "></div>
              </div>
            ` : ''}
            
            <!-- Station name label -->
            <div style="
              position: absolute;
              bottom: -35px;
              left: 50%;
              transform: translateX(-50%);
              background: #1f2937;
              color: white;
              padding: 4px 8px;
              border-radius: 6px;
              font-size: 10px;
              font-weight: bold;
              border: 2px solid white;
              white-space: nowrap;
              z-index: 10000;
              box-shadow: 0 2px 4px rgba(0,0,0,0.3);
            ">${s.name.split(' ')[0]}</div>
            
            <!-- Activity indicator -->
            <div style="
              position: absolute;
              top: 50%;
              right: -15px;
              transform: translateY(-50%);
              background: #10b981;
              color: white;
              border-radius: 50%;
              width: 12px;
              height: 12px;
              animation: blink 2s infinite;
              z-index: 10001;
            "></div>
          </div>
        `,
        iconSize: [40, 40],
        iconAnchor: [20, 20]
      });
      
      const marker = L.marker([s.lat, s.lng], { icon: stationIcon });
      marker.bindTooltip(`
        <div style="text-align:center;min-width:180px;font-size:14px;">
          <strong style="color:${s.type === 'junction' ? '#3b82f6' : s.type === 'terminal' ? '#ef4444' : '#6b7280'};font-size:16px;">${s.name}</strong><br/>
          <span style="color:#666;">Code: ${stationCode}</span><br/>
          <span style="color:#6b7280;">Type: ${s.type.toUpperCase()}</span><br/>
          <span style="color:#6b7280;">Platforms: ${platforms}</span><br/>
          <span style="color:#6b7280;">Loop: ${hasLoop ? 'YES' : 'NO'}</span><br/>
          <span style="color:#10b981;">Status: ACTIVE</span>
        </div>
      `);
      marker.addTo(stationsLayer);
    });
    
    // make sure tracks are on top of base
    (tracksLayer as any).bringToFront?.();
    
    // Make sure trains layer is on top of everything
    (trainsLayer as any).bringToFront?.();

    return () => {
      if (pollTimerRef.current) window.clearInterval(pollTimerRef.current);
      map.remove();
      leafletRef.current = null;
      trainsLayerRef.current = null;
    };
  }, []);

  // Handle movement when isRunning changes
  useEffect(() => {
    console.log('isRunning changed to:', isRunning);
    
    // Get the train markers from the map
    const trainsLayer = trainsLayerRef.current;
    if (!trainsLayer) return;
    
    // Find all train markers
    const trainMarkers: L.Marker[] = [];
    trainsLayer.eachLayer((layer) => {
      if (layer instanceof L.Marker) {
        trainMarkers.push(layer);
      }
    });
    
    console.log('Found train markers:', trainMarkers.length);
    
    if (isRunning) {
      // Start movement along tracks
      const moveInterval = setInterval(() => {
        trainMarkers.forEach((marker, index) => {
          // Simple movement pattern based on index
          let newLat, newLng;
          
          if (index < 3) {
            // First 3 trains on MSH-ADI route
            const timeProgress = (Date.now() / 15000) % 1; // 15 second cycle
            const totalProgress = (index * 0.2 + timeProgress) % 1;
            newLat = 23.5880 - (totalProgress * (23.5880 - 23.0225));
            newLng = 72.3693 + (totalProgress * (72.5714 - 72.3693));
          } else {
            // Last 3 trains on ADI-BRC route
            const timeProgress = (Date.now() / 15000) % 1; // 15 second cycle
            const totalProgress = ((index - 3) * 0.2 + timeProgress) % 1;
            newLat = 23.0225 - (totalProgress * (23.0225 - 22.3072));
            newLng = 72.5714 + (totalProgress * (73.1812 - 72.5714));
          }
          
          marker.setLatLng([newLat, newLng]);
        });
      }, 1000); // Move every 1 second for smoother animation
      
      console.log('Started train movement along tracks');
      
      return () => {
        clearInterval(moveInterval);
        console.log('Stopped train movement');
      };
    }
  }, [isRunning]);

  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center gap-2">
          Live Railway Map - 6 Trains 
          <span className="text-sm bg-green-100 text-green-800 px-2 py-1 rounded-full">
            🚄🚂🚛 Active
          </span>
          <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
            📍 Stations • 🛤️ Tracks • 📊 Symbols
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="relative w-full h-[600px] overflow-hidden rounded-lg">
          <div ref={mapRef} className="absolute inset-0" />
          <style>{`
            @keyframes pulse {
              0% { transform: scale(1); }
              50% { transform: scale(1.1); }
              100% { transform: scale(1); }
            }
            @keyframes blink {
              0%, 50% { opacity: 1; }
              51%, 100% { opacity: 0; }
            }
            .train-marker {
              z-index: 9999 !important;
            }
            .leaflet-marker-icon.train-marker {
              z-index: 9999 !important;
            }
            .leaflet-marker-pane .train-marker {
              z-index: 9999 !important;
            }
            .leaflet-marker-icon {
              z-index: 9999 !important;
            }
            .leaflet-marker-pane {
              z-index: 9999 !important;
            }
            .simple-train-marker {
              z-index: 10000 !important;
            }
            .leaflet-marker-icon.simple-train-marker {
              z-index: 10000 !important;
            }
            .km-marker {
              z-index: 5000 !important;
            }
            .direction-arrow {
              z-index: 5000 !important;
            }
            .track-label {
              z-index: 5000 !important;
            }
            .station-marker {
              z-index: 8000 !important;
            }
            @keyframes spin {
              from { transform: rotate(0deg); }
              to { transform: rotate(360deg); }
            }
          `}</style>
        </div>
      </CardContent>
    </Card>
  );
}


