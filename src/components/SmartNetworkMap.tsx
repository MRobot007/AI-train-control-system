import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Train, Station } from "../data/mockData";
import { MapPin, Train as TrainIcon, Zap, Eye, Layers, Navigation } from "lucide-react";

// Define track segments with proper coordinates
interface TrackSegment {
  id: string;
  start: { x: number; y: number };
  end: { x: number; y: number };
  type: 'main' | 'branch' | 'electrified';
  stations: string[];
}

// Define the simple railway network tracks
const trackSegments: TrackSegment[] = [
  // Simple route: Mehsana to Ahmedabad to Vadodara
  { id: 'MSH-ADI', start: { x: 350, y: 250 }, end: { x: 400, y: 300 }, type: 'main', stations: ['ST002', 'ST001'] },
  { id: 'ADI-BRC', start: { x: 400, y: 300 }, end: { x: 450, y: 350 }, type: 'electrified', stations: ['ST001', 'ST003'] },
];

// Function to calculate position along a track segment
const getPositionAlongTrack = (segment: TrackSegment, progress: number): { x: number; y: number } => {
  return {
    x: segment.start.x + (segment.end.x - segment.start.x) * progress,
    y: segment.start.y + (segment.end.y - segment.start.y) * progress
  };
};

// Function to find the track segment for a train based on its route
const findTrackSegment = (train: Train, stations: Station[]): TrackSegment | null => {
  const currentStation = stations.find(s => s.id === train.currentStation);
  const nextStation = stations.find(s => s.id === train.nextStation);
  
  if (!currentStation || !nextStation) return null;
  
  return trackSegments.find(segment => 
    segment.stations.includes(currentStation.id) && segment.stations.includes(nextStation.id)
  ) || null;
};

interface SmartNetworkMapProps {
  trains: Train[];
  stations: Station[];
  isRunning: boolean;
  currentTime: Date;
  onTrainSelect: (train: Train) => void;
}

