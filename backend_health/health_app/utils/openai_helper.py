from openai import OpenAI
from django.conf import settings

client = OpenAI(
    api_key=settings.OPENAI_API_KEY,
    base_url=settings.OPENAI_BASE_URL
)

def stream_ai_diagnosis(symptoms):
    prompt = f"I’m experiencing: {', '.join(symptoms)}. What could be the possible reasons?"

    stream = client.chat.completions.create(
        model="gpt-3.5-turbo",
        messages=[
            {"role": "system", "content": "You are a friendly and helpful health assistant. Speak directly to the user and keep the tone supportive and informative."},
            {"role": "user", "content": prompt}
        ],
        temperature=0.7,
        stream=True,
    )

    return stream  
