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

1. Run the transcript parser:

```bash
python jlpt_parse_transcript.py <youtube_video_id>
```

Example:

```bash
python jlpt_parse_transcript.py 0e0duD8_LFE
```

```bash
python jlpt_parse_transcript.py CQ82yk3BC6c
```

```bash
python jlpt_parse_transcript.py SAaWBv630nI
```

2. Run backend (need this running so that the frontend can access chromadb):


```bash
python listening-comp-backend.py
```

## Features

- Downloads Japanese transcripts from YouTube videos
- Generates JLPT N5 level listening comprehension questions using Amazon Bedrock
- Creates multiple-choice questions with 4 options each
- Outputs questions in a clean, readable format
