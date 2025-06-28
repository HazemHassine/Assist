# Assist2 - AI-Powered Document Assistant

A modern web application that transforms documents into interactive knowledge graphs using AI-powered analysis. Built with Next.js and a Python FastAPI backend.

## 🚀 Features

- **AI Document Analysis**: Intelligent processing with advanced AI algorithms
- **Interactive Knowledge Graphs**: Visualize document relationships and insights
- **PDF Processing**: Extract text, metadata, and generate embeddings
- **Cloud Integration**: Seamless Google Drive and cloud storage sync
- **Smart Editing**: Advanced markdown editor with real-time preview
- **User Authentication**: Secure signup/signin with MongoDB session management
- **Real-time Collaboration**: Work together on documents
- **Text Compression**: Optimize content for AI processing
- **OpenRouter Integration**: Advanced AI model access

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                                    CLIENT LAYER                                 │
├─────────────────────────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────┐ │
│  │   Next.js App   │  │   React UI      │  │   Monaco Editor │  │   D3.js     │ │
│  │   (Port 3000)   │  │   Components    │  │   Code Editor   │  │   Graphs    │ │
│  │                 │  │                 │  │                 │  │             │ │
│  │ • Landing Page  │  │ • DriveSync     │  │ • Markdown      │  │ • Network   │ │
│  │ • Dashboard     │  │ • ActivityBar   │  │ • PDF Preview   │  │ • Force     │ │
│  │ • Authentication│  │ • Settings      │  │ • Real-time     │  │ • Layout    │ │
│  │ • File Upload   │  │ • QuickActions  │  │   Preview       │  │             │ │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘  └─────────────┘ │
└─────────────────────────────────────────────────────────────────────────────────┘
                                        │
                                        ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                                  API GATEWAY                                   │
