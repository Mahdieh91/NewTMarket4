import os
import requests
from dotenv import load_dotenv

load_dotenv()

api_key = os.getenv("OPENROUTER_API_KEY")

url = "https://openrouter.ai/api/v1/chat/completions"

headers = {
    "Authorization": f"Bearer {api_key}",
    "Content-Type": "application/json",
}

data = {
    "model": "openai/gpt-oss-20b:free",
    "messages": [
        {
            "role": "user",
            "content": "سلام. فقط در یک جمله فارسی بگو: آیا می‌توانی پاسخ بدهی؟"
        }
    ],
    "temperature": 0.1,
    "max_tokens": 100,
}

print("Sending request...")

response = requests.post(
    url,
    headers=headers,
    json=data,
    timeout=60,
)

print("STATUS:", response.status_code)
print("RAW RESPONSE:")
print(response.text)

if response.ok:
    result = response.json()
    print("\nMODEL ANSWER:")
    print(result["choices"][0]["message"]["content"])