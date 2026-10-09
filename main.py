from dotenv import load_dotenv
import os
from langchain_google_genai import ChatGoogleGenerativeAI

load_dotenv()

api_key = os.getenv("GOOGLE_API_KEY")

model = ChatGoogleGenerativeAI(
    model="gemini-3.7-flash",
    google_api_key=api_key
)
msg = model.invoke("what is ai and explain machine learning")
print(msg.content[0]["text"])

