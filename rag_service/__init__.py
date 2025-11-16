"""Lightweight RAG microservice for the Ethik stack."""

from .documents import Document, load_documents
from .index import VectorIndex

__all__ = ['Document', 'load_documents', 'VectorIndex']
