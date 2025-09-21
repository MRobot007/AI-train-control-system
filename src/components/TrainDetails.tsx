import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Train } from "../data/mockData";
import { 
  Train as TrainIcon, 
  MapPin, 
  Clock, 
  Gauge, 
  Route,
  Users,
  Calendar,
  AlertCircle
} from "lucide-react";

interface TrainDetailsProps {
  train: Train;
}

export const TrainDetails = ({ train }: TrainDetailsProps) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'on-time': return 'success';
      case 'delayed': return 'destructive';
      case 'early': return 'default';
      default: return 'secondary';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'express': return 'primary';
      case 'passenger': return 'secondary';
      case 'freight': return 'accent';
      default: return 'muted';
    }
  };

  const getPriorityLabel = (priority: number) => {
    switch (priority) {
      case 1: return 'Highest';
      case 2: return 'High';
      case 3: return 'Medium';
      case 4: return 'Low';
      default: return 'Normal';
    }
  };

  const speedPercentage = (train.speed / train.maxSpeed) * 100;

  return (
    <Card className="h-[400px] flex flex-col">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2">
          <TrainIcon className="w-5 h-5 text-primary" />
          Train Details
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-6 flex-1 overflow-y-auto custom-scrollbar">
        {/* Train Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="font-mono text-2xl font-bold">{train.number}</div>
            <div className="font-semibold text-muted-foreground">{train.name}</div>
          </div>
          <div className="flex flex-col sm:items-end gap-2">
            <Badge variant={getStatusColor(train.status)} className="text-sm font-semibold px-3 py-1">
              {train.status.replace('-', ' ').toUpperCase()}
            </Badge>
            <div className="flex gap-2">
              <Badge variant="outline" className={`text-xs border-${getTypeColor(train.type)} font-medium`}>
                {train.type.toUpperCase()}
              </Badge>
              <Badge variant="outline" className="text-xs font-medium">
                P{train.priority}
              </Badge>
            </div>
          </div>
        </div>

        {/* Current Status */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm">
              <MapPin className="w-4 h-4 text-primary" />
              <span className="font-semibold">Current Location</span>
            </div>
            <div className="pl-6 text-sm font-mono bg-muted/30 p-2 rounded border-l-2 border-l-primary">
              {train.currentStation}
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm">
              <Route className="w-4 h-4 text-primary" />
              <span className="font-semibold">Next Station</span>
            </div>
            <div className="pl-6 text-sm font-mono bg-muted/30 p-2 rounded border-l-2 border-l-primary">
              {train.nextStation}
            </div>
          </div>
        </div>

        {/* Speed Information */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm">
              <Gauge className="w-4 h-4 text-primary" />
              <span className="font-semibold">Current Speed</span>
            </div>
            <div className="font-mono font-bold text-lg">
              {train.speed} / {train.maxSpeed} km/h
            </div>
          </div>
          <Progress value={speedPercentage} className="h-3" />
          <div className="text-xs text-muted-foreground text-center">
            {speedPercentage.toFixed(1)}% of maximum speed
          </div>
        </div>

        {/* Schedule Information */}
        <Card className="bg-gradient-to-r from-primary/5 to-accent/5 border-primary/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 font-semibold mb-4">
              <Calendar className="w-4 h-4 text-primary" />
              Schedule Information
            </div>
            
            <div className="grid grid-cols-2 gap-6 text-sm">
              <div className="space-y-2">
                <div className="text-muted-foreground font-medium">Departure</div>
                <div className="font-mono font-bold text-lg">{train.departureTime}</div>
              </div>
              <div className="space-y-2">
                <div className="text-muted-foreground font-medium">Arrival</div>
                <div className="font-mono font-bold text-lg">{train.arrivalTime}</div>
              </div>
            </div>

            {train.delay !== 0 && (
              <div className="flex items-center gap-2 mt-4 p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                <AlertCircle className="w-5 h-5 text-destructive" />
                <span className="text-sm font-medium">
                  {train.delay > 0 ? 'Delayed by' : 'Running early by'}{' '}
                  <span className="font-bold text-destructive">{Math.abs(train.delay)} minutes</span>
                </span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Route Information */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <Route className="w-4 h-4 text-primary" />
            Route Path
          </div>
          <div className="flex items-center gap-2 overflow-x-auto pb-2">
            {train.route.map((station, index) => (
              <div key={station} className="flex items-center gap-2">
                <Badge 
                  variant={station === train.currentStation ? "default" : "outline"} 
                  className="text-xs whitespace-nowrap font-medium px-3 py-1"
                >
                  {station}
                </Badge>
                {index < train.route.length - 1 && (
                  <div className="w-4 h-0.5 bg-muted-foreground"></div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Priority and Type */}
        <div className="grid grid-cols-2 gap-6 pt-4 border-t">
          <div className="space-y-2">
            <div className="text-sm font-semibold text-muted-foreground">Priority Level</div>
            <div className="font-bold text-lg">{getPriorityLabel(train.priority)}</div>
          </div>
          <div className="space-y-2">
            <div className="text-sm font-semibold text-muted-foreground">Train Type</div>
            <div className="font-bold text-lg capitalize">{train.type}</div>
          </div>
        </div>

        {/* AI Recommendations */}
        <Card className="bg-gradient-to-r from-primary/10 to-accent/10 border-primary/30">
          <CardContent className="p-4">
            <div className="text-sm font-semibold text-primary mb-3 flex items-center gap-2">
              <Users className="w-4 h-4" />
              AI Recommendations
            </div>
            <div className="space-y-2 text-sm text-muted-foreground">
              <div className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2"></div>
                <span>Maintain current speed for optimal arrival</span>
              </div>
              <div className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2"></div>
                <span>Platform 7 assigned at next station</span>
              </div>
              <div className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-success mt-2"></div>
                <span>No conflicts detected on route</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </CardContent>
    </Card>
  );
};