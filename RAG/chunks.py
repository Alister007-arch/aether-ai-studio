from langchain_community.document_loaders import PyPDFLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter


loader = PyPDFLoader("document loader/GRU.pdf")

docs = loader.load()

print(len(docs))

text_splitter = RecursiveCharacterTextSplitter(
        chunk_size=1000, 
        chunk_overlap=200
    )
chunks = text_splitter.split_documents(docs)

print("Number of chunks:", len(chunks))
for i, chunk in enumerate(chunks[:3]):
    print(f"\n --- Chunk {i + 1} --- ")
    print(chunk.page_content)
    print("Metadata:", chunk.metadata)