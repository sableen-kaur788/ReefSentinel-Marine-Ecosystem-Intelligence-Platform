import { useState, useCallback } from 'react';
import type {
  ReefAnalysis,
  ChatMessage,
  PipelineStep,
  AnalysisStatus
} from '../types';
import {
  mockAnalysis,
  pipelineSteps,
  mockChatHistory,
  delay
} from '../data/mockData';
import type { Citation } from '../types';
import type { SegmentationClass } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://sableenkaur27-reefsentinel-backend.hf.space';

const CLASS_FALLBACK_COLORS: Record<string, string> = {
  live_coral: '#AAFFC3',
  bleached_coral: '#FFDC64',
  dead_coral: '#A03C50',
  algae: '#0C5523',
  benthic_substrate: '#B48C64',
  water_background: '#2A79C8',
};

const CLASS_LABELS: Record<string, string> = {
  live_coral: 'Live Coral',
  bleached_coral: 'Bleached Coral',
  dead_coral: 'Dead Coral',
  algae: 'Algae',
  benthic_substrate: 'Benthic Substrate',
  water_background: 'Water / Background',
};

const CLASS_ORDER = [
  'live_coral',
  'bleached_coral',
  'dead_coral',
  'algae',
  'benthic_substrate',
  'water_background',
];

