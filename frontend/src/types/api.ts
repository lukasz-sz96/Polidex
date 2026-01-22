export interface Space {
  id: number
  name: string
  description: string | null
  created_at: string
}

export interface SpaceDetail extends Space {
  document_count: number
  api_key_count: number
  updated_at: string
}

export interface Document {
  id: number
  filename: string
  file_type: string
  file_size: number
  chunk_count: number
  spaces: { id: number; name: string }[]
  created_at: string
}

export interface APIKey {
  id: number
  name: string
  space_id: number
  space_name: string
  key_prefix: string
  is_active: boolean
  request_count: number
  last_used_at: string | null
  created_at: string
}

export interface QueryLog {
  id: number
  query_text: string
  response_text: string
  chunks_retrieved: number
  latency_ms: number
  model_used: string
  source: string
  prompt_tokens: number
  completion_tokens: number
  cost: number
  created_at: string
}

export interface UsageLog {
  id: number
  query_text: string
  response_text: string
  model_used: string
  prompt_tokens: number
  completion_tokens: number
  cost: number
  source: string
  created_at: string
}

export interface UsageData {
  total_cost: number
  total_prompt_tokens: number
  total_completion_tokens: number
  total_requests: number
  logs: UsageLog[]
}

export interface Stats {
  total_queries: number
  avg_latency_ms: number
  avg_chunks_retrieved: number
  total_documents: number
  total_chunks: number
  total_spaces: number
}

export interface ChatResponse {
  answer: string
  sources: {
    document_id: number
    filename: string
    chunk_index: number
    content: string
    score: number
  }[]
}
