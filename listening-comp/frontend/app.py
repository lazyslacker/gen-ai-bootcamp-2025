import streamlit as st
import json
import requests
from pathlib import Path
import os
import random
import boto3
import json
from dotenv import load_dotenv
from pydub import AudioSegment
import uuid
import shutil

load_dotenv()

# Test AWS credentials
def test_aws_credentials():
    try:
        # Test Polly access first (this is what we need for audio)
        print("Testing Polly access...")
        polly_response = polly.describe_voices(
            Engine='neural',  # Specify neural engine
            LanguageCode='ja-JP'
        )
        print("Polly access successful")
        
        # Get only neural voices and their properties
        neural_voices = []
        for voice in polly_response['Voices']:
            if 'SupportedEngines' in voice and 'neural' in voice['SupportedEngines']:
                neural_voices.append(voice)
        
        available_voices = [voice['Id'] for voice in neural_voices]
        print(f"Available Neural Japanese voices: {available_voices}")
        
        # Update voice mapping based on available neural voices
        global VOICE_MAPPING
        VOICE_MAPPING = {
            'male': [],
            'female': [],
            'child': [],
            'elderly': []
        }
        
        # Categorize voices based on their properties
        for voice in neural_voices:
            voice_id = voice['Id']
            if voice['Gender'] == 'Female':
                VOICE_MAPPING['female'].append(voice_id)
                # Mizuki can be used for child voice
                if voice_id == 'Mizuki':
                    VOICE_MAPPING['child'].append(voice_id)
            else:  # Male voices
                VOICE_MAPPING['male'].append(voice_id)
                # Takumi can be used for elderly voice
                if voice_id == 'Takumi':
                    VOICE_MAPPING['elderly'].append(voice_id)
        
        print(f"Updated voice mapping: {VOICE_MAPPING}")
        
        if not any(VOICE_MAPPING.values()):
            raise Exception("No neural voices available for Japanese language")
        
        # Test Bedrock runtime access with a simple prompt
        print("Testing Bedrock runtime access...")
        test_response = bedrock.invoke_model(
            modelId="amazon.nova-micro-v1:0",
            body=json.dumps({
                "inferenceConfig": {
                    "max_new_tokens": 10
                },
                "messages": [
                    {
                        "role": "user",
                        "content": [
                            {"text": "Say hello"}
                        ]
                    }
                ]
            })
        )
        print("Bedrock runtime access successful")
        return True
    except Exception as e:
        print(f"AWS credentials test failed: {str(e)}")
        st.error("AWS credentials test failed. Please check your credentials and permissions.")
        return False

# Bedrock client configuration
bedrock = boto3.client(
    service_name='bedrock-runtime',
    region_name='us-east-1'  # replace with your region
)

# Polly client configuration
polly = boto3.client(
    service_name='polly',
    region_name='us-east-1'  # replace with your region
)

# Audio directory configuration
AUDIO_DIR = Path(__file__).parent / "audio"
TEMP_AUDIO_DIR = AUDIO_DIR / "temp"
AUDIO_DIR.mkdir(exist_ok=True)
TEMP_AUDIO_DIR.mkdir(exist_ok=True)

# Add debug logging for audio directory
print(f"Audio directory path: {AUDIO_DIR}")
print(f"Temp audio directory path: {TEMP_AUDIO_DIR}")
print(f"Audio directory exists: {AUDIO_DIR.exists()}")
print(f"Temp audio directory exists: {TEMP_AUDIO_DIR.exists()}")

# Voice mapping for different speaker characteristics
VOICE_MAPPING = {
    'male': ['Takumi'],  # Japanese male voices
    'female': ['Mizuki', 'Kazuha'],  # Japanese female voices
    'child': ['Mizuki'],  # Voice that can sound younger
    'elderly': ['Takumi']  # Voice that can sound older
}

