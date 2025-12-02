"""
LangChain Integration Django Direct Test
Tests the vector store and medical KB without requiring HTTP server
"""
import os
import sys
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend_health.settings')
django.setup()

from django.contrib.auth import get_user_model
from health_app.services.vector_store_service import VectorStoreService
from health_app.services.medical_knowledge_base import get_medical_knowledge_base
import uuid
from datetime import datetime

User = get_user_model()

def print_section(title):
    """Print a formatted section header"""
    print("\n" + "="*60)
    print(f"  {title}")
    print("="*60 + "\n")

def test_vector_store():
    """Test vector store functionality"""
    print_section("TEST 1: Vector Store Service")
    
    try:
        # Initialize vector store
        vector_store = VectorStoreService()
        print("✅ Vector store initialized")
        
        # Get or create test user
        user, _ = User.objects.get_or_create(email='test@example.com')
        session_id = str(uuid.uuid4())
        
        # Test storing conversation
        print("\n💬 Testing conversation storage...")
        vector_store.add_conversation(
            user_id=user.id,
            session_id=session_id,
            role="user",
            content="I have a headache and fever",
            metadata={
                'source': 'user_query',
                'timestamp': datetime.now().isoformat(),
                'category': 'symptoms'
            }
        )
        print("✅ Conversation stored successfully")
        
        # Test searching conversations
        print("\n🔍 Testing conversation search...")
        results = vector_store.search_similar_conversations(
            user_id=user.id,
            query="headache fever symptoms",
            k=1
        )
        print(f"✅ Found {len(results)} results")
        if results:
            print(f"   - Result: {results[0]['content'][:100]}...")
        
        return True
    except Exception as e:
        print(f"❌ Vector store test failed: {str(e)}")
        import traceback
        traceback.print_exc()
        return False

def test_medical_kb():
    """Test medical knowledge base"""
    print_section("TEST 2: Medical Knowledge Base")
    
    try:
        # Initialize medical KB
        kb = get_medical_knowledge_base()
        print("✅ Medical knowledge base initialized")
        
        # Get categories
        print("\n📚 Fetching available categories...")
        categories = kb.MEDICAL_RESEARCH_PAPERS
        unique_categories = list(set([p.get('category', 'general') for p in categories]))
        print(f"✅ Found {len(unique_categories)} categories:")
        for cat in unique_categories[:5]:
            print(f"   - {cat}")
        
        # Test search
        print("\n🔍 Testing medical research search...")
        results = kb.search_medical_knowledge("diabetes management", k=2)
        print(f"✅ Found {len(results)} relevant papers")
        if results:
            for i, result in enumerate(results, 1):
                title = result.get('metadata', {}).get('title', 'Unknown')[:60]
                print(f"   {i}. {title}...")
        
        # Test RAG context generation
        print("\n🤖 Testing RAG context generation...")
        context = kb.get_research_context("headache treatment", max_results=2)
        print(f"✅ Generated context ({len(context)} chars)")
        print(f"   Preview: {context[:150]}...")
        
        return True
    except Exception as e:
        print(f"❌ Medical KB test failed: {str(e)}")
        import traceback
        traceback.print_exc()
        return False

def test_integration():
    """Test vector store and medical KB integration"""
    print_section("TEST 3: Integration Test")
    
    try:
        vector_store = VectorStoreService()
        kb = get_medical_knowledge_base()
        user, _ = User.objects.get_or_create(email='test@example.com')
        session_id = str(uuid.uuid4())
        
        # Simulate a conversation with context
        query = "I have chest pain and shortness of breath"
        
        print(f"User Query: {query}\n")
        
        # Store user message
        vector_store.add_conversation(
            user_id=user.id,
            session_id=session_id,
            role="user",
            content=query,
            metadata={'source': 'user_query', 'category': 'cardiology'}
        )
        print("✅ Stored user query")
        
        # Get medical context
        print("\n📖 Fetching medical context...")
        medical_context = kb.get_research_context(query, max_results=3)
        print(f"✅ Generated {len(medical_context)} chars of medical context")
        print(f"\nContext Preview:\n{medical_context[:300]}...\n")
        
        # Store AI response
        ai_response = "Based on your symptoms, this could indicate a cardiac condition. Please seek immediate medical attention."
        vector_store.add_conversation(
            user_id=user.id,
            session_id=session_id,
            role="assistant",
            content=ai_response,
            metadata={'source': 'ai_response', 'model': 'gemini-pro'}
        )
        print("✅ Stored AI response")
        
        # Test retrieval of conversation history
        print("\n📜 Retrieving conversation history...")
        history = vector_store.search_similar_conversations(
            user_id=user.id,
            query=query,
            k=2
        )
        print(f"✅ Retrieved {len(history)} messages from conversation")
        for msg in history:
            role = msg.metadata.get('role', 'unknown') if hasattr(msg, 'metadata') else msg.get('role', 'unknown')
            content = msg.page_content[:60] if hasattr(msg, 'page_content') else msg.get('content', '')[:60]
            print(f"   - [{role}]: {content}...")
        
        return True
    except Exception as e:
        print(f"❌ Integration test failed: {str(e)}")
        import traceback
        traceback.print_exc()
        return False

def main():
    print("\n" + "🚀 "*20)
    print("LANGCHAIN DJANGO INTEGRATION TEST SUITE")
    print("🚀 "*20)
    
    results = []
    
    # Run tests
    results.append(("Vector Store Service", test_vector_store()))
    results.append(("Medical Knowledge Base", test_medical_kb()))
    results.append(("Integration", test_integration()))
    
    # Summary
    print_section("TEST SUMMARY")
    passed = sum(1 for _, result in results if result)
    total = len(results)
    
    for test_name, result in results:
        status = "✅ PASSED" if result else "❌ FAILED"
        print(f"{test_name}: {status}")
    
    print(f"\n{passed}/{total} tests passed")
    
    if passed == total:
        print("\n🎉 All tests passed! Your LangChain integration is working correctly.")
    else:
        print(f"\n⚠️  {total - passed} test(s) failed. Please check the errors above.")

if __name__ == "__main__":
    main()
