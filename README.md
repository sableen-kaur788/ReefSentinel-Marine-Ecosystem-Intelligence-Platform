# ReefSentinel: AI-Powered Coral Reef Intelligence Platform

ReefSentinel is a comprehensive, end-to-end coral reef intelligence system that transforms uploaded reef imagery into detailed segmentation maps, benthic composition metrics, reef health KPIs, ecological reports, interactive trends, and AI-powered chatbot assistance.

This project includes custom model training, dataset preparation, RAG (Retrieval-Augmented Generation), and a full-stack web application for coral reef monitoring and analysis.

## Table of Contents
- [Project Overview](#project-overview)
- [Complete Feature Set](#complete-feature-set)
- [Dataset & Model Training](#dataset--model-training)
- [RAG & AI Chatbot System](#rag--ai-chatbot-system)
- [Trend Analysis & Visualization](#trend-analysis--visualization)
- [Architecture](#architecture)
- [Tech Stack](#tech-stack)
- [Installation](#installation)
- [Usage](#usage)

---

## Project Overview

ReefSentinel enables marine researchers and conservationists to:
1. Upload coral reef images/videos for AI analysis
2. Get pixel-wise semantic segmentation of reef habitats
3. View automated reef health scoring and KPIs
4. Generate comprehensive ecological reports with RAG context
5. Explore historical trends and data visualizations
6. Chat with an AI marine science assistant powered by RAG

## Complete Feature Set

### 1. AI-Powered Semantic Segmentation
- **Custom SegFormer-B5 Model**: Fine-tuned from scratch on 6-class coral dataset
- **Architecture**: SegFormer-B5 (Encoder-Decoder Transformer for semantic segmentation)
- **6-Class Classification**: Water/Background, Live Coral, Bleached Coral, Dead Coral, Algae, Benthic Substrate
- **Sliding-Window Inference**: Handles large reef imagery at 1024×1024 resolution
- **Image & Video Support**: Process both single images and video files
- **Color-Coded Overlays**: Visualize segmentation results on original imagery

### 2. Reef Health Analysis & KPI Engine
- **Rule-Based Health Scoring**: Custom formula for health index calculation
- **Health Index**: 0-100 score based on coral cover and stress signals
- **Coral Cover Percentage**: Live + Bleached + Dead coral coverage
- **Stress Signal Detection**: Quantifies bleached + dead coral stress
- **Reef Stage Classification**: 4-stage system (Healthy → Transitional → Stressed → Critical)
- **Benthic-Only Normalization**: Excludes water from KPI calculations for ecological accuracy
- **Multiple KPIs**: Health index, coral cover, stress signals, restoration priority

### 3. Retrieval-Augmented Generation (RAG) System
- **Vector Database**: FAISS (Facebook AI Similarity Search) for efficient similarity search
- **Embedding Model**: `sentence-transformers/all-MiniLM-L6-v2` for text embeddings
- **Knowledge Base**: Local RAG store with marine science documents (text + PDF)
- **Document Chunking**: Smart text splitting with 900-character chunks
- **Contextual Retrieval**: Top-K most relevant scientific context for queries
- **PDF Ingestion**: Optional PDF support via pypdf library
- **Vector Normalization**: L2 normalization for improved similarity search

### 4. AI Chatbot & Knowledge Assistant
- **Marine Science Chatbot**: Specialized for coral reef questions
- **RAG-Powered Responses**: Answers grounded in retrieved scientific context
- **Context Awareness**: Maintains conversation context
- **Interactive Querying**: Ask follow-up ecological questions
- **Groq LLM Integration**: Fast inference with Llama models
- **Fallback Mode**: Works without API key with preset responses

### 5. Ecological Report Generation
- **LLM-Generated Reports**: Executive summaries, findings, recommendations
- **Context-Grounded Reports**: Uses RAG-retrieved scientific context
- **Executive Summary**: High-level reef health overview
- **Class Balance Interpretation**: Analysis of benthic composition
- **Stress Signal Discussion**: Bleaching and mortality assessment
- **Monitoring Recommendations**: Practical field-monitoring actions
- **PDF Export**: Downloadable reports via jsPDF
- **Markdown Rendering**: Rich text formatting

### 6. Trend Analysis & Visualization
- **Data Visualization Dashboard**: Charts and graphs powered by Recharts
- **Class Distribution**: Donut charts and bar graphs
- **Health Score Trends**: Historical health index tracking
- **Gauge Visualization**: Health score gauge display
- **Sparkline Charts**: Trend lines for key metrics
- **KPI Cards**: Real-time metric display
- **Color Legends**: Interactive segmentation legends
- **Progressive Animations**: Smooth data visualization animations

### 7. Interactive Dashboard UI
- **Modern React Frontend**: Built with React 19 and TypeScript
- **Responsive Design**: Works on desktop and mobile
- **Real-Time Feedback**: Live analysis progress updates
- **Smooth Animations**: Framer Motion for enhanced UX
- **Multiple Views**: Dashboard, Segmentation, Reports, Trends, Assistant
- **Glass-Morphism Design**: Modern UI with glass effects
- **Lucide Icons**: Beautiful, consistent iconography
- **Dark Theme**: Ocean-inspired color scheme

---

## Dataset & Model Training

### CoralScapes Dataset
The project uses the **CoralScapes** dataset, a comprehensive coral reef segmentation benchmark containing:
- 40 detailed coral and benthic habitat classes
- High-resolution underwater imagery
- Pixel-perfect ground truth annotations

### Class Remapping (40 → 6 Classes)
To simplify ecological interpretation, the original 40 CoralScapes classes were merged into 6 ecologically meaningful categories:

| Category | Original Class IDs |
|----------|-------------------|
| Water / Background | 0 |
| Live Coral | 22, 34, 31, 25, 28, 21, 27, 6, 17, 36 |
| Bleached Coral | 19, 16, 33, 4 |
| Dead Coral | 20, 32, 23, 37, 3, 39 |
| Algae | 10, 1 |
| Benthic Substrate | 5, 18, 12, 14 |

This remapping is implemented in `lib/coralscapes_6class_lut.py` and `scripts/remap_masks_to_6_classes.py`.

### Custom SegFormer Model Training
I fine-tuned a **SegFormer-B5** model from scratch using the prepared 6-class dataset:

**Training Details:**
- **Base Model**: SegFormer-B5 (pretrained on ImageNet-1K)
- **Input Resolution**: 1024×1024
- **Optimizer**: AdamW
- **Loss**: CrossEntropyLoss
- **Data Augmentation**: Random crops, flips, color jitter
- **Experiment Tracking**: MLflow (for tracking metrics, hyperparameters, and model artifacts)
- **Framework**: PyTorch + Hugging Face Transformers

**Training Scripts & Notebooks:**
- `notebooks/b5.ipynb` - Main training notebook
- `notebooks/b5_copy.ipynb` - Alternative training notebook
- `scripts/` - Dataset preparation and visualization utilities

### Dataset Preparation Pipeline
The `scripts/` directory contains all utilities for preparing the dataset:

| Script | Purpose |
|--------|---------|
| `remap_masks_to_6_classes.py` | Remap original 40-class masks to 6 classes |
| `build_6class_coralscapes_layout.py` | Build structured dataset layout |
| `summarize_coralscapes.py` | Generate dataset statistics |
| `analyze_6class_mask_distribution.py` | Analyze class distribution |
| `visualize_random_6class.py` | Visualize random samples with masks |
| `visualize_random_train.py` | Visualize random training samples |
| `zip_6class_dataset_for_kaggle.py` | Package dataset for distribution |
| `flatten_6class_masks_for_upload.py` | Flatten masks for upload |
| `masks_to_5class_ignore_background.py` | Convert to 5-class (ignore background) |

---

## RAG & AI Chatbot System

### RAG Architecture
ReefSentinel implements a robust Retrieval-Augmented Generation system:

1. **Document Ingestion**:
   - Loads documents from `data/rag_docs/`
   - Supports both .txt and .pdf files
   - Text extraction from PDFs using pypdf

2. **Text Chunking**:
   - Smart chunking with 900-character max chunks
   - Sentence-aware splitting to preserve context
   - Overlap for continuity between chunks

3. **Embedding Generation**:
   - Model: `sentence-transformers/all-MiniLM-L6-v2`
   - 384-dimensional embeddings
   - L2 normalization for cosine similarity

4. **Vector Storage**:
   - FAISS IndexFlatIP for efficient similarity search
   - In-memory vector database
   - Fast nearest-neighbor retrieval

5. **Retrieval**:
   - Top-K (default: 5) most relevant chunks
   - Cosine similarity scoring
   - Contextual re-ranking

6. **Generation**:
   - Groq API for fast LLM inference
   - Model: Llama 3.1 8B Instant
   - Temperature: 0.35 for balanced creativity/accuracy
   - System prompt: Senior marine ecologist persona

### AI Chatbot Features
- **Specialized Knowledge**: Marine science and coral reef ecology
- **Context-Aware**: Maintains conversation history
- **Source Grounding**: Answers based on retrieved documents
- **Interactive**: Follow-up questions and clarifications
- **Fallback**: Works without API key with default responses

---

## Trend Analysis & Visualization

### Data Visualization Components
ReefSentinel includes comprehensive data visualization:

1. **Donut Charts**: Class distribution visualization
2. **Gauge Displays**: Health score gauge with color coding
3. **Sparkline Charts**: Trend lines for key metrics
4. **KPI Cards**: Real-time metric display
5. **Progress Bars**: Class percentage visualization
6. **Color Legends**: Interactive segmentation legends
7. **Badges**: Status indicators and alerts

### Analysis Features
- **Class Distribution Breakdown**: Detailed percentage and area statistics
- **Health Score Tracking**: 0-100 health index
- **Coral Cover Calculation**: Live coral percentage
- **Stress Signal Quantification**: Bleached + dead coral
- **Restoration Priority**: Low/Medium/High priority classification
- **Dominant Species Detection**: Most abundant coral class

---

## Architecture

```text
coral/
├── backend/                # FastAPI backend (API, prediction, KPI, RAG)
│   └── app/
│       ├── routers/        # API endpoints
│       │   ├── predict.py  # Segmentation & prediction
│       │   ├── analyze.py  # Full analysis pipeline
│       │   └── rag.py      # RAG query & chat
│       └── services/       # Core business logic
│           ├── segmentation.py    # Model inference
│           ├── kpi.py            # Health scoring
│           ├── llm_groq.py       # LLM reports
│           ├── rag_store.py      # Vector DB
│           └── visualization.py  # Overlay generation
├── reefguard/              # React + Vite frontend (dashboard, UI)
│   ├── src/
│   │   ├── pages/          # Dashboard, Reports, Trends, Assistant
│   │   ├── components/ui/  # Cards, Buttons, Charts, Legends
│   │   └── hooks/          # API integration
├── lib/                    # Shared ML utilities
│   ├── segformer_coralscapes.py  # Model service
│   ├── coralscapes_6class_lut.py # Class remapping
│   └── project_paths.py           # Path config
├── scripts/                # Dataset preparation scripts
├── notebooks/              # Model training notebooks
├── dataset/                # Prepared 6-class dataset
└── data/
    └── rag_docs/           # RAG knowledge base (txt, pdf)
```

## Tech Stack

### Backend
- **Python 3.12** - Runtime
- **FastAPI** - Modern REST API framework
- **Uvicorn** - ASGI server
- **PyTorch** - Deep learning framework
- **Hugging Face Transformers** - Model loading & inference
- **Hugging Face Hub** - Model distribution
- **OpenCV** - Video & image processing
- **Pillow** - Image handling
- **NumPy** - Numerical computing
- **FAISS** - Vector similarity search
- **Sentence-Transformers** - Text embeddings
- **Groq Python SDK** - LLM inference
- **pypdf** - PDF text extraction

### Frontend
- **React 19** - UI library
- **TypeScript** - Type safety
- **Vite** - Build tool & dev server
- **Tailwind CSS** - Utility-first styling
- **Framer Motion** - Animations
- **Lucide React** - Icons
- **Recharts** - Data visualization
- **jsPDF** - PDF export
- **React Three Fiber** - 3D visualization (optional)
- **Three.js** - 3D rendering

### ML/DL & Experimentation
- **SegFormer-B5** - Semantic segmentation architecture
- **MLflow** - Experiment tracking & model management
- **PyTorch** - Deep learning framework
- **scikit-learn** - Utilities & metrics
- **Jupyter Notebooks** - Experimentation

### Vector DB & RAG
- **FAISS** - Facebook AI Similarity Search
- **sentence-transformers/all-MiniLM-L6-v2** - Embedding model
- **Document chunking** - Custom text splitting

---

## Installation

### Prerequisites
- Python 3.10+
- Node.js 18+
- Git

### 1. Clone the repository
```bash
git clone <repository-url>
cd coral
```

### 2. Backend Setup
```powershell
# Create virtual environment
python -m venv venv

# Activate virtual environment
.\venv\Scripts\activate  # Windows
source venv/bin/activate  # Linux/Mac

# Install dependencies
pip install -r backend/requirements.txt
```

### 3. Frontend Setup
```powershell
cd reefguard
npm install
```

### 4. Environment Configuration
Create a `.env` file in the project root:
```env
# LLM Configuration (optional, for reports and chatbot)
groq_api_key=your_groq_api_key_here
groq_model=llama-3.1-8b-instant

# Model Configuration
hf_token=your_huggingface_token_here  # Optional
embed_model=sentence-transformers/all-MiniLM-L6-v2
video_max_frames=24
preload_segformer=true
```

---

## Usage

### Starting the Backend
```powershell
# From project root, with venv activated
python -m uvicorn backend.app.main:app --reload --host 127.0.0.1 --port 8000
```

Backend API will be available at: `http://127.0.0.1:8000`

API documentation (Swagger UI): `http://127.0.0.1:8000/docs`

### Starting the Frontend
```powershell
cd reefguard
npm run dev
```

Frontend will be available at: `http://localhost:5173`

### API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/health` | GET | Health check |
| `/predict` | POST | Run segmentation & get KPIs |
| `/analyze` | POST | Full pipeline with RAG & report |
| `/analyze/from_percentages` | POST | Analyze from precomputed percentages |
| `/rag/query` | POST | Query RAG knowledge base |
| `/rag/rebuild` | POST | Rebuild RAG index |
| `/rag/chat` | POST | Reef knowledge assistant chat |

---

## Project Outputs

The system produces:
1. **Segmentation masks** - Pixel-wise classification
2. **Class percentages** - Area coverage for each category
3. **Health KPIs** - Health index, coral cover, stress signals
4. **Visual overlays** - Color-coded segmentation on original image
5. **Ecological reports** - LLM-generated analysis with RAG context
6. **PDF exports** - Downloadable reports
7. **Trend visualizations** - Charts and data displays
8. **Chatbot conversations** - Interactive marine science Q&A

---

## Use Cases

- Coral reef health monitoring
- Bleaching event assessment
- Reef restoration planning
- Marine conservation research
- Environmental impact analysis
- Educational demonstrations
- Marine science education
- Ecological report generation
- Reef trend analysis

---

## Future Work

- [ ] Time-series analysis & change detection
- [ ] Batch processing of multiple images
- [ ] Cloud deployment with Docker
- [ ] User authentication & persistence
- [ ] Model confidence visualization
- [ ] Integration with satellite imagery
- [ ] Historical analysis database
- [ ] Collaborative features
- [ ] Mobile app version
- [ ] Multi-language support

---

## License

MIT License - feel free to use this project for research and educational purposes.

---

## Acknowledgments

- CoralScapes dataset for providing the training data
- Hugging Face for transformers & model hub
- Facebook AI Research for FAISS
- Groq for fast LLM inference
- The marine conservation community for inspiration