def get_appropriate_voice(speaker_info, used_voices=None):
    """Select an appropriate voice based on speaker characteristics and maintain uniqueness"""
    if used_voices is None:
        used_voices = set()
    
    # Get all available voices
    all_voices = set()
    for voices in VOICE_MAPPING.values():
        all_voices.update(voices)
    
    if not all_voices:
        print("No voices available in voice mapping")
        return None
    
    # Get remaining available voices
    available_voices = list(all_voices - used_voices)
    
    # If no more unique voices available, reset to using all voices
    if not available_voices:
        available_voices = list(all_voices)
    
    # If we have speaker characteristics, try to match them first
    if speaker_info and not isinstance(speaker_info, str):
        # Check for gender
        if 'gender' in speaker_info:
            gender = 'female' if speaker_info['gender'].lower() == 'female' else 'male'
            if VOICE_MAPPING[gender]:  # Check if we have voices for this gender
                gender_voices = VOICE_MAPPING[gender]
                # Try to find an unused voice of the correct gender
                unused_gender_voices = [v for v in gender_voices if v in available_voices]
                if unused_gender_voices:
                    return random.choice(unused_gender_voices)
        
        # Check for age characteristics
        if 'age' in speaker_info:
            age = speaker_info['age'].lower()
            if age in ['young', 'child'] and VOICE_MAPPING['child']:
                child_voices = [v for v in VOICE_MAPPING['child'] if v in available_voices]
                if child_voices:
                    return random.choice(child_voices)
            elif age in ['elderly', 'old'] and VOICE_MAPPING['elderly']:
                elderly_voices = [v for v in VOICE_MAPPING['elderly'] if v in available_voices]
                if elderly_voices:
                    return random.choice(elderly_voices)
    
    # If we couldn't find a matching voice or have no characteristics,
    # just pick a random available voice
    if available_voices:
        return random.choice(available_voices)
    
    # Fallback to any voice if all else fails
    return random.choice(list(all_voices)) if all_voices else None

def generate_audio_for_line(text, voice_id):
    """Generate audio for a single line of dialogue using Amazon Polly"""
    try:
        if not voice_id:
            print("No voice ID provided")
            return None
            
        print(f"Generating audio for text: {text} with voice: {voice_id}")
        try:
            # First try with neural engine
            response = polly.synthesize_speech(
                Text=text,
                OutputFormat='mp3',
                VoiceId=voice_id,
                Engine='neural',
                LanguageCode='ja-JP'
            )
        except Exception as e:
            if 'ValidationException' in str(e) and 'does not support the selected engine' in str(e):
                print(f"Neural engine not supported for voice {voice_id}, falling back to standard engine")
                # Fall back to standard engine
                response = polly.synthesize_speech(
                    Text=text,
                    OutputFormat='mp3',
                    VoiceId=voice_id,
                    Engine='standard',
                    LanguageCode='ja-JP'
                )
            else:
                raise e
        
        # Generate a unique filename in the temp directory
        filename = f"{uuid.uuid4()}.mp3"
        file_path = TEMP_AUDIO_DIR / filename
        print(f"Saving audio to: {file_path}")
        
        # Save the audio stream to a file
        if "AudioStream" in response:
            with open(file_path, 'wb') as file:
                file.write(response['AudioStream'].read())
            print(f"Successfully saved audio file: {file_path}")
            return str(file_path)
        else:
            print("No AudioStream in response")
            return None
    except Exception as e:
        print(f"Error in generate_audio_for_line: {str(e)}")
        if st.session_state.debug_mode:
            st.error(f"Error generating audio: {str(e)}")
        return None

def combine_audio_files(audio_files):
    """Combine multiple audio files into a single audio file"""
    try:
        print(f"Combining audio files: {audio_files}")
        combined = AudioSegment.empty()
        for audio_file in audio_files:
            print(f"Processing audio file: {audio_file}")
            segment = AudioSegment.from_mp3(audio_file)
            combined += segment
            
        # Generate output filename in the main audio directory
        output_filename = f"conversation_{uuid.uuid4()}.mp3"
        output_path = AUDIO_DIR / output_filename
        print(f"Saving combined audio to: {output_path}")
        
        # Export combined audio
        combined.export(str(output_path), format="mp3")
        print(f"Successfully saved combined audio: {output_path}")
        
        return str(output_path)
    except Exception as e:
        print(f"Error in combine_audio_files: {str(e)}")
        if st.session_state.debug_mode:
            st.error(f"Error combining audio files: {str(e)}")
        return None

