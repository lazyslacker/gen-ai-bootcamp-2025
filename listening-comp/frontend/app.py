import streamlit as st
import json
import requests
from pathlib import Path
import os
import random

# Initialize session state variables
if 'selected_answer' not in st.session_state:
    st.session_state.selected_answer = None
if 'current_question' not in st.session_state:
    st.session_state.current_question = None
if 'feedback_shown' not in st.session_state:
    st.session_state.feedback_shown = False

# Sample topics for random selection
SAMPLE_TOPICS = {
  "天気": "てんき",
  "学校": "がっこう",
  "先生": "せんせい",
  "学生": "がくせい",
  "家": "いえ",
  "部屋": "へや",
  "仕事": "しごと",
  "時間": "じかん",
  "映画": "えいが",
  "音楽": "おんがく",
  "本": "ほん",
  "友達": "ともだち",
  "食べ物": "たべもの",
  "飲み物": "のみもの",
  "朝": "あさ",
  "昼": "ひる",
  "夜": "よる",
  "旅行": "りょこう",
  "公園": "こうえん",
  "買い物": "かいもの",
  "病院": "びょういん",
  "天気予報": "てんきよほう",
  "道": "みち",
  "店": "みせ",
  "図書館": "としょかん",
  "家族": "かぞく",
  "車": "くるま",
  "自転車": "じてんしゃ",
  "バス": "ばす",
  "電車": "でんしゃ",
  "飛行機": "ひこうき",
  "駅": "えき",
  "学校の宿題": "がっこうのしゅくだい",
  "漢字": "かんじ",
  "誕生日": "たんじょうび",
  "プレゼント": "ぷれぜんと",
  "お金": "おかね",
  "休み": "やすみ",
  "料理": "りょうり",
  "海": "うみ",
  "山": "やま",
  "川": "かわ",
  "花": "はな",
  "春": "はる",
  "夏": "なつ",
  "秋": "あき",
  "冬": "ふゆ",
  "日本": "にほん",
  "外国": "がいこく"
}

# Create history directory if it doesn't exist
HISTORY_DIR = Path("history")
HISTORY_DIR.mkdir(exist_ok=True)
HISTORY_FILE = HISTORY_DIR / "question_history.json"

# Load question history
def load_history():
    try:
        if HISTORY_FILE.exists():
            with open(HISTORY_FILE, 'r', encoding='utf-8') as f:
                content = f.read().strip()
                if content:  # Check if file is not empty
                    return json.loads(content)
        # If file doesn't exist or is empty, initialize with empty list
        with open(HISTORY_FILE, 'w', encoding='utf-8') as f:
            json.dump([], f, ensure_ascii=False, indent=2)
        return []
    except json.JSONDecodeError:
        # If JSON is malformed, backup the old file and create a new empty one
        if HISTORY_FILE.exists():
            backup_file = HISTORY_FILE.with_suffix('.json.backup')
            HISTORY_FILE.rename(backup_file)
        with open(HISTORY_FILE, 'w', encoding='utf-8') as f:
            json.dump([], f, ensure_ascii=False, indent=2)
        return []
    except Exception as e:
        st.error(f"Error loading history: {str(e)}")
        return []

# Save question to history
def save_to_history(question_data):
    try:
        history = load_history()
        history.append(question_data)
        with open(HISTORY_FILE, 'w', encoding='utf-8') as f:
            json.dump(history, f, ensure_ascii=False, indent=2)
    except Exception as e:
        st.error(f"Error saving to history: {str(e)}")

# Custom CSS
st.markdown("""
<style>
.stButton > button {
    width: 100%;
    margin-bottom: 10px;
    background-color: white;
    color: black;
}

.stButton > button:hover {
    border-color: #0068c9;
    color: black;
}

.topic-label {
    font-size: 1.5rem;
    margin-bottom: 0.5rem;
}
</style>
""", unsafe_allow_html=True)

# Layout with columns
col1, col2 = st.columns([1, 3])

# Sidebar with history
with col1:
    st.sidebar.title("Question History")
    history = load_history()
    for idx, item in enumerate(history):
        if st.sidebar.button(f"Question {idx + 1}: {item['question'][:20]}..."):
            st.session_state.current_question = item
            st.session_state.selected_answer = None
            st.session_state.feedback_shown = False

