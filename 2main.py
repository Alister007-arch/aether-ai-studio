from dotenv import load_dotenv
import os

load_dotenv()

api_key = os.getenv("GOOGLE_API_KEY")
from langchain_google_genai import GoogleGenerativeAIEmbeddings 

embeddings = GoogleGenerativeAIEmbeddings(
    model="gemini-embedding-2-preview",
    google_api_key=api_key
)
vector = embeddings.embed_query("hello, world!")
print(vector[0:5])
print(len(vector))