def generate_conversation_audio(conversation_analysis):
    """Generate audio for the entire conversation"""
    try:
        if not conversation_analysis:
            print("No conversation analysis provided")
            return None
            
        print(f"Generating audio for conversation analysis: {conversation_analysis}")
        # Parse the conversation analysis JSON
        if isinstance(conversation_analysis, str):
            analysis = json.loads(conversation_analysis)
        else:
            analysis = conversation_analysis
            
        # Get the dialogue array from the analysis
        dialogue = analysis.get('dialogue', [])
        if not dialogue:
            print("No dialogue found in analysis")
            return None
            
        # Track used voices to ensure different speakers get different voices
        speaker_voices = {}
        used_voices = set()
        audio_files = []
        
        # Generate audio for each line
        for line in dialogue:
            speaker = line.get('speaker', 'Unknown')
            text = line.get('line', '')  # Note: changed from 'text' to 'line' to match the JSON structure
            print(f"Processing line for speaker {speaker}: {text}")
            
            # Get or assign a voice for this speaker
            if speaker not in speaker_voices:
                voice_id = get_appropriate_voice(speaker, used_voices)
                speaker_voices[speaker] = voice_id
                used_voices.add(voice_id)
                print(f"Assigned voice {voice_id} to speaker {speaker}")
            
            # Generate audio for this line
            audio_file = generate_audio_for_line(text, speaker_voices[speaker])
            if audio_file:
                audio_files.append(audio_file)
        
        print(f"Generated {len(audio_files)} audio files")
        # Combine all audio files
        if audio_files:
            return combine_audio_files(audio_files)
        
        return None
    except Exception as e:
        print(f"Error in generate_conversation_audio: {str(e)}")
        if st.session_state.debug_mode:
            st.error(f"Error generating conversation audio: {str(e)}")
        return None

# Initialize session state variables
if 'selected_answer' not in st.session_state:
    st.session_state.selected_answer = None
if 'current_question' not in st.session_state:
    st.session_state.current_question = None
if 'feedback_shown' not in st.session_state:
    st.session_state.feedback_shown = False
if 'debug_mode' not in st.session_state:
    st.session_state.debug_mode = False
if 'correct_key' not in st.session_state:
    st.session_state.correct_key = None
if 'conversation_analysis' not in st.session_state:
    st.session_state.conversation_analysis = None
if 'conversation_audio' not in st.session_state:
    st.session_state.conversation_audio = None

def analyze_conversation_with_nova_micro(conversation_text):
    try:
        print("Starting conversation analysis")
        prompt = f"""
{conversation_text}
Clearly identify the speaker in each line of the dialogue. Return a json document with speaker tags for each line of dialogue. Just return the JSON document and nothing else please.
"""
        print(f"Sending prompt to Nova Micro: {prompt}")
        response = bedrock.invoke_model(
            modelId="amazon.nova-micro-v1:0",
            body=json.dumps({
                "inferenceConfig": {
                    "max_new_tokens": 1000
                },
                "messages": [
                    {
                        "role": "user",
                        "content": [
                            {"text": prompt}
                        ]
                    }
                ]
            })
        )
        
        response_body = json.loads(response.get('body').read().decode())
        analysis = response_body['output']['message']['content'][0]['text']
        print(f"Received analysis: {analysis}")
        
        # Store the analysis in session state
        st.session_state.conversation_analysis = analysis
        
        # Generate audio for the conversation
        print("Starting audio generation")
        audio_path = generate_conversation_audio(analysis)
        if audio_path:
            print(f"Audio generated successfully: {audio_path}")
            st.session_state.conversation_audio = audio_path
        else:
            print("Failed to generate audio")
        
        return analysis
    except Exception as e:
        print(f"Error in analyze_conversation_with_nova_micro: {str(e)}")
        if st.session_state.debug_mode:
            st.error(f"Error analyzing conversation: {str(e)}")
        return None

