import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Train } from "../data/mockData";
import { Clock, Calendar } from "lucide-react";

interface ScheduleGanttProps {
  trains: Train[];
  currentTime: Date;
  isRunning: boolean;
}

export const ScheduleGantt = ({ trains, currentTime, isRunning }: ScheduleGanttProps) => {
  const timeSlots = Array.from({ length: 24 }, (_, i) => i);
  const currentHour = currentTime.getHours();

  const getTrainSchedulePosition = (departureTime: string) => {
    const [hours, minutes] = departureTime.split(':').map(Number);
    return ((hours + minutes / 60) / 24) * 100;
  };

  const getTrainStatusColor = (status: string) => {
    switch (status) {
      case 'on-time': return 'bg-success';
      case 'delayed': return 'bg-destructive';
      case 'early': return 'bg-primary';
      default: return 'bg-muted';
    }
  };

  const getTrainTypeColor = (type: string) => {
    switch (type) {
      case 'express': return 'border-l-primary';
      case 'passenger': return 'border-l-secondary';
      case 'freight': return 'border-l-accent';
      default: return 'border-l-muted';
    }
  };

  return (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2">
          <Calendar className="w-5 h-5" />
          Schedule Timeline - Today's Operations
        </CardTitle>
        <div className="flex gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-1 bg-primary"></div>
            <span>Express</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-1 bg-secondary"></div>
            <span>Passenger</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-1 bg-accent"></div>
            <span>Freight</span>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <div className="space-y-4">
          {/* Time Header */}
          <div className="relative h-8 border-b">
            <div className="flex justify-between text-xs text-muted-foreground">
              {timeSlots.map(hour => (
                <div key={hour} className="flex-1 text-center">
                  {String(hour).padStart(2, '0')}:00
                </div>
              ))}
            </div>
            
            {/* Current Time Indicator */}
            <div 
              className="absolute top-0 bottom-0 w-0.5 bg-primary animate-pulse-glow z-10"
              style={{ left: `${(currentHour / 24) * 100}%` }}
            >
              <div className="absolute -top-1 -left-2 w-4 h-4 bg-primary rounded-full animate-pulse"></div>
            </div>
          </div>

          {/* Train Schedules */}
          <div className="space-y-2 max-h-80 overflow-y-auto">
            {trains.map(train => (
              <div key={train.id} className="relative">
                <div className={`flex items-center p-3 border rounded-lg border-l-4 ${getTrainTypeColor(train.type)} 
                  bg-card hover:bg-muted/50 transition-colors`}>
                  
                  {/* Train Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3">
                      <div className="font-mono font-semibold">{train.number}</div>
                      <div className="font-medium truncate">{train.name}</div>
                      <Badge variant="outline" className="text-xs">
                        {train.type.toUpperCase()}
                      </Badge>
                      <div className={`w-2 h-2 rounded-full ${getTrainStatusColor(train.status)}`}></div>
                    </div>
                    
                    <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        <span>Dep: {train.departureTime}</span>
                      </div>
                      <div>Arr: {train.arrivalTime}</div>
                      <div>{train.currentStation} → {train.nextStation}</div>
                      {train.delay > 0 && (
                        <Badge variant="destructive" className="text-xs">
                          +{train.delay}min
                        </Badge>
                      )}
                      {train.delay < 0 && (
                        <Badge variant="outline" className="text-xs border-primary text-primary">
                          {train.delay}min
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Schedule Bar */}
                  <div className="flex-1 max-w-md mx-4">
                    <div className="relative h-6 bg-muted rounded">
                      {/* Scheduled Journey */}
                      <div 
                        className={`absolute top-0 bottom-0 ${getTrainStatusColor(train.status)} rounded opacity-80`}
                        style={{ 
                          left: `${getTrainSchedulePosition(train.departureTime)}%`,
                          width: '25%' // Simplified - would calculate actual journey duration
                        }}
                      >
                        {isRunning && (
                          <div className="absolute inset-0 bg-white/20 rounded animate-pulse"></div>
                        )}
                      </div>
                      
                      {/* Current Progress Indicator */}
                      <div 
                        className="absolute top-1/2 transform -translate-y-1/2 w-1 h-4 bg-foreground rounded-full z-10"
                        style={{ left: `${getTrainSchedulePosition(train.departureTime) + 10}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* Status */}
                  <div className="text-right min-w-20">
                    <div className="text-sm font-medium capitalize">{train.status}</div>
                    <div className="text-xs text-muted-foreground">{train.speed} km/h</div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* AI Optimization Summary */}
          <div className="mt-6 p-4 border border-success/20 bg-success/5 rounded-lg">
            <h4 className="font-semibold text-success mb-2">Gujarat Division AI Results</h4>
            <div className="grid grid-cols-4 gap-4 text-sm">
              <div>
                <div className="font-medium">Conflicts Resolved</div>
                <div className="text-2xl font-bold text-success">4</div>
              </div>
              <div>
                <div className="font-medium">Time Saved</div>
                <div className="text-2xl font-bold text-success">38min</div>
              </div>
              <div>
                <div className="font-medium">Trains Optimized</div>
                <div className="text-2xl font-bold text-success">7</div>
              </div>
              <div>
                <div className="font-medium">Efficiency Gain</div>
                <div className="text-2xl font-bold text-success">+19%</div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};