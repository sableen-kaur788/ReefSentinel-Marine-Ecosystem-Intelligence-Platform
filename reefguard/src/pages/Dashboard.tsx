import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import jsPDF from 'jspdf';
import {
  LayoutDashboard, Scan, FileText, TrendingUp, MessageSquare,
  Upload, X, CheckCircle2, Loader2, Download, Sparkles,
  Image as ImageIcon, FileDown, ChevronRight, ArrowLeft,
  Brain, PieChart, Activity, Eye
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { ProgressBar } from '../components/ui/ProgressBar';
import { Gauge } from '../components/ui/Gauge';
import { DonutChart } from '../components/ui/DonutChart';
import { Sparkline } from '../components/ui/Sparkline';
import { SegmentationLegend, SegmentationLegendDetailed } from '../components/ui/SegmentationLegend';
import { FloatingBubbles } from '../components/effects/FloatingBubbles';
import { FadeInUp } from '../components/animations/TextReveal';
import { useSegmentation, useDashboardData } from '../hooks/useMockApi';
import { dashboardKPIs, mockAnalysis } from '../data/mockData';

type NavTab = 'dashboard' | 'segmentation' | 'reports' | 'trends' | 'assistant';

interface DashboardProps {
  onNavigateToAssistant: () => void;
  onBack?: () => void;
}

function formatPixels(value: number): string {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(2)}M px`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K px`;
  return `${Math.round(value)} px`;
}

