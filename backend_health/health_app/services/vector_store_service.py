"""
Vector Store Service using ChromaDB for conversation embeddings
"""
import os
from typing import List, Dict, Any
from django.conf import settings
import chromadb
from chromadb.config import Settings
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_community.vectorstores import Chroma
from langchain_core.documents import Document


class VectorStoreService:
    """Service for managing conversation embeddings in ChromaDB"""
    
    def __init__(self):
        self.persist_directory = os.path.join(
            os.path.dirname(os.path.dirname(os.path.dirname(__file__))),
            'chroma_db'
        )
        
        # Use HuggingFace embeddings (free, local, no API key needed)
        self.embeddings = HuggingFaceEmbeddings(
            model_name="sentence-transformers/all-MiniLM-L6-v2"
        )
        
        self.vectorstore = Chroma(
            persist_directory=self.persist_directory,
            embedding_function=self.embeddings,
            collection_name="health_conversations"
        )
    
    def add_conversation(
        self,
        user_id: int,
        session_id: str,
        role: str,
        content: str,
        metadata: Dict[str, Any] = None
    ) -> None:
        """
        Add a conversation message to the vector store
        
        Args:
            user_id: User ID
            session_id: Conversation session ID
            role: Message role (user/assistant)
            content: Message content
            metadata: Additional metadata
        """
        if not content or not content.strip():
            return
        
        doc_metadata = {
            "user_id": str(user_id),
            "session_id": session_id,
            "role": role,
            **(metadata or {})
        }
        
        document = Document(
            page_content=content,
            metadata=doc_metadata
        )
        
        self.vectorstore.add_documents([document])
    
    def search_similar_conversations(
        self,
        user_id: int,
        query: str,
        k: int = 5,
        filter_role: str = None
    ) -> List[Dict[str, Any]]:
        """
        Search for similar past conversations
        
        Args:
            user_id: User ID to filter conversations
            query: Search query
            k: Number of results to return
            filter_role: Optional role filter (user/assistant)
        
        Returns:
            List of similar conversation documents
        """
        if not query or not query.strip():
            return []
        
        where_filter = {"user_id": str(user_id)}
        if filter_role:
            where_filter["role"] = filter_role
        
        try:
            results = self.vectorstore.similarity_search_with_score(
                query=query,
                k=k,
                filter=where_filter
            )
            
            formatted_results = []
            for doc, score in results:
                formatted_results.append({
                    "content": doc.page_content,
                    "metadata": doc.metadata,
                    "similarity_score": float(score)
                })
            
            return formatted_results
        except Exception as e:
            print(f"Error searching conversations: {e}")
            return []
    
    def get_conversation_context(
        self,
        user_id: int,
        current_message: str,
        max_context_items: int = 3
    ) -> str:
        """
        Get relevant conversation context for the current message
        
        Args:
            user_id: User ID
            current_message: Current user message
            max_context_items: Maximum context items to retrieve
        
        Returns:
            Formatted context string
        """
        similar_conversations = self.search_similar_conversations(
            user_id=user_id,
            query=current_message,
            k=max_context_items
        )
        
        if not similar_conversations:
            return ""
        
        context_parts = ["Based on your previous conversations:\n"]
        
        for idx, conv in enumerate(similar_conversations, 1):
            role = conv['metadata'].get('role', 'unknown')
            content = conv['content']
            context_parts.append(f"{idx}. [{role}]: {content}")
        
        return "\n".join(context_parts)
    
    def delete_user_conversations(self, user_id: int) -> None:
        """
        Delete all conversations for a specific user
        
        Args:
            user_id: User ID
        """
        try:
            self.vectorstore.delete(
                where={"user_id": str(user_id)}
            )
        except Exception as e:
            print(f"Error deleting user conversations: {e}")
    
    def get_session_messages(self, user_id: int, session_id: str) -> List[Dict[str, Any]]:
        """
        Get all messages from a specific session
        
        Args:
            user_id: User ID
            session_id: Session ID
        
        Returns:
            List of message dictionaries with content, role, and timestamp
        """
        try:
            results = self.vectorstore.get(
                where={
                    "$and": [
                        {"user_id": str(user_id)},
                        {"session_id": session_id}
                    ]
                }
            )
            
            messages = []
            if results and 'documents' in results:
                for idx, content in enumerate(results['documents']):
                    metadata = results['metadatas'][idx] if 'metadatas' in results else {}
                    messages.append({
                        'content': content,
                        'role': metadata.get('role', 'unknown'),
                        'timestamp': metadata.get('timestamp', ''),
                        'metadata': metadata
                    })
            
            # Sort by timestamp if available
            messages.sort(key=lambda x: x.get('timestamp', ''))
            return messages
            
        except Exception as e:
            print(f"Error getting session messages: {e}")
            return []


_vector_store_instance = None


def get_vector_store() -> VectorStoreService:
    """Get or create vector store singleton instance"""
    global _vector_store_instance
    if _vector_store_instance is None:
        _vector_store_instance = VectorStoreService()
    return _vector_store_instance
