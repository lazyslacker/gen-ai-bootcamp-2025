import pytest
import json
from app import create_app

@pytest.fixture
def client():
    app = create_app({"TESTING": True})
    with app.test_client() as client:
        yield client

def test_create_study_session_success(client):
    """Test creating a study session with valid data"""
    payload = {
        "group_id": 1,
        "study_activity_id": 1
    }
    response = client.post(
        '/api/study-sessions',
        data=json.dumps(payload),
        content_type='application/json'
    )
    
    assert response.status_code == 201
    data = json.loads(response.data)
    assert 'id' in data
    assert data['group_id'] == payload['group_id']
    assert 'group_name' in data
    assert 'activity_id' in data
    assert 'activity_name' in data
    assert 'created_at' in data

def test_create_study_session_invalid_json(client):
    """Test creating a study session with invalid JSON"""
    response = client.post(
        '/api/study-sessions',
        data='invalid json',
        content_type='application/json'
    )
    assert response.status_code == 400
    assert b'Invalid JSON payload' in response.data

def test_create_study_session_missing_fields(client):
    """Test creating a study session with missing fields"""
    payload = {"group_id": 1}  # Missing study_activity_id
    response = client.post(
        '/api/study-sessions',
        data=json.dumps(payload),
        content_type='application/json'
    )
    assert response.status_code == 400
    data = json.loads(response.data)
    assert 'required' in data['error']

def test_create_study_session_invalid_group(client):
    """Test creating a study session with non-existent group"""
    payload = {
        "group_id": 99999,  # Non-existent group
        "study_activity_id": 1
    }
    response = client.post(
        '/api/study-sessions',
        data=json.dumps(payload),
        content_type='application/json'
    )
    assert response.status_code == 404
    data = json.loads(response.data)
    assert 'Group not found' in data['error']

def test_create_word_review_success(client):
    """Test creating a word review with valid data"""
    payload = {
        "correct": True
    }
    response = client.post(
        '/api/study_sessions/1/words/1/review',
        data=json.dumps(payload),
        content_type='application/json'
    )
    
    assert response.status_code == 201
    data = json.loads(response.data)
    assert data['success'] is True
    assert data['word_id'] == 1
    assert data['study_session_id'] == 1
    assert data['correct'] is True
    assert 'created_at' in data

def test_create_word_review_invalid_json(client):
    """Test creating a word review with invalid JSON"""
    response = client.post(
        '/api/study_sessions/1/words/1/review',
        data='invalid json',
        content_type='application/json'
    )
    assert response.status_code == 400
    assert b'Invalid JSON payload' in response.data

def test_create_word_review_missing_correct(client):
    """Test creating a word review without correct field"""
    payload = {}  # Missing correct field
    response = client.post(
        '/api/study_sessions/1/words/1/review',
        data=json.dumps(payload),
        content_type='application/json'
    )
    assert response.status_code == 400
    data = json.loads(response.data)
    assert 'required' in data['error']

def test_create_word_review_invalid_session(client):
    """Test creating a word review with non-existent session"""
    payload = {"correct": True}
    response = client.post(
        '/api/study_sessions/99999/words/1/review',
        data=json.dumps(payload),
        content_type='application/json'
    )
    assert response.status_code == 404
    data = json.loads(response.data)
    assert 'Study session not found' in data['error']

def test_create_word_review_word_not_in_group(client):
    """Test creating a word review for word not in session's group"""
    payload = {"correct": True}
    response = client.post(
        '/api/study_sessions/1/words/99999/review',
        data=json.dumps(payload),
        content_type='application/json'
    )
    assert response.status_code == 404
    data = json.loads(response.data)
    assert 'Word not found or not in session group' in data['error'] 