export function Dashboard({ onNavigateToAssistant, onBack }: DashboardProps) {
  const [activeTab, setActiveTab] = useState<NavTab>('dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  const { status, steps, result, uploadedImageUrl, isReportGenerating, progress, runSegmentation, reset } = useSegmentation();
  useDashboardData();

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files?.[0]) {
      const file = e.dataTransfer.files[0];
      if (file.type.startsWith('image/')) {
        runSegmentation(file);
      }
    }
  }, [runSegmentation]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      runSegmentation(e.target.files[0]);
    }
  }, [runSegmentation]);

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'segmentation', label: 'Run Segmentation', icon: Scan },
    { id: 'reports', label: 'Ecological Report', icon: FileText },
    { id: 'trends', label: 'Trends', icon: TrendingUp },
    { id: 'assistant', label: 'Knowledge Assistant', icon: MessageSquare },
  ];

  const getClassPct = (label: string) =>
    Number(result?.classes.find((c: any) => c.name.toLowerCase() === label.toLowerCase())?.percentage || 0);

  const waterPct = getClassPct('Water / Background');
  const livePct = getClassPct('Live Coral');
  const bleachedPct = getClassPct('Bleached Coral');
  const deadPct = getClassPct('Dead Coral');
  const algaePct = getClassPct('Algae');
  const stressSignalPct = bleachedPct + deadPct;

  // Use benthic-only health score (from backend, excludes water)
  const healthScore = result?.healthScore || 0;
  const priorityScore =
    healthScore >= 72 ? 25 :
    healthScore >= 50 ? 50 :
    healthScore >= 30 ? 85 : 95;

  const baseline = {
    healthScore: 70,
    mortalityRisk: 30,
    liveCoral: 20,
    restorationPriorityScore: 60,
  };
  const toPctDelta = (current: number, base: number) => ((current - base) / base) * 100;

  const downloadReportPdf = useCallback(() => {
    if (!result) return;
    const doc = new jsPDF();
    let y = 16;
    const lineGap = 7;
    const addLine = (text: string, options?: { bold?: boolean; indent?: number }) => {
      if (y > 280) {
        doc.addPage();
        y = 16;
      }
      doc.setFont('helvetica', options?.bold ? 'bold' : 'normal');
      doc.setFontSize(11);
      doc.text(text, 14 + (options?.indent || 0), y);
      y += lineGap;
    };

    addLine('ReefSentinel Ecological Report', { bold: true });
    addLine(`Analysis ID: ${result.id}`);
    addLine(`Date: ${new Date(result.timestamp).toLocaleString()}`);
    addLine('');
    addLine('KPI Snapshot (benthic-only, excludes water):', { bold: true });
    addLine(`- Health Score: ${healthScore}/100`);
    addLine(`- Mortality Signal (Dead + Bleached): ${Number(stressSignalPct).toFixed(1)}%`);
    addLine(`- Live Coral: ${Number(livePct).toFixed(1)}%`);
    addLine(`- Water / Background: ${Number(waterPct).toFixed(1)}%`);
    addLine('');
    addLine('Class Breakdown:', { bold: true });
    result.classes.forEach((cls: any) => {
      addLine(`- ${cls.name}: ${Number(cls.percentage).toFixed(1)}% (${formatPixels(cls.area)})`);
    });
    addLine('');
    addLine('Executive Summary:', { bold: true });
    const summaryLines = doc.splitTextToSize(result.report.summary || 'No summary available.', 180);
    summaryLines.forEach((line: string) => addLine(line));

    const filename = `reef-report-${result.id}.pdf`;
    doc.save(filename);
  }, [result, healthScore, stressSignalPct, livePct, waterPct]);

  return (
    <div className="flex h-screen bg-ocean-950 overflow-hidden">
      <FloatingBubbles count={8} className="opacity-30" />

      {/* Sidebar */}
      <motion.aside
        initial={false}
        animate={{ width: sidebarCollapsed ? 80 : 260 }}
        className="glass-panel border-r-0 border-t-0 border-b-0 flex flex-col z-20"
      >
        {/* Logo */}
        <div className="p-6 border-b border-slate-800/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-reef-cyan to-reef-cyanDark flex items-center justify-center flex-shrink-0">
              <Scan className="w-5 h-5 text-white" />
            </div>
            {!sidebarCollapsed && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <span className="font-bold text-lg text-white">Reef<span className="text-cyan-400">Sentinel</span></span>
                <p className="text-xs text-slate-500">Analytics Platform</p>
              </motion.div>
            )}
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                if (item.id === 'assistant') {
                  onNavigateToAssistant();
                } else {
                  setActiveTab(item.id as NavTab);
                }
              }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                activeTab === item.id
                  ? 'bg-gradient-to-r from-reef-cyan/20 to-transparent text-white border-l-2 border-reef-cyan'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
              }`}
            >
              <item.icon className={`w-5 h-5 flex-shrink-0 ${activeTab === item.id ? 'text-reef-cyan' : ''}`} />
              {!sidebarCollapsed && <span className="text-sm font-medium">{item.label}</span>}
            </button>
          ))}
        </nav>

        {/* Collapse Toggle */}
        <div className="p-4 border-t border-slate-800/50">
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="w-full flex items-center justify-center p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/50 transition-colors"
          >
            <ChevronRight className={`w-5 h-5 transition-transform ${sidebarCollapsed ? '' : 'rotate-180'}`} />
          </button>
        </div>
      </motion.aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <div className="p-8 max-w-7xl mx-auto">
          {/* Header */}
          <FadeInUp className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              {onBack && (
                <Button variant="ghost" size="sm" icon={ArrowLeft} onClick={onBack}>
                  Back
                </Button>
              )}
              <div>
                <h1 className="text-3xl font-bold font-display text-white">
                {activeTab === 'dashboard' && 'Dashboard'}
                {activeTab === 'segmentation' && 'Run Segmentation'}
                {activeTab === 'reports' && 'Ecological Reports'}
                {activeTab === 'trends' && 'Trends & Analytics'}
              </h1>
              <p className="text-slate-400 mt-1">
                {activeTab === 'dashboard' && 'Overview of reef health metrics and recent analyses'}
                {activeTab === 'segmentation' && 'Upload imagery to run AI-powered segmentation'}
                {activeTab === 'reports' && 'View and download generated ecological reports'}
                {activeTab === 'trends' && 'Track reef health trends over time'}
              </p>
              </div>
            </div>
            <Badge variant="info" icon={Sparkles} pulse>
              AI Ready
            </Badge>
          </FadeInUp>

          {/* KPI Cards - Only show when segmentation is complete */}
          {(activeTab === 'dashboard' || activeTab === 'trends') && result && (
            <FadeInUp delay={0.1}>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                <AnalysisKPICard 
                  label="Health Score"
                  value={Number(healthScore)}
                  unit="/100"
                  trend={Number(toPctDelta(healthScore, baseline.healthScore)).toFixed(1)}
                  color="teal"
                  icon={Activity}
                />
                <AnalysisKPICard 
                  label="Mortality Risk"
                  value={Number(stressSignalPct).toFixed(1)}
                  unit="%"
                  trend={Number(toPctDelta(stressSignalPct, baseline.mortalityRisk)).toFixed(1)}
                  color="coral"
                  icon={TrendingUp}
                />
                <AnalysisKPICard 
                  label="Live Coral"
                  value={Number(livePct).toFixed(1)}
                  unit="%"
                  trend={Number(toPctDelta(livePct, baseline.liveCoral)).toFixed(1)}
                  color="cyan"
                  icon={Scan}
                />
                <AnalysisKPICard 
                  label="Restoration Priority"
                  value={priorityScore}
                  unit="score"
                  trend={Number(toPctDelta(priorityScore, baseline.restorationPriorityScore)).toFixed(1)}
                  color={result.restorationPriority === 'low' ? 'teal' : result.restorationPriority === 'medium' ? 'yellow' : 'coral'}
                  icon={FileText}
                />
              </div>
            </FadeInUp>
          )}

          {/* Main Content Area - Based on Active Tab */}
          {activeTab === 'segmentation' && (
            <div className="space-y-6">
              <SegmentationView 
                uploadedImageUrl={uploadedImageUrl}
                result={result}
                status={status}
                steps={steps}
                progress={progress}
                handleDrag={handleDrag}
                handleDrop={handleDrop}
                handleFileSelect={handleFileSelect}
                dragActive={dragActive}
                runSegmentation={runSegmentation}
              />
            </div>
          )}

          {activeTab === 'reports' && (
            <div className="max-w-4xl mx-auto">
              <EcologicalReportView 
                result={result} 
                isReportGenerating={isReportGenerating}
                uploadedImageUrl={uploadedImageUrl}
                onDownloadPdf={downloadReportPdf}
              />
            </div>
          )}

          {activeTab === 'trends' && (
            <div className="space-y-6">
              <TrendsView result={result} />
            </div>
          )}

          {(activeTab === 'dashboard') && (
          <div className="grid grid-cols-1 gap-6">
            {/* Left/Center - Upload & Results */}
            <div className="space-y-6">
              {/* Upload Area */}
              <FadeInUp delay={0.2}>
                <Card variant="glass" className="p-6">
                  <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <Upload className="w-5 h-5 text-reef-cyan" />
                    Image Upload
                  </h3>

                  {uploadedImageUrl ? (
                    <div className="relative rounded-xl overflow-hidden border border-slate-700/60 bg-slate-900/40">
                      <img
                        src={uploadedImageUrl}
                        alt="Uploaded coral"
                        className="w-full h-auto max-h-[600px] object-contain mx-auto"
                      />
                      <div className="absolute top-3 left-3">
                        <Badge variant="info" className="text-xs">Uploaded image</Badge>
                      </div>
                      <label className="absolute top-3 right-3">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleFileSelect}
                          className="hidden"
                        />
                        <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-ocean-950/70 border border-slate-600 text-xs text-slate-200 cursor-pointer hover:border-reef-cyan/50">
                          Change image
                        </span>
                      </label>
                    </div>
                  ) : (
                    <div
                      onDragEnter={handleDrag}
                      onDragLeave={handleDrag}
                      onDragOver={handleDrag}
                      onDrop={handleDrop}
                      className={`relative border-2 border-dashed rounded-xl p-12 text-center transition-all duration-300 ${
                        dragActive
                          ? 'border-reef-cyan bg-reef-cyan/5'
                          : 'border-slate-700 hover:border-slate-600'
                      }`}
                    >
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleFileSelect}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      />
                      <div className="flex flex-col items-center gap-4">
                        <div className="w-16 h-16 rounded-2xl bg-slate-800/50 flex items-center justify-center">
                          <ImageIcon className="w-8 h-8 text-slate-500" />
                        </div>
                        <div>
                          <p className="text-white font-medium">Drop your reef image here</p>
                          <p className="text-slate-500 text-sm mt-1">
                            or click to browse (JPG, PNG, TIFF up to 50MB)
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Compact Pipeline Status - Shows Only Current Step */}
                  <AnimatePresence mode="wait">
                    {status !== 'idle' && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="mt-4"
                      >
                        <CompactPipelineStatus steps={steps} progress={progress} />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </Card>
              </FadeInUp>

              {/* Results Area */}
              <AnimatePresence>
                {(uploadedImageUrl || result) && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                  >
                    <Card variant="glass" className="p-8">
                      <div className="flex items-center justify-between mb-8">
                        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                          <CheckCircle2 className="w-5 h-5 text-reef-teal" />
                          Analysis Results
                        </h3>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm" icon={Download}>
                            Export
                          </Button>
                          <Button variant="outline" size="sm" icon={X} onClick={reset}>
                            Clear
                          </Button>
                        </div>
                      </div>

                      <div className="space-y-8">
                        {/* Segmented Image Only - Full Width */}
                        <div className="space-y-4">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-lg bg-reef-cyan/20 flex items-center justify-center">
                              <Scan className="w-4 h-4 text-reef-cyan" />
                            </div>
                            <span className="text-sm font-medium text-slate-300">AI Segmentation</span>
                            {result ? (
                              <Badge variant="success" size="sm" icon={CheckCircle2}>Complete</Badge>
                            ) : (
                              <Badge variant="info" size="sm" pulse>Processing</Badge>
                            )}
                          </div>
                    <div className="relative rounded-xl bg-slate-900 overflow-hidden border-2 border-reef-cyan/30 shadow-[0_0_30px_rgba(0,212,255,0.15)]">
                            {result ? (
                              <img
                                src={result.segmentedUrl}
                                alt="Segmented"
                                className="w-full h-auto max-h-[700px] object-contain mx-auto"
                              />
                            ) : (
                              <div className="w-full h-96 flex flex-col items-center justify-center gap-4 bg-gradient-to-br from-slate-800 via-slate-900 to-ocean-950 relative overflow-hidden">
                                <motion.div
                                  className="absolute inset-0 bg-gradient-to-b from-transparent via-reef-cyan/10 to-transparent"
                                  animate={{ y: ['-100%', '100%'] }}
                                  transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                                />
                                <div className="relative">
                                  <motion.div
                                    className="w-24 h-24 rounded-full border-2 border-reef-cyan/30"
                                    animate={{ scale: [1, 1.3, 1], opacity: [0.3, 0.6, 0.3] }}
                                    transition={{ duration: 2, repeat: Infinity }}
                                  />
                                  <div className="absolute inset-0 flex items-center justify-center">
                                    <Brain className="w-10 h-10 text-reef-cyan" />
                                  </div>
                                </div>
                                <div className="text-center z-10">
                                  <p className="text-lg text-white font-medium mb-1">AI Analyzing Reef...</p>
                                  <p className="text-sm text-slate-400">Detecting coral structures with neural networks</p>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Color Legend Section */}
                        {result && (
                          <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="pt-6 border-t border-slate-700/40"
                          >
                            <h4 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                              <Eye className="w-4 h-4 text-reef-cyan" />
                              Color Legend: Segmented Reef Components
                            </h4>
                            <p className="text-sm text-slate-400 mb-6">
                              The AI has classified the reef image into the following components. Each color represents a different type of reef structure.
                            </p>
                            <SegmentationLegend classes={result.classes} layout="grid" />
                          </motion.div>
                        )}
                      </div>

                      {/* Analysis Results Dashboard */}
                      {result && (
                        <motion.div
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="xl:col-span-2"
                        >
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {/* Coral Classification Breakdown with Detailed Legend */}
                            <div className="md:col-span-1">
                              <div className="rounded-xl border border-slate-700/40 bg-gradient-to-br from-slate-900/80 to-slate-900/40 p-5 h-full">
                                <div className="flex items-center gap-2 mb-4">
                                  <PieChart className="w-5 h-5 text-reef-cyan" />
                                  <h4 className="text-sm font-semibold text-white">Coral Classification</h4>
                                </div>
                                <div className="flex items-center justify-center mb-4">
                                  <DonutChart data={result.classes} size={180} />
                                </div>
                                <SegmentationLegendDetailed classes={result.classes} />
                              </div>
                            </div>

                            {/* Health Score & Metrics */}
                            <div className="md:col-span-1">
                              <div className="rounded-xl border border-slate-700/40 bg-gradient-to-br from-slate-900/80 to-slate-900/40 p-5 h-full">
                                <div className="flex items-center gap-2 mb-4">
                                  <Activity className="w-5 h-5 text-reef-teal" />
                                  <h4 className="text-sm font-semibold text-white">Health Metrics</h4>
                                </div>
                                
                                {/* Health Score Gauge */}
                                <div className="flex items-center justify-center mb-6">
                                  <div className="relative">
                                    <Gauge value={Number(healthScore)} size="lg" showLabel={false} />
                                    <div className="absolute inset-0 flex items-center justify-center">
                                      <div className="text-center">
                                        <span className="text-3xl font-bold text-white">{Number(healthScore)}</span>
                                        <p className="text-xs text-slate-400">Health Score</p>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                                
                                {/* Risk Badge */}
                                <div className="flex items-center justify-between p-3 rounded-lg bg-slate-800/50 mb-3">
                                  <span className="text-sm text-slate-400">Restoration Priority</span>
                                  <Badge 
                                    variant={result.restorationPriority === 'low' ? 'success' : result.restorationPriority === 'medium' ? 'warning' : 'danger'}
                                  >
                                    {result.restorationPriority.charAt(0).toUpperCase() + result.restorationPriority.slice(1)}
                                  </Badge>
                                </div>
                                
                                {/* Status */}
                                <div className="flex items-center justify-between p-3 rounded-lg bg-slate-800/50">
                                  <span className="text-sm text-slate-400">Overall Status</span>
                                  <span className={`text-sm font-medium ${result.healthScore > 70 ? 'text-reef-teal' : result.healthScore > 40 ? 'text-yellow-400' : 'text-reef-coral'}`}>
                                    {result.healthScore > 70 ? 'Healthy' : result.healthScore > 40 ? 'Stressed' : 'Critical'}
                                  </span>
                                </div>
                              </div>
                            </div>

                            {/* Detection Summary */}
                            <div className="md:col-span-1">
                              <div className="rounded-xl border border-slate-700/40 bg-gradient-to-br from-slate-900/80 to-slate-900/40 p-5 h-full">
                                <div className="flex items-center gap-2 mb-4">
                                  <Eye className="w-5 h-5 text-reef-coral" />
                                  <h4 className="text-sm font-semibold text-white">Detection Summary</h4>
                                </div>
                                
                                <div className="space-y-4">
                                  <div className="p-3 rounded-lg bg-gradient-to-r from-reef-teal/10 to-transparent border-l-2 border-reef-teal">
                                    <p className="text-xs text-slate-400 mb-1">Coral Coverage</p>
                                    <p className="text-xl font-bold text-white">
                                      {Number(result.classes.filter(c => c.name.toLowerCase().includes('coral')).reduce((sum, c) => sum + c.percentage, 0)).toFixed(1)}%
                                    </p>
                                  </div>
                                  
                                  <div className="p-3 rounded-lg bg-gradient-to-r from-reef-cyan/10 to-transparent border-l-2 border-reef-cyan">
                                    <p className="text-xs text-slate-400 mb-1">Detected Classes</p>
                                    <p className="text-xl font-bold text-white">{result.classes.length}</p>
                                  </div>
                                  
                                  <div className="p-3 rounded-lg bg-gradient-to-r from-purple-500/10 to-transparent border-l-2 border-purple-500">
                                    <p className="text-xs text-slate-400 mb-1">Analysis Confidence</p>
                                    <p className="text-xl font-bold text-white">94%</p>
                                  </div>
                                  
                                  <div className="p-3 rounded-lg bg-slate-800/50">
                                    <p className="text-xs text-slate-500 mb-2">Dominant Species</p>
                                    <div className="flex items-center gap-2">
                                      <div 
                                        className="w-3 h-3 rounded-full"
                                        style={{ backgroundColor: result.classes[0]?.color }}
                                      />
                                      <span className="text-sm text-white font-medium">
                                        {result.classes[0]?.name} ({Number(result.classes[0]?.percentage).toFixed(1)}%)
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </Card>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

          </div>
          )}
        </div>
      </main>
    </div>
  );
}

// Segmentation View Component - Shows only upload and segmentation results
function SegmentationView({
  uploadedImageUrl, result, status, steps, progress,
  handleDrag, handleDrop, handleFileSelect, dragActive
}: {
  uploadedImageUrl: string | null;
  result: any;
  status: string;
  steps: any[];
  progress: number;
  handleDrag: (e: React.DragEvent) => void;
  handleDrop: (e: React.DragEvent) => void;
  handleFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  dragActive: boolean;
  runSegmentation: (file: File) => void;
}) {
  return (
    <FadeInUp>
      <div className="space-y-6">
        {/* Upload Area */}
        {!uploadedImageUrl ? (
          <Card variant="glass" className="p-8">
            <h3 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
              <Scan className="w-5 h-5 text-reef-cyan" />
              AI Segmentation Engine
            </h3>
            <div
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              className={`relative border-2 border-dashed rounded-xl p-16 text-center transition-all duration-300 ${
                dragActive
                  ? 'border-reef-cyan bg-reef-cyan/5'
                  : 'border-slate-700 hover:border-slate-600'
              }`}
            >
              <input
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              <div className="space-y-4">
                <div className="w-20 h-20 rounded-2xl bg-slate-800/50 flex items-center justify-center mx-auto">
                  <Upload className="w-10 h-10 text-slate-500" />
                </div>
                <div>
                  <p className="text-xl text-white font-medium">Drop your reef image here</p>
                  <p className="text-slate-500 text-sm mt-2">
                    or click to browse (JPG, PNG, TIFF up to 50MB)
                  </p>
                </div>
              </div>
            </div>
          </Card>
        ) : (
          <>
            {/* Pipeline Status */}
            {status !== 'idle' && status !== 'complete' && (
              <CompactPipelineStatus steps={steps} progress={progress} />
            )}

            {/* Full Width Segmentation Results */}
            {result && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                {/* Large Image Comparison */}
                <Card variant="glass" className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                      <Scan className="w-5 h-5 text-reef-cyan" />
                      Segmentation Results
                    </h3>
                    <label>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleFileSelect}
                        className="hidden"
                      />
                      <span className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-800/70 border border-slate-600 text-sm text-slate-200 cursor-pointer hover:border-reef-cyan/50 transition-colors">
                        <Upload className="w-4 h-4" />
                        Upload New Image
                      </span>
                    </label>
                  </div>

                  {/* Segmented Image - Full Width */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-8 h-8 rounded-lg bg-reef-cyan/20 flex items-center justify-center">
                        <Scan className="w-4 h-4 text-reef-cyan" />
                      </div>
                      <span className="text-sm font-medium text-slate-300">AI Segmentation</span>
                      <Badge variant="success" size="sm" icon={CheckCircle2}>Complete</Badge>
                    </div>
                    <div className="relative rounded-xl bg-slate-900 overflow-hidden border-2 border-reef-cyan/30 shadow-[0_0_30px_rgba(0,212,255,0.1)]">
                      <img
                        src={result.segmentedUrl}
                        alt="Segmented"
                        className="w-full h-auto max-h-[700px] object-contain mx-auto"
                      />
                    </div>
                  </div>

                  {/* Color Legend - Below Images */}
                  <div className="mt-6 pt-6 border-t border-slate-700/40">
                    <h4 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                      <Eye className="w-4 h-4 text-reef-cyan" />
                      Segmentation Color Legend
                    </h4>
                    <p className="text-sm text-slate-400 mb-10">
                      Each color represents a different reef component detected by the AI. The percentages indicate the area coverage of each component.
                    </p>
                    <SegmentationLegend classes={result.classes} layout="grid" />
                  </div>
                </Card>

                {/* Detailed Class Breakdown */}
                <Card variant="glass" className="p-6 mt-8">
                  <h4 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <PieChart className="w-5 h-5 text-reef-cyan" />
                    Detailed Class Analysis
                  </h4>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Left: Detailed Legend with Progress Bars */}
                    <SegmentationLegendDetailed classes={result.classes} />

                    {/* Right: Donut Chart */}
                    <div className="flex flex-col items-center justify-center">
                      <DonutChart data={result.classes} size={250} />
                      <p className="text-sm text-slate-400 mt-4 text-center">
                        Total analyzed reef area distribution
                      </p>
                    </div>
                  </div>
                </Card>

                {/* Summary Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {result.classes.map((cls: any) => (
                    <motion.div
                      key={cls.id}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="p-4 rounded-xl bg-slate-800/40 border border-slate-700/30"
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <div
                          className="w-4 h-4 rounded"
                          style={{ backgroundColor: cls.color }}
                        />
                        <span className="text-xs text-slate-400">{cls.name}</span>
                      </div>
                      <p className="text-2xl font-bold text-white">{cls.percentage.toFixed(1)}%</p>
                      <p className="text-xs text-slate-500">{formatPixels(cls.area)}</p>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Upload Preview (when no result yet) */}
            {uploadedImageUrl && !result && (
              <Card variant="glass" className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-white">Uploaded Image</h3>
                  <label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileSelect}
                      className="hidden"
                    />
                    <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800/70 border border-slate-600 text-xs text-slate-200 cursor-pointer hover:border-reef-cyan/50">
                      <Upload className="w-3 h-3" />
                      Change Image
                    </span>
                  </label>
                </div>
                <div className="relative rounded-xl overflow-hidden border border-slate-700/60" style={{ maxHeight: '500px' }}>
                  <img
                    src={uploadedImageUrl}
                    alt="Uploaded coral"
                    className="w-full h-full object-contain"
                    style={{ maxHeight: '500px' }}
                  />
                </div>
              </Card>
            )}
          </>
        )}
      </div>
    </FadeInUp>
  );
}

// Parse markdown report into structured sections
function parseMarkdownReport(markdown: string): {
  executiveSummary: string;
  keyFindings: string[];
  recommendations: string[];
  riskAssessment: string;
} {
  if (!markdown || markdown === 'Generating ecological report...') {
    return {
      executiveSummary: markdown,
      keyFindings: [],
      recommendations: [],
      riskAssessment: '',
    };
  }

  const sections = {
    executiveSummary: '',
    keyFindings: [] as string[],
    recommendations: [] as string[],
    riskAssessment: '',
  };

  // Try to extract sections from markdown
  const lines = markdown.split('\n');
  let currentSection = '';

  for (const line of lines) {
    const trimmedLine = line.trim();

    // Check for headers
    if (trimmedLine.match(/^#+\s*executive\s*summary/i)) {
      currentSection = 'executiveSummary';
      continue;
    }
    if (trimmedLine.match(/^#+\s*key\s*findings?/i)) {
      currentSection = 'keyFindings';
      continue;
    }
    if (trimmedLine.match(/^#+\s*recommendations?/i)) {
      currentSection = 'recommendations';
      continue;
    }
    if (trimmedLine.match(/^#+\s*risk\s*assessment/i)) {
      currentSection = 'riskAssessment';
      continue;
    }

    // Skip empty lines and headers
    if (!trimmedLine || trimmedLine.startsWith('#')) {
      continue;
    }

    // Add content to current section
    if (currentSection === 'executiveSummary') {
      sections.executiveSummary += (sections.executiveSummary ? '\n' : '') + trimmedLine;
    } else if (currentSection === 'keyFindings') {
      // Check for list items
      if (trimmedLine.match(/^[-*•\d.]\s+/)) {
        sections.keyFindings.push(trimmedLine.replace(/^[-*•\d.]\s+/, ''));
      } else if (trimmedLine) {
        sections.keyFindings.push(trimmedLine);
      }
    } else if (currentSection === 'recommendations') {
      if (trimmedLine.match(/^[-*•\d.]\s+/)) {
        sections.recommendations.push(trimmedLine.replace(/^[-*•\d.]\s+/, ''));
      } else if (trimmedLine) {
        sections.recommendations.push(trimmedLine);
      }
    } else if (currentSection === 'riskAssessment') {
      sections.riskAssessment += (sections.riskAssessment ? '\n' : '') + trimmedLine;
    }
  }

  // If no structured sections found, treat entire markdown as summary
  if (!sections.executiveSummary && !sections.keyFindings.length && !sections.recommendations.length) {
    sections.executiveSummary = markdown;
  }

  return sections;
}

function cleanReportText(text: string): string {
  if (!text) return '';
  return text
    .replace(/^#{1,6}\s*/gm, '')
    .replace(/^[-*]\s+/gm, '• ')
    .trim();
}

// Ecological Report View Component - Shows full report
function EcologicalReportView({
  result, isReportGenerating, uploadedImageUrl, onDownloadPdf
}: {
  result: any;
  isReportGenerating: boolean;
  uploadedImageUrl: string | null;
  onDownloadPdf: () => void;
}) {
  // Parse the markdown report if available
  const parsedReport = result?.report?.summary
    ? parseMarkdownReport(result.report.summary)
    : null;

  return (
    <FadeInUp>
      <Card variant="glass" className="p-8">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-reef-cyan/20 to-reef-teal/10 flex items-center justify-center">
            <FileText className="w-6 h-6 text-reef-cyan" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white">Ecological Assessment Report</h2>
            <p className="text-slate-400">Generated by ReefSentinel AI</p>
          </div>
        </div>

        {!result ? (
          <div className="relative overflow-hidden">
            {/* Animated background */}
            <div className="absolute inset-0 opacity-10">
              <motion.div
                className="absolute inset-0"
                style={{
                  background: 'radial-gradient(circle at 30% 70%, rgba(0,212,255,0.3) 0%, transparent 50%), radial-gradient(circle at 70% 30%, rgba(0,201,167,0.3) 0%, transparent 50%)',
                }}
                animate={{ scale: [1, 1.2, 1], rotate: [0, 180, 360] }}
                transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
              />
            </div>

            <div className="relative z-10 py-16 px-8 text-center">
              {/* Animated document icon with coral */}
              <div className="relative w-32 h-32 mx-auto mb-6">
                {/* Floating circles */}
                <motion.div
                  className="absolute inset-0 rounded-full border-2 border-reef-cyan/20"
                  animate={{ scale: [1, 1.1, 1], opacity: [0.3, 0.6, 0.3] }}
                  transition={{ duration: 3, repeat: Infinity }}
                />
                <motion.div
                  className="absolute inset-2 rounded-full border-2 border-reef-teal/20"
                  animate={{ scale: [1, 1.15, 1], opacity: [0.3, 0.5, 0.3] }}
                  transition={{ duration: 3, repeat: Infinity, delay: 0.5 }}
                />

                {/* Central icon container */}
                <motion.div
                  className="absolute inset-4 rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900 flex flex-col items-center justify-center border border-slate-700"
                  animate={{ y: [0, -5, 0] }}
                  transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                >
                  <FileText className="w-10 h-10 text-reef-cyan mb-2" />
                  {/* Animated coral lines */}
                  <div className="flex gap-1">
                    <motion.div
                      className="w-1 h-4 bg-reef-cyan/40 rounded-full"
                      animate={{ height: [16, 24, 16] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                    />
                    <motion.div
                      className="w-1 h-6 bg-reef-teal/40 rounded-full"
                      animate={{ height: [24, 16, 24] }}
                      transition={{ duration: 1.5, repeat: Infinity, delay: 0.3 }}
                    />
                    <motion.div
                      className="w-1 h-4 bg-reef-cyan/40 rounded-full"
                      animate={{ height: [16, 20, 16] }}
                      transition={{ duration: 1.5, repeat: Infinity, delay: 0.6 }}
                    />
                  </div>
                </motion.div>
              </div>

              <motion.h3
                className="text-2xl font-bold text-white mb-3"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                Generate Your First Report
              </motion.h3>

              <motion.p
                className="text-slate-400 max-w-md mx-auto mb-8"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
              >
                Upload a reef image and our AI will analyze coral health, detect species, and generate a comprehensive ecological assessment.
              </motion.p>

              {/* Feature highlights */}
              <motion.div
                className="grid grid-cols-3 gap-4 max-w-lg mx-auto mb-8"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                {[
                  { icon: Scan, label: 'AI Segmentation', desc: 'Detect coral species' },
                  { icon: Activity, label: 'Health Scoring', desc: 'Assess reef condition' },
                  { icon: FileText, label: 'Full Report', desc: 'Ecological insights' },
                ].map((item, i) => (
                  <div key={i} className="p-4 rounded-xl bg-slate-800/30 border border-slate-700/30">
                    <item.icon className="w-6 h-6 text-reef-cyan mx-auto mb-2" />
                    <p className="text-sm font-medium text-white">{item.label}</p>
                    <p className="text-xs text-slate-500">{item.desc}</p>
                  </div>
                ))}
              </motion.div>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
              >
                <p className="text-sm text-slate-500">
                  Go to <span className="text-reef-cyan font-medium">Run Segmentation</span> to get started
                </p>
              </motion.div>
            </div>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Report Header */}
            <div className="flex items-start justify-between pb-6 border-b border-slate-800">
              <div>
                <p className="text-sm text-slate-400 mb-1">Analysis ID</p>
                <p className="text-lg font-mono text-white">{result.id}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-slate-400 mb-1">Date</p>
                <p className="text-lg text-white">{new Date(result.timestamp).toLocaleDateString()}</p>
              </div>
            </div>

            {/* Executive Summary */}
            <div className="rounded-xl bg-gradient-to-br from-slate-800/50 to-slate-900/30 p-6 border border-slate-700/40">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Brain className="w-5 h-5 text-reef-cyan" />
                Executive Summary
              </h3>
              <div className="text-slate-300 leading-relaxed whitespace-pre-line">
                {cleanReportText(parsedReport?.executiveSummary || result.report.summary)}
              </div>
            </div>

            {/* Key Metrics Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-4 rounded-xl bg-slate-800/30 border border-slate-700/30">
                <p className="text-sm text-slate-400 mb-1">Health Score</p>
                <p className="text-3xl font-bold text-reef-teal">{result.healthScore}</p>
                <p className="text-xs text-slate-500">/100 points</p>
              </div>
              <div className="p-4 rounded-xl bg-slate-800/30 border border-slate-700/30">
                <p className="text-sm text-slate-400 mb-1">Mortality Risk</p>
                <p className="text-3xl font-bold text-reef-coral">{result.mortalityRisk}%</p>
                <p className="text-xs text-slate-500">Probability</p>
              </div>
              <div className="p-4 rounded-xl bg-slate-800/30 border border-slate-700/30">
                <p className="text-sm text-slate-400 mb-1">Live Coral</p>
                <p className="text-3xl font-bold text-reef-cyan">{result.liveCoral.toFixed(1)}%</p>
                <p className="text-xs text-slate-500">Coverage</p>
              </div>
              <div className="p-4 rounded-xl bg-slate-800/30 border border-slate-700/30">
                <p className="text-sm text-slate-400 mb-1">Priority</p>
                <p className="text-xl font-bold text-white capitalize">{result.restorationPriority}</p>
                <Badge
                  variant={result.restorationPriority === 'low' ? 'success' : result.restorationPriority === 'medium' ? 'warning' : 'danger'}
                  size="sm"
                >
                  {result.restorationPriority.toUpperCase()}
                </Badge>
              </div>
            </div>

            {/* Findings & Recommendations */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Key Findings */}
              <div className="rounded-xl bg-gradient-to-br from-reef-cyan/5 to-transparent p-6 border border-reef-cyan/20">
                <h4 className="text-sm font-semibold text-reef-cyan mb-4 flex items-center gap-2">
                  <Scan className="w-4 h-4" />
                  Key Findings
                </h4>
                {parsedReport?.keyFindings && parsedReport.keyFindings.length > 0 ? (
                  <ul className="space-y-3">
                    {parsedReport.keyFindings.map((finding: string, i: number) => (
                      <li key={i} className="text-sm text-slate-300 flex gap-3">
                        <span className="text-reef-cyan font-bold">{i + 1}.</span>
                        {finding}
                      </li>
                    ))}
                  </ul>
                ) : result.report.findings && result.report.findings.length > 0 ? (
                  <ul className="space-y-3">
                    {result.report.findings.map((finding: string, i: number) => (
                      <li key={i} className="text-sm text-slate-300 flex gap-3">
                        <span className="text-reef-cyan font-bold">{i + 1}.</span>
                        {finding}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-slate-400 italic">No specific findings available.</p>
                )}
              </div>

              {/* Recommendations */}
              <div className="rounded-xl bg-gradient-to-br from-reef-teal/5 to-transparent p-6 border border-reef-teal/20">
                <h4 className="text-sm font-semibold text-reef-teal mb-4 flex items-center gap-2">
                  <Sparkles className="w-4 h-4" />
                  Recommendations
                </h4>
                {parsedReport?.recommendations && parsedReport.recommendations.length > 0 ? (
                  <ul className="space-y-3">
                    {parsedReport.recommendations.map((rec: string, i: number) => (
                      <li key={i} className="text-sm text-slate-300 flex gap-3">
                        <span className="text-reef-teal">→</span>
                        {rec}
                      </li>
                    ))}
                  </ul>
                ) : result.report.recommendations && result.report.recommendations.length > 0 ? (
                  <ul className="space-y-3">
                    {result.report.recommendations.map((rec: string, i: number) => (
                      <li key={i} className="text-sm text-slate-300 flex gap-3">
                        <span className="text-reef-teal">→</span>
                        {rec}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-slate-400 italic">No recommendations available.</p>
                )}
              </div>
            </div>

            {/* Risk Assessment */}
            <div className="rounded-xl bg-gradient-to-r from-reef-coral/5 via-slate-800/30 to-reef-coral/5 p-6 border border-reef-coral/20">
              <h4 className="text-sm font-semibold text-reef-coral mb-3 flex items-center gap-2">
                <Activity className="w-4 h-4" />
                Risk Assessment
              </h4>
              <p className="text-slate-300">
                {parsedReport?.riskAssessment || result.report.riskAssessment || 'Risk assessment pending...'}
              </p>
            </div>

            {/* Segmentation Data Reference */}
            <div className="rounded-xl bg-slate-800/30 border border-slate-700/30 p-6">
              <h4 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                <PieChart className="w-4 h-4 text-reef-cyan" />
                Segmentation Analysis Data
              </h4>
              <SegmentationLegend classes={result.classes} layout="grid" showArea={true} />
            </div>

            {/* Actions */}
            <div className="flex gap-4 pt-4">
              <Button fullWidth icon={FileDown} onClick={onDownloadPdf}>
                Download PDF Report
              </Button>
              <Button variant="outline" icon={Download}>
                Export Data
              </Button>
            </div>
          </div>
        )}

        {/* Report Generating State */}
        {isReportGenerating && (
          <div className="mt-8 rounded-xl border border-reef-cyan/30 bg-gradient-to-br from-reef-cyan/10 via-slate-900/50 to-reef-coral/10 p-6 relative overflow-hidden">
            <motion.div
              className="absolute inset-0 opacity-20"
              style={{ background: 'linear-gradient(90deg, transparent, rgba(0,212,255,0.3), transparent)' }}
              animate={{ x: ['-100%', '100%'] }}
              transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
            />
            <div className="relative z-10 flex items-center gap-4">
              <motion.div
                className="w-12 h-12 rounded-xl bg-gradient-to-br from-reef-cyan to-reef-teal flex items-center justify-center"
                animate={{ rotate: [0, 360] }}
                transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
              >
                <Sparkles className="w-6 h-6 text-white" />
              </motion.div>
              <div>
                <p className="text-white font-medium">Generating AI Report...</p>
                <p className="text-sm text-slate-400">Composing ecological insights</p>
              </div>
            </div>
          </div>
        )}
      </Card>
    </FadeInUp>
  );
}

// Trends View Component - Shows analytics charts
function TrendsView({ result }: { result: any }) {
  // Always keep trends visible; fall back to sample analysis when no result.
  const safeResult = result || mockAnalysis;
  const coralClasses = safeResult?.classes || [];
  
  return (
    <FadeInUp>
      <div className="space-y-6">
        {/* Header */}
        <Card variant="glass" className="p-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-reef-cyan/20 to-reef-teal/10 flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-reef-cyan" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">Trends & Analytics</h2>
              <p className="text-slate-400">Visual analysis of reef composition</p>
            </div>
          </div>
        </Card>

        {!result && (
          <Card variant="glass" className="p-4 border border-amber-400/30">
            <p className="text-sm text-amber-300">
              Showing sample trends. Run segmentation to view trends from your latest uploaded image.
            </p>
          </Card>
        )}
        <>
            {/* Charts Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Donut Chart */}
              <Card variant="glass" className="p-6">
                <h3 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
                  <PieChart className="w-5 h-5 text-reef-cyan" />
                  Coral Composition
                </h3>
                <div className="flex items-center justify-center py-4">
                  <DonutChart data={safeResult.classes} size={280} />
                </div>
              </Card>

              {/* Class Distribution Bars */}
              <Card variant="glass" className="p-6">
                <h3 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
                  <Activity className="w-5 h-5 text-reef-teal" />
                  Coverage Distribution
                </h3>
                <div className="space-y-4">
                  {safeResult.classes.map((cls: any, idx: number) => (
                    <motion.div
                      key={cls.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.1 }}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: cls.color }}
                          />
                          <span className="text-sm text-slate-300">{cls.name}</span>
                        </div>
                        <span className="text-sm font-medium text-white">{Number(cls.percentage).toFixed(1)}%</span>
                      </div>
                      <div className="h-3 bg-slate-800 rounded-full overflow-hidden">
                        <motion.div
                          className="h-full rounded-full"
                          style={{ backgroundColor: cls.color }}
                          initial={{ width: 0 }}
                          animate={{ width: `${cls.percentage}%` }}
                          transition={{ duration: 1, delay: idx * 0.1 + 0.3 }}
                        />
                      </div>
                      <p className="text-xs text-slate-500 mt-1">{formatPixels(cls.area)} area</p>
                    </motion.div>
                  ))}
                </div>
              </Card>
            </div>

            {/* Health Score Analysis */}
            <Card variant="glass" className="p-6">
              <h3 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
                <Activity className="w-5 h-5 text-reef-cyan" />
                Health Analysis
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="flex items-center justify-center">
                  <div className="relative">
                    <Gauge value={Number(safeResult.healthScore)} size="lg" showLabel={false} />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-center">
                        <span className="text-4xl font-bold text-white">{Number(safeResult.healthScore)}</span>
                        <p className="text-xs text-slate-400">Health Score</p>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="md:col-span-2 space-y-4">
                  <div className="p-4 rounded-xl bg-gradient-to-r from-reef-teal/10 to-transparent border-l-4 border-reef-teal">
                    <p className="text-sm text-slate-400">Overall Status</p>
                    <p className="text-xl font-semibold text-white">
                      {safeResult.healthScore > 70 ? 'Healthy Ecosystem' : safeResult.healthScore > 40 ? 'Stressed System' : 'Critical Condition'}
                    </p>
                  </div>
                  <div className="p-4 rounded-xl bg-gradient-to-r from-reef-coral/10 to-transparent border-l-4 border-reef-coral">
                    <p className="text-sm text-slate-400">Mortality Risk</p>
                    <p className="text-xl font-semibold text-white">{safeResult.mortalityRisk}% Risk Level</p>
                  </div>
                  <div className="p-4 rounded-xl bg-gradient-to-r from-reef-cyan/10 to-transparent border-l-4 border-reef-cyan">
                    <p className="text-sm text-slate-400">Restoration Priority</p>
                    <p className="text-xl font-semibold text-white capitalize">{safeResult.restorationPriority} Priority</p>
                  </div>
                </div>
              </div>
            </Card>

            {/* Statistics Summary */}
            <Card variant="glass" className="p-6">
              <h3 className="text-lg font-semibold text-white mb-6">Detection Statistics</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-4 rounded-xl bg-slate-800/30">
                  <p className="text-3xl font-bold text-reef-cyan">{safeResult.classes.length}</p>
                  <p className="text-sm text-slate-400">Classes Detected</p>
                </div>
                <div className="text-center p-4 rounded-xl bg-slate-800/30">
                  <p className="text-3xl font-bold text-reef-teal">
                    {Number(safeResult.classes.filter((c: any) => c.name.toLowerCase().includes('coral')).reduce((sum: number, c: any) => sum + c.percentage, 0)).toFixed(1)}%
                  </p>
                  <p className="text-sm text-slate-400">Total Coral</p>
                </div>
                <div className="text-center p-4 rounded-xl bg-slate-800/30">
                  <p className="text-3xl font-bold text-reef-coral">{Number(safeResult.liveCoral).toFixed(1)}%</p>
                  <p className="text-sm text-slate-400">Live Coral</p>
                </div>
                <div className="text-center p-4 rounded-xl bg-slate-800/30">
                  <p className="text-3xl font-bold text-purple-400">94%</p>
                  <p className="text-sm text-slate-400">AI Confidence</p>
                </div>
              </div>
            </Card>
          </>
      </div>
    </FadeInUp>
  );
}

function AnalysisKPICard({ 
  label, value, unit, trend, color, icon: Icon 
}: { 
  label: string; 
  value: string | number; 
  unit: string; 
  trend: number | string; 
  color: 'teal' | 'coral' | 'cyan' | 'yellow';
  icon: any;
}) {
  const trendNum = typeof trend === 'string' ? parseFloat(trend) : trend;
  const isPositive = trendNum > 0;
  const trendColor = isPositive ? 'text-reef-teal' : 'text-reef-coral';
  
  const colorClasses = {
    teal: 'from-reef-teal/20 to-reef-teal/5 border-reef-teal/30',
    coral: 'from-reef-coral/20 to-reef-coral/5 border-reef-coral/30',
    cyan: 'from-reef-cyan/20 to-reef-cyan/5 border-reef-cyan/30',
    yellow: 'from-yellow-500/20 to-yellow-500/5 border-yellow-500/30',
  };
  
  const iconColors = {
    teal: 'text-reef-teal',
    coral: 'text-reef-coral',
    cyan: 'text-reef-cyan',
    yellow: 'text-yellow-400',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.02 }}
      className={`rounded-xl border bg-gradient-to-br ${colorClasses[color]} p-5`}
    >
      <div className="flex items-start justify-between mb-3">
        <span className="text-slate-300 text-sm font-medium">{label}</span>
        <Icon className={`w-5 h-5 ${iconColors[color]}`} />
      </div>
      
      <div className="flex items-baseline gap-2 mb-2">
        <motion.span 
          className="text-3xl font-bold text-white"
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          {value}
        </motion.span>
        <span className="text-sm text-slate-500">{unit}</span>
      </div>
      
      <div className="flex items-center gap-1">
        <span className={`text-xs font-medium ${trendColor}`}>
          {isPositive ? '↑' : '↓'} {Math.abs(trendNum).toFixed(1)}%
        </span>
        <span className="text-xs text-slate-500">vs baseline</span>
      </div>
      
      {/* Animated progress bar */}
      <div className="mt-3 h-1.5 bg-slate-800/50 rounded-full overflow-hidden">
        <motion.div
          className={`h-full rounded-full ${
            color === 'teal' ? 'bg-reef-teal' : 
            color === 'coral' ? 'bg-reef-coral' : 
            color === 'cyan' ? 'bg-reef-cyan' : 
            'bg-yellow-400'
          }`}
          initial={{ width: 0 }}
          animate={{ width: `${Math.min((parseFloat(String(value)) / (unit === '/100' ? 100 : 100)) * 100, 100)}%` }}
          transition={{ duration: 1, ease: 'easeOut' }}
        />
      </div>
    </motion.div>
  );
}

function KPICard({ kpi }: { kpi: typeof dashboardKPIs[0] }) {
  const isPositive = kpi.trend > 0;
  const trendColor = isPositive ? 'text-reef-teal' : 'text-reef-coral';
  
  // Generate mini sparkline data
  const sparklineData = Array.from({ length: 7 }, () => ({
    value: kpi.value + (Math.random() - 0.5) * 10,
  }));

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <Card variant="glass" hover glow="cyan" className="p-5">
        <div className="flex items-start justify-between mb-3">
          <span className="text-slate-400 text-sm">{kpi.label}</span>
          <span className={`text-xs font-medium ${trendColor}`}>
            {isPositive ? '+' : ''}{kpi.trend}%
          </span>
        </div>
        <div className="flex items-baseline gap-1 mb-3">
          <span className="text-2xl font-bold text-white">{kpi.value}</span>
          <span className="text-sm text-slate-500">{kpi.unit}</span>
        </div>
        <Sparkline data={sparklineData} height={30} />
      </Card>
    </motion.div>
  );
}

function CompactPipelineStatus({ steps, progress }: { steps: { id: string; label: string; description: string; status: string; progress: number }[]; progress: number }) {
  // Find the current active step, or the last completed one
  const activeStepIndex = steps.findIndex(s => s.status === 'active');
  const currentStep = activeStepIndex >= 0 ? steps[activeStepIndex] : steps.filter(s => s.status === 'complete').pop();
  
  if (!currentStep) return null;
  
  const stepNumber = activeStepIndex >= 0 ? activeStepIndex + 1 : steps.length;
  const totalSteps = steps.length;
  
  const getStepIcon = () => {
    if (currentStep.status === 'complete') {
      return (
        <motion.div
          initial={{ scale: 0 }}
        animate={{ scale: 1 }}
          className="w-8 h-8 rounded-full bg-reef-teal/20 flex items-center justify-center"
        >
          <CheckCircle2 className="w-5 h-5 text-reef-teal" />
        </motion.div>
      );
    }
    return (
      <div className="relative w-8 h-8 flex items-center justify-center">
        <motion.div
          className="absolute inset-0 rounded-full border-2 border-reef-cyan/30"
          animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0.2, 0.5] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        />
        <Loader2 className="w-5 h-5 text-reef-cyan animate-spin" />
      </div>
    );
  };
  
  return (
    <div className="rounded-xl border border-reef-cyan/20 bg-gradient-to-r from-reef-cyan/5 via-slate-900/50 to-reef-cyan/5 p-4">
      <div className="flex items-center gap-4">
        {/* Step indicator */}
        <div className="flex-shrink-0">
          {getStepIcon()}
        </div>
        
        {/* Step info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs text-slate-400">Step {stepNumber}/{totalSteps}</span>
            <span className="text-xs text-slate-500">•</span>
            <AnimatePresence mode="wait">
              <motion.span
                key={currentStep.id}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className={`text-xs font-medium ${currentStep.status === 'active' ? 'text-reef-cyan' : 'text-reef-teal'}`}
              >
                {currentStep.status === 'active' ? 'Processing...' : 'Complete'}
              </motion.span>
            </AnimatePresence>
          </div>
          
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.3 }}
            >
              <p className="text-white font-medium truncate">{currentStep.label}</p>
              <p className="text-xs text-slate-400 truncate">{currentStep.description}</p>
            </motion.div>
          </AnimatePresence>
        </div>
        
        {/* Progress percentage */}
        <div className="flex-shrink-0 text-right">
          <motion.span 
            key={currentStep.progress}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-2xl font-bold text-white"
          >
            {currentStep.progress}%
          </motion.span>
        </div>
      </div>
      
      {/* Mini progress bar */}
      <div className="mt-3 h-1 bg-slate-800 rounded-full overflow-hidden">
        <motion.div
          className="h-full bg-gradient-to-r from-reef-cyan to-reef-teal rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        />
      </div>
      
      {/* Upcoming steps preview */}
      <div className="mt-3 flex items-center gap-1">
        {steps.map((step, idx) => (
          <div
            key={step.id}
            className={`h-1 flex-1 rounded-full transition-all duration-500 ${
              step.status === 'complete' 
                ? 'bg-reef-teal' 
                : step.status === 'active' 
                  ? 'bg-reef-cyan animate-pulse' 
                  : 'bg-slate-700'
            }`}
          />
        ))}
      </div>
    </div>
  );
}

function PipelineStepItem({ step }: { step: { id: string; label: string; description: string; status: string; progress: number } }) {
  const getStatusIcon = () => {
    switch (step.status) {
      case 'complete':
        return <CheckCircle2 className="w-5 h-5 text-reef-teal" />;
      case 'active':
        return <Loader2 className="w-5 h-5 text-reef-cyan animate-spin" />;
      default:
        return <div className="w-5 h-5 rounded-full border-2 border-slate-700" />;
    }
  };

  const getStatusStyles = () => {
    switch (step.status) {
      case 'complete':
        return 'bg-reef-teal/10 border-reef-teal/30';
      case 'active':
        return 'bg-reef-cyan/10 border-reef-cyan/30 shadow-[0_0_20px_rgba(0,212,255,0.15)]';
      default:
        return 'bg-slate-800/30 border-slate-700/30';
    }
  };

  return (
    <div className={`flex items-center gap-4 p-3 rounded-xl border transition-all duration-500 ${getStatusStyles()}`}>
      {getStatusIcon()}
      <div className="flex-1">
        <div className="flex items-center justify-between">
          <span className={`font-medium ${step.status === 'active' ? 'text-reef-cyan' : step.status === 'complete' ? 'text-reef-teal' : 'text-slate-500'}`}>
            {step.label}
          </span>
          <span className="text-xs text-slate-500">{step.progress}%</span>
        </div>
        <p className="text-xs text-slate-500 mt-0.5">{step.description}</p>
      </div>
    </div>
  );
}