export const SmartNetworkMap = ({ trains, stations, isRunning, currentTime, onTrainSelect }: SmartNetworkMapProps) => {
  const [animatedTrains, setAnimatedTrains] = useState(trains);
  const [selectedTrain, setSelectedTrain] = useState<Train | null>(null);
  const [viewMode, setViewMode] = useState<'normal' | 'heatmap' | 'flow'>('normal');
  const [showPredictions, setShowPredictions] = useState(true);
  const [congestionData, setCongestionData] = useState<any[]>([]);
  const [trainProgress, setTrainProgress] = useState<Record<string, number>>({});
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Initialize train progress
  useEffect(() => {
    const initialProgress: Record<string, number> = {};
    trains.forEach((train, index) => {
      initialProgress[train.id] = Math.random() * 0.8; // Start at random position along track
    });
    setTrainProgress(initialProgress);
  }, [trains]);

  useEffect(() => {
    if (isRunning) {
      const interval = setInterval(() => {
        setAnimatedTrains(prevTrains => 
          prevTrains.map((train, index) => {
            const trackSegment = findTrackSegment(train, stations);
            
            if (trackSegment) {
              // Update progress along the track
              const speedFactor = train.speed / 100;
              const delayFactor = train.delay > 0 ? 0.7 : 1.0;
              const progressIncrement = (speedFactor * delayFactor * 0.02); // Slower, more realistic movement
              
              setTrainProgress(prev => {
                const currentProgress = prev[train.id] || 0;
                let newProgress = currentProgress + progressIncrement;
                
                // Reset progress when reaching the end of track
                if (newProgress >= 1) {
                  newProgress = 0;
                }
                
                return { ...prev, [train.id]: newProgress };
              });
              
              // Calculate position along track with proper spacing
              const baseProgress = trainProgress[train.id] || 0;
              const spacingOffset = (index % 3) * 0.1; // Spread trains along track
              const finalProgress = Math.min(0.95, baseProgress + spacingOffset);
              
              const newPosition = getPositionAlongTrack(trackSegment, finalProgress);
              
              return {
                ...train,
                position: newPosition
              };
            } else {
              // Fallback to station position if no track found
              const currentStation = stations.find(s => s.id === train.currentStation);
              return {
                ...train,
                position: currentStation?.position || train.position
              };
            }
          })
        );

        // Update congestion data
        setCongestionData([
          { section: 'ADI-BRC', level: Math.random() * 100, trains: Math.floor(Math.random() * 8) + 2 },
          { section: 'BRC-ST', level: Math.random() * 100, trains: Math.floor(Math.random() * 6) + 1 },
          { section: 'ST-VAPI', level: Math.random() * 100, trains: Math.floor(Math.random() * 5) + 1 },
          { section: 'ADI-RJT', level: Math.random() * 100, trains: Math.floor(Math.random() * 7) + 2 },
        ]);
      }, 1500); // Slightly faster update for smoother movement

      return () => clearInterval(interval);
    }
  }, [isRunning, stations, trainProgress]);

  // Enhanced canvas rendering for heatmap and flow visualization
  useEffect(() => {
    if (!canvasRef.current || viewMode === 'normal') return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (viewMode === 'heatmap') {
      // Draw congestion heatmap
      congestionData.forEach(data => {
        const intensity = data.level / 100;
        const gradient = ctx.createRadialGradient(200, 200, 0, 200, 200, 100);
        gradient.addColorStop(0, `rgba(255, 0, 0, ${intensity * 0.6})`);
        gradient.addColorStop(1, `rgba(255, 0, 0, 0)`);
        
        ctx.fillStyle = gradient;
        ctx.fillRect(150 + Math.random() * 200, 150 + Math.random() * 200, 100, 100);
      });
    } else if (viewMode === 'flow') {
      // Draw traffic flow lines
      ctx.strokeStyle = 'rgba(59, 130, 246, 0.6)';
      ctx.lineWidth = 3;
      
      for (let i = 0; i < 10; i++) {
        ctx.beginPath();
        ctx.moveTo(Math.random() * canvas.width, Math.random() * canvas.height);
        ctx.lineTo(Math.random() * canvas.width, Math.random() * canvas.height);
        ctx.stroke();
      }
    }
  }, [viewMode, congestionData]);

  const getTrainStatusColor = (status: string) => {
    switch (status) {
      case 'on-time': return 'bg-success';
      case 'delayed': return 'bg-destructive';
      case 'early': return 'bg-primary';
      default: return 'bg-muted';
    }
  };

  const getCongestionColor = (level: number) => {
    if (level > 80) return 'text-destructive';
    if (level > 60) return 'text-accent';
    return 'text-success';
  };

  const handleTrainClick = (train: Train) => {
    setSelectedTrain(train);
    onTrainSelect(train);
  };

  return (
    <Card className="h-full">
      <CardHeader className="pb-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <MapPin className="w-5 h-5 text-primary" />
            <CardTitle className="text-xl">Smart Railway Network Map</CardTitle>
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
          {viewMode === 'heatmap' && (
            <div className="flex items-center gap-3">
              <div className="w-5 h-5 rounded-full bg-red-500 opacity-80 border-2 border-white shadow-lg animate-pulse"></div>
              <span className="font-semibold text-slate-200">High Congestion</span>
            </div>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="p-0 flex-1">
        <div className="relative w-full h-[70vh] min-h-[500px] max-h-[700px] bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 border-t overflow-hidden">
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
          <svg className="absolute inset-0 w-full h-full">
            <defs>
              {/* Professional track patterns */}
              <pattern id="railwayTrack" patternUnits="userSpaceOnUse" width="24" height="8">
                {/* Track bed */}
                <rect width="24" height="8" fill="#2D3748" stroke="#1A202C" strokeWidth="0.5" />
                {/* Rails */}
                <rect x="2" y="2" width="20" height="1.5" fill="#4A5568" stroke="#2D3748" strokeWidth="0.3" />
                <rect x="2" y="4.5" width="20" height="1.5" fill="#4A5568" stroke="#2D3748" strokeWidth="0.3" />
                {/* Sleepers */}
                <rect x="0" y="3" width="2" height="2" fill="#1A202C" />
                <rect x="6" y="3" width="2" height="2" fill="#1A202C" />
                <rect x="12" y="3" width="2" height="2" fill="#1A202C" />
                <rect x="18" y="3" width="2" height="2" fill="#1A202C" />
                <rect x="22" y="3" width="2" height="2" fill="#1A202C" />
              </pattern>
              
              <pattern id="electrifiedTrack" patternUnits="userSpaceOnUse" width="24" height="8">
                {/* Track bed */}
                <rect width="24" height="8" fill="#1F2937" stroke="#111827" strokeWidth="0.5" />
                {/* Rails */}
                <rect x="2" y="2" width="20" height="1.5" fill="#6B7280" stroke="#374151" strokeWidth="0.3" />
                <rect x="2" y="4.5" width="20" height="1.5" fill="#6B7280" stroke="#374151" strokeWidth="0.3" />
                {/* Sleepers */}
                <rect x="0" y="3" width="2" height="2" fill="#111827" />
                <rect x="6" y="3" width="2" height="2" fill="#111827" />
                <rect x="12" y="3" width="2" height="2" fill="#111827" />
                <rect x="18" y="3" width="2" height="2" fill="#111827" />
                <rect x="22" y="3" width="2" height="2" fill="#111827" />
                {/* Electrification overhead */}
                <line x1="0" y1="1" x2="24" y2="1" stroke="#F59E0B" strokeWidth="1.5" opacity="0.9" />
                <line x1="0" y1="7" x2="24" y2="7" stroke="#F59E0B" strokeWidth="1.5" opacity="0.9" />
                {/* Power poles */}
                <line x1="6" y1="1" x2="6" y2="7" stroke="#F59E0B" strokeWidth="0.8" opacity="0.7" />
                <line x1="12" y1="1" x2="12" y2="7" stroke="#F59E0B" strokeWidth="0.8" opacity="0.7" />
                <line x1="18" y1="1" x2="18" y2="7" stroke="#F59E0B" strokeWidth="0.8" opacity="0.7" />
              </pattern>
              
              <pattern id="mainTrack" patternUnits="userSpaceOnUse" width="24" height="8">
                {/* Track bed */}
                <rect width="24" height="8" fill="#1E3A8A" stroke="#1E40AF" strokeWidth="0.5" />
                {/* Rails */}
                <rect x="2" y="2" width="20" height="1.5" fill="#3B82F6" stroke="#2563EB" strokeWidth="0.3" />
                <rect x="2" y="4.5" width="20" height="1.5" fill="#3B82F6" stroke="#2563EB" strokeWidth="0.3" />
                {/* Sleepers */}
                <rect x="0" y="3" width="2" height="2" fill="#1E40AF" />
                <rect x="6" y="3" width="2" height="2" fill="#1E40AF" />
                <rect x="12" y="3" width="2" height="2" fill="#1E40AF" />
                <rect x="18" y="3" width="2" height="2" fill="#1E40AF" />
                <rect x="22" y="3" width="2" height="2" fill="#1E40AF" />
              </pattern>
              
              {/* Professional gradients */}
              <linearGradient id="trackGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="rgba(59, 130, 246, 0.3)" />
                <stop offset="50%" stopColor="rgba(59, 130, 246, 0.8)" />
                <stop offset="100%" stopColor="rgba(59, 130, 246, 0.3)" />
              </linearGradient>
              
              <linearGradient id="electrifiedGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="rgba(16, 185, 129, 0.3)" />
                <stop offset="50%" stopColor="rgba(16, 185, 129, 0.8)" />
                <stop offset="100%" stopColor="rgba(16, 185, 129, 0.3)" />
              </linearGradient>
              
              {/* Professional shadows and effects */}
              <filter id="trackShadow" x="-50%" y="-50%" width="200%" height="200%">
                <feDropShadow dx="2" dy="2" stdDeviation="3" floodColor="rgba(0,0,0,0.4)"/>
              </filter>
              
              <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
                <feMerge> 
                  <feMergeNode in="coloredBlur"/>
                  <feMergeNode in="SourceGraphic"/>
                </feMerge>
              </filter>
              
              {/* Signal light patterns */}
              <radialGradient id="signalGreen" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#10B981" />
                <stop offset="70%" stopColor="#059669" />
                <stop offset="100%" stopColor="#047857" />
              </radialGradient>
              
              <radialGradient id="signalYellow" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#F59E0B" />
                <stop offset="70%" stopColor="#D97706" />
                <stop offset="100%" stopColor="#B45309" />
              </radialGradient>
              
              <radialGradient id="signalRed" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#EF4444" />
                <stop offset="70%" stopColor="#DC2626" />
                <stop offset="100%" stopColor="#B91C1C" />
              </radialGradient>
            </defs>
            
            {/* Professional track segments */}
            {trackSegments.map((segment) => {
              const strokeWidth = segment.type === 'electrified' ? 8 : segment.type === 'main' ? 7 : 6;
              const patternId = segment.type === 'electrified' ? 'electrifiedTrack' : 
                               segment.type === 'main' ? 'mainTrack' : 'railwayTrack';
              
              return (
                <g key={segment.id}>
                  {/* Track foundation shadow */}
                  <line 
                    x1={segment.start.x} 
                    y1={segment.start.y + 1} 
                    x2={segment.end.x} 
                    y2={segment.end.y + 1} 
                    stroke="rgba(0,0,0,0.6)" 
                    strokeWidth={strokeWidth + 3}
                    filter="url(#trackShadow)"
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
                    filter="url(#glow)"
                  />
                  
                  {/* Track center line for electrified tracks */}
                  {segment.type === 'electrified' && (
                    <line 
                      x1={segment.start.x} 
                      y1={segment.start.y} 
                      x2={segment.end.x} 
                      y2={segment.end.y} 
                      stroke="rgba(245, 158, 11, 0.4)" 
                      strokeWidth="2"
                      strokeDasharray="8,4"
                      strokeLinecap="round"
                    />
                  )}
                  
                  {/* Track identification markers */}
                  <text 
                    x={(segment.start.x + segment.end.x) / 2} 
                    y={(segment.start.y + segment.end.y) / 2 - 15} 
                    textAnchor="middle" 
                    className="text-xs font-mono fill-slate-400"
                    style={{ fontSize: '10px' }}
                  >
                    {segment.id}
                  </text>
                </g>
              );
            })}

            {/* Professional junction points and stations */}
            {stations.map(station => (
              <g key={`junction-${station.id}`}>
                {/* Station foundation */}
                <circle
                  cx={station.position.x}
                  cy={station.position.y}
                  r="12"
                  fill="rgba(0,0,0,0.3)"
                  stroke="rgba(0,0,0,0.5)"
                  strokeWidth="1"
                />
                {/* Station platform */}
                <circle
                  cx={station.position.x}
                  cy={station.position.y}
                  r="10"
                  fill={station.type === 'junction' ? '#1E40AF' : 
                        station.type === 'terminal' ? '#DC2626' : '#6B7280'}
                  stroke={station.type === 'junction' ? '#3B82F6' : 
                          station.type === 'terminal' ? '#EF4444' : '#9CA3AF'}
                  strokeWidth="2"
                />
                {/* Station center */}
                <circle
                  cx={station.position.x}
                  cy={station.position.y}
                  r="6"
                  fill="rgba(255,255,255,0.2)"
                  stroke="rgba(255,255,255,0.4)"
                  strokeWidth="1"
                />
                {/* Platform indicators */}
                {Array.from({ length: station.platforms }, (_, i) => {
                  const angle = (i * 360) / station.platforms;
                  const x = station.position.x + Math.cos(angle * Math.PI / 180) * 8;
                  const y = station.position.y + Math.sin(angle * Math.PI / 180) * 8;
                  return (
                    <circle
                      key={i}
                      cx={x}
                      cy={y}
                      r="2"
                      fill="rgba(255,255,255,0.6)"
                      stroke="rgba(255,255,255,0.8)"
                      strokeWidth="0.5"
                    />
                  );
                })}
              </g>
            ))}

            {/* Professional signal systems */}
            {isRunning && (
              <>
                {/* Main line signals */}
                <g>
                  <rect x="320" y="185" width="8" height="20" fill="#374151" stroke="#1F2937" strokeWidth="1" />
                  <circle cx="324" cy="190" r="3" fill="url(#signalGreen)" filter="url(#glow)" className="animate-pulse" />
                  <text x="324" y="210" textAnchor="middle" className="text-xs font-mono fill-slate-400">S1</text>
                </g>
                
                <g>
                  <rect x="270" y="305" width="8" height="20" fill="#374151" stroke="#1F2937" strokeWidth="1" />
                  <circle cx="274" cy="310" r="3" fill="url(#signalGreen)" filter="url(#glow)" className="animate-pulse" />
                  <text x="274" y="330" textAnchor="middle" className="text-xs font-mono fill-slate-400">S2</text>
                </g>
                
                <g>
                  <rect x="170" y="130" width="8" height="20" fill="#374151" stroke="#1F2937" strokeWidth="1" />
                  <circle cx="174" cy="135" r="3" fill="url(#signalYellow)" filter="url(#glow)" className="animate-pulse" />
                  <text x="174" y="155" textAnchor="middle" className="text-xs font-mono fill-slate-400">S3</text>
                </g>
                
                <g>
                  <rect x="315" y="155" width="8" height="20" fill="#374151" stroke="#1F2937" strokeWidth="1" />
                  <circle cx="319" cy="160" r="3" fill="url(#signalGreen)" filter="url(#glow)" className="animate-pulse" />
                  <text x="319" y="180" textAnchor="middle" className="text-xs font-mono fill-slate-400">S4</text>
                </g>
                
                <g>
                  <rect x="295" y="295" width="8" height="20" fill="#374151" stroke="#1F2937" strokeWidth="1" />
                  <circle cx="299" cy="300" r="3" fill="url(#signalYellow)" filter="url(#glow)" className="animate-pulse" />
                  <text x="299" y="320" textAnchor="middle" className="text-xs font-mono fill-slate-400">S5</text>
                </g>
              </>
            )}
          </svg>

          {/* Professional station information displays */}
          {stations.map(station => (
            <div
              key={station.id}
              className="absolute transform -translate-x-1/2 -translate-y-1/2 group"
              style={{ left: station.position.x, top: station.position.y }}
            >
              <div className="flex flex-col items-center">
                {/* Station status indicator */}
                <div className={`w-3 h-3 rounded-full border-2 border-white shadow-lg ${
                  station.type === 'junction' ? 'bg-blue-500' : 
                  station.type === 'terminal' ? 'bg-red-500' : 'bg-gray-500'
                } hover:scale-125 transition-transform cursor-pointer`} />
                
                {/* Professional station label */}
                <div className="mt-2 text-xs font-mono bg-slate-800/95 backdrop-blur-sm px-3 py-2 rounded-lg border border-slate-600 text-center min-w-20 group-hover:bg-slate-700/95 transition-all duration-200 shadow-xl">
                  <div className="font-bold text-white text-sm">{station.code}</div>
                  <div className="text-slate-300 text-[10px] font-medium">P{station.platforms}</div>
                  <div className="w-full h-0.5 bg-slate-600 mt-1 rounded"></div>
                  <div className="text-slate-400 text-[9px] mt-1">
                    {station.type === 'junction' ? 'JCT' : 
                     station.type === 'terminal' ? 'TERM' : 'HALT'}
                  </div>
                </div>
                
                {/* Professional station details on hover */}
                <div className="absolute top-full mt-3 hidden group-hover:block bg-slate-900/98 backdrop-blur-sm border border-slate-600 rounded-xl p-4 text-xs shadow-2xl z-20 min-w-48">
                  <div className="font-bold text-white text-base mb-1">{station.name}</div>
                  <div className="text-slate-300 text-sm font-mono mb-3">{station.code}</div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400">Type:</span>
                      <span className="text-white font-medium capitalize">{station.type}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400">Platforms:</span>
                      <span className="text-blue-400 font-bold">{station.platforms}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400">Status:</span>
                      <span className="text-green-400 font-medium">Active</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400">Trains:</span>
                      <span className="text-yellow-400 font-medium">{Math.floor(Math.random() * 5) + 1}</span>
                    </div>
                  </div>
                  
                  <div className="mt-3 pt-3 border-t border-slate-600">
                    <div className="text-slate-400 text-[10px] font-medium">Western Railway Zone</div>
                    <div className="text-slate-500 text-[9px]">AI-Enhanced Station</div>
                  </div>
                </div>
              </div>
            </div>
          ))}

          {/* Enhanced Trains with predictions - Improved spacing and visibility */}
          {animatedTrains.map((train, index) => {
            // Calculate proper spacing based on track segment
            const trackSegment = findTrackSegment(train, stations);
            let offsetX = 0;
            let offsetY = 0;
            
            if (trackSegment) {
              // Calculate perpendicular offset for parallel tracks
              const dx = trackSegment.end.x - trackSegment.start.x;
              const dy = trackSegment.end.y - trackSegment.start.y;
              const length = Math.sqrt(dx * dx + dy * dy);
              
              if (length > 0) {
                // Perpendicular vector for offset
                const perpX = -dy / length;
                const perpY = dx / length;
                
                // Offset based on train index to create parallel tracks
                const trackOffset = (index % 3 - 1) * 25; // -25, 0, 25
                offsetX = perpX * trackOffset;
                offsetY = perpY * trackOffset;
              }
            } else {
              // Fallback spacing for trains not on tracks
              offsetX = (index % 3) * 20 - 20;
              offsetY = Math.floor(index / 3) * 25 - 25;
            }
            
            return (
              <div
                key={train.id}
                className="absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer transition-all duration-700 hover:scale-110 group z-10"
                style={{ 
                  left: train.position.x + offsetX, 
                  top: train.position.y + offsetY,
                  transition: isRunning ? 'all 1.2s ease-in-out' : 'transform 0.3s'
                }}
                onClick={() => handleTrainClick(train)}
              >
                <div className="flex flex-col items-center">
                  {/* Professional train indicator */}
                  <div className={`w-14 h-14 rounded-lg ${getTrainStatusColor(train.status)} 
                    flex items-center justify-center text-white text-xs shadow-2xl hover:shadow-3xl transition-all duration-300 relative border-2 border-white/80 ring-2 ring-black/30 backdrop-blur-sm`}>
                    <TrainIcon className="w-7 h-7" />
                    
                    {/* Priority indicator */}
                    <div className="absolute -top-3 -left-3 w-7 h-7 bg-slate-900 text-white rounded-full flex items-center justify-center text-xs font-bold border-2 border-white shadow-lg">
                      P{train.priority}
                    </div>
                    
                    {/* AI prediction indicator */}
                    {showPredictions && (
                      <div className="absolute -top-3 -right-3 w-6 h-6 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center border-2 border-white shadow-lg">
                        <Zap className="w-3 h-3 text-white" />
                      </div>
                    )}
                    
                    {/* Speed indicator */}
                    <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 bg-slate-900 text-white text-[8px] px-1 py-0.5 rounded border border-white/50">
                      {train.speed}km/h
                    </div>
                  </div>
                  
                  {/* Professional train info card */}
                  <div className="mt-3 bg-slate-900/95 backdrop-blur-sm border border-slate-600 rounded-xl px-3 py-2 text-xs font-mono text-center shadow-2xl group-hover:bg-slate-800/95 transition-all duration-200 min-w-28">
                    <div className="font-bold text-white text-sm mb-1">{train.number}</div>
                    <div className="text-slate-300 text-xs mb-1 font-medium">
                      {train.name}
                    </div>
                    <div className="text-slate-400 text-[10px] capitalize mb-1">
                      {train.type}
                    </div>
                    <div className="w-full h-0.5 bg-slate-600 rounded mb-1"></div>
                    <div className="text-slate-500 text-[9px]">
                      {train.currentStation} → {train.nextStation}
                    </div>
                  </div>
                  
                  {/* Professional delay indicator */}
                  {train.delay !== 0 && (
                    <div className={`mt-2 px-3 py-1 rounded-lg text-xs font-bold border-2 border-white shadow-lg ${
                      train.delay > 0 
                        ? 'bg-red-600 text-white' 
                        : 'bg-green-600 text-white'
                    }`}>
                      {train.delay > 0 ? `+${train.delay}m` : `${train.delay}m`}
                    </div>
                  )}

                  {/* Professional train details on hover */}
                  <div className="absolute top-full mt-4 hidden group-hover:block bg-slate-900/98 backdrop-blur-sm border border-slate-600 rounded-2xl p-6 text-xs shadow-2xl z-20 min-w-72">
                    <div className="font-bold text-white text-lg mb-2">{train.name}</div>
                    <div className="text-slate-300 mb-4 font-mono text-sm">{train.number}</div>
                    
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-slate-400">Status:</span>
                        <div className={`px-2 py-1 rounded text-xs font-bold ${
                          train.status === 'on-time' ? 'bg-green-600 text-white' : 
                          train.status === 'delayed' ? 'bg-red-600 text-white' : 
                          'bg-blue-600 text-white'
                        }`}>
                          {train.status.toUpperCase()}
                        </div>
                      </div>
                      
                      <div className="flex justify-between">
                        <span className="text-slate-400">Speed:</span>
                        <span className="font-mono font-semibold text-white">{train.speed}/{train.maxSpeed} km/h</span>
                      </div>
                      
                      <div className="flex justify-between">
                        <span className="text-slate-400">Priority:</span>
                        <span className="font-bold text-blue-400">P{train.priority}</span>
                      </div>
                      
                      <div className="flex justify-between">
                        <span className="text-slate-400">Route:</span>
                        <span className="font-mono text-xs text-slate-300">{train.currentStation} → {train.nextStation}</span>
                      </div>
                      
                      <div className="flex justify-between">
                        <span className="text-slate-400">Departure:</span>
                        <span className="font-mono text-white">{train.departureTime}</span>
                      </div>
                      
                      <div className="flex justify-between">
                        <span className="text-slate-400">Arrival:</span>
                        <span className="font-mono text-white">{train.arrivalTime}</span>
                      </div>
                      
                      {showPredictions && (
                        <div className="pt-4 border-t border-slate-600">
                          <div className="text-blue-400 font-semibold mb-3 flex items-center gap-2">
                            <Zap className="w-4 h-4" />
                            AI Prediction
                          </div>
                          <div className="space-y-2">
                            <div className="flex justify-between">
                              <span className="text-slate-400">ETA:</span>
                              <span className="font-mono font-semibold text-white">{train.arrivalTime}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-slate-400">Confidence:</span>
                              <span className="text-green-400 font-bold">{Math.floor(Math.random() * 20) + 80}%</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-slate-400">Risk Level:</span>
                              <span className="text-yellow-400 font-medium">LOW</span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                    
                    <div className="mt-4 pt-4 border-t border-slate-600">
                      <div className="text-slate-400 text-[10px] font-medium">Western Railway Zone</div>
                      <div className="text-slate-500 text-[9px]">AI-Enhanced Tracking</div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}

          {/* Congestion indicators for heatmap mode */}
          {viewMode === 'heatmap' && (
            <div className="absolute bottom-4 right-4 bg-card/95 backdrop-blur-sm border rounded-xl p-4 text-xs max-w-56 shadow-lg">
              <h4 className="font-semibold mb-3 text-sm">Section Congestion</h4>
              <div className="space-y-2">
                {congestionData.map((data, index) => (
                  <div key={index} className="flex justify-between items-center">
                    <span className="font-medium">{data.section}</span>
                    <div className="flex items-center gap-2">
                      <span className={getCongestionColor(data.level)}>
                        {Math.round(data.level)}%
                      </span>
                      <span className="text-muted-foreground">({data.trains})</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

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
              
              {/* Train Indicators */}
              <div className="space-y-2">
                <div className="text-slate-300 font-semibold text-xs mb-1">Train Indicators</div>
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-lg bg-green-600 border-2 border-white flex items-center justify-center text-xs font-bold text-white shadow-lg">P</div>
                  <span className="text-slate-200 font-medium">Train Priority</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 border-2 border-white shadow-lg"></div>
                  <span className="text-slate-200 font-medium">AI Prediction</span>
                </div>
              </div>
              
              {/* Signal System */}
              <div className="space-y-2">
                <div className="text-slate-300 font-semibold text-xs mb-1">Signal System</div>
                <div className="flex items-center gap-3">
                  <div className="w-4 h-4 rounded-full bg-green-500 animate-pulse shadow-lg"></div>
                  <span className="text-slate-200 font-medium">Clear (Green)</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-4 h-4 rounded-full bg-yellow-500 animate-pulse shadow-lg"></div>
                  <span className="text-slate-200 font-medium">Caution (Yellow)</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-4 h-4 rounded-full bg-red-500 animate-pulse shadow-lg"></div>
                  <span className="text-slate-200 font-medium">Stop (Red)</span>
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