├─────────────────────────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────┐ │
│  │   Next.js API   │  │   Auth Routes   │  │   Drive API     │  │ Document API│ │
│  │   Routes        │  │                 │  │                 │  │             │ │
│  │                 │  │ • /api/auth/*   │  │ • /api/drive/*  │  │ • /api/docs │ │
│  │ • /api/auth/    │  │ • Login/Logout  │  │ • File Sync     │  │ • Processing│ │
│  │ • /api/drive/   │  │ • Registration  │  │ • OAuth Flow    │  │ • Graph Gen │ │
│  │ • /api/docs/    │  │ • Session Mgmt  │  │ • File Download │  │ • Metadata  │ │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘  └─────────────┘ │
└─────────────────────────────────────────────────────────────────────────────────┘
                                        │
                                        ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                                 SERVICE LAYER                                  │
├─────────────────────────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────┐ │
│  │   MongoDB       │  │   Google Drive  │  │   Python        │  │   File      │ │
│  │   Database      │  │   API           │  │   Service       │  │   Storage   │ │
│  │                 │  │                 │  │   (Port 8000)   │  │             │ │
│  │ • User Accounts │  │ • OAuth 2.0     │  │                 │  │ • Local     │ │
│  │ • Sessions      │  │ • File Access   │  │ • FastAPI       │  │   Files     │ │
│  │ • Preferences   │  │ • Real-time     │  │ • PDF Processing│  │ • Processed │ │
│  │ • Drive Tokens  │  │   Sync          │  │ • AI Embeddings │  │   Data      │ │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘  └─────────────┘ │
└─────────────────────────────────────────────────────────────────────────────────┘
                                        │
                                        ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                                  AI LAYER                                      │
├─────────────────────────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────┐ │
│  │   OpenRouter    │  │   Sentence      │  │   spaCy NLP     │  │   NetworkX  │ │
│  │   API           │  │   Transformers  │  │   Processing    │  │   Graphs    │ │
│  │                 │  │                 │  │                 │  │             │ │
│  │ • AI Models     │  │ • Text          │  │ • Entity        │  │ • Knowledge │ │
│  │ • Summarization │  │   Embeddings    │  │   Extraction    │  │   Graphs    │ │
│  │ • Text Analysis │  │ • Similarity    │  │ • NER           │  │ • Graph     │ │
│  │ • Compression   │  │   Calculation   │  │ • Dependency    │  │   Analysis  │ │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘  └─────────────┘ │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### Data Flow

1. **Authentication Flow**: User login → MongoDB session → JWT tokens → API access
2. **Document Processing**: File upload → Python service → AI analysis → Graph generation
3. **Drive Sync**: OAuth → Google Drive API → File download → Local processing
4. **Real-time Updates**: WebSocket connections → Live collaboration → UI updates

## 🛠️ Tech Stack

### Frontend
- **Next.js 15** - React framework with App Router
- **Tailwind CSS** - Utility-first CSS framework
- **Monaco Editor** - Code editor integration
- **D3.js** - Data visualization
- **Framer Motion** - Animations
- **NextAuth.js** - Authentication

### Backend
- **FastAPI** - Python web framework
- **PyPDF2/pdfplumber** - PDF text extraction
- **Sentence Transformers** - AI embeddings
- **NetworkX** - Knowledge graph generation
- **spaCy** - NLP processing
- **OpenRouter** - AI model integration

### Database & Storage
- **MongoDB** - User data, sessions, and metadata
- **Google Drive API** - Cloud file storage and sync
- **Local File System** - Processed documents and cache

### Authentication & Security
- **bcryptjs** - Password hashing
- **JWT/Sessions** - Token-based authentication
- **OAuth 2.0** - Google Drive integration
- **CORS** - Cross-origin resource sharing

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm
- Python 3.8+
- Docker and Docker Compose (optional)

### Option 1: Docker (Recommended)

```bash
# Clone the repository
git clone <repository-url>
cd assist2

# Start all services
docker-compose up --build

# Access the application
open http://localhost:3000
```

### Option 2: Local Development

#### Frontend Setup
```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

#### Backend Setup
```bash
# Navigate to Python service
cd python_service

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Download spaCy model
python -m spacy download en_core_web_sm

# Start the service
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

## 📁 Project Structure

```
assist2/
├── src/                    # Next.js application
│   ├── app/               # App Router pages
│   ├── lib/               # Utility functions
│   └── models/            # Data models
├── python_service/        # Python backend
│   ├── services/          # Core services
│   ├── main.py           # FastAPI application
│   └── requirements.txt  # Python dependencies
├── docker-compose.yml    # Docker configuration
└── package.json          # Node.js dependencies
```

## 🔧 Configuration

### Environment Variables

Create `.env.local` for the frontend:
```env
# Authentication
NEXTAUTH_SECRET=your-secret-key
NEXTAUTH_URL=http://localhost:3000

# MongoDB
MONGODB_URI=mongodb://localhost:27017/assist2

# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_REDIRECT_URI=http://localhost:3000/api/auth/google/callback

# Python Service
PYTHON_SERVICE_URL=http://localhost:8000
```

Create `.env` in `python_service/` for the backend:
```env
# AI Services
OPENROUTER_API_KEY=your-openrouter-api-key

# Processing Configuration
COMPRESSION_TARGET=1000
MAX_TEXT_LENGTH=50000
MAX_GRAPH_NODES=100
MAX_GRAPH_EDGES=200

# API Configuration
API_HOST=0.0.0.0
API_PORT=8000
LOG_LEVEL=INFO

# CORS
CORS_ORIGINS=["http://localhost:3000", "http://127.0.0.1:3000"]
```

### Google Drive Setup

1. **Create Google Cloud Project**:
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project or select existing one
   - Enable Google Drive API

2. **Configure OAuth 2.0**:
   - Go to "APIs & Services" > "Credentials"
   - Create OAuth 2.0 Client ID
   - Add authorized redirect URIs:
     - `http://localhost:3000/api/auth/google/callback`
     - `http://127.0.0.1:3000/api/auth/google/callback`

3. **Set Scopes**:
   - `https://www.googleapis.com/auth/drive.readonly`
   - `https://www.googleapis.com/auth/drive.file`

### MongoDB Setup

1. **Local Installation**:
   ```bash
   # Install MongoDB
   sudo apt-get install mongodb  # Ubuntu/Debian
   brew install mongodb-community  # macOS
   
   # Start MongoDB service
   sudo systemctl start mongod  # Linux
   brew services start mongodb-community  # macOS
   ```

2. **MongoDB Atlas (Cloud)**:
   - Create account at [MongoDB Atlas](https://www.mongodb.com/atlas)
   - Create new cluster
   - Get connection string
   - Update `MONGODB_URI` in environment variables

## 📚 API Endpoints

### Document Processing
- `POST /process-pdf` - Process PDF documents
- `POST /extract-text` - Extract text only
- `POST /compress-text` - Compress text content
- `POST /summarize` - Generate document summaries
- `POST /generate-graph` - Create knowledge graphs

### Health & Config
- `GET /health` - Service health check
- `GET /config` - Current configuration

## 🧪 Testing

```bash
# Test Python service
cd python_service
python test_service.py

# Test enhanced features
python test_enhanced_services.py

# Run all tests
python run_tests.py
```

## 🚀 Deployment

### Production Build
```bash
# Build frontend
npm run build

# Build Python service
cd python_service
docker build -t document-processor .

# Deploy with Docker Compose
docker-compose -f docker-compose.prod.yml up -d
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support and questions:
- Check the [documentation](python_service/README.md)
- Open an issue on GitHub
- Review the [enhanced features guide](python_service/README_ENHANCED.md)

---