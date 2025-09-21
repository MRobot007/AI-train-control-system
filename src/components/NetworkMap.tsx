import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Train, Station } from "../data/mockData";
import { MapPin, Train as TrainIcon } from "lucide-react";

interface NetworkMapProps {
  trains: Train[];
  stations: Station[];
  isRunning: boolean;
  currentTime: Date;
  onTrainSelect: (train: Train) => void;
}

export const NetworkMap = ({ trains, stations, isRunning, currentTime, onTrainSelect }: NetworkMapProps) => {
  const [animatedTrains, setAnimatedTrains] = useState(trains);

  useEffect(() => {
    if (isRunning) {
      const interval = setInterval(() => {
        setAnimatedTrains(prevTrains => 
          prevTrains.map(train => ({
            ...train,
            position: {
              x: train.position.x + (Math.random() - 0.5) * 20,
              y: train.position.y + (Math.random() - 0.5) * 10
            }
          }))
        );
      }, 2000);

      return () => clearInterval(interval);
    }
  }, [isRunning]);

  const getTrainStatusColor = (status: string) => {
    switch (status) {
      case 'on-time': return 'bg-success';
      case 'delayed': return 'bg-destructive';
      case 'early': return 'bg-primary';
      default: return 'bg-muted';
    }
  };

  const getTrainTypeIcon = (type: string) => {
    return type === 'freight' ? '🚛' : '🚂';
  };

  return (
    <Card className="h-[600px]">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2">
          <MapPin className="w-5 h-5" />
          Railway Network Map
        </CardTitle>
        <div className="flex gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-success"></div>
            <span>On Time</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-destructive"></div>
            <span>Delayed</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-primary"></div>
            <span>Early</span>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="p-0">
        <div className="relative w-full h-[500px] bg-card border-t overflow-hidden">
          {/* Railway Lines */}
          <svg className="absolute inset-0 w-full h-full">
            <defs>
              <pattern id="railwayTrack" patternUnits="userSpaceOnUse" width="20" height="4">
                <rect width="20" height="1" fill="hsl(var(--border))" />
                <rect y="3" width="20" height="1" fill="hsl(var(--border))" />
              </pattern>
            </defs>
            
            {/* Simple Railway Network - Mehsana to Ahmedabad to Vadodara */}
            {/* Mehsana to Ahmedabad */}
            <line x1="350" y1="250" x2="400" y2="300" stroke="url(#railwayTrack)" strokeWidth="4" />
            {/* Ahmedabad to Vadodara */}
            <line x1="400" y1="300" x2="450" y2="350" stroke="url(#railwayTrack)" strokeWidth="4" />
          </svg>

          {/* Stations */}
          {stations.map(station => (
            <div
              key={station.id}
              className="absolute transform -translate-x-1/2 -translate-y-1/2"
              style={{ left: station.position.x, top: station.position.y }}
            >
              <div className="flex flex-col items-center">
                <div className={`w-4 h-4 rounded-full border-2 border-foreground ${
                  station.type === 'junction' ? 'bg-primary' : 
                  station.type === 'terminal' ? 'bg-accent' : 'bg-secondary'
                }`} />
                <div className="mt-1 text-xs font-mono bg-card px-2 py-1 rounded border text-center min-w-16">
                  <div className="font-semibold">{station.code}</div>
                  <div className="text-muted-foreground text-[10px]">P{station.platforms}</div>
                </div>
              </div>
            </div>
          ))}

          {/* Trains */}
          {animatedTrains.map(train => (
            <div
              key={train.id}
              className="absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer transition-all duration-500 hover:scale-110"
              style={{ 
                left: train.position.x, 
                top: train.position.y,
                transition: isRunning ? 'all 0.8s ease-in-out' : 'transform 0.2s'
              }}
              onClick={() => onTrainSelect(train)}
            >
              <div className="flex flex-col items-center">
                <div className={`w-6 h-6 rounded-full ${getTrainStatusColor(train.status)} 
                  flex items-center justify-center text-white text-xs shadow-lg animate-pulse-glow`}>
                  <TrainIcon className="w-3 h-3" />
                </div>
                <div className="mt-1 bg-card border rounded px-2 py-1 text-xs font-mono text-center shadow-sm">
                  <div className="font-semibold">{train.number}</div>
                  <div className="text-muted-foreground text-[10px]">
                    {train.speed}kmh
                  </div>
                </div>
                {train.delay > 0 && (
                  <Badge variant="destructive" className="text-[10px] px-1 py-0 mt-1">
                    +{train.delay}m
                  </Badge>
                )}
              </div>
            </div>
          ))}

          {/* Legend */}
          <div className="absolute bottom-4 left-4 bg-card border rounded-lg p-3 text-xs">
            <h4 className="font-semibold mb-2">Gujarat Rail Network</h4>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-primary"></div>
                <span>Major Junction</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-accent"></div>
                <span>Terminal Station</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-secondary"></div>
                <span>Junction/Halt</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-1 bg-border"></div>
                <span>Broad Gauge Line</span>
              </div>
            </div>
            <div className="mt-2 pt-2 border-t">
              <div className="text-muted-foreground">Western Railway Zone</div>
              <div className="text-muted-foreground">Live tracking active</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};