from openai import OpenAI
from django.conf import settings
import base64

client = OpenAI(
    api_key=settings.OPENAI_API_KEY,
    base_url=settings.OPENAI_BASE_URL
)

def stream_ai_diagnosis(symptoms):
    prompt = f"I’m experiencing: {', '.join(symptoms)}. What could be the possible reasons also provide the medication as well as the precautions?"

    try:
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
    except Exception as e:
        print("OpenAI streaming error:", e)
        return iter([
            {"choices": [{"delta": {"content": "[Error occurred while streaming response]"}}]}
        ])


def stream_ai_image_analysis(image_file):
    try:
        encoded_image = base64.b64encode(image_file.read()).decode('utf-8')
        image_file.seek(0)

        stream = client.chat.completions.create(
            model="gpt-4o",
            messages=[
                {
                    "role": "system",
                    "content": (
                        "You are a medical imaging assistant. Analyze the provided medical image and "
                        "provide insights about potential findings. Be professional but compassionate. "
                        "Note that you're not a substitute for professional medical advice. "
                        "Point out any notable features but avoid definitive diagnoses. "
                        "If it's a symptom, tell the user about it and the medication. "
                        "If it's medicine, explain when to take it and recommend consulting a professional."
                    )
                },
                {
                    "role": "user",
                    "content": [
                        {"type": "text", "text": "Please analyze this medical image and describe what you see."},
                        {"type": "image_url", "image_url": {"url": f"data:image/jpeg;base64,{encoded_image}"}}
                    ]
                }
            ],
            temperature=0.3,
            max_tokens=1000,
            stream=True
        )

        return stream
    except Exception as e:
        print("Image stream error:", e)
        return iter([
            {"choices": [{"delta": {"content": "[Image analysis failed. Please try again.]"}}]}
        ])