def generate_question_with_nova(topic, example_question):
    """Generate a new question using Nova Lite based on a topic and example"""
    try:
        prompt = f"""Given the topic "{topic}" and the following example question format:
{json.dumps(example_question, ensure_ascii=False, indent=2)}

Please generate a new Japanese listening comprehension question following the exact same format.
Important requirements:
1. Use only JLPT N5 level vocabulary and grammar
2. Follow the exact same JSON structure as the example
3. Make sure the question is different from the example but related to the topic
4. Ensure all text is in Japanese
5. Include a brief introduction, a conversation, a question, and 4 answer choices (A, B, C, D)
6. In the conversation, clearly identify the speaker for each line of dialogue
6. Clearly mark the correct answer

Generate the response in valid JSON format."""

        response = bedrock.invoke_model(
            modelId="amazon.nova-lite-v1:0",
            body=json.dumps({
                "inferenceConfig": {
                    "max_new_tokens": 1000
                },
                "messages": [
                    {
                        "role": "user",
                        "content": [
                            {"text": prompt}
                        ]
                    }
                ]
            })
        )
        
        response_body = json.loads(response.get('body').read().decode())
        generated_text = response_body['output']['message']['content'][0]['text']

        # Try to extract JSON from the response text
        import re
        json_match = re.search(r'\{.*\}', generated_text, re.DOTALL)
        if json_match:
            json_str = json_match.group(0)
            generated_question = json.loads(json_str)
            
            # Analyze the conversation using Nova Micro
            if "conversation" in generated_question:
                conversation_analysis = analyze_conversation_with_nova_micro(generated_question["conversation"])
                st.session_state.conversation_analysis = conversation_analysis
        else:
            if st.session_state.debug_mode:
                st.error("Failed to generate a valid question. Falling back to example question.")
            return None

        # Validate the generated question has all required fields
        required_fields = ["introduction", "conversation", "question", "answers", "correct_answer"]
        missing_fields = [field for field in required_fields if field not in generated_question]
        if missing_fields:
            if st.session_state.debug_mode:
                st.error(f"Generated question is missing required fields. Falling back to example question.")
            return None

        return generated_question
    except json.JSONDecodeError as e:
        if st.session_state.debug_mode:
            st.error("Failed to generate a valid question. Falling back to example question.")
        return None
    except Exception as e:
        if st.session_state.debug_mode:
            st.error("An error occurred while generating the question. Falling back to example question.")
        return None

# def get_correct_answer_key(answers, correct_answer_text):
#     """Helper function to find the key (A, B, C, D) for the correct answer text"""
#     for k, v in answers.items():
#         if v == correct_answer_text:
#             return k
#     return None

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

# Left Sidebar with history
with col1:
    st.sidebar.title("Question History")
    history = load_history()
    for idx, item in enumerate(history):
        if st.sidebar.button(f"Question {idx + 1}: {item['question'][:20]}..."):
            st.session_state.current_question = item
            st.session_state.selected_answer = None
            st.session_state.feedback_shown = False
    
    # Add debug mode toggle at the bottom of left sidebar
    st.sidebar.markdown("---")
    if st.sidebar.checkbox("Show Debug Info", value=st.session_state.debug_mode):
        st.session_state.debug_mode = True
    else:
        st.session_state.debug_mode = False

# Right Sidebar with debug info
if st.session_state.debug_mode:
    with st.sidebar:
        st.markdown("---")  # Add a separator
        st.title("Debug Information")
        
        # Show session state variables
        st.subheader("Session State")
        st.write("Selected Answer:", st.session_state.selected_answer)
        st.write("Feedback Shown:", st.session_state.feedback_shown)
        
        # Show conversation analysis if available
        if st.session_state.conversation_analysis:
            st.subheader("Conversation Analysis")
            st.write(st.session_state.conversation_analysis)
        
        # Show current question info if available
        if st.session_state.current_question:
            st.subheader("Current Question")
            st.write("Correct Answer:", st.session_state.current_question.get("correct_answer"))
            
            # Find and show correct key
            correct_key = st.session_state.current_question.get("correct_answer")
            st.write("Correct Key:", correct_key)
            
            # Show all answers
            st.subheader("Answer Choices")
            for k, v in st.session_state.current_question["answers"].items():
                st.write(f"{k}: {v}")

            st.write("Answers:", st.session_state.current_question["answers"].items())

