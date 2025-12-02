import google.generativeai as genai
from django.conf import settings
import base64

# Configure Gemini API
genai.configure(api_key=settings.GEMINI_API_KEY)

def stream_ai_diagnosis(symptoms, context=""):
    """Stream AI diagnosis using Gemini API with optional historical context"""
    symptom_text = ', '.join(symptoms)
    prompt = f"I'm experiencing: {symptom_text}. What could be the possible reasons also provide the medication as well as the precautions?"
    
    # Build enhanced prompt with historical context
    system_message = "You are a friendly and helpful health assistant. Speak directly to the user and keep the tone supportive and informative."
    
    if context and context.strip():
        system_message += f"\n\nBased on the user's medical history and previous conversations:\n{context}\n\nPlease consider this context when providing your response, but focus on the current symptoms."
    
    full_prompt = f"{system_message}\n\n{prompt}"
    
    try:
        model = genai.GenerativeModel('gemini-1.5-flash')
        response = model.generate_content(
            full_prompt,
            stream=True
        )
        return response
    except Exception as e:
        print("Gemini streaming error:", e)
        return iter([])


def stream_ai_image_analysis(image_file, context=""):
    """Stream AI image analysis using Gemini Vision API with optional historical context"""
    try:
        image_data = image_file.read()
        image_file.seek(0)
        
        # Build enhanced system message with historical context
        system_message = (
            "You are a medical imaging assistant. Analyze the provided medical image and "
            "provide insights about potential findings. Be professional but compassionate. "
            "Note that you're not a substitute for professional medical advice. "
            "Point out any notable features but avoid definitive diagnoses. "
            "If it's a symptom, tell the user about it and the medication. "
            "If it's medicine, explain when to take it and recommend consulting a professional."
        )
        
        if context and context.strip():
            system_message += f"\n\nBased on the user's previous medical images and conversations:\n{context}\n\nPlease consider this context when analyzing the current image."
        
        system_message += "\n\nPlease analyze this medical image and describe what you see."
        
        model = genai.GenerativeModel('gemini-1.5-flash')
        response = model.generate_content(
            [
                system_message,
                {"mime_type": "image/jpeg", "data": image_data}
            ],
            stream=True
        )
        return response
    except Exception as e:
        print("Image stream error:", e)
        return iter([])
