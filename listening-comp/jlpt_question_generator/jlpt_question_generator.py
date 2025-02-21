import os
from typing import List, Dict
from youtube_transcript_api import YouTubeTranscriptApi
import boto3
import json
from dotenv import load_dotenv

load_dotenv()

class JLPTQuestionGenerator:
    def __init__(self):
        self.bedrock = boto3.client(
            service_name='bedrock-runtime',
            region_name='us-east-1'
        )

    def download_transcript(self, video_id: str) -> str:
        """
        Downloads the transcript from a YouTube video.
        
        Args:
            video_id (str): The YouTube video ID
            
        Returns:
            str: The concatenated transcript text
        """
        try:
            transcript_list = YouTubeTranscriptApi.get_transcript(
                video_id, 
                languages=['ja']
            )
            return " ".join([entry['text'] for entry in transcript_list])
        except Exception as e:
            raise Exception(f"Error downloading transcript: {str(e)}")

    def parse_transcript(self, transcript_text: str) -> List[Dict]:
        """
        Sends the transcript to Amazon Bedrock's Nano model to generate questions.
        
        Args:
            transcript_text (str): The transcript text to parse
            
        Returns:
            List[Dict]: List of questions with options and answers
        """
        prompt = f"""
        Based on the following Japanese transcript, generate 5 JLPT N5 level listening comprehension questions.
        For each question:
        1. Create a question in Japanese
        2. Provide 4 possible answers (A, B, C, D) in Japanese
        3. Indicate the correct answer
        
        Format the output as a JSON array of objects with the following structure:
        [
            {{
                "question": "質問文",
                "options": ["選択肢A", "選択肢B", "選択肢C", "選択肢D"],
                "answer": "A"
            }}
        ]

        Transcript:
        {transcript_text}
        """

        try:
            response = self.bedrock.invoke_model(
                modelId="amazon.nova-lite-v1:0",
                body=json.dumps({
                    "inferenceConfig": {
                        "max_new_tokens": 1000
                        },
                    "messages": [
                        {
                            "role": "user",
                            "content": [
                                {"text": prompt}  # Ensure 'content' is a list of dictionaries
                            ]
                        }
                    ]
                })
            )
            response_body = json.loads(response['body'].read())
            print(response_body)
            # Access the nested content
            content_text = response_body['output']['message']['content'][0]['text']
            # Remove the code block markers if present
            content_text = content_text.strip("```json\n").strip("\n```")
            questions = json.loads(content_text)
            return questions
        except KeyError as e:
            raise Exception(f"KeyError: Missing key in response: {str(e)}")
        except json.JSONDecodeError as e:
            raise Exception(f"JSONDecodeError: Error decoding JSON: {str(e)}")
        except Exception as e:
            raise Exception(f"Error parsing transcript with Bedrock: {str(e)}")

    def save_questions(self, questions: List[Dict], file_path: str) -> None:
        """
        Saves the generated questions to a text file.
        
        Args:
            questions (List[Dict]): List of question dictionaries
            file_path (str): Path to save the output file
        """
        try:
            with open(file_path, 'w', encoding='utf-8') as f:
                for i, q in enumerate(questions, 1):
                    f.write(f"問題{i}. {q['question']}\n\n")
                    for j, option in enumerate(q['options']):
                        f.write(f"{chr(65+j)}. {option}\n")
                    f.write(f"\n正解: {q['answer']}\n\n")
        except Exception as e:
            raise Exception(f"Error saving questions to file: {str(e)}")

def main(video_id: str, output_file: str):
    """
    Main function to orchestrate the question generation process.
    
    Args:
        video_id (str): YouTube video ID
        output_file (str): Path to save the output file
    """
    generator = JLPTQuestionGenerator()
    
    print("Downloading transcript...")
    transcript = generator.download_transcript(video_id)
    
    print("Generating questions...")
    questions = generator.parse_transcript(transcript)
    
    print("Saving questions...")
    generator.save_questions(questions, output_file)
    
    print(f"Questions have been saved to {output_file}")

if __name__ == "__main__":
    import sys
    if len(sys.argv) != 3:
        print("Usage: python jlpt_question_generator.py <video_id> <output_file>")
        sys.exit(1)
    
    main(sys.argv[1], sys.argv[2]) 