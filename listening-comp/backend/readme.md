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

1. First, run the transcript parser. The transcript parser will parse the transcript of a youtube video and save the results to a directory. The backend will need this data to populate the chroma database. Parse the transcripts of as many videos as you want to build up the data, before you run the backend. You will need to stop the backend and restart it each time you parse a new transcript, if you want to insert the new transcripts in your vectordatabase.

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
