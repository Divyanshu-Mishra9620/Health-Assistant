import openai
from django.conf import settings

client = openai.OpenAI(api_key=settings.OPENAI_API_KEY)

def get_ai_diagnosis(symptoms):
    prompt = f"A user reports these symptoms: {', '.join(symptoms)}. Suggest likely conditions."

    response = client.chat.completions.create(
        model="gpt-3.5-turbo",
        messages=[
            {"role": "system", "content": "You are a helpful medical assistant."},
            {"role": "user", "content": prompt}
        ],
        max_tokens=150,
        temperature=0.7
    )
    return response.choices[0].message.content.strip()
