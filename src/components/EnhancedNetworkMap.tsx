import { useState, useEffect, useRef, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Train, Station, getRandomSpeed } from "../data/mockData";
import { railwayMapService, RailwayStation, RailwayLine } from "../services/railwayMapService";
import { 
  MapPin, 
  Train as TrainIcon, 
  Zap, 
  Eye, 
  Layers, 
  Navigation,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Maximize2,
  Minimize2
} from "lucide-react";

// Define track segments with proper coordinates for a larger railway network
interface TrackSegment {
  id: string;
  start: { x: number; y: number };
  end: { x: number; y: number };
  type: 'main' | 'branch' | 'electrified';
  stations: string[];
  name: string;
}

// Simple linear route: Mehsana -> Ahmedabad -> Vadodara
const trackSegments: TrackSegment[] = [
  // Only two tracks connecting the three stations
  { id: 'MSH-ADI', start: { x: 350, y: 250 }, end: { x: 400, y: 300 }, type: 'main', stations: ['ST002', 'ST001'], name: 'Mehsana-Ahmedabad' },
  { id: 'ADI-BRC', start: { x: 400, y: 300 }, end: { x: 450, y: 350 }, type: 'electrified', stations: ['ST001', 'ST003'], name: 'Ahmedabad-Vadodara' },
];

interface EnhancedNetworkMapProps {
  trains: Train[];
  stations: Station[];
  isRunning: boolean;
  currentTime: Date;
  onTrainSelect: (train: Train) => void;
}

