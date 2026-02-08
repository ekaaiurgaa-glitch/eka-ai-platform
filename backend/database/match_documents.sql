-- Enable vector extension
create extension if not exists vector;

-- Create documents table if not exists (for RAG storage)
create table if not exists documents (
    id bigint generated always as identity primary key,
    content text,
    metadata jsonb,
    embedding vector(768)
);

-- Create index for faster similarity search
-- Using ivfflat for balanced performance/recall
create index if not exists documents_embedding_idx 
on documents 
using ivfflat (embedding vector_cosine_ops)
with (lists = 100);

-- LangChain RPC Function
-- Dimension 768 is optimized for Google Gemini Embeddings
create or replace function match_documents (
  query_embedding vector(768), 
  match_threshold float,
  match_count int
) returns table (
  id bigint,
  content text,
  metadata jsonb,
  similarity float
) language plpgsql stable as $$
begin
  return query
  select
    documents.id,
    documents.content,
    documents.metadata,
    1 - (documents.embedding <=> query_embedding) as similarity
  from documents
  where 1 - (documents.embedding <=> query_embedding) > match_threshold
  order by similarity desc
  limit match_count;
end;
$$;

-- Enable RLS on documents table
alter table documents enable row level security;

-- Create policy for authenticated users to read documents
create policy if not exists "Allow authenticated read" on documents
    for select using (auth.role() = 'authenticated');
