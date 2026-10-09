<div align="center">

# ⚡ Aether AI Studio
### Intelligent GenAI, RAG & Vector Intelligence Platform

[![Live Demo](https://img.shields.io/badge/Live%20Demo-Render-46E3B7?style=for-the-badge&logo=render&logoColor=white)](https://aether-ai-studio.onrender.com)
[![Python](https://img.shields.io/badge/Python-3.11+-3776AB?style=for-the-badge&logo=python&logoColor=white)](https://python.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115+-009688?style=for-the-badge&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![Google Gemini](https://img.shields.io/badge/Google%20Gemini-3.7%20Flash-4285F4?style=for-the-badge&logo=google&logoColor=white)](https://aistudio.google.com)
[![ChromaDB](https://img.shields.io/badge/ChromaDB-Vector%20Store-FF6F00?style=for-the-badge)](https://www.trychroma.com/)

<p align="center">
  <b>🌐 Live Application:</b> <a href="https://aether-ai-studio.onrender.com">https://aether-ai-studio.onrender.com</a>
</p>

---

</div>

## 🌟 Overview

**Aether AI Studio** is a modern, full-stack Generative AI application featuring high-performance Retrieval-Augmented Generation (RAG), vector similarity analysis, direct LLM reasoning, and a responsive glassmorphic user interface.

Powered by **Google Gemini 3.7 Flash**, **LangChain**, and **ChromaDB**, it enables users to seamlessly upload documents, index multi-dimensional embeddings, and interrogate knowledge bases with precise semantic grounding.

---

## 🚀 Key Features

### 1. 📚 Document Knowledge Base & RAG Engine
- **PDF Ingestion & Chunking**: Automatic document parsing with Recursive Character Splitting (`1000` chunk size, `200` overlap).
- **MMR & Similarity Search**: Maximal Marginal Relevance (MMR) retrieval to minimize redundancy and maximize diversity.
- **Strict Semantic Grounding**: Tailored system prompts that answer strictly based on retrieved context.
- **Source Inspection**: Inspect retrieved chunks, source metadata, and character counts for full transparency.

### 2. 💬 Direct Gemini Intelligence
- **Multi-Model Support**: Powered by Google Gemini (`gemini-3.7-flash` and `gemini-1.5-pro`).
- **Configurable Parameters**: Real-time adjustment of temperature and system instructions.
- **Markdown & Code Rendering**: Syntax highlighting and fluid streaming response styling.

### 3. 🔬 Vector Lab & Semantic Explorer
- **Live Vector Generation**: Generate 768/1536-dimensional vectors using `gemini-embedding-001`.
- **Cosine Similarity Calculator**: Compare any two text snippets with real-time cosine score interpretation.
- **Spectrum Visualization**: Dynamic visual bar rendering of vector dimensions.

### 4. 🎨 Glassmorphic Multi-Theme UI
- Built-in curated themes: **Spider-Man Suit**, **Batman Dark Knight**, **Iron Man Arc Reactor**, **Luxury Gold**, **Electric Indigo**, **Cyber Cyan**, **Emerald Matrix**, **Crimson Ruby**, and **Titanium Platinum**.
- Ambient glow toggles, compact reading mode, and responsive layout.

---

## 🛠️ Architecture & Tech Stack

```text
┌────────────────────────────────────────────────────────┐
│               Frontend: Glassmorphic UI                 │
│      (Vanilla HTML5 / Modern CSS3 / Vanilla JS ES6)     │
└───────────────────────────┬────────────────────────────┘
                            │ REST APIs
┌───────────────────────────▼────────────────────────────┐
│                  FastAPI Backend Server                │
├───────────────────────────┬────────────────────────────┤
│   LangChain Orchestration │   ChromaDB Vector Store    │
├───────────────────────────┼────────────────────────────┤
│ Google Generative AI (LLM)│ Gemini Embeddings Engine   │
└───────────────────────────┴────────────────────────────┘
```

- **Backend**: FastAPI, Uvicorn, Pydantic, Python-Dotenv
- **AI / LLM Framework**: LangChain Google GenAI, LangChain Chroma, LangChain Community
- **Vector Database**: ChromaDB (with persistent SQLite3 vector storage)
- **Frontend**: Vanilla HTML5, Modern CSS Variables & Animations, Vanilla JavaScript ES6
- **Deployment**: Render, Docker (Python 3.11-slim)

---

## 💻 Local Setup & Development

### 1. Clone the Repository
```bash
git clone https://github.com/Alister007-arch/aether-ai-studio.git
cd aether-ai-studio
```

### 2. Create and Activate Virtual Environment
```bash
# Windows
python -m venv venv
venv\Scripts\activate

# macOS / Linux
python3 -m venv venv
source venv/bin/activate
```

### 3. Install Dependencies
```bash
pip install -r requirements.txt
```

### 4. Configure Environment Variables
Create a `.env` file in the project root:
```env
GOOGLE_API_KEY=your_gemini_api_key_here
PORT=8000
```
> Get your free Gemini API key at [Google AI Studio](https://aistudio.google.com/).

### 5. Run the Application
```bash
python server.py
```
Open your browser and navigate to:
```text
http://localhost:8000
```

---

## ☁️ Deployment

### Render (Recommended)
This repository includes a `render.yaml` blueprint:
1. Fork or push this repository to GitHub.
2. Sign in to [Render Dashboard](https://dashboard.render.com).
3. Click **New +** > **Web Service**, connect this repository.
4. Add the environment variable:
   - `GOOGLE_API_KEY`: Your Gemini API key.
5. Deploy!

### Docker
```bash
# Build Docker image
docker build -t aether-ai-studio .

# Run container
docker run -p 8000:8000 -e GOOGLE_API_KEY=your_key aether-ai-studio
```

---

## 📁 Project Structure

```text
├── RAG/
│   ├── chroma_db/          # Persistent Chroma vector store
│   ├── document loader/    # Sample PDF documents
│   ├── chroma.py           # Ingestion logic
│   └── last.py             # RAG query logic
├── static/
│   ├── index.html          # Main application page
│   ├── style.css           # Glassmorphism & responsive themes
│   └── app.js              # Application controller & state
├── Dockerfile              # Containerization configuration
├── Procfile                # Process file for cloud runners
├── render.yaml             # Render deployment blueprint
├── requirements.txt        # Python package dependencies
├── server.py               # FastAPI backend & static server
└── README.md               # Project documentation
```

---

## 📜 License
This project is open-source under the [MIT License](LICENSE).