# Main content
with col2:
    st.title("Japanese Listening Comprehension")
    
    # Topic input label with larger text
    st.markdown('<p class="topic-label">Enter a topic (in Japanese):</p>', unsafe_allow_html=True)
    
    # Topic input field
    current_topic = st.session_state.get('topic', "日本の伝統文化について")
    display_text = f"{current_topic} ({SAMPLE_TOPICS.get(current_topic, '')})" if current_topic in SAMPLE_TOPICS else current_topic
    topic = st.text_input("Topic Input Field", value=display_text, label_visibility="collapsed")
    
    # Random Topic and Get New Question buttons
    if st.button("Random Topic", use_container_width=True):
        # Select a random key from the dictionary
        topic = random.choice(list(SAMPLE_TOPICS.keys()))
        # Use session state to update the text input
        st.session_state.topic = topic
        st.rerun()
    
    # Update topic from session state if it exists
    if 'topic' in st.session_state:
        topic = st.session_state.topic
    
    if st.button("Get New Question", use_container_width=True):
        try:
            response = requests.post(
                "http://0.0.0.0:8000/api/search",
                json={
                    "query": topic,
                    "n_results": 1
                }
            )
            if response.status_code == 200:
                data = response.json()
                if data["results"]:
                    st.session_state.current_question = data["results"][0]
                    st.session_state.selected_answer = None
                    st.session_state.feedback_shown = False
                    save_to_history(data["results"][0])
        except requests.exceptions.RequestException as e:
            st.error(f"Error connecting to the backend: {str(e)}")

    # Display current question
    if st.session_state.current_question:
        question_data = st.session_state.current_question
        
        st.subheader("Introduction")
        st.write(question_data["introduction"])
        
        st.subheader("Conversation")
        st.write(question_data["conversation"])
        
        st.subheader("Question")
        st.write(question_data["question"])
        
        # Display answer choices
        st.subheader("Answer Choices")
        
        # Create columns for answer choices
        col1_ans, col2_ans = st.columns(2)
        
        # Split answers into two columns
        answers = list(question_data["answers"].items())
        left_answers = answers[:2]  # A and B
        right_answers = answers[2:]  # C and D
        
        # Display answers in left column
        with col1_ans:
            for key, value in left_answers:
                button_label = f"{key}: {value}"
                # First show the button
                if st.button(
                    button_label,
                    key=f"answer_{key}",
                    disabled=st.session_state.feedback_shown,
                    type="secondary" if not st.session_state.feedback_shown else "primary"
                ):
                    st.session_state.selected_answer = key
                    st.rerun()
                
                # Then show the feedback highlights
                if st.session_state.feedback_shown:
                    if key == question_data["correct_answer"]:
                        # Always show correct answer in green with checkmark
                        st.success(f"✓ {button_label} (Correct Answer)")
                    elif key == st.session_state.selected_answer:
                        # Show selected wrong answer in red with X
                        st.error(f"✗ {button_label}")
        
        # Display answers in right column
        with col2_ans:
            for key, value in right_answers:
                button_label = f"{key}: {value}"
                # First show the button
                if st.button(
                    button_label,
                    key=f"answer_{key}",
                    disabled=st.session_state.feedback_shown,
                    type="secondary" if not st.session_state.feedback_shown else "primary"
                ):
                    st.session_state.selected_answer = key
                    st.rerun()
                
                # Then show the feedback highlights
                if st.session_state.feedback_shown:
                    if key == question_data["correct_answer"]:
                        # Always show correct answer in green with checkmark
                        st.success(f"✓ {button_label} (Correct Answer)")
                    elif key == st.session_state.selected_answer:
                        # Show selected wrong answer in red with X
                        st.error(f"✗ {button_label}")
        
        # Add some spacing
        st.write("")
        
        # Show selected answer and check button
        if st.session_state.selected_answer:
            st.write(f"Selected answer: {st.session_state.selected_answer}")
            
            # Check answer button
            if not st.session_state.feedback_shown:
                if st.button("Check Answer", type="primary"):
                    st.session_state.feedback_shown = True
                    if st.session_state.selected_answer == question_data["correct_answer"]:
                        st.success("Correct! 正解です！")
                    else:
                        st.error(f"Incorrect. The correct answer is: {question_data['correct_answer']}")
                    st.rerun()
            
            # Add a "Try Again" button when feedback is shown
            if st.session_state.feedback_shown:
                if st.button("Try Another Question", type="primary"):
                    st.session_state.selected_answer = None
                    st.session_state.feedback_shown = False
                    st.rerun() 