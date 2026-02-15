"""
Quick test script to verify Gemini API is working
"""
import os
from dotenv import load_dotenv
import google.generativeai as genai

load_dotenv()

api_key = os.getenv('GEMINI_API_KEY')
print(f"API Key found: {api_key[:20]}..." if api_key else "No API key!")

try:
    genai.configure(api_key=api_key)
    
    # List available models
    print("\nAvailable models:")
    for model in genai.list_models():
        if 'generateContent' in model.supported_generation_methods:
            print(f"  - {model.name}")
    
    # Try different model names
    model_names = ['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-flash-latest', 'gemini-pro-latest']
    
    for model_name in model_names:
        try:
            print(f"\nTrying model: {model_name}")
            model = genai.GenerativeModel(model_name)
            response = model.generate_content("Say 'Gemini is working!'")
            print(f"✅ Response: {response.text}")
            print(f"✅ Model {model_name} is working!")
            break
        except Exception as e:
            print(f"❌ {model_name} failed: {e}")
    
except Exception as e:
    print(f"❌ Error: {e}")
