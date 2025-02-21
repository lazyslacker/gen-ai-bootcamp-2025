# JLPT N5 Listening Practice Question Generator

This tool generates JLPT N5 level listening comprehension questions from Japanese YouTube videos using Amazon Bedrock.

## Setup

1. Install dependencies:
```bash
pip install -r requirements.txt
```

2. Set up environment variables in `.env`:
```
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
```

## Usage

1. Run the question generator:
```bash
python jlpt_question_generator.py <youtube_video_id> <output_file>
```

Example:
```bash
python jlpt_question_generator.py EngW7tLk6R8 questions.txt
```

2. Run tests:
```bash
pytest test_jlpt_question_generator.py
```

## Features

- Downloads Japanese transcripts from YouTube videos
- Generates JLPT N5 level listening comprehension questions using Amazon Bedrock
- Creates multiple-choice questions with 4 options each
- Outputs questions in a clean, readable format