import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Conflict } from "../data/mockData";
import { AlertTriangle, CheckCircle, Clock, Wrench } from "lucide-react";

interface ConflictAlertsProps {
  conflicts: Conflict[];
}

export const ConflictAlerts = ({ conflicts }: ConflictAlertsProps) => {
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'destructive';
      case 'high': return 'destructive';
      case 'medium': return 'default';
      case 'low': return 'secondary';
      default: return 'outline';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical':
      case 'high':
        return AlertTriangle;
      case 'medium':
        return Clock;
      case 'low':
        return CheckCircle;
      default:
        return AlertTriangle;
    }
  };

  const getConflictTypeIcon = (type: string) => {
    switch (type) {
      case 'maintenance-block':
        return Wrench;
      case 'platform-conflict':
        return AlertTriangle;
      case 'section-overlap':
        return AlertTriangle;
      default:
        return AlertTriangle;
    }
  };

  const getConflictTypeLabel = (type: string) => {
    switch (type) {
      case 'maintenance-block':
        return 'Maintenance Block';
      case 'platform-conflict':
        return 'Platform Conflict';
      case 'section-overlap':
        return 'Section Overlap';
      default:
        return 'Unknown';
    }
  };

  return (
    <Card className="h-[300px] flex flex-col">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-destructive" />
          Conflict Management
          <Badge variant="outline" className="ml-auto">
            {conflicts.length} Active
          </Badge>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4 flex-1 overflow-y-auto custom-scrollbar">
        {conflicts.length === 0 ? (
          <div className="text-center p-8 text-muted-foreground">
            <CheckCircle className="w-12 h-12 mx-auto mb-3 text-success" />
            <div className="font-semibold text-lg">No Active Conflicts</div>
            <div className="text-sm">All systems operating normally</div>
          </div>
        ) : (
          conflicts.map(conflict => {
            const SeverityIcon = getSeverityIcon(conflict.severity);
            const TypeIcon = getConflictTypeIcon(conflict.type);
            
            return (
              <Card key={conflict.id} className="border-l-4 border-l-destructive/50 hover:shadow-md transition-all duration-200">
                <CardContent className="p-4">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <SeverityIcon className="w-5 h-5 text-destructive" />
                      <Badge variant={getSeverityColor(conflict.severity)} className="text-xs font-semibold">
                        {conflict.severity.toUpperCase()}
                      </Badge>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <TypeIcon className="w-4 h-4" />
                        <span className="font-medium">{getConflictTypeLabel(conflict.type)}</span>
                      </div>
                    </div>
                    <div className="text-xs text-muted-foreground font-mono bg-muted/50 px-2 py-1 rounded">
                      {conflict.timestamp}
                    </div>
                  </div>

                  {/* Details */}
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <div className="text-sm font-semibold text-muted-foreground mb-1">Location</div>
                        <div className="text-sm">{conflict.location}</div>
                      </div>
                      
                      <div>
                        <div className="text-sm font-semibold text-muted-foreground mb-2">Affected Trains</div>
                        <div className="flex flex-wrap gap-1">
                          {conflict.trains.map(trainId => (
                            <Badge key={trainId} variant="outline" className="text-xs">
                              {trainId}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div>
                      <div className="text-sm font-semibold text-muted-foreground mb-2">Resolution</div>
                      <div className="text-sm bg-muted/30 p-3 rounded-lg border-l-2 border-l-primary">
                        {conflict.suggestion}
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-3 border-t">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <CheckCircle className="w-4 h-4 text-success" />
                        <span>Resolved by {conflict.resolvedBy}</span>
                      </div>
                      
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" className="text-xs h-8">
                          Details
                        </Button>
                        <Button variant="default" size="sm" className="text-xs h-8">
                          Apply Fix
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}

        {/* Summary Stats */}
        <Card className="bg-gradient-to-r from-success/5 to-primary/5 border-success/20">
          <CardContent className="p-4">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="space-y-1">
                <div className="text-sm font-semibold text-success">Resolved Today</div>
                <div className="text-2xl font-bold text-success">89</div>
              </div>
              <div className="space-y-1">
                <div className="text-sm font-semibold text-muted-foreground">Avg Resolution</div>
                <div className="text-2xl font-bold">1.8min</div>
              </div>
              <div className="space-y-1">
                <div className="text-sm font-semibold text-success">AI Success Rate</div>
                <div className="text-2xl font-bold text-success">96%</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </CardContent>
    </Card>
  );
};