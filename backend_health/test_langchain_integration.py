"""
LangChain Integration Test Script
Tests the enhanced chat API with memory and RAG features
"""
import requests
import json
import uuid
import time

# Configuration
BASE_URL = "http://localhost:8000"
EMAIL = "test@example.com"
PASSWORD = "TestPass123"

def print_section(title):
    """Print a formatted section header"""
    print("\n" + "="*60)
    print(f"  {title}")
    print("="*60 + "\n")

def get_auth_token():
    """Get JWT authentication token"""
    print("🔐 Authenticating...")
    response = requests.post(
        f"{BASE_URL}/api/token/",
        json={"email": EMAIL, "password": PASSWORD}
    )
    
    if response.status_code == 200:
        token = response.json()['access']
        print("✅ Authentication successful")
        return token
    else:
        print(f"❌ Authentication failed: {response.status_code}")
        print(f"Response: {response.text}")
        return None

def test_chat_with_memory(token):
    """Test the chat endpoint with memory"""
    print_section("TEST 1: Chat with Memory")
    
    session_id = str(uuid.uuid4())
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }
    
    # First message
    print("💬 Sending first message...")
    response = requests.post(
        f"{BASE_URL}/chat/",
        headers=headers,
        json={
            "message": "I have been experiencing headaches for the past 3 days",
            "session_id": session_id
        },
        stream=True
    )
    
    print("🤖 AI Response (streaming):")
    print("-" * 60)
    full_response = ""
    for chunk in response.iter_content(chunk_size=None, decode_unicode=True):
        if chunk:
            print(chunk, end='', flush=True)
            full_response += chunk
    print("\n" + "-" * 60)
    
    time.sleep(2)
    
    # Follow-up message (should reference previous context)
    print("\n💬 Sending follow-up message...")
    response2 = requests.post(
        f"{BASE_URL}/chat/",
        headers=headers,
        json={
            "message": "What if the headache gets worse at night?",
            "session_id": session_id
        },
        stream=True
    )
    
    print("🤖 AI Response (with context):")
    print("-" * 60)
    for chunk in response2.iter_content(chunk_size=None, decode_unicode=True):
        if chunk:
            print(chunk, end='', flush=True)
    print("\n" + "-" * 60)
    
    return session_id

def test_symptom_diagnosis(token):
    """Test symptom diagnosis with memory"""
    print_section("TEST 2: Symptom Diagnosis with Memory")
    
    session_id = str(uuid.uuid4())
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }
    
    print("💬 Analyzing symptoms: headache, nausea, sensitivity to light")
    response = requests.post(
        f"{BASE_URL}/diagnose/enhanced/",
        headers=headers,
        json={
            "symptom_names": ["headache", "nausea", "sensitivity to light"],
            "session_id": session_id
        },
        stream=True
    )
    
    print("🤖 AI Diagnosis (streaming):")
    print("-" * 60)
    for chunk in response.iter_content(chunk_size=None, decode_unicode=True):
        if chunk:
            print(chunk, end='', flush=True)
    print("\n" + "-" * 60)

def test_medical_research(token):
    """Test medical research search"""
    print_section("TEST 3: Medical Research Search")
    
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }
    
    print("🔍 Searching for: 'migraine headache causes and treatment'")
    response = requests.post(
        f"{BASE_URL}/research/search/",
        headers=headers,
        json={
            "query": "migraine headache causes and treatment",
            "max_results": 3
        }
    )
    
    if response.status_code == 200:
        data = response.json()
        print(f"\n✅ Found {data['results_count']} research papers:")
        print("-" * 60)
        
        for idx, result in enumerate(data['results'], 1):
            print(f"\n📄 Result {idx}:")
            print(f"   Title: {result['metadata'].get('title', 'N/A')}")
            print(f"   Category: {result['metadata'].get('category', 'N/A')}")
            print(f"   Similarity: {result['similarity_score']:.2%}")
            print(f"   Preview: {result['content'][:150]}...")
    else:
        print(f"❌ Search failed: {response.status_code}")
        print(response.text)

