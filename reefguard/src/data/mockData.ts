import type { 
  HealthMetric, 
  SegmentationClass, 
  ReefAnalysis, 
  ChatMessage, 
  PipelineStep,
  DashboardKPI,
  TrendData 
} from '../types';

export const heroMetrics: HealthMetric[] = [
  { id: '1', label: 'Reef Health', value: 73, unit: 'Index', trend: 5.2, status: 'good' },
  { id: '2', label: 'Live Coral Cover', value: 64, unit: '%', trend: -2.1, status: 'warning' },
  { id: '3', label: 'Bleaching Risk', value: 42, unit: '%', trend: 8.5, status: 'warning' },
  { id: '4', label: 'Restoration Priority', value: 85, unit: 'Score', trend: 12.3, status: 'critical' },
];

export const dashboardKPIs: DashboardKPI[] = [
  { id: '1', label: 'Health Index', value: 73, target: 80, trend: 5.2, unit: 'pts' },
  { id: '2', label: 'Coral Mortality Risk', value: 28, target: 20, trend: -3.5, unit: '%' },
  { id: '3', label: 'Live Coral %', value: 64, target: 75, trend: -2.1, unit: '%' },
  { id: '4', label: 'Restoration Priority', value: 85, target: 60, trend: 12.3, unit: 'score' },
];

export const segmentationClasses: SegmentationClass[] = [
  { id: '1', name: 'Hard Coral', color: '#ff6b6b', percentage: 42, area: 1250 },
  { id: '2', name: 'Soft Coral', color: '#4ecdc4', percentage: 18, area: 536 },
  { id: '3', name: 'Algae', color: '#95e1d3', percentage: 15, area: 446 },
  { id: '4', name: 'Sand/Rubble', color: '#f5e6d3', percentage: 20, area: 595 },
  { id: '5', name: 'Bleached Coral', color: '#ffe66d', percentage: 5, area: 149 },
];

export const pipelineSteps: PipelineStep[] = [
  { id: 'upload', label: 'Uploading', description: 'Receiving high-res imagery', status: 'pending', progress: 0 },
  { id: 'preprocess', label: 'Preprocessing', description: 'Enhancing image quality', status: 'pending', progress: 0 },
  { id: 'segment', label: 'Running Segmentation', description: 'AI classifying reef structures', status: 'pending', progress: 0 },
  { id: 'health', label: 'Computing Health Score', description: 'Analyzing coral conditions', status: 'pending', progress: 0 },
  { id: 'report', label: 'Generating Report', description: 'Compiling ecological insights', status: 'pending', progress: 0 },
];

export const mockAnalysis: ReefAnalysis = {
  id: 'analysis-001',
  imageUrl: '/background.avif',
  segmentedUrl: '/coral2.gif',
  timestamp: '2024-01-15T10:30:00Z',
  location: 'Great Barrier Reef, Australia',
  healthScore: 73,
  mortalityRisk: 28,
  liveCoral: 64,
  restorationPriority: 'high',
  classes: segmentationClasses,
  report: {
    summary: 'This reef segment shows moderate degradation with signs of recent thermal stress. Hard coral coverage at 42% is below optimal thresholds but shows resilience potential.',
    findings: [
      'Hard coral cover decreased 8% from baseline measurements',
      'Presence of early-stage bleaching in 5% of coral colonies',
      'Macroalgae coverage within acceptable limits (15%)',
      'No signs of disease or predation damage detected',
      'Structural complexity adequate for fish habitat',
    ],
    recommendations: [
      'Implement targeted water quality monitoring',
      'Consider assisted coral propagation in degraded zones',
      'Schedule follow-up assessment in 3 months',
      'Reduce local stressors (fishing, tourism) during recovery period',
    ],
    citations: [
      { id: '1', title: 'Global Coral Reef Monitoring Network Guidelines', author: 'Hughes et al.', year: 2023, url: '#' },
      { id: '2', title: 'Thermal Stress Indices for Coral Bleaching Prediction', author: 'McClanahan et al.', year: 2022, url: '#' },
    ],
    riskAssessment: 'Moderate risk of further degradation without intervention. Climate resilience strategies recommended.',
  },
};

export const mockChatHistory: ChatMessage[] = [
  {
    id: '1',
    role: 'assistant',
    content: 'Welcome to ReefSentinel Knowledge Assistant. I can help you understand coral reef health, restoration techniques, and provide ecological insights. What would you like to know?',
    timestamp: '2024-01-15T09:00:00Z',
  },
];

export function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export const trendData: TrendData[] = [
  { date: 'Jan', healthScore: 68, coralCover: 58, mortalityRisk: 32 },
  { date: 'Feb', healthScore: 70, coralCover: 60, mortalityRisk: 30 },
  { date: 'Mar', healthScore: 69, coralCover: 59, mortalityRisk: 31 },
  { date: 'Apr', healthScore: 72, coralCover: 62, mortalityRisk: 29 },
  { date: 'May', healthScore: 73, coralCover: 64, mortalityRisk: 28 },
  { date: 'Jun', healthScore: 75, coralCover: 66, mortalityRisk: 26 },
];

export const featureCards = [
  {
    id: '1',
    title: 'Segmentation Analytics',
    description: 'AI-powered pixel-perfect classification of reef structures with sub-meter accuracy.',
    icon: 'Scan',
    color: 'from-reef-coral/20 to-reef-coral/5',
  },
  {
    id: '2',
    title: 'Reef Health Scoring',
    description: 'Comprehensive health index based on coral cover, diversity, and stress indicators.',
    icon: 'Activity',
    color: 'from-reef-teal/20 to-reef-teal/5',
  },
  {
    id: '3',
    title: 'Ecological Reports',
    description: 'Automated scientific reports with findings, recommendations, and citations.',
    icon: 'FileText',
    color: 'from-amber-400/20 to-amber-400/5',
  },
  {
    id: '4',
    title: 'Knowledge Engine',
    description: 'RAG-powered assistant for reef ecology queries with verified research sources.',
    icon: 'Brain',
    color: 'from-purple-400/20 to-purple-400/5',
  },
  {
    id: '5',
    title: 'Restoration Guidance',
    description: 'AI-driven recommendations for coral propagation and reef rehabilitation.',
    icon: 'Sprout',
    color: 'from-emerald-400/20 to-emerald-400/5',
  },
];

export const howItWorksSteps = [
  {
    id: '1',
    title: 'Upload Image',
    description: 'Drag & drop high-resolution drone or satellite reef imagery',
    icon: 'Upload',
  },
  {
    id: '2',
    title: 'AI Segmentation',
    description: 'Deep learning model classifies coral, algae, sand, and bleached areas',
    icon: 'Scan',
  },
  {
    id: '3',
    title: 'Health KPIs',
    description: 'Automated scoring of reef vitality, mortality risk, and restoration needs',
    icon: 'Activity',
  },
  {
    id: '4',
    title: 'Ecological Report',
    description: 'Comprehensive scientific report with insights and recommendations',
    icon: 'FileCheck',
  },
];
