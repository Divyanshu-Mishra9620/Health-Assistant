from openai import OpenAI
from django.conf import settings
import base64

client = OpenAI(
    api_key=settings.OPENAI_API_KEY,
    base_url=settings.OPENAI_BASE_URL
)

def stream_ai_diagnosis(symptoms):
    prompt = f"I’m experiencing: {', '.join(symptoms)}. What could be the possible reasons?"

    stream = client.chat.completions.create(
        model="gpt-4o",
        messages=[
            {"role": "system", "content": "You are a friendly and helpful health assistant. Speak directly to the user and keep the tone supportive and informative."},
            {"role": "user", "content": prompt}
        ],
        temperature=0.7,
        stream=True,
    )

    return stream  

def stream_ai_image_analysis(image_file):
    encoded_image = base64.b64encode(image_file.read()).decode('utf-8')
    image_file.seek(0)
    print(encoded_image)
    
    stream = client.chat.completions.create(
        model="gpt-4o",
        messages=[
            {
                "role": "system",
                "content": (
                    "You are a medical imaging assistant. Analyze the provided medical image and "
                    "provide insights about potential findings. Be professional but compassionate. "
                    "Note that you're not a substitute for professional medical advice. "
                    "Point out any notable features but avoid definitive diagnoses."
                    "If its a symptom tell the user about it and the medication and if its medicine tell the patient about it and when to take also ask him to consult professionals"
                )
            },
            {
                "role": "user",
                "content": [
                    {
                        "type": "text",
                        "text": "Please analyze this medical image and describe what you see."
                    },
                    {
                        "type": "image_url",
                        "image_url": {
                            "url": f"data:image/jpeg;base64,{encoded_image}"
                        }
                    }
                ]
            }
        ],
        temperature=0.3,  
        max_tokens=1000,
        stream=True
    )

    return stream
