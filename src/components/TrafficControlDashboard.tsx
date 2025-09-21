import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import SimpleLeafletMap from "./SimpleLeafletMap";
import { ScheduleGantt } from "./ScheduleGantt";
import { EnhancedMetricsPanels } from "./EnhancedMetricsPanels";
import { ConflictAlerts } from "./ConflictAlerts";
import { TrainDetails } from "./TrainDetails";
import { AIInsights } from "./AIInsights";
import { mockTrains, mockStations, mockConflicts } from "../data/mockData";
import { Play, Pause, RotateCcw, Brain, Zap } from "lucide-react";
import { aiService } from "../services/aiService";

export const TrafficControlDashboard = () => {
  // Use exactly 6 trains as requested
  const slicedTrains = mockTrains.slice(0, 6);
  // Project 6 trains onto the railway network tracks
  const stationById = Object.fromEntries(mockStations.map(s => [s.id, s]));
  const pairs: Array<{ current: string; next: string }> = [
    { current: 'ST002', next: 'ST001' }, // MSH -> ADI
    { current: 'ST001', next: 'ST003' }, // ADI -> BRC
    { current: 'ST002', next: 'ST001' }, // MSH -> ADI
    { current: 'ST001', next: 'ST003' }, // ADI -> BRC
    { current: 'ST002', next: 'ST001' }, // MSH -> ADI
    { current: 'ST001', next: 'ST003' }, // ADI -> BRC
  ];
  const simpleTrains = slicedTrains.map((t, i) => {
    const p = pairs[i % pairs.length];
    const pos = stationById[p.current]?.position || t.position;
    return {
      ...t,
      currentStation: p.current,
      nextStation: p.next,
      position: pos,
      route: [p.current, p.next],
    };
  });
  const [isSimulationRunning, setIsSimulationRunning] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [selectedTrain, setSelectedTrain] = useState(simpleTrains[0]);
  const [aiEnabled, setAiEnabled] = useState(true);
  const [systemHealth, setSystemHealth] = useState(98.5);

  useEffect(() => {
    const interval = setInterval(() => {
      if (isSimulationRunning) {
        setCurrentTime(new Date(currentTime.getTime() + 60000)); // Add 1 minute
        
        // Update AI service with real-time data
        if (aiEnabled) {
          aiService.updateModel(simpleTrains);
        }
        
        // Simulate system health fluctuations
        setSystemHealth(prev => Math.max(95, Math.min(100, prev + (Math.random() - 0.5) * 2)));
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [isSimulationRunning, currentTime, aiEnabled]);

  useEffect(() => {
    // Initialize AI model on component mount
    const initializeAI = async () => {
      await aiService.trainModel(simpleTrains);
    };
    
    if (aiEnabled) {
      initializeAI();
    }
  }, [aiEnabled]);

  const toggleSimulation = () => {
    setIsSimulationRunning(!isSimulationRunning);
  };

  const resetSimulation = () => {
    setIsSimulationRunning(false);
    setCurrentTime(new Date());
  };

  const toggleAI = () => {
    setAiEnabled(!aiEnabled);
  };
  return (
    <div className="min-h-screen bg-background p-4 sm:p-6 space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="space-y-2">
          <h1 className="text-3xl lg:text-4xl font-bold bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">
            AI-Powered Gujarat Railway Control
          </h1>
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
            <p className="text-muted-foreground">
              Western Railway Zone - AI-Enhanced Control Room
            </p>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-success animate-pulse"></div>
              <span className="text-sm font-medium">System Health: {systemHealth.toFixed(1)}%</span>
            </div>
          </div>
        </div>
        
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="text-right">
            <p className="text-sm text-muted-foreground">System Time</p>
            <p className="font-mono text-lg font-semibold">{currentTime.toLocaleTimeString()}</p>
          </div>
          
          <div className="flex flex-wrap gap-2">
            <Button 
              variant={aiEnabled ? "default" : "outline"} 
              onClick={toggleAI}
              className="gap-2"
              size="sm"
            >
              {aiEnabled ? (
                <><Brain className="w-4 h-4" /> AI Active</>
              ) : (
                <><Zap className="w-4 h-4" /> Enable AI</>
              )}
            </Button>
            <Button 
              variant={isSimulationRunning ? "destructive" : "default"} 
              onClick={toggleSimulation}
              className="gap-2"
              size="sm"
            >
              {isSimulationRunning ? (
                <><Pause className="w-4 h-4" /> Pause</>
              ) : (
                <><Play className="w-4 h-4" /> Start</>
              )}
            </Button>
            <Button variant="outline" onClick={resetSimulation} className="gap-2" size="sm">
              <RotateCcw className="w-4 h-4" /> Reset
            </Button>
          </div>
        </div>
      </div>

      {/* AI Status Banner */}
      <Card className={`${aiEnabled ? 'border-success' : 'border-muted'}`}>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-3 h-3 rounded-full ${aiEnabled ? 'bg-success animate-pulse-glow' : 'bg-muted'}`}></div>
              <div>
                <h3 className={`font-semibold ${aiEnabled ? 'text-success' : 'text-muted-foreground'}`}>
                  {aiEnabled ? 'AI Optimization Active' : 'AI System Disabled'}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {aiEnabled 
                    ? 'Advanced ML algorithms optimizing traffic flow and predicting delays' 
                    : 'Manual control mode - Enable AI for automated optimization'
                  }
                </p>
              </div>
            </div>
            {aiEnabled && (
              <div className="flex gap-2">
                <Badge variant="outline" className="border-success text-success">
                  +{Math.floor(Math.random() * 10) + 20}% Throughput
                </Badge>
                <Badge variant="outline" className="border-primary text-primary">
                  {Math.floor(Math.random() * 5) + 95}% Accuracy
                </Badge>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Main Layout - Perfect Inline Alignment */}
      <div className="space-y-6">
        
        {/* Top Row - Network Map and Control Panels */}
        <div className="grid grid-cols-12 gap-4">
          {/* Left Section - Network Map (9 columns) */}
          <div className="col-span-12 lg:col-span-9">
            <SimpleLeafletMap 
              isRunning={isSimulationRunning}
              onTrainSelect={(t: any) => setSelectedTrain({ ...selectedTrain, id: t.id, name: t.name })}
            />
          </div>

          {/* Right Section - Control Panels (3 columns) */}
          <div className="col-span-12 lg:col-span-3 space-y-4">
            {aiEnabled && (
              <AIInsights trains={simpleTrains} conflicts={mockConflicts} />
            )}
            <ConflictAlerts conflicts={mockConflicts} />
            <TrainDetails train={selectedTrain} />
          </div>
        </div>

        {/* Bottom Row - Metrics and Analytics */}
        <div className="grid grid-cols-12 gap-4">
          {/* Enhanced Metrics Panel (8 columns) */}
          <div className="col-span-12 lg:col-span-8">
            <EnhancedMetricsPanels />
          </div>

          {/* AI Analytics Panel (4 columns) */}
          <div className="col-span-12 lg:col-span-4">
            {aiEnabled ? (
              <Card className="h-full">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Brain className="w-5 h-5" />
                    Predictive Analytics
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="p-3 border rounded-lg">
                      <div className="font-medium text-sm mb-2">Next Hour Forecast</div>
                      <div className="text-xs text-muted-foreground space-y-1">
                        <div>• Expected delays: {Math.floor(Math.random() * 3) + 1} trains</div>
                        <div>• Platform conflicts: {Math.floor(Math.random() * 2)} predicted</div>
                        <div>• Optimal rerouting: {Math.floor(Math.random() * 4) + 2} suggestions</div>
                        <div>• Fuel efficiency: +{Math.floor(Math.random() * 8) + 12}% improvement</div>
                      </div>
                    </div>
                    
                    <div className="p-3 border rounded-lg">
                      <div className="font-medium text-sm mb-2">ML Model Performance</div>
                      <div className="space-y-2">
                        <div className="flex justify-between text-xs">
                          <span>Delay Prediction</span>
                          <span className="text-success">{Math.floor(Math.random() * 5) + 94}%</span>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span>Route Optimization</span>
                          <span className="text-success">{Math.floor(Math.random() * 4) + 96}%</span>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span>Conflict Resolution</span>
                          <span className="text-success">{Math.floor(Math.random() * 3) + 97}%</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card className="border-dashed h-full">
                <CardContent className="pt-6 h-full flex items-center justify-center">
                  <div className="text-center p-8">
                    <Brain className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="font-semibold mb-2">AI Features Disabled</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Enable AI to access predictive analytics, automated optimization, and intelligent conflict resolution.
                    </p>
                    <Button onClick={toggleAI} className="gap-2">
                      <Zap className="w-4 h-4" />
                      Enable AI System
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Schedule Gantt - Full Width Bottom */}
        <div className="w-full">
          <ScheduleGantt 
            trains={simpleTrains}
            currentTime={currentTime}
            isRunning={isSimulationRunning}
          />
        </div>
      </div>
    </div>
  );
};