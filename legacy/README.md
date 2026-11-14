# 🤖 YouTube AI-Genie

YouTube AI-Genie is a **Retrieval-Augmented Generation (RAG)** based AI chatbot that allows users to **ask questions about any YouTube video** using its transcript.

Instead of relying on an LLM’s memory, the system retrieves **relevant video content at runtime**, ensuring accurate, grounded, and context-aware answers.

The project is built with a **clean frontend–backend separation**, a modern GenAI stack, and a simple yet animated Streamlit UI.

---

## ✨ What This Project Does

- Takes a **YouTube video URL**
- Extracts the **video transcript**
- Splits the transcript into meaningful chunks
- Converts chunks into **semantic embeddings**
- Stores embeddings in a **FAISS vector database**
- Retrieves relevant context for each user question
- Uses a **Groq-hosted LLaMA model** to generate precise answers
- Displays responses in a **modern animated UI**

---

## 🧠 Why Retrieval-Augmented Generation (RAG)?

Large Language Models can hallucinate when they don’t have access to real data.

This project uses **RAG** to:
- Reduce hallucinations
- Ensure answers come **only from the video**
- Handle long-form content efficiently
- Scale without fine-tuning the model

---

## 🏗️ Project Architecture


---

## 🧩 Key Features

- 🎥 Ask questions about any public YouTube video
- 🧠 RAG-based question answering
- 🔍 Semantic search using FAISS
- ⚡ Ultra-fast inference using Groq LLaMA models
- 🌍 Multi-language transcript support (English & Hindi)
- 🎨 Clean Streamlit UI with animated background
- 🧱 Modular backend design (UI and logic separated)
- 🔐 Secure API key handling with `.env`

---

## 🛠️ Tech Stack

- **Python**
- **Streamlit** – Frontend UI
- **LangChain (LCEL)** – RAG pipeline
- **FAISS** – Vector database
- **HuggingFace Sentence Transformers** – Embeddings
- **Groq (LLaMA 3.x)** – LLM inference
- **YouTube Transcript API**
- **dotenv** – Environment variables

---

## 🚀 How to Run the Project

### 1️⃣ Clone the repository
```bash
git clone https://github.com/your-username/youtube-ai-genie.git
cd youtube-ai-genie



---

## ✅ Next Steps (Optional)

If you want, I can now:
- 🏷️ Suggest **GitHub repo name & tags**
- 📸 Add **Screenshots / Demo section**
- ✍️ Write a **LinkedIn post** for this project
- 📄 Create `requirements.txt`
- 🧪 Add **future improvements section**

Just tell me 👍

