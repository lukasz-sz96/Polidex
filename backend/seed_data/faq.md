# Frequently Asked Questions

## General Questions

### What is Polidex?
Polidex is a RAG (Retrieval-Augmented Generation) admin system that helps you create AI-powered chatbots backed by your own documents. Upload your knowledge base, and Polidex handles the rest.

### What file formats are supported?
Polidex supports PDF, DOCX, TXT, and Markdown (.md) files. Maximum file size is 50MB per document.

### How does the semantic search work?
When you upload a document, Polidex automatically:
1. Extracts the text content
2. Splits it into manageable chunks (1000 characters with 200 character overlap)
3. Generates embeddings using the all-MiniLM-L6-v2 model
4. Stores embeddings in a vector database for fast similarity search

## Spaces & Organization

### What are spaces?
Spaces are containers for organizing your documents. Think of them as separate knowledge bases. Each space can have its own documents and API keys.

### Can a document belong to multiple spaces?
Yes! Documents can be added to multiple spaces, allowing you to reuse content across different chatbots.

### How do I delete a space?
Navigate to the space detail page and click the delete button. Note: Deleting a space will also delete all associated API keys.

## API & Integration

### How do I get an API key?
Go to the API Keys section in the dashboard, click "New API Key", select a space, and give it a name. The key will be shown once - make sure to copy it!

### Can I customize the chatbot's personality?
Yes! Use the `system_prompt` parameter in your API requests to customize how the chatbot responds. For example, you can make it respond as a specific persona or in a particular tone.

### What happens if I exceed the rate limit?
You'll receive a 429 error. Wait a moment and try again. Default limit is 60 requests per minute.

## Troubleshooting

### My documents aren't being found in searches
- Ensure the document was processed successfully (check chunk count)
- Verify you're querying the correct space
- Try rephrasing your question

### API key not working
- Check that the key is active (not revoked)
- Ensure you're using the correct header: `X-API-Key`
- Verify the key is associated with the space you're trying to access
