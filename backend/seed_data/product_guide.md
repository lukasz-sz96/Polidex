# Polidex Product Guide

## Overview

Polidex is an intelligent RAG (Retrieval-Augmented Generation) administration system designed to help teams manage knowledge bases for AI-powered chatbots. It provides a seamless way to upload, organize, and query documents using natural language.

## Key Features

### Document Management
- **Multi-format Support**: Upload PDF, DOCX, TXT, and Markdown files
- **Automatic Processing**: Documents are automatically chunked and embedded for semantic search
- **Space Organization**: Organize documents into logical spaces for different use cases

### Spaces
Spaces are isolated containers for your documents. Each space can have its own set of documents and API keys. This allows you to:
- Separate knowledge bases for different products
- Maintain distinct chatbots for different departments
- Control access at a granular level

### API Integration
External applications can query your knowledge base using REST APIs:
- Simple authentication with API keys
- Customizable system prompts for personalized responses
- Source citations included in every response

## Getting Started

1. **Create a Space**: Start by creating a space to organize your documents
2. **Upload Documents**: Add your knowledge base documents to the space
3. **Generate API Key**: Create an API key linked to your space
4. **Integrate**: Use the API key to query your knowledge base from any application

## Best Practices

- Keep documents focused on specific topics for better retrieval
- Use descriptive filenames for easy identification
- Regularly update your knowledge base to keep information current
- Monitor query logs to understand user needs
