

from langchain_community.document_loaders import PyPDFLoader
loader = PyPDFLoader("document loader/GRU.pdf")
docs = loader.load()
print(len(docs))
print ("Number of pages", len(docs))
print("/nFirst page:")
print(docs[0].page_content)
print("/nMetadata:")
print(docs[0].metadata)

