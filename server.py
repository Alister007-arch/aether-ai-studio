import os
import math
from typing import List, Optional, Dict, Any
from dotenv import load_dotenv

from fastapi import FastAPI, HTTPException, UploadFile, File, Form
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

# Load environment variables from .env
load_dotenv()
API_KEY = os.getenv("GOOGLE_API_KEY")

def get_api_key() -> Optional[str]:
    return os.getenv("GOOGLE_API_KEY") or API_KEY

# Root directories and ChromaDB paths
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
CHROMA_DIR = os.path.join(BASE_DIR, "RAG", "chroma_db")
if not os.path.exists(CHROMA_DIR):
    CHROMA_DIR = os.path.join(BASE_DIR, "chroma_db")

DOCS_DIR = os.path.join(BASE_DIR, "RAG", "document loader")
os.makedirs(DOCS_DIR, exist_ok=True)

# Lazy import helpers to ensure server starts cleanly
try:
    from langchain_google_genai import ChatGoogleGenerativeAI, GoogleGenerativeAIEmbeddings
    from langchain_chroma import Chroma
    from langchain_community.document_loaders import PyPDFLoader
    from langchain_text_splitters import RecursiveCharacterTextSplitter
    LANGCHAIN_AVAILABLE = True
except Exception as e:
    LANGCHAIN_AVAILABLE = False
    print(f"Warning: LangChain initialization issue: {e}")

