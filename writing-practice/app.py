import gradio as gr
import requests
import json
from enum import Enum
from openai import OpenAI
import os
import logging
import dotenv
import random

dotenv.load_dotenv()

# Setup logging
logger = logging.getLogger('writing-practice')
logger.setLevel(logging.DEBUG)
fh = logging.FileHandler('app.log')
fh.setLevel(logging.DEBUG)
formatter = logging.Formatter('%(asctime)s - %(levelname)s - %(message)s')
fh.setFormatter(formatter)
logger.addHandler(fh)

# States enum
class AppState(Enum):
    SETUP = "setup"
    PRACTICE = "practice"
    REVIEW = "review"

class JapaneseWritingApp:
    def __init__(self):
        self.current_state = AppState.SETUP
        self.current_word = None
        self.word_collection = []
        self.fetch_words()
    
    def fetch_words(self):
        try:
            # Fetch words from API
            group_id = os.getenv('WORDS_GROUP_ID', '1')
            url = f"http://localhost:3000/api/groups/{group_id}/words/"
            logger.debug(f"Fetching words from {url}")

            response = requests.get(url)

            if response.status_code == 200:
                self.word_collection = response.json()
                logger.info(f"Loaded {len(self.word_collection.get('words', []))} words")
                logger.debug(f"Loaded {[word['english'] for word in self.word_collection.get('words', [])]}")

            else:
                logger.error(f"Failed to load vocabulary, API not responding. Status code: {response.status_code}")
                self.word_collection = {"words": []}
            
        except Exception as e:
            # For testing, use dummy 
            logger.error(f"Error loading vocabulary: {str(e)}, using fallback data") # data if API is not available
            self.word_collection = [
                {"kanji": "食べる", "english": "to eat", "reading": "たべる"},
                {"kanji": "飲む", "english": "to drink", "reading": "のむ"}
            ]

    def select_random_word(self):
        try:
            words = self.word_collection.get('words', [])
            if not words:
                logger.error("No words available in collection")
                return {
                    "english": "Error: No words available",
                    "kanji": "",
                    "reading": ""
                }
            
            self.current_word = random.choice(words)
            logger.debug(f"Selected word: {self.current_word}")
            return self.current_word
            
        except Exception as e:
            logger.error(f"Error selecting random word: {str(e)}")
            return {
                "english": "Error selecting word",
                "kanji": "",
                "reading": ""
            }

    def generate_word(self, word_output, english_output, kanji_output, reading_output,
                         image_upload, generate_btn, submit_btn, next_btn, 
                         transcription, translation, grade, feedback):
        
        try:
            word = self.select_random_word()
            self.current_state = AppState.PRACTICE
            
            return {
                word_output: gr.update(value=f"{word['kanji']}", visible=True),
                english_output: gr.update(value=word['english'], visible=True),
                kanji_output: gr.update(value=word['kanji'], visible=True),
                reading_output: gr.update(value=word.get('reading', ''), visible=True),
                image_upload: gr.update(visible=True),
                generate_btn: gr.update(visible=False),
                next_btn: gr.update(visible=False),
                submit_btn: gr.update(visible=True),
                transcription: gr.update(value="", visible=False),
                translation: gr.update(value="", visible=False),
                grade: gr.update(value="", visible=False),
                feedback: gr.update(value="", visible=False)
            }
            
        except Exception as e:
            logger.error(f"Error in generate_word: {str(e)}")
            return {
                word_output: gr.update(value="Error occurred while selecting word", visible=True),
                english_output: gr.update(value="", visible=True),
                kanji_output: gr.update(value="", visible=True),
                reading_output: gr.update(value="", visible=True),
                image_upload: gr.update(visible=False),
                generate_btn: gr.update(visible=True),
                submit_btn: gr.update(visible=False),
                next_btn: gr.update(visible=False),
                transcription: gr.update(value="", visible=False),
                translation: gr.update(value="", visible=False),
                grade: gr.update(value="", visible=False),
                feedback: gr.update(value=f"Error: {str(e)}", visible=True)
            }

    def submit_for_review(self, image):
        try:
            if image is None:
                return (
                    gr.update(value="", visible=False),  # transcription
                    gr.update(value="", visible=False),  # translation
                    gr.update(value="", visible=False),  # grade
                    gr.update(value="Error: Please upload an image first!", visible=True),  # feedback
                    gr.update(visible=True),  # image_upload
                    gr.update(visible=True),  # submit_btn
                    gr.update(visible=False)  # next_btn
            )
        
            # Simulate processing
            return (
                gr.update(value="猫が牛乳を飲みます。", visible=True),  # transcription
                gr.update(value="The cat drinks milk.", visible=True),  # translation
                gr.update(value="S", visible=True),  # grade
                gr.update(value="Excellent work! The word matches the kanji perfectly.", visible=True),  # feedback
                gr.update(visible=True),  # image_upload
                gr.update(visible=False),  # submit_btn
                gr.update(visible=True)  # next_btn
            )
        except Exception as e:
            return (
                gr.update(value="", visible=False),  # transcription
                gr.update(value="", visible=False),  # translation
                gr.update(value="", visible=False),  # grade
                gr.update(value=f"Error: {str(e)}", visible=True),  # feedback
                gr.update(visible=True),  # image_upload
                gr.update(visible=True),  # submit_btn
                gr.update(visible=False)  # next_btn
        )
    def create_interface(self):
        with gr.Blocks(title="Japanese Writing Practice") as interface:
            
            # Inject custom CSS
            gr.HTML("""
            <style>
                .large-font textarea{
                    font-size: 48pt !important;
                    font-weight: bold;
                    padding: 30px !important;
                    min-height: 60px !important;
                    text-align: center !important;
                    margin: 30px 0 !important;
                    line-height: 1.2 !important;
                }
                
                .word-info {
                    margin-top: 30px !important;
                }

                .large-font textarea {
                    font-size: 48pt !important;
                    font-weight: bold;
                    line-height: 1.2 !important;
                }
            </style>
            """)
            with gr.Row():
                # Left Column
                with gr.Column(scale=1):
                    generate_btn = gr.Button("Select random word", variant="primary", size="lg")
                    
                    with gr.Group():
                        word_output = gr.Textbox(
                            value="",
                            label="Random word",
                            interactive=False,
                            elem_classes=["large-font"],
                            container=False,
                            lines=2,
                            scale=2
                        )
                    
                    with gr.Group(elem_classes=["word-info"]):
                        english_output = gr.Textbox(label="English", interactive=False)
                        kanji_output = gr.Textbox(label="Kanji", interactive=False)
                        reading_output = gr.Textbox(label="Reading", interactive=False)

                # Right Column
                with gr.Column(scale=1):
                    with gr.Group():
                        image_upload = gr.ImageEditor(
                            label="Upload your handwritten word",
                            type="filepath",
                            sources="upload"
                            #sources=['upload']
                        )
                        submit_btn = gr.Button("Submit", variant="secondary")
                        next_btn = gr.Button("Next Question", visible=False)

                    with gr.Group():
                        transcription = gr.Textbox(label="Transcription", interactive=False, visible=False)
                        translation = gr.Textbox(label="Translation", interactive=False, visible=False)
                        grade = gr.Textbox(label="Grade", interactive=False, visible=False)
                        feedback = gr.Textbox(label="Feedback", interactive=False, visible=False)
            
            # Event handlers
            generate_btn.click(
                fn=lambda: self.generate_word(word_output, english_output, 
                        kanji_output, reading_output, image_upload, generate_btn, 
                        submit_btn, next_btn, transcription, translation, grade, feedback),
                outputs=[word_output, english_output, kanji_output, reading_output,
                        image_upload, generate_btn, submit_btn, next_btn,
                        transcription, translation, grade, feedback]
            )
            
            submit_btn.click(
                fn=self.submit_for_review,
                inputs=[image_upload],
                outputs=[transcription, translation, grade, feedback, image_upload, submit_btn, next_btn]
            )
            
            next_btn.click(
                fn=lambda: self.generate_word(word_output, english_output,
                        kanji_output, reading_output, image_upload, generate_btn,
                        submit_btn, next_btn, transcription, translation, grade, feedback),
                outputs=[word_output, english_output, kanji_output, reading_output,
                        image_upload, generate_btn, submit_btn, next_btn,
                        transcription, translation, grade, feedback]
            )
            
        return interface

if __name__ == "__main__":
    app = JapaneseWritingApp()
    interface = app.create_interface()
    interface.launch() 