export const EnhancedNetworkMap = ({ trains, stations, isRunning, currentTime, onTrainSelect }: EnhancedNetworkMapProps) => {
  const [animatedTrains, setAnimatedTrains] = useState(trains);
  const [selectedTrain, setSelectedTrain] = useState<Train | null>(null);
  const [viewMode, setViewMode] = useState<'normal' | 'heatmap' | 'flow'>('normal');
  const [showPredictions, setShowPredictions] = useState(true);
  const [congestionData, setCongestionData] = useState<any[]>([]);
  const [trainProgress, setTrainProgress] = useState<Record<string, number>>({});
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const lastMoveRef = useRef<{ x: number; y: number; t: number } | null>(null);
  const velocityRef = useRef<{ vx: number; vy: number }>({ vx: 0, vy: 0 });
  const inertiaAnimRef = useRef<number | null>(null);
  const pinchStateRef = useRef<{
    isPinching: boolean;
    startDistance: number;
    lastDistance: number;
    lastCenter: { x: number; y: number } | null;
  }>({ isPinching: false, startDistance: 0, lastDistance: 0, lastCenter: null });
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [placeMode, setPlaceMode] = useState(false);
  const [manualTrains, setManualTrains] = useState<Train[]>([]);
  const [draggingTrainId, setDraggingTrainId] = useState<string | null>(null);
  const [realStations, setRealStations] = useState<RailwayStation[]>([]);
  const [realLines, setRealLines] = useState<RailwayLine[]>([]);
  const [trainRoutes, setTrainRoutes] = useState<Record<string, string[]>>({});
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const envUrl = (import.meta as any).env?.VITE_MAP_IMAGE_URL as string | undefined;
  const MAP_IMAGE_URL = envUrl || '/Gujarat%20Railway%20Map.jpg';
  const MAP_FALLBACKS = ['/Gujarat%20Railway%20Map.png', '/gujarat-map.png'];
  const resolvedMapUrl = MAP_IMAGE_URL || MAP_FALLBACKS[0];

  // Initialize real railway data (stations and lines in pixel coordinates)
  useEffect(() => {
    const mapSize = { width: 800, height: 800 };
    const stations = railwayMapService.getStationsWithPixelCoordinates(mapSize);
    setRealStations(stations);
    const lines = railwayMapService.getLinesWithPixelCoordinates(mapSize);
    setRealLines(lines);
  }, []);

  // Initialize train progress and routes
  useEffect(() => {
    const initialProgress: Record<string, number> = {};
    const initialRoutes: Record<string, string[]> = {};
    
    // Create circular routes for trains
    const stationIds = stations.map(s => s.id);
    const circularRoute = [...stationIds, stationIds[0]]; // Complete the loop
    
    trains.forEach((train, index) => {
      initialProgress[train.id] = Math.random() * 0.8;
      // Create a circular route starting from current station
      const startIndex = stationIds.indexOf(train.currentStation);
      const route = [...stationIds.slice(startIndex), ...stationIds.slice(0, startIndex), stationIds[startIndex]];
      initialRoutes[train.id] = route;
    });
    
    setTrainProgress(initialProgress);
    setTrainRoutes(initialRoutes);
  }, [trains, stations]);

  // Get polyline points between two stations from real lines or fallback to simplified segment
  const getLinePointsBetweenStations = (stationAId: string, stationBId: string): Array<{ x: number; y: number }> | null => {
    const realLine = realLines.find(line => line.stations.includes(stationAId) && line.stations.includes(stationBId));
    if (realLine && realLine.coordinates.length >= 2) {
      return realLine.coordinates.map(p => ({ x: (p as any).x, y: (p as any).y }));
    }
    const fallback = trackSegments.find(seg => seg.stations.includes(stationAId) && seg.stations.includes(stationBId));
    if (fallback) {
      return [fallback.start, fallback.end];
    }
    return null;
  };

  // Calculate position and tangent along a polyline path
  const getPointAlongPath = (
    points: Array<{ x: number; y: number }>,
    progress: number
  ): { position: { x: number; y: number }; tangent: { x: number; y: number } } => {
    if (!points || points.length === 0) return { position: { x: 0, y: 0 }, tangent: { x: 1, y: 0 } };
    if (points.length === 1) return { position: points[0], tangent: { x: 1, y: 0 } };

    const segmentLengths: number[] = [];
    let total = 0;
    for (let i = 0; i < points.length - 1; i++) {
      const dx = points[i + 1].x - points[i].x;
      const dy = points[i + 1].y - points[i].y;
      const len = Math.hypot(dx, dy);
      segmentLengths.push(len);
      total += len;
    }
    if (total === 0) return { position: points[0], tangent: { x: 1, y: 0 } };

    const target = Math.max(0, Math.min(1, progress)) * total;
    let acc = 0;
    for (let i = 0; i < segmentLengths.length; i++) {
      const nextAcc = acc + segmentLengths[i];
      if (target <= nextAcc) {
        const localT = segmentLengths[i] === 0 ? 0 : (target - acc) / segmentLengths[i];
        const p0 = points[i];
        const p1 = points[i + 1];
        const x = p0.x + (p1.x - p0.x) * localT;
        const y = p0.y + (p1.y - p0.y) * localT;
        const tx = p1.x - p0.x;
        const ty = p1.y - p0.y;
        return { position: { x, y }, tangent: { x: tx, y: ty } };
      }
      acc = nextAcc;
    }
    const last = points[points.length - 1];
    const prev = points[points.length - 2];
    return { position: last, tangent: { x: last.x - prev.x, y: last.y - prev.y } };
  };

  // Find the track segment for a train based on its route (prefer real line data)
  const findTrackSegment = (train: Train, stations: Station[]): TrackSegment | null => {
    const currentStation = stations.find(s => s.id === train.currentStation);
    const nextStation = stations.find(s => s.id === train.nextStation);
    
    if (!currentStation || !nextStation) return null;
    // Try to find a matching real line first
    const realLine = realLines.find(line => 
      line.stations.includes(currentStation.id) && line.stations.includes(nextStation.id)
    );
    if (realLine && realLine.coordinates.length >= 2) {
      const start = realLine.coordinates[0];
      const end = realLine.coordinates[realLine.coordinates.length - 1];
      return {
        id: realLine.id,
        start: { x: start.x, y: start.y } as any,
        end: { x: end.x, y: end.y } as any,
        type: realLine.type as any,
        stations: realLine.stations,
        name: realLine.name
      };
    }
    // Fallback to simplified predefined track segments
    return trackSegments.find(segment => 
      segment.stations.includes(currentStation.id) && segment.stations.includes(nextStation.id)
    ) || null;
  };

  // Zoom controls
  const handleZoomIn = () => {
    const container = mapContainerRef.current;
    if (!container) {
      setZoom(prev => Math.min(prev * 1.2, 3));
      return;
    }
    const rect = container.getBoundingClientRect();
    const centerPoint = { x: rect.width / 2, y: rect.height / 2 };
    zoomAt(centerPoint, 1.2);
  };

  const handleZoomOut = () => {
    const container = mapContainerRef.current;
    if (!container) {
      setZoom(prev => Math.max(prev / 1.2, 0.3));
      return;
    }
    const rect = container.getBoundingClientRect();
    const centerPoint = { x: rect.width / 2, y: rect.height / 2 };
    zoomAt(centerPoint, 1/1.2);
  };

  const handleResetZoom = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  const handleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  // Pan controls
  const handleMouseDown = (e: React.MouseEvent) => {
    // if clicking on empty map area in place mode, create a new train at cursor
    const target = e.target as HTMLElement;
    const clickedTrain = target.closest('[data-train-id]');
    if (placeMode && !clickedTrain) {
      const coords = getMapCoordinates(e.clientX, e.clientY);
      const newTrain: Train = {
        id: `M${Date.now()}`,
        number: `M${String(Math.floor(Math.random() * 900) + 100)}`,
        name: 'Manual Train',
        type: 'express',
        priority: 2,
        status: 'on-time',
        currentStation: 'ST001',
        nextStation: 'ST002',
        speed: 0,
        maxSpeed: 120,
        delay: 0,
        route: [],
        departureTime: '00:00',
        arrivalTime: '00:00',
        position: { x: coords.x, y: coords.y },
      };
      setManualTrains(prev => [...prev, newTrain]);
      setDraggingTrainId(newTrain.id);
      return;
    }

    // start panning the map
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    lastMoveRef.current = { x: e.clientX, y: e.clientY, t: performance.now() };
    velocityRef.current = { vx: 0, vy: 0 };
    if (inertiaAnimRef.current) {
      cancelAnimationFrame(inertiaAnimRef.current);
      inertiaAnimRef.current = null;
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    // drag a train if grabbed
    if (draggingTrainId) {
      const coords = getMapCoordinates(e.clientX, e.clientY);
      // If manual train, free move
      const isManual = draggingTrainId.startsWith('M');
      if (isManual) {
        setManualTrains(prev => prev.map(t => t.id === draggingTrainId ? { ...t, position: coords } : t));
      } else {
        // Snap non-manual trains to their current path between stations
        const draggedTrain = animatedTrains.find(t => t.id === draggingTrainId);
        if (draggedTrain) {
          const pathPoints = getLinePointsBetweenStations(draggedTrain.currentStation, draggedTrain.nextStation);
          if (pathPoints && pathPoints.length >= 2) {
            const projected = projectPointOntoPolyline(coords, pathPoints);
            setAnimatedTrains(prev => prev.map(t => t.id === draggingTrainId ? { ...t, position: projected } : t));
          } else {
            setAnimatedTrains(prev => prev.map(t => t.id === draggingTrainId ? { ...t, position: coords } : t));
          }
        }
      }
      return;
    }

    if (isDragging) {
      setPan({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      });
      const now = performance.now();
      const last = lastMoveRef.current;
      if (last) {
        const dt = Math.max(16, now - last.t);
        const vx = (e.clientX - last.x) / dt;
        const vy = (e.clientY - last.y) / dt;
        velocityRef.current = { vx, vy };
      }
      lastMoveRef.current = { x: e.clientX, y: e.clientY, t: now };
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setDraggingTrainId(null);
    // start inertia if there is velocity
    const { vx, vy } = velocityRef.current;
    if (Math.hypot(vx, vy) > 0.01) {
      const decay = 0.95;
      const step = () => {
        setPan(prev => ({ x: prev.x + vx * 16, y: prev.y + vy * 16 }));
        velocityRef.current = { vx: vx * decay, vy: vy * decay };
        if (Math.hypot(velocityRef.current.vx, velocityRef.current.vy) > 0.01) {
          inertiaAnimRef.current = requestAnimationFrame(step);
        } else {
          inertiaAnimRef.current = null;
        }
      };
      inertiaAnimRef.current = requestAnimationFrame(step);
    }
  };

  const getContainerPoint = (clientX: number, clientY: number) => {
    const container = mapContainerRef.current;
    if (!container) return { x: 0, y: 0 };
    const rect = container.getBoundingClientRect();
    return { x: clientX - rect.left, y: clientY - rect.top };
  };

  const zoomAt = (pointInContainer: { x: number; y: number }, scaleFactor: number) => {
    setZoom(prevZoom => {
      const newZoom = Math.max(0.3, Math.min(3, prevZoom * scaleFactor));
      setPan(prevPan => {
        // Keep the world point under the cursor stable: w = (S - p) / z
        const worldX = (pointInContainer.x - prevPan.x) / prevZoom;
        const worldY = (pointInContainer.y - prevPan.y) / prevZoom;
        const newPanX = pointInContainer.x - worldX * newZoom;
        const newPanY = pointInContainer.y - worldY * newZoom;
        return { x: newPanX, y: newPanY };
      });
      return newZoom;
    });
  };

  // Wheel zoom (Google Maps-like: zoom towards cursor)
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const point = getContainerPoint(e.clientX, e.clientY);
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    zoomAt(point, delta);
  };

  const handleDoubleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    const point = getContainerPoint(e.clientX, e.clientY);
    zoomAt(point, 1.25);
  };

  // Touch support: pan with one finger, pinch-zoom with two fingers
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      const t = e.touches[0];
      setIsDragging(true);
      setDragStart({ x: t.clientX - pan.x, y: t.clientY - pan.y });
      lastMoveRef.current = { x: t.clientX, y: t.clientY, t: performance.now() };
      velocityRef.current = { vx: 0, vy: 0 };
      if (inertiaAnimRef.current) {
        cancelAnimationFrame(inertiaAnimRef.current);
        inertiaAnimRef.current = null;
      }
    } else if (e.touches.length === 2) {
      pinchStateRef.current.isPinching = true;
      const [a, b] = [e.touches[0], e.touches[1]];
      const dx = b.clientX - a.clientX;
      const dy = b.clientY - a.clientY;
      pinchStateRef.current.startDistance = Math.hypot(dx, dy);
      pinchStateRef.current.lastDistance = pinchStateRef.current.startDistance;
      pinchStateRef.current.lastCenter = getContainerPoint((a.clientX + b.clientX) / 2, (a.clientY + b.clientY) / 2);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (pinchStateRef.current.isPinching && e.touches.length === 2) {
      e.preventDefault();
      const [a, b] = [e.touches[0], e.touches[1]];
      const dx = b.clientX - a.clientX;
      const dy = b.clientY - a.clientY;
      const dist = Math.hypot(dx, dy);
      const center = getContainerPoint((a.clientX + b.clientX) / 2, (a.clientY + b.clientY) / 2);
      const factor = dist / Math.max(1, pinchStateRef.current.lastDistance);
      zoomAt(center, factor);
      pinchStateRef.current.lastDistance = dist;
      pinchStateRef.current.lastCenter = center;
      return;
    }

    if (e.touches.length === 1 && isDragging) {
      const t = e.touches[0];
      // If dragging a train via touch
      if (draggingTrainId) {
        const coords = getMapCoordinates(t.clientX, t.clientY);
        const isManual = draggingTrainId.startsWith('M');
        if (isManual) {
          setManualTrains(prev => prev.map(tr => tr.id === draggingTrainId ? { ...tr, position: coords } : tr));
        } else {
          const draggedTrain = animatedTrains.find(tr => tr.id === draggingTrainId);
          if (draggedTrain) {
            const pathPoints = getLinePointsBetweenStations(draggedTrain.currentStation, draggedTrain.nextStation);
            if (pathPoints && pathPoints.length >= 2) {
              const projected = projectPointOntoPolyline(coords, pathPoints);
              setAnimatedTrains(prev => prev.map(tr => tr.id === draggingTrainId ? { ...tr, position: projected } : tr));
            } else {
              setAnimatedTrains(prev => prev.map(tr => tr.id === draggingTrainId ? { ...tr, position: coords } : tr));
            }
          }
        }
      } else {
        setPan({ x: t.clientX - dragStart.x, y: t.clientY - dragStart.y });
      }
      const now = performance.now();
      const last = lastMoveRef.current;
      if (last) {
        const dt = Math.max(16, now - last.t);
        const vx = (t.clientX - last.x) / dt;
        const vy = (t.clientY - last.y) / dt;
        velocityRef.current = { vx, vy };
      }
      lastMoveRef.current = { x: t.clientX, y: t.clientY, t: now };
    }
  };

  const handleTouchEnd = () => {
    if (pinchStateRef.current.isPinching) {
      pinchStateRef.current.isPinching = false;
      return;
    }
    if (isDragging) {
      setIsDragging(false);
      const { vx, vy } = velocityRef.current;
      if (Math.hypot(vx, vy) > 0.01) {
        const decay = 0.95;
        const step = () => {
          setPan(prev => ({ x: prev.x + vx * 16, y: prev.y + vy * 16 }));
          velocityRef.current = { vx: vx * decay, vy: vy * decay };
          if (Math.hypot(velocityRef.current.vx, velocityRef.current.vy) > 0.01) {
            inertiaAnimRef.current = requestAnimationFrame(step);
          } else {
            inertiaAnimRef.current = null;
          }
        };
        inertiaAnimRef.current = requestAnimationFrame(step);
      }
    }
  };

  // Convert screen coords to map coords taking zoom/pan into account
  const getMapCoordinates = (clientX: number, clientY: number) => {
    const container = mapContainerRef.current;
    if (!container) return { x: 0, y: 0 };
    const rect = container.getBoundingClientRect();
    const screenX = clientX - rect.left;
    const screenY = clientY - rect.top;
    // displayed = orig * zoom + pan
    const x = (screenX - pan.x) / zoom;
    const y = (screenY - pan.y) / zoom;
    return { x, y };
  };

  // Project a point onto a polyline, return nearest point on the path
  const projectPointOntoPolyline = (
    point: { x: number; y: number },
    polyline: Array<{ x: number; y: number }>
  ): { x: number; y: number } => {
    if (polyline.length === 0) return point;
    if (polyline.length === 1) return polyline[0];
    let bestDist = Infinity;
    let bestPoint = polyline[0];
    for (let i = 0; i < polyline.length - 1; i++) {
      const p0 = polyline[i];
      const p1 = polyline[i + 1];
      const vx = p1.x - p0.x;
      const vy = p1.y - p0.y;
      const wx = point.x - p0.x;
      const wy = point.y - p0.y;
      const c1 = vx * wx + vy * wy;
      const c2 = vx * vx + vy * vy;
      const t = c2 === 0 ? 0 : Math.max(0, Math.min(1, c1 / c2));
      const proj = { x: p0.x + t * vx, y: p0.y + t * vy };
      const d = Math.hypot(point.x - proj.x, point.y - proj.y);
      if (d < bestDist) {
        bestDist = d;
        bestPoint = proj;
      }
    }
    return bestPoint;
  };

  // Update train animations with random speeds
  useEffect(() => {
    if (isRunning) {
      const interval = setInterval(() => {
        setAnimatedTrains(prevTrains => 
          prevTrains.map((train, index) => {
            // Do not auto-move manually placed trains (id starts with 'M')
            if (train.id.startsWith('M')) return train;
            
            // Generate new random speed for this train (with some variation)
            const baseSpeed = getRandomSpeed(train.type);
            const speedVariation = (Math.random() - 0.5) * 20; // ±10 km/h variation
            const newSpeed = Math.max(30, Math.min(train.maxSpeed, baseSpeed + speedVariation));
            
            const trainRoute = trainRoutes[train.id] || train.route;
            const currentStationIndex = trainRoute.indexOf(train.currentStation);
            const nextStationIndex = (currentStationIndex + 1) % trainRoute.length;
            const nextStationId = trainRoute[nextStationIndex];
            
            const pathPoints = getLinePointsBetweenStations(train.currentStation, nextStationId);
            if (pathPoints && pathPoints.length >= 2) {
              const speedFactor = newSpeed / 100;
              const delayFactor = train.delay > 0 ? 0.7 : 1.0;
              const progressIncrement = (speedFactor * delayFactor * 0.015); // Slightly slower for more realistic movement
              
              setTrainProgress(prev => {
                const currentProgress = prev[train.id] || 0;
                let newProgress = currentProgress + progressIncrement;
                
                // When reaching the end, move to next station in route
                if (newProgress >= 1) {
                  newProgress = 0;
                  // Update train's current and next station
                  setAnimatedTrains(prevTrains => 
                    prevTrains.map(t => 
                      t.id === train.id 
                        ? { 
                            ...t, 
                            currentStation: nextStationId,
                            nextStation: trainRoute[(nextStationIndex + 1) % trainRoute.length]
                          }
                        : t
                    )
                  );
                }
                
                return { ...prev, [train.id]: newProgress };
              });
              
              const baseProgress = trainProgress[train.id] || 0;
              const spacingOffset = (index % 3) * 0.1;
              const finalProgress = Math.min(0.95, baseProgress + spacingOffset);
              const { position: newPosition } = getPointAlongPath(pathPoints, finalProgress);

              return {
                ...train,
                speed: Math.round(newSpeed),
                position: newPosition
              };
            } else {
              const currentStation = stations.find(s => s.id === train.currentStation);
              return {
                ...train,
                speed: Math.round(newSpeed),
                position: currentStation?.position || train.position
              };
            }
          })
        );

        setCongestionData([
          { section: 'ADI-BRC', level: Math.random() * 100, trains: Math.floor(Math.random() * 8) + 2 },
          { section: 'BRC-ST', level: Math.random() * 100, trains: Math.floor(Math.random() * 6) + 1 },
          { section: 'ST-VAPI', level: Math.random() * 100, trains: Math.floor(Math.random() * 5) + 1 },
          { section: 'ADI-RJT', level: Math.random() * 100, trains: Math.floor(Math.random() * 7) + 2 },
        ]);
      }, 1500);

      return () => clearInterval(interval);
    }
  }, [isRunning, stations, trainProgress]);

  const getTrainStatusColor = (status: string) => {
    switch (status) {
      case 'on-time': return 'bg-green-600';
      case 'delayed': return 'bg-red-600';
      case 'early': return 'bg-blue-600';
      default: return 'bg-gray-600';
    }
  };

  const getCongestionColor = (level: number) => {
    if (level > 80) return 'text-red-500';
    if (level > 60) return 'text-yellow-500';
    return 'text-green-500';
  };

  const handleTrainClick = (train: Train) => {
    setSelectedTrain(train);
    onTrainSelect(train);
  };

  return (
    <Card className={`${isFullscreen ? 'fixed inset-0 z-50' : 'h-full'}`}>
      <CardHeader className="pb-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <MapPin className="w-5 h-5 text-primary" />
            <CardTitle className="text-xl">Enhanced Railway Network Map</CardTitle>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <Tabs value={viewMode} onValueChange={(value: any) => setViewMode(value)}>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="normal" className="text-xs">Normal</TabsTrigger>
                <TabsTrigger value="heatmap" className="text-xs">Heatmap</TabsTrigger>
                <TabsTrigger value="flow" className="text-xs">Flow</TabsTrigger>
              </TabsList>
            </Tabs>
            <Button
              variant={showPredictions ? "default" : "outline"}
              size="sm"
              onClick={() => setShowPredictions(!showPredictions)}
              className="gap-2"
            >
              <Eye className="w-4 h-4" />
              Predictions
            </Button>
          </div>
        </div>
        
        <div className="flex flex-wrap gap-6 text-sm mt-4">
          <div className="flex items-center gap-3">
            <div className="w-5 h-5 rounded-full bg-green-500 border-2 border-white shadow-lg"></div>
            <span className="font-semibold text-slate-200">On Time</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-5 h-5 rounded-full bg-red-500 border-2 border-white shadow-lg"></div>
            <span className="font-semibold text-slate-200">Delayed</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-5 h-5 rounded-full bg-blue-500 border-2 border-white shadow-lg"></div>
            <span className="font-semibold text-slate-200">Early</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-5 h-5 rounded-lg bg-slate-700 border-2 border-white flex items-center justify-center text-xs font-bold text-white shadow-lg">P</div>
            <span className="font-semibold text-slate-200">Priority</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-5 h-5 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 border-2 border-white shadow-lg"></div>
            <span className="font-semibold text-slate-200">AI Enhanced</span>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="p-0 flex-1">
        <div 
          ref={mapContainerRef}
          className={`relative w-full ${isFullscreen ? 'h-screen' : 'h-[70vh] min-h-[500px] max-h-[700px]'} border-t overflow-hidden cursor-grab ${isDragging ? 'cursor-grabbing' : ''}`}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onWheel={handleWheel}
          onDoubleClick={handleDoubleClick}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          {/* Zoom Controls */}
          <div className="absolute top-4 right-4 z-20 flex flex-col gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={handleZoomIn}
              className="bg-white/90 hover:bg-white"
            >
              <ZoomIn className="w-4 h-4" />
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={handleZoomOut}
              className="bg-white/90 hover:bg-white"
            >
              <ZoomOut className="w-4 h-4" />
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={handleResetZoom}
              className="bg-white/90 hover:bg-white"
            >
              <RotateCcw className="w-4 h-4" />
            </Button>
            <Button
              size="sm"
              variant={placeMode ? 'default' : 'outline'}
              onClick={() => setPlaceMode(p => !p)}
              className="bg-white/90 hover:bg-white"
            >
              {placeMode ? 'Place: ON' : 'Place: OFF'}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={handleFullscreen}
              className="bg-white/90 hover:bg-white"
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </Button>
          </div>

          {/* Zoom Level Indicator */}
          <div className="absolute top-4 left-4 z-20 bg-black/50 text-white px-3 py-1 rounded-lg text-sm font-mono">
            {Math.round(zoom * 100)}%
          </div>

          {/* Map Container with Transform */}
          <div
            className="absolute inset-0 origin-top-left"
            style={{
              transform: `scale(${zoom}) translate(${pan.x / zoom}px, ${pan.y / zoom}px)`,
              transformOrigin: '0 0'
            }}
          >
            {/* Background map image that pans/zooms with content and fills container */}
            <img
              src={resolvedMapUrl}
              onError={(e) => {
                const img = e.currentTarget as HTMLImageElement;
                if (img.src.endsWith(encodeURI(MAP_FALLBACKS[0]))) {
                  img.src = MAP_FALLBACKS[1];
                } else {
                  img.src = MAP_FALLBACKS[0];
                }
              }}
              className="absolute inset-0 w-full h-full object-cover select-none pointer-events-none"
              alt="Gujarat Railway Map"
            />
            {/* Canvas overlay for advanced visualizations */}
            {viewMode !== 'normal' && (
              <canvas
                ref={canvasRef}
                className="absolute inset-0 w-full h-full pointer-events-none"
                width={1400}
                height={700}
              />
            )}

            {/* Professional Railway Control Map */}
            <svg className="absolute inset-0 w-full h-full" viewBox="0 0 800 800" style={{ width: '100%', height: '100%' }}>
              <defs>
                {/* Professional track patterns */}
                <pattern id="railwayTrack" patternUnits="userSpaceOnUse" width="24" height="8">
                  <rect width="24" height="8" fill="#2D3748" stroke="#1A202C" strokeWidth="0.5" />
                  <rect x="2" y="2" width="20" height="1.5" fill="#4A5568" stroke="#2D3748" strokeWidth="0.3" />
                  <rect x="2" y="4.5" width="20" height="1.5" fill="#4A5568" stroke="#2D3748" strokeWidth="0.3" />
                  <rect x="0" y="3" width="2" height="2" fill="#1A202C" />
                  <rect x="6" y="3" width="2" height="2" fill="#1A202C" />
                  <rect x="12" y="3" width="2" height="2" fill="#1A202C" />
                  <rect x="18" y="3" width="2" height="2" fill="#1A202C" />
                  <rect x="22" y="3" width="2" height="2" fill="#1A202C" />
                </pattern>
                
                <pattern id="electrifiedTrack" patternUnits="userSpaceOnUse" width="24" height="8">
                  <rect width="24" height="8" fill="#1F2937" stroke="#111827" strokeWidth="0.5" />
                  <rect x="2" y="2" width="20" height="1.5" fill="#6B7280" stroke="#374151" strokeWidth="0.3" />
                  <rect x="2" y="4.5" width="20" height="1.5" fill="#6B7280" stroke="#374151" strokeWidth="0.3" />
                  <rect x="0" y="3" width="2" height="2" fill="#111827" />
                  <rect x="6" y="3" width="2" height="2" fill="#111827" />
                  <rect x="12" y="3" width="2" height="2" fill="#111827" />
                  <rect x="18" y="3" width="2" height="2" fill="#111827" />
                  <rect x="22" y="3" width="2" height="2" fill="#111827" />
                  <line x1="0" y1="1" x2="24" y2="1" stroke="#F59E0B" strokeWidth="1.5" opacity="0.9" />
                  <line x1="0" y1="7" x2="24" y2="7" stroke="#F59E0B" strokeWidth="1.5" opacity="0.9" />
                  <line x1="6" y1="1" x2="6" y2="7" stroke="#F59E0B" strokeWidth="0.8" opacity="0.7" />
                  <line x1="12" y1="1" x2="12" y2="7" stroke="#F59E0B" strokeWidth="0.8" opacity="0.7" />
                  <line x1="18" y1="1" x2="18" y2="7" stroke="#F59E0B" strokeWidth="0.8" opacity="0.7" />
                </pattern>
                
                <pattern id="mainTrack" patternUnits="userSpaceOnUse" width="24" height="8">
                  <rect width="24" height="8" fill="#1E3A8A" stroke="#1E40AF" strokeWidth="0.5" />
                  <rect x="2" y="2" width="20" height="1.5" fill="#3B82F6" stroke="#2563EB" strokeWidth="0.3" />
                  <rect x="2" y="4.5" width="20" height="1.5" fill="#3B82F6" stroke="#2563EB" strokeWidth="0.3" />
                  <rect x="0" y="3" width="2" height="2" fill="#1E40AF" />
                  <rect x="6" y="3" width="2" height="2" fill="#1E40AF" />
                  <rect x="12" y="3" width="2" height="2" fill="#1E40AF" />
                  <rect x="18" y="3" width="2" height="2" fill="#1E40AF" />
                  <rect x="22" y="3" width="2" height="2" fill="#1E40AF" />
                </pattern>
              </defs>
              
              {/* Real track lines */}
              {realLines.map((line) => {
                if (!line.coordinates || line.coordinates.length < 2) return null;
                const pathData = line.coordinates.map((p, idx) => `${idx === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
                const strokeWidth = 2;
                const patternId = line.type === 'electrified' ? 'electrifiedTrack' : 
                                  line.type === 'main' ? 'mainTrack' : 'railwayTrack';
                return (
                  <g key={`real-${line.id}`}>
                    <path d={pathData} stroke="rgba(0,0,0,0.35)" strokeWidth={strokeWidth + 1} fill="none" />
                    <path d={pathData} stroke={`url(#${patternId})`} strokeWidth={strokeWidth} strokeLinecap="round" fill="none" />
                    {line.type === 'electrified' && (
                      <path d={pathData} stroke="rgba(245, 158, 11, 0.25)" strokeWidth={1.5} strokeDasharray="8,4" strokeLinecap="round" fill="none" />
                    )}
                  </g>
                );
              })}

              {/* Fallback track segments for predefined routes */}
              {trackSegments.map((segment) => {
                const strokeWidth = 2;
                const patternId = segment.type === 'electrified' ? 'electrifiedTrack' : 
                                 segment.type === 'main' ? 'mainTrack' : 'railwayTrack';
                
                return (
                  <g key={`fallback-${segment.id}`}>
                    {/* Track foundation shadow */}
                    <line 
                      x1={segment.start.x} 
                      y1={segment.start.y + 0.5} 
                      x2={segment.end.x} 
                      y2={segment.end.y + 0.5} 
                      stroke="rgba(0,0,0,0.35)" 
                      strokeWidth={strokeWidth + 1}
                    />
                    
                    {/* Track bed */}
                    <line 
                      x1={segment.start.x} 
                      y1={segment.start.y} 
                      x2={segment.end.x} 
                      y2={segment.end.y} 
                      stroke={`url(#${patternId})`} 
                      strokeWidth={strokeWidth}
                      strokeLinecap="round"
                    />
                    
                    {/* Track center line for electrified tracks */}
                    {segment.type === 'electrified' && (
                      <line 
                        x1={segment.start.x} 
                        y1={segment.start.y} 
                        x2={segment.end.x} 
                        y2={segment.end.y} 
                        stroke="rgba(245, 158, 11, 0.25)" 
                        strokeWidth="1.5"
                        strokeDasharray="8,4"
                        strokeLinecap="round"
                      />
                    )}
                    
                    {/* Track labels hidden for clean background */}
                  </g>
                );
              })}
              {/* Stations hidden for clean background */}
            </svg>

            {/* Station overlays with loop indicators */}
            {stations.map(station => (
              <div
                key={station.id}
                className="absolute transform -translate-x-1/2 -translate-y-1/2 group"
                style={{ left: station.position.x, top: station.position.y }}
              >
                <div className="flex flex-col items-center">
                  {/* Station symbol with loop indicator */}
                  <div className="relative">
                    {/* Main station circle */}
                    <div className={`w-6 h-6 rounded-full border-2 border-white shadow-lg ${
                      station.type === 'junction' ? 'bg-blue-500' : 
                      station.type === 'terminal' ? 'bg-red-500' : 'bg-gray-500'
                    }`} />
                    
                    {/* Loop indicator - circular arrow around station */}
                    {station.hasLoop && (
                      <div className="absolute -inset-3 w-12 h-12 border-2 border-green-400 rounded-full opacity-80 animate-spin-slow">
                        <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-green-400 rounded-full"></div>
                      </div>
                    )}
                    
                    {/* Station type indicator */}
                    <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-white rounded-full border border-gray-400 flex items-center justify-center">
                      <div className={`w-1.5 h-1.5 rounded-full ${
                        station.type === 'junction' ? 'bg-blue-500' : 
                        station.type === 'terminal' ? 'bg-red-500' : 'bg-gray-500'
                      }`}></div>
                    </div>
                  </div>
                  
                  {/* Station label */}
                  <div className="mt-2 text-xs font-mono bg-slate-800/95 backdrop-blur-sm px-2 py-1 rounded border border-slate-600 text-center min-w-16 group-hover:bg-slate-700/95 transition-all duration-200 shadow-lg">
                    <div className="font-bold text-white text-sm">{station.code}</div>
                    <div className="text-slate-300 text-[10px] font-medium">P{station.platforms}</div>
                    {station.hasLoop && (
                      <div className="text-green-400 text-[8px] font-bold">LOOP</div>
                    )}
                  </div>
                  
                  {/* Station details on hover */}
                  <div className="absolute top-full mt-3 hidden group-hover:block bg-slate-900/98 backdrop-blur-sm border border-slate-600 rounded-xl p-3 text-xs shadow-2xl z-20 min-w-40">
                    <div className="font-bold text-white text-sm mb-1">{station.name}</div>
                    <div className="text-slate-300 text-xs font-mono mb-2">{station.code}</div>
                    
                    <div className="space-y-1">
                      <div className="flex justify-between items-center">
                        <span className="text-slate-400">Type:</span>
                        <span className="text-white font-medium capitalize">{station.type}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-slate-400">Platforms:</span>
                        <span className="text-blue-400 font-bold">{station.platforms}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-slate-400">Loop:</span>
                        <span className={`font-bold ${station.hasLoop ? 'text-green-400' : 'text-red-400'}`}>
                          {station.hasLoop ? 'YES' : 'NO'}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-slate-400">Status:</span>
                        <span className="text-green-400 font-medium">Active</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {/* Trains with speed indicators */}
            {[...manualTrains, ...animatedTrains.filter(t => !t.id.startsWith('M'))].map((train, index) => {
              const trackSegment = findTrackSegment(train, stations);
              let offsetX = 0;
              let offsetY = 0;
              
              if (trackSegment) {
                const dx = trackSegment.end.x - trackSegment.start.x;
                const dy = trackSegment.end.y - trackSegment.start.y;
                const length = Math.sqrt(dx * dx + dy * dy);
                
                if (length > 0) {
                  const perpX = -dy / length;
                  const perpY = dx / length;
                  const trackOffset = (index % 3 - 1) * 25;
                  offsetX = perpX * trackOffset;
                  offsetY = perpY * trackOffset;
                }
              } else {
                offsetX = (index % 3) * 20 - 20;
                offsetY = Math.floor(index / 3) * 25 - 25;
              }
              
              return (
                <div
                  key={train.id}
                  className="absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer transition-all duration-300 hover:scale-110 group z-10"
                  style={{ 
                    left: train.position.x + offsetX, 
                    top: train.position.y + offsetY,
                    transition: isRunning && !train.id.startsWith('M') ? 'all 1.2s ease-in-out' : 'transform 0.3s'
                  }}
                  onClick={() => handleTrainClick(train)}
                  onMouseDown={(e) => {
                    // start dragging this train if manual and place mode
                    if (placeMode && train.id.startsWith('M')) {
                      e.stopPropagation();
                      setDraggingTrainId(train.id);
                    }
                  }}
                >
                  <div className="flex flex-col items-center">
                    {/* Train symbol with speed indicator */}
                    <div className={`w-8 h-8 rounded-full ${getTrainStatusColor(train.status)} border-2 border-white shadow-lg flex items-center justify-center relative animate-pulse-glow`}>
                      <TrainIcon className="w-5 h-5 text-white" />
                      
                      {/* Speed indicator */}
                      <div className="absolute -top-2 -right-2 bg-slate-900 text-white text-[8px] px-1 py-0.5 rounded border border-white/50 font-mono">
                        {train.speed}
                      </div>
                    </div>
                    
                    {/* Train info */}
                    <div className="mt-1 bg-slate-800/95 backdrop-blur-sm border border-slate-600 rounded px-2 py-1 text-xs font-mono text-center shadow-lg group-hover:bg-slate-700/95 transition-all duration-200 min-w-20">
                      <div className="font-bold text-white text-sm">{train.number}</div>
                      <div className="text-slate-300 text-[10px]">{train.speed}km/h</div>
                      <div className="text-slate-400 text-[8px]">{train.type}</div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Professional Railway Control Legend */}
          <div className="absolute bottom-4 left-4 bg-slate-900/98 backdrop-blur-sm border border-slate-600 rounded-2xl p-4 text-xs shadow-2xl max-w-64">
            <h4 className="font-bold mb-3 text-base text-white">Railway Control System</h4>
            
            <div className="space-y-3">
              {/* Station Types */}
              <div className="space-y-2">
                <div className="text-slate-300 font-semibold text-xs mb-1">Station Types</div>
                <div className="flex items-center gap-3">
                  <div className="w-4 h-4 rounded-full bg-blue-500 border-2 border-white shadow-lg"></div>
                  <span className="text-slate-200 font-medium">Major Junction</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-4 h-4 rounded-full bg-red-500 border-2 border-white shadow-lg"></div>
                  <span className="text-slate-200 font-medium">Terminal Station</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-4 h-4 rounded-full bg-gray-500 border-2 border-white shadow-lg"></div>
                  <span className="text-slate-200 font-medium">Junction/Halt</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div className="w-4 h-4 rounded-full bg-blue-500 border-2 border-white shadow-lg"></div>
                    <div className="absolute -inset-2 w-8 h-8 border-2 border-green-400 rounded-full opacity-60"></div>
                  </div>
                  <span className="text-slate-200 font-medium">Station with Loop</span>
                </div>
              </div>
              
              {/* Track Types */}
              <div className="space-y-2">
                <div className="text-slate-300 font-semibold text-xs mb-1">Track Types</div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-3 bg-green-500 rounded border border-green-400 relative">
                    <div className="absolute top-0 left-0 w-full h-0.5 bg-yellow-400"></div>
                    <div className="absolute bottom-0 left-0 w-full h-0.5 bg-yellow-400"></div>
                  </div>
                  <span className="text-slate-200 font-medium">Electrified Line</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-3 bg-blue-500 rounded border border-blue-400"></div>
                  <span className="text-slate-200 font-medium">Main Line</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-3 bg-slate-500 rounded border border-slate-400"></div>
                  <span className="text-slate-200 font-medium">Branch Line</span>
                </div>
              </div>
            </div>
            
            <div className="mt-6 pt-4 border-t border-slate-600">
              <div className="text-slate-300 text-sm font-semibold">Western Railway Zone</div>
              <div className="text-slate-400 text-xs font-medium">AI-Enhanced Control System</div>
              {showPredictions && (
                <div className="text-blue-400 text-xs font-bold mt-2 flex items-center gap-1">
                  <Zap className="w-3 h-3" />
                  Predictive Mode Active
                </div>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
