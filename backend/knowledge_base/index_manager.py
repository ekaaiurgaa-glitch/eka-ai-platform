import os
from PyPDF2 import PdfReader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_google_genai import GoogleGenerativeAIEmbeddings
from database.supabase_client import supabase_client

class KnowledgeBaseManager:
    def __init__(self):
        # Using Gemini embeddings for cost-efficiency
        self.embeddings = GoogleGenerativeAIEmbeddings(
            model="models/embedding-001",
            google_api_key=os.getenv("GEMINI_API_KEY")
        )

    def ingest_pdf(self, file_path: str, metadata: dict):
        """Reads a PDF, chunks it, embeds it, and stores in Supabase"""
        print(f"📄 Processing {file_path}...")
        
        try:
            reader = PdfReader(file_path)
            text = ""
            for page in reader.pages:
                text += page.extract_text() or ""

            # Chunking with overlap to preserve context
            splitter = RecursiveCharacterTextSplitter(
                chunk_size=1000,
                chunk_overlap=200
            )
            chunks = splitter.split_text(text)

            print(f"⚡ Generating embeddings for {len(chunks)} chunks...")
            
            # Batch process could be added here for scale, doing 1-by-1 for MVP
            for i, chunk in enumerate(chunks):
                vector = self.embeddings.embed_query(chunk)
                
                payload = {
                    "content": chunk,
                    "embedding": vector,
                    "metadata": metadata
                }
                
                # Insert into Supabase 'documents' table
                supabase_client.table('documents').insert(payload).execute()
                
            print(f"✅ Ingestion Complete for {file_path}.")
        except Exception as e:
            print(f"❌ Error ingesting {file_path}: {str(e)}")

# Example Usage:
# kb = KnowledgeBaseManager()
# kb.ingest_pdf("./manuals/swift_service.pdf", {"car_model": "Swift", "year": "2020"})
