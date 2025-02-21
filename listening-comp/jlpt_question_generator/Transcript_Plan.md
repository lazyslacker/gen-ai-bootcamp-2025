# JLPTN5 Listening Practice Question Generator Plan

This plan outlines the steps to create a Python program that:

- Downloads a transcript from a YouTube JLPTN5 practice video.
- Uses Amazon Bedrock’s Nano model to parse the transcript into a list of questions and answers.
- Writes the resulting questions (with four options per question and one correct answer) to a text file.

## Setup

- [ ] **Install Dependencies**
  - Install necessary packages:
    - For downloading YouTube transcript: You can use either the official YouTube API (e.g., `google-api-python-client`) or a library like [`youtube_transcript_api`](https://github.com/jdepoix/youtube-transcript-api).
    - For HTTP requests: `requests`
    - For testing: `unittest` (comes with Python) or `pytest`
  - Example:

    ```bash
    pip install youtube_transcript_api requests
    ```

## Implementation

- [ ] **Download YouTube Transcript**
  - Write a function (e.g., `download_transcript(video_id)`) that:
    - Uses the YouTube API (or an alternative library) to fetch the transcript.
    - Handles errors if the transcript is unavailable.
  - *Hint*: Consider using the `youtube_transcript_api` for simplicity.

- [ ] **Parse Transcript Using Amazon Bedrock’s Nano Model**
  - Write a function (e.g., `parse_transcript(transcript_text)`) that:
    - Sends the transcript text to the Nano model endpoint via an HTTP request.
    - Includes a prompt instructing the model to generate a list of questions with the following for each question:
      - Introduction
      - Conversation
      - Question
      - 4 possible answers (A, B, C, D) in Japanese
      - Correct Answer
    - Parses the JSON response into a Python data structure.
  - *Note*: Ensure proper error handling for API responses.

- [ ] **Store Parsed Content into a Text File**
  - Write a function (e.g., `save_questions(questions, file_path)`) that:
    - Writes the list of questions and answers to a text file in a readable format.
    - Verifies that the file is saved correctly.

- [ ] **Main Script**
  - Create a main script that:
    - Accepts a YouTube video ID as input.
    - Calls `download_transcript` to retrieve the transcript.
    - Calls `parse_transcript` to generate questions.
    - Calls `save_questions` to write the output to a file.
  - Add proper logging and error handling.

## Testing

- [ ] **Write Unit Tests**
  - Create tests for each key function.
  - Verify:
    - The transcript is successfully downloaded.
    - The transcript is correctly parsed into questions.
    - The output file contains the expected text.
  - Below is an example testing code using Python’s built-in `unittest`:

    ```python
    import unittest
    from your_module import download_transcript, parse_transcript, save_questions

    class TestJLPTN5Tool(unittest.TestCase):
        def test_download_transcript(self):
            # Example YouTube video ID for testing; replace with a valid ID.
            video_id = "example_video_id"
            transcript = download_transcript(video_id)
            self.assertIsInstance(transcript, str)
            self.assertGreater(len(transcript), 0)

        def test_parse_transcript(self):
            sample_transcript = "これはテストの文章です。"
            questions = parse_transcript(sample_transcript)
            self.assertIsInstance(questions, list)
            # Each question should be a dict with keys 'question', 'options', 'answer'
            for q in questions:
                self.assertIn('question', q)
                self.assertIn('options', q)
                self.assertIn('answer', q)
                self.assertEqual(len(q['options']), 4)

        def test_save_questions(self):
            questions = [{
                "question": "これは何ですか？",
                "options": ["A", "B", "C", "D"],
                "answer": "A"
            }]
            file_path = "output.txt"
            save_questions(questions, file_path)
            with open(file_path, "r", encoding="utf-8") as f:
                content = f.read()
            self.assertIn("これは何ですか？", content)

    if __name__ == "__main__":
        unittest.main()
    ```

- [ ] **Run and Verify Tests**
  - Execute your tests to ensure each component works as expected.
  - Fix any issues before moving to production.

## Final Considerations

- [ ] **API Key Management**
  - Store YouTube API keys and any Amazon Bedrock credentials securely (e.g., in environment variables).

- [ ] **Documentation**
  - Add comments and documentation in your code to make it understandable for future maintainers.

- [ ] **Error Handling & Logging**
  - Ensure your code gracefully handles errors (e.g., missing transcript, API errors).
  - Add logging to help diagnose issues during runtime.
