import gradio as gr
import requests
import json
from enum import Enum
import os

# States enum
class AppState(Enum):
    SETUP = "setup"
    PRACTICE = "practice"
    REVIEW = "review"

class JapaneseWritingApp:
    def __init__(self):
        self.current_state = AppState.SETUP
        self.current_sentence = ""
        self.word_collection = []
        self.fetch_words()
    
    def fetch_words(self):
        try:
            # Fetch words from API
            response = requests.get("http://localhost:3000/api/groups/1/raw")
            self.word_collection = response.json()
        except:
            # For testing, use dummy data if API is not available
            self.word_collection = [
                {"japanese": "食べる", "english": "to eat", "reading": "たべる"},
                {"japanese": "飲む", "english": "to drink", "reading": "のむ"}
            ]

    def generate_sentence(self, sentence_output, english_output, kanji_output, reading_output,
                         image_upload, generate_btn, submit_btn, next_btn, 
                         transcription, translation, grade, feedback):
        # TODO: Implement actual LLM call
        self.current_sentence = "Please write: The cat drinks milk."
        self.current_state = AppState.PRACTICE
        
        # Dummy word info for now
        word_info = {
            "english": "to drink",
            "kanji": "飲む",
            "reading": "のむ"
        }
        
        return {
            sentence_output: gr.update(value=self.current_sentence, visible=True),
            english_output: gr.update(value=word_info["english"], visible=True),
            kanji_output: gr.update(value=word_info["kanji"], visible=True),
            reading_output: gr.update(value=word_info["reading"], visible=True),
            image_upload: gr.update(visible=True),
            generate_btn: gr.update(visible=False),
            submit_btn: gr.update(visible=True),
            next_btn: gr.update(visible=False),
            transcription: gr.update(value="", visible=False),
            translation: gr.update(value="", visible=False),
            grade: gr.update(value="", visible=False),
            feedback: gr.update(value="", visible=False)
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
                gr.update(value="Excellent work! The sentence matches the English perfectly.", visible=True),  # feedback
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
                .large-font {
                    font-size: 24px;  /* Adjust the font size as needed */
                }
            </style>
            """)
            with gr.Row():
                # Left Column
                with gr.Column(scale=1):
                    generate_btn = gr.Button("Generate New Sentence", variant="primary")
                    
                    with gr.Group():
                        sentence_output = gr.Textbox(
                            value="",
                            label="Generated Sentence",
                            interactive=False,
                            elem_classes=["large-font"]  # Apply the custom CSS class
                        )
                    
                    with gr.Group():
                        english_output = gr.Textbox(label="English", interactive=False)
                        kanji_output = gr.Textbox(label="Kanji", interactive=False)
                        reading_output = gr.Textbox(label="Reading", interactive=False)

                # Right Column
                with gr.Column(scale=1):
                    with gr.Group():
                        image_upload = gr.Image(
                            label="Upload your handwritten sentence",
                            type="filepath",
                            sources=['upload']
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
                fn=lambda: self.generate_sentence(sentence_output, english_output, 
                        kanji_output, reading_output, image_upload, generate_btn, 
                        submit_btn, next_btn, transcription, translation, grade, feedback),
                outputs=[sentence_output, english_output, kanji_output, reading_output,
                        image_upload, generate_btn, submit_btn, next_btn,
                        transcription, translation, grade, feedback]
            )
            
            submit_btn.click(
                fn=self.submit_for_review,
                inputs=[image_upload],
                outputs=[transcription, translation, grade, feedback, image_upload, submit_btn, next_btn]
            )
            
            next_btn.click(
                fn=lambda: self.generate_sentence(sentence_output, english_output,
                        kanji_output, reading_output, image_upload, generate_btn,
                        submit_btn, next_btn, transcription, translation, grade, feedback),
                outputs=[sentence_output, english_output, kanji_output, reading_output,
                        image_upload, generate_btn, submit_btn, next_btn,
                        transcription, translation, grade, feedback]
            )
            
        return interface

if __name__ == "__main__":
    app = JapaneseWritingApp()
    interface = app.create_interface()
    interface.launch() 