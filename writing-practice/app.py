import gradio as gr
import requests
import json
from enum import Enum
from openai import OpenAI
from manga_ocr import MangaOcr
import os
import logging
import dotenv
import random

# Define global CSS
custom_css = """
<style>
/* Apply font to all elements */
* {
    font-family: 'Noto Sans', 'Arial', sans-serif !important;
}

/* Specific styles for the large font display */
.large-font textarea {
    font-size: 80pt !important;
    font-weight: bold;
    padding: auto;
    min-height: auto;
    text-align: center !important;
    margin: auto;
    line-height: 1.2 !important;
    display: flex !important;
    align-items: center !important;
    justify-content: center !important;
    vertical-align: middle !important;
}

.word-info {
    margin-top: auto !important;
}
</style>
"""

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
        self.client = OpenAI()
        self.current_state = AppState.SETUP
        self.current_word = None
        self.word_collection = []
        self.mocr = MangaOcr()  # Initialize MangaOCR
        self.fetch_words()
    
    def fetch_words(self):
        try:
            # Fetch words from API
            words_group_id = os.getenv('WORDS_GROUP_ID', '1')
            api_url = os.getenv('LANGPORTAL_API_URL', 'http://localhost:3000')
            url = f"{api_url}/api/groups/{words_group_id}/words/"
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

    def translate_japanese_text(self, japanese_text):
        try:
            response = self.client.chat.completions.create(
                model="gpt-4",
                messages=[
                    {"role": "system", "content": "You are a Japanese translator. Provide only the English translation of the Japanese text, nothing else."},
                    {"role": "user", "content": f"Translate this Japanese text to English: {japanese_text}"}
                ],
                temperature=0
            )
            translation = response.choices[0].message.content.strip()
            logger.info(f"Translated '{japanese_text}' to '{translation}'")
            return translation
        except Exception as e:
            logger.error(f"Translation error: {str(e)}")
            raise

    def grade_submission(self, expected_word, transcribed_text, transcribed_translation):
        try:
            response = self.client.chat.completions.create(
                model="gpt-4",
                messages=[
                    {"role": "system", "content": """You are a Japanese writing evaluator. 
                    Grade the submission using these criteria:
                    - S rank: Perfect match in both writing and meaning
                    - A rank: Correct meaning but minor writing differences
                    - B rank: Recognizable but with significant writing differences
                    - C rank: Incorrect or unrecognizable
                    
                    Provide your response in this format:
                    {"grade": "rank_letter", "feedback": "detailed_feedback"}"""},
                    {"role": "user", "content": f"""Evaluate this Japanese writing submission:
                    Expected word: {expected_word}
                    Written text: {transcribed_text}
                    Translation of written text: {transcribed_translation}"""}
                ],
                temperature=0
            )
            
            evaluation = json.loads(response.choices[0].message.content)
            logger.info(f"Grading result: {evaluation}")
            return evaluation
        except Exception as e:
            logger.error(f"Grading error: {str(e)}")
            raise

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

            # Process image with MangaOCR
            logger.debug(f"Processing image with MangaOCR: {image}")
            try:
                transcribed_text = self.mocr(image['composite'])
                logger.info(f"MangaOCR transcription: {transcribed_text}")
            except Exception as e:
                logger.error(f"MangaOCR error: {str(e)}")
                return (
                    gr.update(value="", visible=False),
                    gr.update(value="", visible=False),
                    gr.update(value="", visible=False),
                    gr.update(value=f"Error processing image: {str(e)}", visible=True),
                    gr.update(visible=True),
                    gr.update(visible=True),
                    gr.update(visible=False)
                )

            # Get translation of transcribed text
            transcribed_translation = self.translate_japanese_text(transcribed_text)
            
            # Grade the submission
            evaluation = self.grade_submission(
                self.current_word['kanji'],
                transcribed_text,
                transcribed_translation
            )

            return (
                gr.update(value=transcribed_text, visible=True),  # transcription
                gr.update(value=transcribed_translation, visible=True),  # translation
                gr.update(value=evaluation['grade'], visible=True),  # grade
                gr.update(value=evaluation['feedback'], visible=True),  # feedback
                gr.update(visible=True),  # image_upload
                gr.update(visible=False),  # submit_btn
                gr.update(visible=True)  # next_btn
            )

        except Exception as e:
            logger.error(f"Error in submit_for_review: {str(e)}")
            return (
                gr.update(value="", visible=False),
                gr.update(value="", visible=False),
                gr.update(value="", visible=False),
                gr.update(value=f"Error: {str(e)}", visible=True),
                gr.update(visible=True),
                gr.update(visible=True),
                gr.update(visible=False)
            )

    def create_interface(self):
        with gr.Blocks(title="Japanese Writing Practice", css=custom_css) as interface:
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
                            lines=1,
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