def test_conversation_insights(token):
    """Test conversation insights"""
    print_section("TEST 4: Conversation Insights")
    
    headers = {"Authorization": f"Bearer {token}"}
    
    print("📊 Getting conversation insights...")
    response = requests.get(
        f"{BASE_URL}/chat/insights/",
        headers=headers
    )
    
    if response.status_code == 200:
        data = response.json()
        print(f"✅ Total messages: {data['total_messages']}")
        print(f"✅ Unique sessions: {data['unique_sessions']}")
        print(f"\n📝 Recent conversations:")
        print("-" * 60)
        
        for conv in data['recent_conversations'][:3]:
            print(f"   Session: {conv['session_id'][:8]}...")
            print(f"   Message: {conv['content'][:80]}...")
            print(f"   Time: {conv['timestamp']}")
            print()
    else:
        print(f"❌ Failed: {response.status_code}")

def test_active_sessions(token):
    """Test active sessions retrieval"""
    print_section("TEST 5: Active Sessions")
    
    headers = {"Authorization": f"Bearer {token}"}
    
    print("📋 Getting active sessions...")
    response = requests.get(
        f"{BASE_URL}/chat/session/active/",
        headers=headers
    )
    
    if response.status_code == 200:
        data = response.json()
        print(f"✅ Total sessions: {data['total_sessions']}")
        print(f"\n📊 Session details:")
        print("-" * 60)
        
        for session in data['sessions'][:5]:
            print(f"   Session ID: {session['session_id'][:16]}...")
            print(f"   Messages: {session['message_count']}")
            print(f"   Last activity: {session['last_activity']}")
            print()
    else:
        print(f"❌ Failed: {response.status_code}")

def test_medical_categories(token):
    """Test medical categories endpoint"""
    print_section("TEST 6: Medical Categories")
    
    headers = {"Authorization": f"Bearer {token}"}
    
    print("🏥 Getting medical categories...")
    response = requests.get(
        f"{BASE_URL}/research/categories/",
        headers=headers
    )
    
    if response.status_code == 200:
        data = response.json()
        print(f"✅ Available categories ({data['total_count']}):")
        print("-" * 60)
        for cat in data['categories']:
            print(f"   • {cat}")
    else:
        print(f"❌ Failed: {response.status_code}")

def test_session_summary(token, session_id):
    """Test session summary"""
    print_section("TEST 7: Session Summary")
    
    headers = {"Authorization": f"Bearer {token}"}
    
    print(f"📈 Getting summary for session: {session_id[:16]}...")
    response = requests.get(
        f"{BASE_URL}/chat/session/summary/",
        headers=headers,
        params={"session_id": session_id}
    )
    
    if response.status_code == 200:
        data = response.json()
        print("✅ Session Summary:")
        print("-" * 60)
        print(f"   Messages: {data.get('message_count', 0)}")
        print(f"   Duration: {data.get('duration_minutes', 0)} minutes")
        print(f"   Topics: {', '.join(data.get('topics_discussed', []))}")
        print(f"   Last activity: {data.get('last_activity', 'N/A')}")
    else:
        print(f"❌ Failed: {response.status_code}")

def main():
    """Run all tests"""
    print("\n" + "🚀 LANGCHAIN INTEGRATION TEST SUITE " + "🚀")
    print("="*60)
    
    # Get authentication token
    token = get_auth_token()
    if not token:
        print("\n❌ Cannot proceed without authentication")
        return
    
    try:
        # Run tests
        session_id = test_chat_with_memory(token)
        time.sleep(1)
        
        test_symptom_diagnosis(token)
        time.sleep(1)
        
        test_medical_research(token)
        time.sleep(1)
        
        test_conversation_insights(token)
        time.sleep(1)
        
        test_active_sessions(token)
        time.sleep(1)
        
        test_medical_categories(token)
        time.sleep(1)
        
        if session_id:
            test_session_summary(token, session_id)
        
        # Final summary
        print_section("✅ TEST SUITE COMPLETED")
        print("All LangChain features have been tested successfully!")
        print("\n📚 See LANGCHAIN_API_GUIDE.md for detailed API documentation")
        
    except Exception as e:
        print(f"\n❌ Test failed with error: {str(e)}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    main()
