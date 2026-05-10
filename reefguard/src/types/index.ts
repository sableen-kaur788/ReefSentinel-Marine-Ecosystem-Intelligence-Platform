export interface HealthMetric {
  id: string;
  label: string;
  value: number;
  unit: string;
  trend: number;
  status: 'good' | 'warning' | 'critical';
}

export interface SegmentationClass {
  id: string;
  name: string;
  color: string;
  percentage: number;
  area: number;
}

export interface ReefAnalysis {
  id: string;
  imageUrl: string;
  segmentedUrl: string;
  timestamp: string;
  location?: string;
  healthScore: number;
  mortalityRisk: number;
  liveCoral: number;
  restorationPriority: 'low' | 'medium' | 'high' | 'critical';
  classes: SegmentationClass[];
  report: EcologicalReport;
}

export interface EcologicalReport {
  summary: string;
  findings: string[];
  recommendations: string[];
  citations: Citation[];
  riskAssessment: string;
}

export interface Citation {
  id: string;
  title: string;
  author: string;
  year: number;
  url?: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  citations?: Citation[];
}

export interface PipelineStep {
  id: string;
  label: string;
  description: string;
  status: 'pending' | 'active' | 'complete';
  progress: number;
}

export interface DashboardKPI {
  id: string;
  label: string;
  value: number;
  target: number;
  trend: number;
  unit: string;
}

export interface TrendData {
  date: string;
  healthScore: number;
  coralCover: number;
  mortalityRisk: number;
}

export type AnalysisStatus = 'idle' | 'uploading' | 'processing' | 'segmenting' | 'analyzing' | 'complete' | 'error';
