# ReefGuard

**Intelligent Coral Health Monitoring & Restoration Insights**

A premium, production-quality React frontend for coral reef monitoring platforms. Built with cinematic dark-theme aesthetics, animated underwater effects, and comprehensive AI-powered analytics.

![ReefGuard Hero](https://images.unsplash.com/photo-1546026423-cc4642628d2b?w=1200)

## Features

### Landing Page
- **Cinematic Hero Section** with animated underwater effects using React Three Fiber
- **Floating Metrics Cards** with live counters and trend indicators
- **Interactive How It Works Timeline** showing the 4-step process
- **Feature Cards** with hover animations and glassmorphism effects
- **Dashboard Preview** embedded showcase

### Dashboard
- **Left Collapsible Navigation** with icon + label support
- **KPI Cards** with sparkline mini-charts and trend indicators
- **Image Upload Dropzone** with drag-and-drop support
- **Animated Inference Pipeline** with glowing nodes and progress indicators
- **Segmentation Results** with side-by-side image comparison
- **Donut Chart** for class coverage visualization
- **Ecological Report Panel** with health gauge and risk classification

### Knowledge Assistant (RAG)
- **Chat Interface** with user/assistant message bubbles
- **Citation Cards** showing research sources
- **Suggested Questions** for quick queries
- **Knowledge Base Stats** showing research papers count
- **Responsive Design** with collapsible panels

## Tech Stack

- **React 18** + TypeScript
- **Vite** for fast development
- **Tailwind CSS** with custom ocean theme
- **Framer Motion** for smooth animations
- **React Three Fiber + Three.js** for 3D underwater effects
- **Recharts** for data visualization
- **Lucide React** for icons

## Project Structure

```
reefguard/
├── public/
│   └── reefguard-icon.svg
├── src/
│   ├── components/
│   │   ├── animations/
│   │   │   ├── AnimatedCounter.tsx
│   │   │   └── TextReveal.tsx
│   │   ├── effects/
│   │   │   ├── OceanBackground.tsx      # Three.js underwater scene
│   │   │   └── FloatingBubbles.tsx      # CSS bubble animation
│   │   └── ui/
│   │       ├── Badge.tsx
│   │       ├── Button.tsx
│   │       ├── Card.tsx
│   │       ├── DonutChart.tsx
│   │       ├── Gauge.tsx
│   │       ├── ProgressBar.tsx
│   │       └── Sparkline.tsx
│   ├── data/
│   │   └── mockData.ts                  # Mock API data
│   ├── hooks/
│   │   └── useMockApi.ts                # Mock API hooks
│   ├── lib/
│   │   └── utils.ts                     # Utility functions
│   ├── pages/
│   │   ├── Dashboard.tsx                # Main dashboard
│   │   ├── KnowledgeAssistant.tsx       # RAG chat interface
│   │   └── LandingPage.tsx              # Marketing landing page
│   ├── types/
│   │   └── index.ts                     # TypeScript types
│   ├── App.tsx
│   ├── index.css                        # Global styles
│   └── main.tsx
├── index.html
├── package.json
├── tailwind.config.js                   # Custom ocean theme
└── README.md
```

## Design System

### Colors
- **Ocean Dark**: `#07111c`, `#0c1c2e`
- **Reef Cyan**: `#00d4ff` (primary accent)
- **Reef Coral**: `#ff6b6b` (danger/warning)
- **Reef Teal**: `#00c9a7` (success)

### Effects
- **Glassmorphism**: `backdrop-blur-xl` with semi-transparent backgrounds
- **Glow Effects**: Cyan and coral colored box-shadows
- **Noise Overlay**: Subtle texture for cinematic feel
- **Floating Bubbles**: CSS-animated rising bubbles
- **Light Rays**: Three.js volumetric light effects

## Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn

### Installation

```bash
# Navigate to project
cd reefguard

# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

### Development

The app runs on `http://localhost:5173` by default.

## Pages

### Landing Page (`/`)
- Hero with animated metrics
- How It Works section
- Feature showcase
- Dashboard preview

### Dashboard (`Launch Dashboard`)
- Full analytics interface
- Image upload & segmentation
- Live report generation

### Knowledge Assistant
- RAG-powered chat
- Research citations
- Restoration guidance

## Mock API Integration

The project uses mock hooks that simulate API calls:

```typescript
const { status, steps, result, runSegmentation } = useSegmentation();

// Upload and analyze
await runSegmentation(imageFile);

// Status: 'idle' | 'uploading' | 'processing' | 'segmenting' | 'analyzing' | 'complete'
```

Replace with real FastAPI endpoints:

```typescript
// hooks/useRealApi.ts
export function useSegmentation() {
  const runSegmentation = async (file: File) => {
    const formData = new FormData();
    formData.append('image', file);
    
    const response = await fetch('/api/segment', {
      method: 'POST',
      body: formData,
    });
    
    return await response.json();
  };
  
  return { runSegmentation };
}
```

## Customization

### Adding New KPI Cards
```typescript
const dashboardKPIs = [
  { id: '1', label: 'Health Index', value: 73, target: 80, trend: 5.2, unit: 'pts' },
  // Add your KPI here
];
```

### Changing Colors
Edit `tailwind.config.js`:
```javascript
colors: {
  reef: {
    cyan: '#00d4ff',    // Change accent color
    coral: '#ff6b6b',   // Change warning color
  }
}
```

### Adding Pipeline Steps
Edit `src/data/mockData.ts`:
```typescript
export const pipelineSteps: PipelineStep[] = [
  { id: 'upload', label: 'Uploading', description: '...', status: 'pending', progress: 0 },
  // Add your step here
];
```

## Performance

- **Lazy Loading**: Components load on demand
- **Optimized Animations**: GPU-accelerated transforms
- **Efficient Re-renders**: React.memo on heavy components
- **Three.js Optimization**: Limited particle count, shared geometries

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## License

MIT License - feel free to use for commercial or personal projects.

## Credits

- Design inspired by modern environmental SaaS and luxury interfaces
- Icons by [Lucide](https://lucide.dev)
- 3D effects powered by [Three.js](https://threejs.org)
- Animations by [Framer Motion](https://www.framer.com/motion/)

---

Built with care for coral reef conservation.
