import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Brain, 
  TrendingUp, 
  Zap, 
  Target, 
  AlertTriangle,
  CheckCircle,
  Clock,
  BarChart3,
  Lightbulb,
  Activity
} from "lucide-react";
import { aiService, TrainPrediction, OptimizationSuggestion, AIMetrics } from "../services/aiService";
import { Train, Conflict } from "../data/mockData";

interface AIInsightsProps {
  trains: Train[];
  conflicts: Conflict[];
}

export const AIInsights = ({ trains, conflicts }: AIInsightsProps) => {
  const [predictions, setPredictions] = useState<TrainPrediction[]>([]);
  const [optimizations, setOptimizations] = useState<OptimizationSuggestion[]>([]);
  const [metrics, setMetrics] = useState<AIMetrics | null>(null);
  const [anomalies, setAnomalies] = useState<any[]>([]);
  const [isTraining, setIsTraining] = useState(false);

  useEffect(() => {
    const updateAIData = async () => {
      setPredictions(aiService.predictDelays(trains));
      setOptimizations(aiService.generateOptimizations(trains, conflicts));
      try {
        const m = await aiService.getMetrics();
        // ensure minimal required fields exist
        if (m && typeof m.accuracy === 'number' && typeof m.efficiency === 'number') {
          setMetrics(m as AIMetrics);
        }
      } catch (e) {
        // ignore and keep previous metrics
      }
      setAnomalies(aiService.detectAnomalies(trains));
      setIsTraining(aiService.isModelTraining());
    };

    updateAIData();
    const interval = setInterval(updateAIData, 5000); // Update every 5 seconds

    return () => clearInterval(interval);
  }, [trains, conflicts]);

  const handleTrainModel = async () => {
    setIsTraining(true);
    await aiService.trainModel(trains);
    setIsTraining(false);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'destructive';
      case 'high': return 'destructive';
      case 'medium': return 'default';
      case 'low': return 'secondary';
      default: return 'outline';
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'text-destructive';
      case 'high': return 'text-destructive';
      case 'medium': return 'text-accent';
      case 'low': return 'text-success';
      default: return 'text-muted-foreground';
    }
  };

  return (
    <Card className="h-[300px] flex flex-col">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2">
          <Brain className="w-5 h-5 text-primary" />
          AI Traffic Intelligence
          {isTraining && (
            <Badge variant="outline" className="animate-pulse">
              Training...
            </Badge>
          )}
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4 flex-1 overflow-y-auto custom-scrollbar">
        <Tabs defaultValue="metrics" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="metrics">Metrics</TabsTrigger>
            <TabsTrigger value="predictions">Predictions</TabsTrigger>
            <TabsTrigger value="optimizations">Optimize</TabsTrigger>
            <TabsTrigger value="anomalies">Anomalies</TabsTrigger>
          </TabsList>

          <TabsContent value="metrics" className="space-y-4">
            {metrics && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Model Accuracy</span>
                      <span className="text-sm font-mono">{metrics.accuracy.toFixed(1)}%</span>
                    </div>
                    <Progress value={metrics.accuracy} className="h-2" />
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">System Efficiency</span>
                      <span className="text-sm font-mono">{metrics.efficiency.toFixed(1)}%</span>
                    </div>
                    <Progress value={metrics.efficiency} className="h-2" />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4 text-center">
                  <div className="p-3 border rounded-lg">
                    <div className="text-2xl font-bold text-primary">{metrics.predictionsToday}</div>
                    <div className="text-xs text-muted-foreground">Predictions Today</div>
                  </div>
                  <div className="p-3 border rounded-lg">
                    <div className="text-2xl font-bold text-success">{metrics.conflictsResolved}</div>
                    <div className="text-xs text-muted-foreground">Conflicts Resolved</div>
                  </div>
                  <div className="p-3 border rounded-lg">
                    <div className="text-2xl font-bold text-accent">{metrics.timeSaved}min</div>
                    <div className="text-xs text-muted-foreground">Time Saved</div>
                  </div>
                </div>

                <Button 
                  onClick={handleTrainModel} 
                  disabled={isTraining}
                  className="w-full"
                  variant="outline"
                >
                  {isTraining ? (
                    <>
                      <Activity className="w-4 h-4 mr-2 animate-spin" />
                      Training Model...
                    </>
                  ) : (
                    <>
                      <Brain className="w-4 h-4 mr-2" />
                      Retrain AI Model
                    </>
                  )}
                </Button>
              </>
            )}
          </TabsContent>

          <TabsContent value="predictions" className="space-y-3 max-h-80 overflow-y-auto">
            {predictions.map(prediction => (
              <div key={prediction.trainId} className="p-3 border rounded-lg space-y-2">
                <div className="flex items-center justify-between">
                  <div className="font-medium">Train {trains.find(t => t.id === prediction.trainId)?.number}</div>
                  <Badge variant={prediction.predictedDelay > 15 ? "destructive" : "outline"}>
                    {prediction.predictedDelay > 0 ? `+${prediction.predictedDelay}min` : 'On Time'}
                  </Badge>
                </div>
                
                <div className="flex items-center gap-2">
                  <Target className="w-3 h-3" />
                  <span className="text-xs">Confidence: {prediction.confidence}%</span>
                  <Progress value={prediction.confidence} className="h-1 flex-1" />
                </div>
                
                <div className="text-xs text-muted-foreground">
                  <span className="font-medium">Factors:</span> {prediction.factors.join(', ')}
                </div>
              </div>
            ))}
          </TabsContent>

          <TabsContent value="optimizations" className="space-y-3 max-h-80 overflow-y-auto">
            {optimizations.map((opt, index) => (
              <div key={index} className="p-3 border rounded-lg space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Lightbulb className="w-4 h-4 text-accent" />
                    <span className="font-medium capitalize">{opt.type.replace('_', ' ')}</span>
                  </div>
                  <Badge variant={getPriorityColor(opt.priority)}>
                    {opt.priority.toUpperCase()}
                  </Badge>
                </div>
                
                <div className="text-sm text-muted-foreground">
                  Train {trains.find(t => t.id === opt.trainId)?.number}
                </div>
                
                <div className="text-sm">{opt.description}</div>
                
                <div className="flex items-center gap-2 text-xs">
                  <TrendingUp className="w-3 h-3 text-success" />
                  <span>Impact: {opt.impact} minutes saved</span>
                </div>
              </div>
            ))}
          </TabsContent>

          <TabsContent value="anomalies" className="space-y-3 max-h-80 overflow-y-auto">
            {anomalies.length === 0 ? (
              <div className="text-center p-6 text-muted-foreground">
                <CheckCircle className="w-8 h-8 mx-auto mb-2 text-success" />
                <div className="font-medium">No Anomalies Detected</div>
                <div className="text-sm">All systems operating normally</div>
              </div>
            ) : (
              anomalies.map((anomaly, index) => (
                <div key={index} className="p-3 border rounded-lg space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className={`w-4 h-4 ${getSeverityColor(anomaly.severity)}`} />
                      <span className="font-medium capitalize">{anomaly.type.replace('_', ' ')}</span>
                    </div>
                    <Badge variant={anomaly.severity === 'critical' ? 'destructive' : 'outline'}>
                      {anomaly.severity.toUpperCase()}
                    </Badge>
                  </div>
                  
                  <div className="text-sm text-muted-foreground">
                    Train {trains.find(t => t.id === anomaly.trainId)?.number}
                  </div>
                  
                  <div className="text-sm">{anomaly.description}</div>
                  
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Clock className="w-3 h-3" />
                    <span>{new Date(anomaly.timestamp).toLocaleTimeString()}</span>
                  </div>
                </div>
              ))
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};