import os
import glob
import json
from typing import List, Dict
from dotenv import load_dotenv
import chromadb
from chromadb.config import Settings
import boto3
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel

# Load environment variables
load_dotenv()

# Initialize FastAPI app
app = FastAPI(title="JLPT Listening Comprehension API")

class CustomJSONResponse(JSONResponse):
    def render(self, content) -> bytes:
        return json.dumps(
            content,
            ensure_ascii=False,
            allow_nan=False,
            indent=2,
            separators=(",", ":"),
        ).encode("utf-8")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with specific origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize global database instance
db = None

class QueryRequest(BaseModel):
    query: str
    n_results: int = 3

@app.on_event("startup")
async def startup_event():
    global db
    db = JLPTVectorDB()
    # Populate the database with transcript data
    transcript_dir = "transcripts"
    db.populate_database(transcript_dir)

@app.post("/api/search")
async def search_questions(request: QueryRequest):
    try:
        results = db.query_database(request.query, request.n_results)
        
        # Format the response
        formatted_results = []
        for metadata in results['metadatas'][0]:
            # Create a copy of metadata to avoid modifying the original
            result = {
                "question": metadata.get('question', ''),
                "correct_answer": metadata.get('correct_answer', ''),
                "introduction": metadata.get('introduction', ''),
                "conversation": metadata.get('conversation', ''),
                "answers": {}
            }
            
            # Handle answers properly
            try:
                if isinstance(metadata.get('answers_json'), str):
                    result['answers'] = json.loads(metadata['answers_json'])
                elif isinstance(metadata.get('answers_json'), dict):
                    result['answers'] = metadata['answers_json']
            except (json.JSONDecodeError, TypeError) as e:
                print(f"Error parsing answers: {str(e)}")
                result['answers'] = {}
            
            formatted_results.append(result)
        
        return CustomJSONResponse({
            "status": "success",
            "query": request.query,
            "count": len(formatted_results),
            "results": formatted_results
        })
    except Exception as e:
        print(f"Error in search_questions: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

class JLPTVectorDB:
    def __init__(self):
        self.bedrock = boto3.client(
            service_name="bedrock-runtime",
            region_name="us-east-1",
            aws_access_key_id=os.getenv("AWS_ACCESS_KEY_ID"),
            aws_secret_access_key=os.getenv("AWS_SECRET_ACCESS_KEY")
        )

        self.client = chromadb.Client(Settings(
            persist_directory="vectordb"
        ))
        
        # Create or get collection
        self.collection = self.client.get_or_create_collection(
            name="jlpt_questions",
            metadata={"hnsw:space": "cosine"}
        )

    def get_embedding(self, text: str) -> List[float]:
        """Get embeddings directly from Amazon Titan model."""
        try:
            response = self.bedrock.invoke_model(
                modelId="amazon.titan-embed-text-v1",
                contentType="application/json",
                accept="application/json",
                body=json.dumps({
                    "inputText": text
                })
            )
            response_body = json.loads(response['body'].read())
            return response_body['embedding']
        except Exception as e:
            raise Exception(f"Error getting embedding from Bedrock: {str(e)}")

    def parse_transcript_file(self, file_path: str) -> List[Dict]:
        """Parse a transcript file and return a list of question entries."""
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()

        # Split content into question blocks
        blocks = content.strip().split('\n\n導入: ')
        if blocks[0].startswith('導入: '):
            blocks[0] = blocks[0][4:]  # Remove leading '導入: ' from first block
        
        entries = []
        for block in blocks:
            if not block.strip():
                continue
                
            lines = block.split('\n')
            entry = {
                'introduction': lines[0].strip(),
                'conversation': '',
                'question': '',
                'answers': {},
                'correct_answer': ''
            }
            
            current_section = 'introduction'
            conversation_started = False
            conversation_lines = []
            
            for line in lines[1:]:
                line = line.strip()
                if not line:
                    continue
                    
                if '会話:' in line:
                    current_section = 'conversation'
                    conversation_started = True
                    # Get the text after 会話: if it exists on the same line
                    conv_text = line.split('会話:', 1)[1].strip()
                    if conv_text:
                        conversation_lines.append(conv_text)
                    continue
                elif line.startswith('問題'):
                    current_section = 'question'
                    conversation_started = False
                    entry['question'] = line.split('.')[-1].strip()
                    continue
                elif line.startswith(('A.', 'B.', 'C.', 'D.')):
                    answer_key = line[0]
                    answer_text = line[2:].strip()
                    entry['answers'][answer_key] = answer_text
                    continue
                elif line.startswith('正解:'):
                    entry['correct_answer'] = line.split(':')[-1].strip()
                    continue
                
                # Only append to conversation if we're between 会話: and 問題
                if conversation_started and current_section == 'conversation':
                    conversation_lines.append(line)
            
            # Join conversation lines with newlines
            entry['conversation'] = '\n'.join(conversation_lines)
            entries.append(entry)
            
            # Debug print for verification
            print(f"\nParsed entry:")
            print(f"Introduction: {entry['introduction']}")
            print(f"Conversation:")
            print(entry['conversation'])
            print(f"Question: {entry['question']}")
            print("Answers:", entry['answers'])
            print(f"Correct Answer: {entry['correct_answer']}\n")
        
        return entries

    def create_document(self, entry: Dict) -> Dict:
        """Create a document from an entry for vector database storage."""
        # Combine all text fields for embedding
        full_text = f"""Introduction: {entry['introduction']}
Conversation: {entry['conversation']}
Question: {entry['question']}
Answers:
A. {entry['answers']['A']}
B. {entry['answers']['B']}
C. {entry['answers']['C']}
D. {entry['answers']['D']}"""
        
        return {
            'text': full_text,
            'metadata': {
                'introduction': entry['introduction'],
                'conversation': entry['conversation'],
                'question': entry['question'],
                'answers_json': json.dumps(entry['answers'], ensure_ascii=False),  # Convert dict to JSON string
                'correct_answer': entry['correct_answer']
            }
        }

    def populate_database(self, transcript_dir: str):
        """Populate the vector database with transcript data."""
        transcript_files = glob.glob(os.path.join(transcript_dir, '*.txt'))
        
        for file_path in transcript_files:
            print(f"Processing {file_path}...")
            entries = self.parse_transcript_file(file_path)
            
            for entry in entries:
                doc = self.create_document(entry)
                embedding = self.get_embedding(doc['text'])
                
                # Debug print
                print(f"\nAdding document with metadata:", json.dumps(doc['metadata'], ensure_ascii=False, indent=2))
                
                try:
                    # Add to ChromaDB
                    self.collection.add(
                        embeddings=[embedding],
                        documents=[doc['text']],
                        metadatas=[doc['metadata']],
                        ids=[f"q_{hash(doc['text'])}"]
                    )
                except Exception as e:
                    print(f"Error adding document to ChromaDB: {str(e)}")
                    raise
        
        print("Database population complete!")
        
        # Verify collection size
        print(f"Total documents in collection: {self.collection.count()}")

    def query_database(self, query: str, n_results: int = 3):
        """Query the vector database and return similar questions."""
        try:
            query_embedding = self.get_embedding(query)
            results = self.collection.query(
                query_embeddings=[query_embedding],
                n_results=n_results,
                include=['metadatas', 'documents']  # Explicitly request metadata
            )
            
            if not results['metadatas'] or not results['metadatas'][0]:
                print("Warning: No metadata found in results")
                return results
            
            return results
        except Exception as e:
            print(f"Error in query_database: {str(e)}")
            raise

def main():
    import uvicorn
    # Run the FastAPI server
    uvicorn.run(app, host="0.0.0.0", port=8000)

if __name__ == "__main__":
    main() 