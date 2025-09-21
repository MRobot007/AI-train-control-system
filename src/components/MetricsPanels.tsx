import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { TrendingUp, TrendingDown, Clock, Train, Activity, AlertTriangle } from "lucide-react";

export const MetricsPanels = () => {
  const metrics = [
    {
      title: "Throughput",
      value: "847",
      unit: "trains/day",
      change: "+23%",
      trend: "up",
      icon: Train,
      description: "vs yesterday"
    },
    {
      title: "Avg Delay",
      value: "8.5",
      unit: "minutes",
      change: "-34%",
      trend: "down",
      icon: Clock,
      description: "system-wide"
    },
    {
      title: "Track Utilization",
      value: "89",
      unit: "%",
      change: "+12%",
      trend: "up",
      icon: Activity,
      description: "optimal range"
    },
    {
      title: "Active Conflicts",
      value: "3",
      unit: "issues",
      change: "-67%",
      trend: "down",
      icon: AlertTriangle,
      description: "auto-resolved"
    }
  ];

  const sectionUtilization = [
    { name: "ADI-BRC Main Line", utilization: 89, status: "optimal" },
    { name: "BRC-ST-VAPI Section", utilization: 76, status: "optimal" },
    { name: "ADI-RJT Saurashtra", utilization: 82, status: "optimal" },
    { name: "RJT-JAM-GIMB Branch", utilization: 64, status: "low" },
    { name: "MSH-PNU Northern", utilization: 71, status: "optimal" }
  ];

  const getUtilizationColor = (status: string) => {
    switch (status) {
      case 'high': return 'text-destructive';
      case 'optimal': return 'text-success';
      case 'low': return 'text-accent';
      default: return 'text-muted-foreground';
    }
  };

  return (
    <div className="space-y-6">
      {/* Key Performance Metrics */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Performance Metrics</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {metrics.map((metric, index) => {
            const Icon = metric.icon;
            const TrendIcon = metric.trend === 'up' ? TrendingUp : TrendingDown;
            const trendColor = metric.trend === 'up' ? 'text-success' : 'text-primary';
            
            return (
              <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Icon className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <div className="font-medium">{metric.title}</div>
                    <div className="text-xs text-muted-foreground">{metric.description}</div>
                  </div>
                </div>
                
                <div className="text-right">
                  <div className="flex items-center gap-1">
                    <span className="text-2xl font-bold">{metric.value}</span>
                    <span className="text-sm text-muted-foreground">{metric.unit}</span>
                  </div>
                  <div className={`flex items-center gap-1 text-xs ${trendColor}`}>
                    <TrendIcon className="w-3 h-3" />
                    <span>{metric.change}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Section Utilization */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Section Utilization</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {sectionUtilization.map((section, index) => (
            <div key={index} className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-medium text-sm">{section.name}</span>
                <div className="flex items-center gap-2">
                  <Badge 
                    variant="outline" 
                    className={`text-xs ${getUtilizationColor(section.status)}`}
                  >
                    {section.status}
                  </Badge>
                  <span className="text-sm font-mono">{section.utilization}%</span>
                </div>
              </div>
              <Progress 
                value={section.utilization} 
                className="h-2"
              />
            </div>
          ))}
        </CardContent>
      </Card>

      {/* AI Performance */}
      <Card className="border-success/20">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-success animate-pulse"></div>
            AI System Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm">Optimization Engine</span>
              <Badge variant="outline" className="border-success text-success">ACTIVE</Badge>
            </div>
            <div className="flex justify-between">
              <span className="text-sm">Conflict Resolution</span>
              <Badge variant="outline" className="border-success text-success">ACTIVE</Badge>
            </div>
            <div className="flex justify-between">
              <span className="text-sm">Delay Prediction</span>
              <Badge variant="outline" className="border-success text-success">LEARNING</Badge>
            </div>
            <div className="flex justify-between">
              <span className="text-sm">Next Optimization</span>
              <span className="text-sm font-mono text-muted-foreground">2m 34s</span>
            </div>
          </div>
          
          <div className="mt-4 p-3 bg-success/5 border border-success/20 rounded-lg">
            <div className="text-sm font-medium text-success mb-1">Gujarat Zone Impact</div>
            <div className="text-xs text-muted-foreground">
              • 89 conflicts automatically resolved<br/>
              • 38 minutes total time saved<br/>
              • 19% improvement in section throughput<br/>
              • 7 freight trains optimally rescheduled
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};