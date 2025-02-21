import pytest
from jlpt_question_generator import JLPTQuestionGenerator
import os

@pytest.fixture
def generator():
    return JLPTQuestionGenerator()

def test_download_transcript(generator):
    # Use a known Japanese video ID for testing
    video_id = "EngW7tLk6R8"  # This should be a valid Japanese video
    transcript = generator.download_transcript(video_id)
    assert isinstance(transcript, str)
    assert len(transcript) > 0

def test_parse_transcript(generator):
    sample_transcript = "これは日本語のテスト文章です。簡単な会話を含んでいます。"
    questions = generator.parse_transcript(sample_transcript)
    
    assert isinstance(questions, list)
    assert len(questions) > 0
    
    for question in questions:
        assert "question" in question
        assert "options" in question
        assert "answer" in question
        assert len(question["options"]) == 4
        assert question["answer"] in ["A", "B", "C", "D"]

def test_save_questions(generator, tmp_path):
    test_questions = [{
        "question": "これは何ですか？",
        "options": ["テスト", "宿題", "本", "ノート"],
        "answer": "A"
    }]
    
    output_file = tmp_path / "test_output.txt"
    generator.save_questions(test_questions, str(output_file))
    
    assert output_file.exists()
    content = output_file.read_text(encoding="utf-8")
    assert "これは何ですか？" in content
    assert "テスト" in content
    assert "正解: A" in content 