app = FastAPI(
    title="Aether AI Studio API",
    description="Backend API powering the modern frontend for Gemini Chat, Chroma RAG & Embeddings",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Helper function to extract text from LangChain message response
def extract_text_content(content: Any) -> str:
    if isinstance(content, str):
        return content
    if isinstance(content, list):
        parts = []
        for item in content:
            if isinstance(item, dict) and "text" in item:
                parts.append(str(item["text"]))
            elif isinstance(item, str):
                parts.append(item)
            elif hasattr(item, "text"):
                parts.append(str(item.text))
            else:
                parts.append(str(item))
        return "\n".join(parts)
    return str(content)

# Cosine similarity helper
def cosine_similarity(v1: List[float], v2: List[float]) -> float:
    dot_product = sum(a * b for a, b in zip(v1, v2))
    norm_v1 = math.sqrt(sum(a * a for a, v in zip(v1, v1) for a in [v]))
    norm_v2 = math.sqrt(sum(b * b for b, v in zip(v2, v2) for b in [v]))
    if norm_v1 == 0 or norm_v2 == 0:
        return 0.0
    return dot_product / (norm_v1 * norm_v2)


# Pydantic Request Models
class RagQueryRequest(BaseModel):
    question: str
    k: int = 4
    fetch_k: int = 10
    search_type: str = "mmr"
    embedding_model: str = "gemini-embedding-001"
    chat_model: str = "gemini-3.7-flash"

class GeminiChatRequest(BaseModel):
    message: str
    model: str = "gemini-3.7-flash"
    system_instruction: Optional[str] = None
    temperature: float = 0.7

class EmbeddingRequest(BaseModel):
    text: str
    model: str = "gemini-embedding-001"

class SimilarityRequest(BaseModel):
    text1: str
    text2: str
    model: str = "gemini-embedding-001"


# Endpoints
@app.get("/api/status")
def get_system_status():
    api_key = get_api_key()
    api_key_configured = bool(api_key)
    chroma_count = 0
    pdf_files = []

    if os.path.exists(DOCS_DIR):
        pdf_files = [f for f in os.listdir(DOCS_DIR) if f.lower().endswith(".pdf")]

    if LANGCHAIN_AVAILABLE and api_key_configured and os.path.exists(CHROMA_DIR):
        try:
            emb = GoogleGenerativeAIEmbeddings(
                model="gemini-embedding-001",
                google_api_key=api_key
            )
            db = Chroma(
                persist_directory=CHROMA_DIR,
                embedding_function=emb
            )
            chroma_count = db._collection.count()
        except Exception as e:
            print("Error checking Chroma count:", e)

    return {
        "status": "ready" if api_key_configured else "missing_api_key",
        "api_key_configured": api_key_configured,
        "chroma_chunks_count": chroma_count,
        "pdf_files": pdf_files,
        "default_model": "gemini-3.7-flash",
        "chroma_dir": CHROMA_DIR
    }


@app.post("/api/rag/query")
def rag_query(req: RagQueryRequest):
    api_key = get_api_key()
    if not api_key:
        raise HTTPException(
            status_code=400,
            detail="GOOGLE_API_KEY is not configured. Please set the GOOGLE_API_KEY secret in Space settings or in your environment."
        )
    if not req.question.strip():
        raise HTTPException(status_code=400, detail="Question cannot be empty.")

    try:
        # 1. Embedding model
        emb_model = GoogleGenerativeAIEmbeddings(
            model=req.embedding_model,
            google_api_key=api_key
        )

        # 2. Chroma DB connection
        vector_db = Chroma(
            persist_directory=CHROMA_DIR,
            embedding_function=emb_model
        )

        # 3. Create Retriever
        if req.search_type == "mmr":
            retriever = vector_db.as_retriever(
                search_type="mmr",
                search_kwargs={
                    "k": req.k,
                    "fetch_k": req.fetch_k
                }
            )
        else:
            retriever = vector_db.as_retriever(
                search_kwargs={"k": req.k}
            )

        # 4. Retrieve docs
        retrieved_docs = retriever.invoke(req.question)

        # 5. Build Context
        context_parts = []
        chunks_response = []

        for i, doc in enumerate(retrieved_docs):
            context_parts.append(doc.page_content)
            chunks_response.append({
                "chunk_index": i + 1,
                "content": doc.page_content,
                "metadata": doc.metadata,
                "length": len(doc.page_content)
            })

        context = "\n\n".join(context_parts)

        # 6. Prompt exactly matching user's RAG/last.py logic
        prompt = f"""You are a helpful PDF assistant.

Answer the user's question using ONLY the information
provided in the context.

If the answer is not available in the context, say:

"I could not find the answer in the PDF."

Do not make up information.

Context:
{context}

User Question:
{req.question}
"""

        # 7. Gemini Chat Model
        llm = ChatGoogleGenerativeAI(
            model=req.chat_model,
            google_api_key=api_key
        )

        response = llm.invoke(prompt)
        answer_text = extract_text_content(response.content)

        return {
            "question": req.question,
            "answer": answer_text,
            "chunks_retrieved": len(retrieved_docs),
            "chunks": chunks_response,
            "model_used": req.chat_model
        }

    except Exception as e:
        print("RAG query error:", e)
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/gemini/chat")
def gemini_direct_chat(req: GeminiChatRequest):
    api_key = get_api_key()
    if not api_key:
        raise HTTPException(
            status_code=400,
            detail="GOOGLE_API_KEY is not configured. Please set the GOOGLE_API_KEY secret in Space settings or in your environment."
        )
    if not req.message.strip():
        raise HTTPException(status_code=400, detail="Message cannot be empty.")

    try:
        kwargs: Dict[str, Any] = {
            "model": req.model,
            "google_api_key": api_key,
            "temperature": req.temperature
        }

        llm = ChatGoogleGenerativeAI(**kwargs)

        input_prompt = req.message
        if req.system_instruction and req.system_instruction.strip():
            input_prompt = f"System Instruction: {req.system_instruction}\n\nUser: {req.message}"

        response = llm.invoke(input_prompt)
        text = extract_text_content(response.content)

        return {
            "reply": text,
            "model": req.model
        }
    except Exception as e:
        print("Direct Gemini chat error:", e)
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/embeddings/generate")
def generate_embedding(req: EmbeddingRequest):
    api_key = get_api_key()
    if not api_key:
        raise HTTPException(
            status_code=400,
            detail="GOOGLE_API_KEY is not configured. Please set the GOOGLE_API_KEY secret in Space settings or in your environment."
        )
    if not req.text.strip():
        raise HTTPException(status_code=400, detail="Text cannot be empty.")

    try:
        emb_model = GoogleGenerativeAIEmbeddings(
            model=req.model,
            google_api_key=api_key
        )
        vector = emb_model.embed_query(req.text)
        sample = vector[:30] if len(vector) >= 30 else vector

        return {
            "text": req.text,
            "model": req.model,
            "dimension": len(vector),
            "preview_first_10": vector[:10],
            "sample_30": sample
        }
    except Exception as e:
        print("Embedding generation error:", e)
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/embeddings/similarity")
def calculate_similarity(req: SimilarityRequest):
    api_key = get_api_key()
    if not api_key:
        raise HTTPException(
            status_code=400,
            detail="GOOGLE_API_KEY is not configured. Please set the GOOGLE_API_KEY secret in Space settings or in your environment."
        )
    if not req.text1.strip() or not req.text2.strip():
        raise HTTPException(status_code=400, detail="Both texts are required.")

    try:
        emb_model = GoogleGenerativeAIEmbeddings(
            model=req.model,
            google_api_key=api_key
        )
        v1 = emb_model.embed_query(req.text1)
        v2 = emb_model.embed_query(req.text2)
        score = cosine_similarity(v1, v2)

        percentage = max(0.0, min(100.0, score * 100))

        interpretation = "Very High Semantic Match"
        if score < 0.3:
            interpretation = "Low / Dissimilar Content"
        elif score < 0.6:
            interpretation = "Moderate Semantic Overlap"
        elif score < 0.8:
            interpretation = "Strong Semantic Alignment"

        return {
            "text1": req.text1,
            "text2": req.text2,
            "cosine_score": round(score, 4),
            "percentage": round(percentage, 2),
            "interpretation": interpretation,
            "dimension": len(v1)
        }
    except Exception as e:
        print("Similarity error:", e)
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/chunks/sample")
def get_chunks_sample(query: Optional[str] = None, limit: int = 6):
    if not API_KEY or not os.path.exists(CHROMA_DIR):
        return {"chunks": [], "total": 0}

    try:
        emb_model = GoogleGenerativeAIEmbeddings(
            model="gemini-embedding-001",
            google_api_key=API_KEY
        )
        vector_db = Chroma(
            persist_directory=CHROMA_DIR,
            embedding_function=emb_model
        )

        total_count = vector_db._collection.count()

        if query and query.strip():
            docs = vector_db.similarity_search(query, k=limit)
        else:
            docs = vector_db.similarity_search("neural networks attention gated recurrent", k=limit)

        results = []
        for i, doc in enumerate(docs):
            results.append({
                "id": i + 1,
                "content": doc.page_content,
                "metadata": doc.metadata,
                "char_length": len(doc.page_content)
            })

        return {
            "total_count": total_count,
            "returned_count": len(results),
            "chunks": results
        }
    except Exception as e:
        print("Fetch chunks error:", e)
        return {"chunks": [], "total": 0, "error": str(e)}


@app.post("/api/rag/upload")
async def upload_pdf_document(file: UploadFile = File(...)):
    if not API_KEY:
        raise HTTPException(status_code=400, detail="GOOGLE_API_KEY is not configured.")
    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are supported.")

    file_path = os.path.join(DOCS_DIR, file.filename)
    try:
        content = await file.read()
        with open(file_path, "wb") as f:
            f.write(content)

        # Ingest as in RAG/chroma.py
        loader = PyPDFLoader(file_path)
        docs = loader.load()

        text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=1000,
            chunk_overlap=200
        )
        chunks = text_splitter.split_documents(docs)

        emb_model = GoogleGenerativeAIEmbeddings(
            model="gemini-embedding-001",
            google_api_key=API_KEY
        )

        vector_db = Chroma.from_documents(
            documents=chunks,
            embedding=emb_model,
            persist_directory=CHROMA_DIR
        )

        total_chunks = vector_db._collection.count()

        return {
            "status": "success",
            "filename": file.filename,
            "pages_loaded": len(docs),
            "chunks_created": len(chunks),
            "total_chunks_in_db": total_chunks
        }
    except Exception as e:
        print("Upload error:", e)
        raise HTTPException(status_code=500, detail=str(e))


# Mount frontend static directory
static_dir = os.path.join(BASE_DIR, "static")
os.makedirs(static_dir, exist_ok=True)
app.mount("/static", StaticFiles(directory=static_dir), name="static")

@app.get("/")
def serve_index():
    index_file = os.path.join(static_dir, "index.html")
    if os.path.exists(index_file):
        return FileResponse(
            index_file,
            headers={
                "Cache-Control": "no-cache, no-store, must-revalidate",
                "Pragma": "no-cache",
                "Expires": "0"
            }
        )
    return {"message": "GenAI RAG Studio API is running. Frontend static/index.html is loading..."}

if __name__ == "__main__":
    import uvicorn
    host = os.environ.get("HOST", "0.0.0.0")
    port = int(os.environ.get("PORT", 8000))
    print("\n=======================================================")
    print("🚀 Starting Aether AI Studio Frontend Server")
    print(f"📍 URL: http://{host}:{port}")
    print("=======================================================\n")
    uvicorn.run("server:app", host=host, port=port, reload=False)
