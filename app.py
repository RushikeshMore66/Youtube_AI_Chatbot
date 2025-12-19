import streamlit as st
from chatbot import YouTubeChatbot
import time

# --- Page Configuration ---
st.set_page_config(
    page_title="YouTube AI-Genie",
    page_icon="🧞‍♂️",
    layout="wide",
    initial_sidebar_state="expanded"
)

# --- Custom CSS for Premium Look ---
st.markdown("""
<style>
/* ---------------- BACKGROUND ANIMATION ---------------- */

.stApp {
    background: linear-gradient(
        -45deg,
        #0d1117,
        #111827,
        #0f172a,
        #020617
    );
    background-size: 400% 400%;
    animation: gradientBG 18s ease infinite;
    color: #c9d1d9;
}

@keyframes gradientBG {
    0% { background-position: 0% 50%; }
    50% { background-position: 100% 50%; }
    100% { background-position: 0% 50%; }
}

/* ---------------- FLOATING GLOW ORBS ---------------- */

.bg-orb {
    position: fixed;
    width: 300px;
    height: 300px;
    background: radial-gradient(circle, rgba(99,102,241,0.15), transparent 70%);
    border-radius: 50%;
    animation: float 12s ease-in-out infinite;
    z-index: -1;
}

.orb1 {
    top: 10%;
    left: 5%;
}

.orb2 {
    bottom: 15%;
    right: 10%;
    animation-delay: 4s;
}

@keyframes float {
    0% { transform: translateY(0px); }
    50% { transform: translateY(-30px); }
    100% { transform: translateY(0px); }
}

/* ---------------- EXISTING UI POLISH ---------------- */

section[data-testid="stSidebar"] {
    background-color: rgba(22, 27, 34, 0.9) !important;
    border-right: 1px solid #30363d;
}

.main-title {
    font-size: 3rem;
    font-weight: 800;
    background: -webkit-linear-gradient(#6366f1, #a855f7);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
}

.stChatMessage {
    animation: fadeIn 0.5s ease-out;
}

@keyframes fadeIn {
    from { opacity: 0; transform: translateY(8px); }
    to { opacity: 1; transform: translateY(0); }
}
</style>

""", unsafe_allow_html=True)

# --- Initialization ---
if "bot" not in st.session_state:
    try:
        st.session_state.bot = YouTubeChatbot()
    except Exception as e:
        st.error(f"Failed to initialize chatbot: {e}")
        st.stop()

if "chat_history" not in st.session_state:
    st.session_state.chat_history = []

if "video_processed" not in st.session_state:
    st.session_state.video_processed = False

# --- Sidebar ---
with st.sidebar:
    st.image("https://cdn-icons-png.flaticon.com/512/1384/1384060.png", width=50) # YouTube Icon
    st.title("Settings")
    st.markdown("---")
    
    video_url = st.text_input("YouTube Video URL", placeholder="https://www.youtube.com/watch?v=...")
    
    if st.button("✨ Process Video", use_container_width=True):
        if video_url:
            with st.status("Analyzing Video Content...", expanded=True) as status:
                try:
                    st.write("Fetching transcript...")
                    st.session_state.bot.process_video(video_url)
                    st.write("Indexing content for RAG...")
                    time.sleep(1) # Visual delay for feel
                    status.update(label="✅ Video Ready!", state="complete", expanded=False)
                    st.session_state.video_processed = True
                    st.session_state.chat_history = [] # Clear history for new video
                    st.success("You can now ask questions about this video!")
                except Exception as e:
                    status.update(label="❌ Failed", state="error")
                    st.error(f"Error: {str(e)}")
        else:
            st.warning("Please enter a valid YouTube URL.")

    st.markdown("---")
    st.info("This AI Genie uses RAG (Retrieval-Augmented Generation) to answer questions based on the video's transcript.")

# --- Main Interface ---
st.markdown('<h1 class="main-title">YouTube AI-Genie 🧞‍♂️</h1>', unsafe_allow_html=True)
st.markdown("Interact with any YouTube video through AI.")

if not st.session_state.video_processed:
    st.info("👈 Start by entering a YouTube URL in the sidebar to process it.")
    # Display some dummy chat to show look and feel
    with st.chat_message("assistant"):
        st.write("Hello! Once you provide a video, I'll be able to help you understand its content, summarize it, or answer specific questions. How can I help you today?")
else:
    # Display chat history
    for message in st.session_state.chat_history:
        with st.chat_message(message["role"]):
            st.markdown(message["content"])

    # Chat Input
    if prompt := st.chat_input("Ask something about the video..."):
        # Add user message to history
        st.session_state.chat_history.append({"role": "user", "content": prompt})
        with st.chat_message("user"):
            st.markdown(prompt)

        # Generate response
        with st.chat_message("assistant"):
            response_placeholder = st.empty()
            with st.spinner("Thinking..."):
                try:
                    full_response = st.session_state.bot.ask(prompt)
                    response_placeholder.markdown(full_response)
                    st.session_state.chat_history.append({"role": "assistant", "content": full_response})
                except Exception as e:
                    st.error(f"Error: {e}")

# Footer
st.markdown("---")
st.markdown(
    '<p style="text-align: center; color: #6b7280; font-size: 0.8rem;">YouTube AI-Genie | Powered by Groq & LangChain</p>',
    unsafe_allow_html=True
)
