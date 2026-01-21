# Polidex API Documentation

## Authentication

All external API requests require an API key. Include it in the header:

```
X-API-Key: pdx_your_api_key_here
```

## Endpoints

### Query Knowledge Base

**POST** `/api/v1/query`

Query your knowledge base with natural language.

#### Request Body

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| query | string | Yes | The question to ask |
| top_k | integer | No | Number of chunks to retrieve (default: 5, max: 50) |
| system_prompt | string | No | Custom system prompt for personalized responses |

#### Example Request

```json
{
  "query": "How do I create a new space?",
  "top_k": 5,
  "system_prompt": "You are a helpful support assistant for Polidex."
}
```

#### Example Response

```json
{
  "answer": "To create a new space in Polidex, navigate to the Spaces section in the admin dashboard and click the 'New Space' button. Enter a name and optional description for your space.",
  "sources": [
    {
      "document_id": 1,
      "filename": "product_guide.md",
      "chunk_index": 3,
      "content": "1. **Create a Space**: Start by creating a space...",
      "score": 0.8542
    }
  ]
}
```

## Rate Limits

- Default: 60 requests per minute
- Rate limit headers are included in responses

## Error Codes

| Code | Description |
|------|-------------|
| 401 | Invalid or missing API key |
| 404 | Space not found |
| 429 | Rate limit exceeded |
| 500 | Internal server error |