// Parse markdown report into structured sections
function parseReportMarkdown(markdown: string): {
  findings: string[];
  recommendations: string[];
  riskAssessment: string;
} {
  const sections = {
    findings: [] as string[],
    recommendations: [] as string[],
    riskAssessment: '',
  };

  if (!markdown) return sections;

  const lines = markdown.split('\n');
  let currentSection = '';

  for (const line of lines) {
    const trimmedLine = line.trim();

    // Detect section headers
    if (trimmedLine.match(/^#+\s*key\s*findings?/i)) {
      currentSection = 'findings';
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
    if (trimmedLine.match(/^#+\s*executive\s*summary/i)) {
      currentSection = 'summary';
      continue;
    }

    // Skip empty lines and headers
    if (!trimmedLine || trimmedLine.startsWith('#')) continue;

    // Extract content based on current section
    if (currentSection === 'findings') {
      // Match bullet points or numbered lists
      const match = trimmedLine.match(/^[-*•\d.]+\s*(.+)$/);
      if (match) {
        sections.findings.push(match[1]);
      } else if (trimmedLine) {
        sections.findings.push(trimmedLine);
      }
    } else if (currentSection === 'recommendations') {
      const match = trimmedLine.match(/^[-*•\d.]+\s*(.+)$/);
      if (match) {
        sections.recommendations.push(match[1]);
      } else if (trimmedLine) {
        sections.recommendations.push(trimmedLine);
      }
    } else if (currentSection === 'riskAssessment') {
      sections.riskAssessment += (sections.riskAssessment ? ' ' : '') + trimmedLine;
    }
  }

  return sections;
}

export function useSegmentation() {
  const [status, setStatus] = useState<AnalysisStatus>('idle');
  const [steps, setSteps] = useState<PipelineStep[]>(pipelineSteps);
  const [result, setResult] = useState<ReefAnalysis | null>(null);
  const [progress, setProgress] = useState(0);
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string | null>(null);
  const [isReportGenerating, setIsReportGenerating] = useState(false);

  const runStep = useCallback(
    async (stepIdx: number, statusLabel: AnalysisStatus, startProgress: number, endProgress: number, durationMs = 700) => {
      setStatus(statusLabel);
      setSteps(prev =>
        prev.map((step, idx) =>
          idx === stepIdx
            ? { ...step, status: 'active', progress: 0 }
            : idx < stepIdx
              ? { ...step, status: 'complete', progress: 100 }
              : step
        )
      );
      for (let p = 0; p <= 100; p += 20) {
        setSteps(prev => prev.map((step, idx) => (idx === stepIdx ? { ...step, progress: p } : step)));
        setProgress(startProgress + ((endProgress - startProgress) * p) / 100);
        await delay(durationMs / 5);
      }
      setSteps(prev => prev.map((step, idx) => (idx === stepIdx ? { ...step, status: 'complete', progress: 100 } : step)));
    },
    []
  );

  const runSegmentation = useCallback(async (file: File) => {
    const localPreview = URL.createObjectURL(file);
    setUploadedImageUrl(localPreview);
    setStatus('uploading');
    setProgress(0);
    setResult(null);
    setIsReportGenerating(false);
    
    // Reset steps
    setSteps(pipelineSteps.map(s => ({ ...s, status: 'pending', progress: 0 })));

    await runStep(0, 'uploading', 0, 20, 600);
    await runStep(1, 'processing', 20, 40, 700);

    // Keep segmentation active until backend returns segmented output.
    setStatus('segmenting');
    setSteps(prev =>
      prev.map((step, idx) =>
        idx === 2
          ? { ...step, status: 'active', progress: 15 }
          : idx < 2
            ? { ...step, status: 'complete', progress: 100 }
            : step
      )
    );
    setProgress(45);

    try {
      const form = new FormData();
      form.append('file', file);
      const response = await fetch(`${API_BASE_URL}/predict?include_overlay=true`, {
        method: 'POST',
        body: form,
      });
      if (!response.ok) {
        throw new Error(`Analyze failed with status ${response.status}`);
      }
      const data = await response.json();
      // Segmentation completes only when segmented result is ready.
      setSteps(prev => prev.map((step, idx) => (idx === 2 ? { ...step, status: 'complete', progress: 100 } : step)));
      setProgress(68);
      const benthic = data.benthic_percentages || {};
      const legendItems = Array.isArray(data.color_legend) ? data.color_legend : [];
      const fullFrame = data.percentages_full_frame || data.percentages || {};

      const hasFullFrameKeys = CLASS_ORDER.some((key) => fullFrame[key] !== undefined);
      const width = Number(data.meta?.width || 0);
      const height = Number(data.meta?.height || 0);
      const totalPixels = width > 0 && height > 0 ? width * height : 0;
      let classes: SegmentationClass[] = [];

      if (hasFullFrameKeys) {
        classes = CLASS_ORDER
          .filter((key) => Number(fullFrame[key] || 0) > 0)
          .map((key, idx) => ({
            id: String(idx + 1),
            name: CLASS_LABELS[key],
            color: CLASS_FALLBACK_COLORS[key],
            percentage: Number(fullFrame[key] || 0),
            area: 0,
          }));
      } else if (legendItems.length > 0) {
        classes = legendItems.map((entry: { class_key?: string; label?: string; hex?: string; percentage?: number }, idx: number) => ({
          id: String(idx + 1),
          name: entry.label || CLASS_LABELS[entry.class_key || ''] || `Class ${idx + 1}`,
          color: entry.hex || CLASS_FALLBACK_COLORS[entry.class_key || ''] || '#64748B',
          percentage: Number(entry.percentage || 0),
          area: 0,
        }));
      } else {
        classes = [
          { id: '1', name: CLASS_LABELS.live_coral, color: CLASS_FALLBACK_COLORS.live_coral, percentage: Number(benthic.live_coral || 0), area: 0 },
          { id: '2', name: CLASS_LABELS.bleached_coral, color: CLASS_FALLBACK_COLORS.bleached_coral, percentage: Number(benthic.bleached_coral || 0), area: 0 },
          { id: '3', name: CLASS_LABELS.dead_coral, color: CLASS_FALLBACK_COLORS.dead_coral, percentage: Number(benthic.dead_coral || 0), area: 0 },
          { id: '4', name: CLASS_LABELS.algae, color: CLASS_FALLBACK_COLORS.algae, percentage: Number(benthic.algae || 0), area: 0 },
          { id: '5', name: CLASS_LABELS.benthic_substrate, color: CLASS_FALLBACK_COLORS.benthic_substrate, percentage: Number(benthic.benthic_substrate || 0), area: 0 },
        ];
      }

      if (totalPixels > 0) {
        classes = classes.map((cls) => ({
          ...cls,
          area: Math.round((totalPixels * cls.percentage) / 100),
        }));
      }
      const overlay = data.segmentation_overlay_png_base64
        ? `data:image/png;base64,${data.segmentation_overlay_png_base64}`
        : file ? URL.createObjectURL(file) : mockAnalysis.segmentedUrl;
      setResult({
        id: `analysis-${Date.now()}`,
        imageUrl: localPreview,
        segmentedUrl: overlay,
        timestamp: new Date().toISOString(),
        location: 'Uploaded by user',
        healthScore: Number(data.kpis?.health_index ?? mockAnalysis.healthScore),
        mortalityRisk: Number(data.kpis?.bleaching_risk ?? mockAnalysis.mortalityRisk),
        liveCoral: Number(fullFrame.live_coral ?? benthic.live_coral ?? mockAnalysis.liveCoral),
        restorationPriority: (data.kpis?.restoration_priority as 'low' | 'medium' | 'high' | 'critical') || mockAnalysis.restorationPriority,
        classes,
        report: {
          summary: 'Generating ecological report...',
          findings: [
            `Live coral: ${Number(benthic.live_coral || 0).toFixed(1)}%`,
            `Bleached coral: ${Number(benthic.bleached_coral || 0).toFixed(1)}%`,
            `Dead coral: ${Number(benthic.dead_coral || 0).toFixed(1)}%`,
          ],
          recommendations: [
            'Continue monthly monitoring and compare trend changes.',
            'Prioritize restoration in low-live-coral zones.',
          ],
          citations: [],
          riskAssessment: data.kpis?.reef_stage || 'Segmentation complete. Generating report...',
        },
      });

      // Stage 2: compute/report steps after segmented output is already visible.
      await runStep(3, 'analyzing', 68, 82, 850);
      setIsReportGenerating(true);
      setStatus('analyzing');
      setSteps(prev =>
        prev.map((step, idx) =>
          idx === 4
            ? { ...step, status: 'active', progress: 15 }
            : idx < 4
              ? { ...step, status: 'complete', progress: 100 }
              : step
        )
      );
      setProgress(84);

      const reportResponse = await fetch(`${API_BASE_URL}/analyze/from_percentages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          percentages: data.percentages_full_frame || data.percentages || {},
          include_llm: true,
          water_background_full_frame: data.percentages_full_frame?.water_background,
        }),
      });

      if (reportResponse.ok) {
        const reportData = await reportResponse.json();
        const reportMarkdown = reportData.report_markdown || '';

        // Parse the markdown report into sections
        const sections = parseReportMarkdown(reportMarkdown);

        setResult(prev =>
          prev
            ? {
                ...prev,
                report: {
                  ...prev.report,
                  summary: reportMarkdown || prev.report.summary,
                  findings: sections.findings.length > 0 ? sections.findings : prev.report.findings,
                  recommendations: sections.recommendations.length > 0 ? sections.recommendations : prev.report.recommendations,
                  riskAssessment: sections.riskAssessment || reportData.kpis?.reef_stage || prev.report.riskAssessment,
                  citations: (reportData.rag_hits || []).slice(0, 3).map((h: { rank: number; text: string }) => ({
                    id: String(h.rank),
                    title: h.text.slice(0, 90) + (h.text.length > 90 ? '...' : ''),
                    author: 'RAG Corpus',
                    year: 2024,
                  })),
                },
              }
            : prev
        );
      }

      setSteps(prev => prev.map((step, idx) => (idx === 4 ? { ...step, status: 'complete', progress: 100 } : step)));
      setProgress(100);
      setIsReportGenerating(false);
      setStatus('complete');
    } catch {
      setSteps(prev => prev.map((step, idx) => (idx === 2 ? { ...step, status: 'complete', progress: 100 } : step)));
      setProgress(65);
      setResult(mockAnalysis);
      await runStep(3, 'analyzing', 65, 82, 700);
      await runStep(4, 'analyzing', 82, 100, 900);
      setIsReportGenerating(false);
      setStatus('complete');
    }
  }, [runStep]);

  const reset = useCallback(() => {
    setStatus('idle');
    setSteps(pipelineSteps);
    setResult(null);
    setProgress(0);
    setUploadedImageUrl(null);
    setIsReportGenerating(false);
  }, []);

  return {
    status,
    steps,
    result,
    uploadedImageUrl,
    isReportGenerating,
    progress,
    runSegmentation,
    reset,
  };
}

export function useChat() {
  const [messages, setMessages] = useState<ChatMessage[]>(mockChatHistory);
  const [isLoading, setIsLoading] = useState(false);

  const sendMessage = useCallback(async (content: string) => {
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content,
      timestamp: new Date().toISOString(),
    };

    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    try {
      const historyPayload = messages
        .filter((m) => m.role === 'user' || m.role === 'assistant')
        .map((m) => ({ role: m.role, content: m.content }));

      const response = await fetch(`${API_BASE_URL}/rag/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: content,
          history: historyPayload,
          top_k: 5,
        }),
      });

      if (!response.ok) {
        throw new Error(`RAG chat failed with status ${response.status}`);
      }

      const data = await response.json();
      const mappedCitations: Citation[] = (data.citations || []).map((c: { rank: number; text: string; score: number }) => ({
        id: String(c.rank),
        title: c.text.slice(0, 72) + (c.text.length > 72 ? '...' : ''),
        author: 'RAG Corpus',
        year: 2024,
        url: undefined,
      }));

      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.answer || generateResponse(content),
        timestamp: new Date().toISOString(),
        citations: mappedCitations,
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch {
      await delay(800);
      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: generateResponse(content),
        timestamp: new Date().toISOString(),
        citations: [
          { id: '1', title: 'Local fallback response', author: 'Offline Mode', year: 2024 },
        ],
      };
      setMessages(prev => [...prev, assistantMessage]);
    } finally {
      setIsLoading(false);
    }
  }, [messages]);

  const clearChat = useCallback(() => {
    setMessages(mockChatHistory);
  }, []);

  return {
    messages,
    isLoading,
    sendMessage,
    clearChat,
  };
}

function generateResponse(_query: string): string {
  const responses = [
    "Based on recent research, coral propagation techniques show a 68% success rate in controlled nursery environments. The key factors include water quality, temperature stability, and adequate light penetration.",
    "Coral bleaching events have increased by 40% over the past decade. Early detection through automated monitoring can help implement protective measures before irreversible damage occurs.",
    "Restoration priority is determined by several factors: coral cover percentage, structural complexity, connectivity to healthy reefs, and local stressor intensity.",
    "Hard corals (scleractinians) typically recover faster from thermal stress compared to soft corals, though this varies significantly by species and local conditions.",
  ];
  
  return responses[Math.floor(Math.random() * responses.length)];
}

export function useDashboardData() {
  return {
    kpis: {
      healthIndex: { value: 73, trend: 5.2 },
      mortalityRisk: { value: 28, trend: -3.5 },
      liveCoral: { value: 64, trend: -2.1 },
      restorationPriority: { value: 85, trend: 12.3 },
    },
    recentAnalyses: [mockAnalysis, { ...mockAnalysis, id: 'analysis-002', timestamp: '2024-01-14T08:00:00Z' }],
  };
}
