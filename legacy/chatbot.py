from youtube_transcript_api import YouTubeTranscriptApi
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_groq import ChatGroq
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_community.vectorstores import FAISS
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.documents import Document
from langchain_core.runnables import RunnablePassthrough
from langchain_core.output_parsers import StrOutputParser
from dotenv import load_dotenv
import os
import re

class YouTubeChatbot:
    def __init__(self):
        load_dotenv()
        self.groq_api_key = os.getenv("GROQ_API_KEY")
        self.huggingface_api_key = os.getenv("HUGGING_FACE_API_KEY")
        
        if not self.groq_api_key:
            raise ValueError("GROQ_API_KEY not found in environment variables.")
        
        if self.huggingface_api_key:
            os.environ["HUGGINGFACEHUB_API_TOKEN"] = self.huggingface_api_key

        self.embeddings = HuggingFaceEmbeddings(model_name="sentence-transformers/all-MiniLM-L6-v2")
        self.llm = ChatGroq(model="llama-3.3-70b-versatile", groq_api_key=self.groq_api_key)
        self.vectorstore = None
        self.rag_chain = None

    def extract_video_id(self, url):
        """Extracts the video ID from a YouTube URL."""
        if not url:
            return None
        # Handle different URL formats
        reg = r"(?:v=|\/)([0-9A-Za-z_-]{11}).*"
        match = re.search(reg, url)
        return match.group(1) if match else url

    def process_video(self, video_url_or_id):
        """Fetches transcript, creates vector store, and sets up the RAG chain."""
        video_id = self.extract_video_id(video_url_or_id)
        
        try:
            api = YouTubeTranscriptApi()
            transcript_list = api.fetch(video_id, languages=["en", "hi"])
            transcript = " ".join(chunk.text for chunk in transcript_list)
        except Exception as e:
            raise Exception(f"Error fetching transcript: {str(e)}")

        if not transcript:
            raise Exception("No transcript content found for this video.")

        # Split into chunks
        splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=200)
        chunks = splitter.split_text(transcript)
        documents = [Document(page_content=chunk) for chunk in chunks]

        # Create vector store
        self.vectorstore = FAISS.from_documents(documents, self.embeddings)
        retriever = self.vectorstore.as_retriever(search_kwargs={"k": 3})

        # Set up RAG chain
        system_prompt = (
            "You are an assistant for question-answering tasks. "
            "Use the following pieces of retrieved context to answer "
            "the question. If you don't know the answer, say that you "
            "don't know. Use three sentences maximum and keep the "
            "answer concise.\n\n"
            "Context:\n{context}"
        )

        prompt = ChatPromptTemplate.from_messages(
            [
                ("system", system_prompt),
                ("human", "{input}"),
            ]
        )

        def format_docs(docs):
            return "\n\n".join(doc.page_content for doc in docs)

        self.rag_chain = (
            {"context": retriever | format_docs, "input": RunnablePassthrough()}
            | prompt
            | self.llm
            | StrOutputParser()
        )
        
        return True

    def ask(self, query):
        """Generates a response for the given query."""
        if not self.rag_chain:
            raise Exception("Chatbot not initialized. Please process a video first.")
        
        try:
            return self.rag_chain.invoke(query)
        except Exception as e:
            raise Exception(f"Error generating response: {str(e)}")

if __name__ == "__main__":
    # Test logic
    try:
        bot = YouTubeChatbot()
        test_video = "1choivCbZDg"
        print(f"Processing video {test_video}...")
        bot.process_video(test_video)
        print("Bot ready! Ask a question.")
        res = bot.ask("What is this video about?")
        print(f"AI: {res}")
    except Exception as e:
        print(f"Error: {e}")





 