# Main content
with col2:
    st.title("Japanese Listening Comprehension - JLPT N5")
    
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
    else:
        # Set default topic if none exists
        topic = "日本の伝統文化について"
        st.session_state.topic = topic
    
    if st.button("Get New Question", use_container_width=True):
        # Reset feedback state before getting new question
        st.session_state.selected_answer = None
        st.session_state.feedback_shown = False
        st.session_state.correct_key = None
        
        # Ensure we have a valid topic
        if not topic or topic.strip() == "":
            st.warning("Please enter a topic or click 'Random Topic' first.")
        else:
            try:
                # First get a question from the API to use as an example
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
                        # Get the example question from API
                        example_question = data["results"][0]
                        
                        # Generate a new question using Nova
                        generated_question = generate_question_with_nova(topic, example_question)
                        
                        if generated_question:
                            # Store the generated question and set correct key
                            st.session_state.current_question = generated_question
                            st.session_state.correct_key = generated_question.get("correct_answer")
                            
                            # Save the generated question to history
                            save_to_history(generated_question)
                        else:
                            # Fallback to API question if generation fails
                            st.session_state.current_question = example_question
                            st.session_state.correct_key = example_question.get("correct_answer")
                            save_to_history(example_question)
                    else:
                        st.warning("No questions found for this topic. Please try another topic.")
            except requests.exceptions.RequestException as e:
                st.error(f"Error connecting to the backend: {str(e)}")
            except Exception as e:
                if st.session_state.debug_mode:
                    st.error(f"Unexpected error: {str(e)}")
                else:
                    st.error("An unexpected error occurred. Please try again.")

    # Display current question
    if st.session_state.current_question:
        question_data = st.session_state.current_question
        
        st.subheader("Introduction")
        st.write(question_data["introduction"])
        
        st.subheader("Conversation")
        st.write(question_data["conversation"])
        
        # Display audio player if available
        if st.session_state.conversation_audio:
            st.subheader("Listen to the Conversation")
            st.audio(st.session_state.conversation_audio)
        
        st.subheader("Question")
        st.write(question_data["question"])
        
        # Display answer choices
        st.subheader("Answer Choices")
        
        # Create columns for answers and feedback
        col_answers, col_feedback = st.columns(2)
        
        # Display all answers in left column
        with col_answers:
            for key, value in question_data["answers"].items():
                button_label = f"{key}: {value}"
                
                # Show the button
                if st.button(
                    button_label,
                    key=f"answer_{key}",
                    disabled=st.session_state.feedback_shown,
                    type="secondary" if not st.session_state.feedback_shown else "primary"
                ):
                    st.session_state.selected_answer = key
                    st.rerun()
        
        # Show feedback in right column
        with col_feedback:
            if st.session_state.feedback_shown:
                st.subheader("Feedback")
                for key, value in question_data["answers"].items():
                    button_label = f"{key}: {value}"
                    # Always show the correct answer in green
                    if key == st.session_state.correct_key:
                        st.success(f"✓ {button_label}")
                    # Show wrong answer in red only if it was selected
                    if key == st.session_state.selected_answer and key != st.session_state.correct_key:
                        st.error(f"✗ {button_label}")
        
        # Add some spacing
        st.write("")
        
        # Show check button and feedback message at the bottom
        if st.session_state.selected_answer:
            # Check answer button
            if not st.session_state.feedback_shown:
                if st.button("Check Answer", type="primary"):
                    st.session_state.feedback_shown = True
                    
                    if st.session_state.selected_answer == st.session_state.correct_key:
                        st.success("Correct! 正解です！")
                    else:
                        st.error(f"Incorrect. The correct answer is: {st.session_state.correct_key}: {question_data['correct_answer']}")
                    st.rerun()
            
            # Add a "Try Again" button when feedback is shown
            if st.session_state.feedback_shown:
                if st.button("Try Another Question", type="primary"):
                    # Reset all session state variables
                    st.session_state.selected_answer = None
                    st.session_state.current_question = None
                    st.session_state.feedback_shown = False
                    # Set topic back to default instead of deleting it
                    st.session_state.topic = "日本の伝統文化について"
                    st.rerun() 