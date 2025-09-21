import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  TrendingUp, 
  TrendingDown, 
  Clock, 
  Train, 
  Activity, 
  AlertTriangle,
  Zap,
  BarChart3,
  PieChart,
  LineChart,
  Gauge
} from "lucide-react";
import { LineChart as RechartsLineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart as RechartsPieChart, Cell, Pie, BarChart, Bar } from 'recharts';

export const EnhancedMetricsPanels = () => {
  const [realTimeData, setRealTimeData] = useState({
    throughput: { value: 847, change: 23, trend: 'up' },
    avgDelay: { value: 8.5, change: -34, trend: 'down' },
    utilization: { value: 89, change: 12, trend: 'up' },
    conflicts: { value: 3, change: -67, trend: 'down' },
    efficiency: { value: 94.7, change: 8, trend: 'up' },
    fuelSavings: { value: 12.3, change: 15, trend: 'up' }
  });

  const [performanceHistory, setPerformanceHistory] = useState([
    { time: '00:00', throughput: 45, delays: 12, efficiency: 87 },
    { time: '04:00', throughput: 32, delays: 8, efficiency: 91 },
    { time: '08:00', throughput: 78, delays: 15, efficiency: 85 },
    { time: '12:00', throughput: 95, delays: 18, efficiency: 82 },
    { time: '16:00', throughput: 87, delays: 12, efficiency: 89 },
    { time: '20:00', throughput: 65, delays: 9, efficiency: 93 },
  ]);

  const [sectionData, setSectionData] = useState([
    { name: 'ADI-BRC', utilization: 89, status: 'optimal', trains: 12, avgSpeed: 85 },
    { name: 'BRC-ST', utilization: 76, status: 'optimal', trains: 8, avgSpeed: 92 },
    { name: 'ADI-RJT', utilization: 82, status: 'optimal', trains: 10, avgSpeed: 78 },
    { name: 'RJT-JAM', utilization: 64, status: 'low', trains: 5, avgSpeed: 65 },
    { name: 'MSH-PNU', utilization: 71, status: 'optimal', trains: 7, avgSpeed: 88 }
  ]);

  const trainTypeData = [
    { name: 'Express', value: 45, color: '#3b82f6' },
    { name: 'Passenger', value: 35, color: '#10b981' },
    { name: 'Freight', value: 20, color: '#f59e0b' }
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      // Simulate real-time data updates
      setRealTimeData(prev => ({
        throughput: { 
          ...prev.throughput, 
          value: prev.throughput.value + (Math.random() - 0.5) * 10,
          change: prev.throughput.change + (Math.random() - 0.5) * 5
        },
        avgDelay: { 
          ...prev.avgDelay, 
          value: Math.max(0, prev.avgDelay.value + (Math.random() - 0.5) * 2),
          change: prev.avgDelay.change + (Math.random() - 0.5) * 10
        },
        utilization: { 
          ...prev.utilization, 
          value: Math.max(0, Math.min(100, prev.utilization.value + (Math.random() - 0.5) * 5)),
          change: prev.utilization.change + (Math.random() - 0.5) * 3
        },
        conflicts: { 
          ...prev.conflicts, 
          value: Math.max(0, prev.conflicts.value + Math.floor((Math.random() - 0.7) * 2)),
          change: prev.conflicts.change + (Math.random() - 0.5) * 20
        },
        efficiency: { 
          ...prev.efficiency, 
          value: Math.max(70, Math.min(100, prev.efficiency.value + (Math.random() - 0.5) * 3)),
          change: prev.efficiency.change + (Math.random() - 0.5) * 5
        },
        fuelSavings: { 
          ...prev.fuelSavings, 
          value: Math.max(0, prev.fuelSavings.value + (Math.random() - 0.5) * 2),
          change: prev.fuelSavings.change + (Math.random() - 0.5) * 8
        }
      }));

      // Update performance history
      setPerformanceHistory(prev => {
        const newData = [...prev.slice(1)];
        const currentTime = new Date().toLocaleTimeString('en-US', { 
          hour12: false, 
          hour: '2-digit', 
          minute: '2-digit' 
        });
        newData.push({
          time: currentTime,
          throughput: Math.floor(Math.random() * 50) + 50,
          delays: Math.floor(Math.random() * 20) + 5,
          efficiency: Math.floor(Math.random() * 15) + 80
        });
        return newData;
      });
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  const metrics = [
    {
      title: "Throughput",
      value: Math.round(realTimeData.throughput.value),
      unit: "trains/day",
      change: `${realTimeData.throughput.change > 0 ? '+' : ''}${Math.round(realTimeData.throughput.change)}%`,
      trend: realTimeData.throughput.trend,
      icon: Train,
      description: "vs yesterday"
    },
    {
      title: "Avg Delay",
      value: realTimeData.avgDelay.value.toFixed(1),
      unit: "minutes",
      change: `${realTimeData.avgDelay.change > 0 ? '+' : ''}${Math.round(realTimeData.avgDelay.change)}%`,
      trend: realTimeData.avgDelay.change < 0 ? 'down' : 'up',
      icon: Clock,
      description: "system-wide"
    },
    {
      title: "Track Utilization",
      value: Math.round(realTimeData.utilization.value),
      unit: "%",
      change: `${realTimeData.utilization.change > 0 ? '+' : ''}${Math.round(realTimeData.utilization.change)}%`,
      trend: realTimeData.utilization.trend,
      icon: Activity,
      description: "optimal range"
    },
    {
      title: "Active Conflicts",
      value: Math.round(realTimeData.conflicts.value),
      unit: "issues",
      change: `${realTimeData.conflicts.change > 0 ? '+' : ''}${Math.round(realTimeData.conflicts.change)}%`,
      trend: realTimeData.conflicts.change < 0 ? 'down' : 'up',
      icon: AlertTriangle,
      description: "auto-resolved"
    },
    {
      title: "AI Efficiency",
      value: realTimeData.efficiency.value.toFixed(1),
      unit: "%",
      change: `${realTimeData.efficiency.change > 0 ? '+' : ''}${Math.round(realTimeData.efficiency.change)}%`,
      trend: realTimeData.efficiency.trend,
      icon: Zap,
      description: "optimization"
    },
    {
      title: "Fuel Savings",
      value: realTimeData.fuelSavings.value.toFixed(1),
      unit: "L/km",
      change: `${realTimeData.fuelSavings.change > 0 ? '+' : ''}${Math.round(realTimeData.fuelSavings.change)}%`,
      trend: realTimeData.fuelSavings.trend,
      icon: Gauge,
      description: "per train"
    }
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
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            Enhanced Performance Metrics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="analytics">Analytics</TabsTrigger>
              <TabsTrigger value="sections">Sections</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {metrics.map((metric, index) => {
                  const Icon = metric.icon;
                  const TrendIcon = metric.trend === 'up' ? TrendingUp : TrendingDown;
                  const trendColor = metric.trend === 'up' ? 'text-success' : 'text-destructive';
                  
                  return (
                    <Card key={index} className="hover:shadow-md transition-all duration-200 hover:border-primary/20">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-primary/10 rounded-lg">
                              <Icon className="w-5 h-5 text-primary" />
                            </div>
                            <div>
                              <div className="font-semibold text-sm">{metric.title}</div>
                              <div className="text-xs text-muted-foreground">{metric.description}</div>
                            </div>
                          </div>
                        </div>
                        
                        <div className="mt-4">
                          <div className="flex items-baseline gap-1">
                            <span className="text-2xl font-bold">{metric.value}</span>
                            <span className="text-sm text-muted-foreground">{metric.unit}</span>
                          </div>
                          <div className={`flex items-center gap-1 text-xs mt-1 ${trendColor}`}>
                            <TrendIcon className="w-3 h-3" />
                            <span className="font-medium">{metric.change}</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </TabsContent>

            <TabsContent value="analytics" className="space-y-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <LineChart className="w-4 h-4" />
                      Performance Trends
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={250}>
                      <RechartsLineChart data={performanceHistory}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis 
                          dataKey="time" 
                          tick={{ fontSize: 12 }}
                          stroke="hsl(var(--muted-foreground))"
                        />
                        <YAxis 
                          tick={{ fontSize: 12 }}
                          stroke="hsl(var(--muted-foreground))"
                        />
                        <Tooltip 
                          contentStyle={{
                            backgroundColor: 'hsl(var(--card))',
                            border: '1px solid hsl(var(--border))',
                            borderRadius: '6px'
                          }}
                        />
                        <Line type="monotone" dataKey="throughput" stroke="hsl(var(--primary))" strokeWidth={2} name="Throughput" />
                        <Line type="monotone" dataKey="efficiency" stroke="hsl(var(--success))" strokeWidth={2} name="Efficiency" />
                      </RechartsLineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <PieChart className="w-4 h-4" />
                      Train Distribution
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={250}>
                      <RechartsPieChart>
                        <Pie
                          data={trainTypeData}
                          cx="50%"
                          cy="50%"
                          innerRadius={50}
                          outerRadius={90}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          {trainTypeData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip 
                          contentStyle={{
                            backgroundColor: 'hsl(var(--card))',
                            border: '1px solid hsl(var(--border))',
                            borderRadius: '6px'
                          }}
                        />
                      </RechartsPieChart>
                    </ResponsiveContainer>
                    <div className="mt-4 space-y-2">
                      {trainTypeData.map((entry, index) => (
                        <div key={index} className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: entry.color }}></div>
                            <span>{entry.name}</span>
                          </div>
                          <span className="font-medium">{entry.value}%</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="sections" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {sectionData.map((section, index) => (
                  <Card key={index} className="hover:shadow-md transition-all duration-200">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-3">
                        <span className="font-semibold text-sm">{section.name}</span>
                        <div className="flex items-center gap-2">
                          <Badge 
                            variant="outline" 
                            className={`text-xs ${getUtilizationColor(section.status)}`}
                          >
                            {section.status}
                          </Badge>
                          <span className="text-sm font-mono font-bold">{section.utilization}%</span>
                        </div>
                      </div>
                      <Progress 
                        value={section.utilization} 
                        className="h-2 mb-3"
                      />
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Train className="w-3 h-3" />
                          {section.trains} trains
                        </span>
                        <span className="flex items-center gap-1">
                          <Gauge className="w-3 h-3" />
                          Avg: {section.avgSpeed} km/h
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* AI Performance Summary */}
      <Card className="border-success/20 bg-gradient-to-r from-success/5 to-primary/5">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-success animate-pulse"></div>
            AI System Performance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 text-center">
            <div className="space-y-2">
              <div className="text-3xl font-bold text-success">{Math.round(realTimeData.efficiency.value)}%</div>
              <div className="text-sm text-muted-foreground">AI Accuracy</div>
            </div>
            <div className="space-y-2">
              <div className="text-3xl font-bold text-primary">{Math.round(realTimeData.throughput.value / 10)}</div>
              <div className="text-sm text-muted-foreground">Optimizations/hr</div>
            </div>
            <div className="space-y-2">
              <div className="text-3xl font-bold text-accent">{realTimeData.fuelSavings.value.toFixed(1)}L</div>
              <div className="text-sm text-muted-foreground">Fuel Saved</div>
            </div>
            <div className="space-y-2">
              <div className="text-3xl font-bold text-success">₹{(realTimeData.fuelSavings.value * 85).toFixed(0)}K</div>
              <div className="text-sm text-muted-foreground">Cost Savings</div>
            </div>
          </div>
          
          <div className="mt-6 p-4 bg-success/10 border border-success/30 rounded-lg">
            <div className="text-sm font-semibold text-success mb-3 flex items-center gap-2">
              <Zap className="w-4 h-4" />
              Real-time AI Impact
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-muted-foreground">
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-success"></div>
                <span>{Math.round(realTimeData.conflicts.value * 30)} conflicts automatically resolved</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-primary"></div>
                <span>{Math.round(realTimeData.avgDelay.value * 4.5)} minutes total time saved</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-accent"></div>
                <span>{Math.round(realTimeData.utilization.value / 4.7)}% improvement in section throughput</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-success"></div>
                <span>{Math.round(realTimeData.throughput.value / 120)} freight trains optimally rescheduled</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};