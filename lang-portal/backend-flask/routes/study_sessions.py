from flask import request, jsonify, g
from flask_cors import cross_origin
from datetime import datetime
import math
import sqlite3
import logging

INSERT_STUDY_SESSION = '''
    INSERT INTO study_sessions (group_id, study_activity_id)
    VALUES (?, ?)
'''

GET_NEW_SESSION = '''
    SELECT 
        ss.id,
        ss.group_id,
        g.name as group_name,
        sa.id as activity_id,
        sa.name as activity_name,
        ss.created_at
    FROM study_sessions ss
    JOIN groups g ON g.id = ss.group_id
    JOIN study_activities sa ON sa.id = ss.study_activity_id
    WHERE ss.id = ?
'''

# Add new constants for word review
VALIDATE_SESSION = '''
    SELECT ss.id, ss.group_id 
    FROM study_sessions ss 
    WHERE ss.id = ?
'''

VALIDATE_WORD = '''
    SELECT w.id 
    FROM words w 
    JOIN word_groups wg ON w.id = wg.word_id 
    WHERE w.id = ? AND wg.group_id = ?
'''

INSERT_WORD_REVIEW = '''
    INSERT INTO word_review_items (word_id, study_session_id, correct, created_at)
    VALUES (?, ?, ?, datetime('now'))
'''

def load(app):
  # todo /study_sessions POST

  @app.route('/api/study_sessions', methods=['GET'])
  @cross_origin()
  def get_study_sessions():
    try:
      cursor = app.db.cursor()
      
      # Get pagination parameters
      page = request.args.get('page', 1, type=int)
      per_page = request.args.get('per_page', 10, type=int)
      offset = (page - 1) * per_page

      # Get total count
      cursor.execute('''
        SELECT COUNT(*) as count 
        FROM study_sessions ss
        JOIN groups g ON g.id = ss.group_id
        JOIN study_activities sa ON sa.id = ss.study_activity_id
      ''')
      total_count = cursor.fetchone()['count']

      # Get paginated sessions
      cursor.execute('''
        SELECT 
          ss.id,
          ss.group_id,
          g.name as group_name,
          sa.id as activity_id,
          sa.name as activity_name,
          ss.created_at,
          COUNT(wri.id) as review_items_count
        FROM study_sessions ss
        JOIN groups g ON g.id = ss.group_id
        JOIN study_activities sa ON sa.id = ss.study_activity_id
        LEFT JOIN word_review_items wri ON wri.study_session_id = ss.id
        GROUP BY ss.id
        ORDER BY ss.created_at DESC
        LIMIT ? OFFSET ?
      ''', (per_page, offset))
      sessions = cursor.fetchall()

      return jsonify({
        'items': [{
          'id': session['id'],
          'group_id': session['group_id'],
          'group_name': session['group_name'],
          'activity_id': session['activity_id'],
          'activity_name': session['activity_name'],
          'start_time': session['created_at'],
          'end_time': session['created_at'],  # For now, just use the same time since we don't track end time
          'review_items_count': session['review_items_count']
        } for session in sessions],
        'total': total_count,
        'page': page,
        'per_page': per_page,
        'total_pages': math.ceil(total_count / per_page)
      })
    except Exception as e:
      return jsonify({"error": str(e)}), 500

  @app.route('/api/study_sessions/<id>', methods=['GET'])
  @cross_origin()
  def get_study_session(id):
    try:
      cursor = app.db.cursor()
      
      # Get session details
      cursor.execute('''
        SELECT 
          ss.id,
          ss.group_id,
          g.name as group_name,
          sa.id as activity_id,
          sa.name as activity_name,
          ss.created_at,
          COUNT(wri.id) as review_items_count
        FROM study_sessions ss
        JOIN groups g ON g.id = ss.group_id
        JOIN study_activities sa ON sa.id = ss.study_activity_id
        LEFT JOIN word_review_items wri ON wri.study_session_id = ss.id
        WHERE ss.id = ?
        GROUP BY ss.id
      ''', (id,))
      
      session = cursor.fetchone()
      if not session:
        return jsonify({"error": "Study session not found"}), 404

      # Get pagination parameters
      page = request.args.get('page', 1, type=int)
      per_page = request.args.get('per_page', 10, type=int)
      offset = (page - 1) * per_page

      # Get the words reviewed in this session with their review status
      cursor.execute('''
        SELECT 
          w.*,
          COALESCE(SUM(CASE WHEN wri.correct = 1 THEN 1 ELSE 0 END), 0) as session_correct_count,
          COALESCE(SUM(CASE WHEN wri.correct = 0 THEN 1 ELSE 0 END), 0) as session_wrong_count
        FROM words w
        JOIN word_review_items wri ON wri.word_id = w.id
        WHERE wri.study_session_id = ?
        GROUP BY w.id
        ORDER BY w.kanji
        LIMIT ? OFFSET ?
      ''', (id, per_page, offset))
      
      words = cursor.fetchall()

      # Get total count of words
      cursor.execute('''
        SELECT COUNT(DISTINCT w.id) as count
        FROM words w
        JOIN word_review_items wri ON wri.word_id = w.id
        WHERE wri.study_session_id = ?
      ''', (id,))
      
      total_count = cursor.fetchone()['count']

      return jsonify({
        'session': {
          'id': session['id'],
          'group_id': session['group_id'],
          'group_name': session['group_name'],
          'activity_id': session['activity_id'],
          'activity_name': session['activity_name'],
          'start_time': session['created_at'],
          'end_time': session['created_at'],  # For now, just use the same time
          'review_items_count': session['review_items_count']
        },
        'words': [{
          'id': word['id'],
          'kanji': word['kanji'],
          'romaji': word['romaji'],
          'english': word['english'],
          'correct_count': word['session_correct_count'],
          'wrong_count': word['session_wrong_count']
        } for word in words],
        'total': total_count,
        'page': page,
        'per_page': per_page,
        'total_pages': math.ceil(total_count / per_page)
      })
    except Exception as e:
      return jsonify({"error": str(e)}), 500

  @app.route('/api/study_sessions', methods=['POST'])
  @cross_origin()
  def create_study_session():
    """Create a new study session.
    
    Required JSON payload:
    {
        "group_id": integer,
        "study_activity_id": integer
    }
    
    Returns:
        201: Successfully created study session
        400: Invalid request (bad JSON or missing fields)
        404: Group or activity not found
        500: Server error
    """
    cursor = None
    try:
      # Get and validate JSON payload
      data = request.get_json()
      if not data:
        return jsonify({'error': 'Invalid JSON payload'}), 400

      # Extract and validate required fields
      group_id = data.get('group_id')
      study_activity_id = data.get('study_activity_id')
      
      if group_id is None or study_activity_id is None:
        return jsonify({
          'error': 'Missing required fields',
          'required': ['group_id', 'study_activity_id']
        }), 400

      # Validate field types
      if not isinstance(group_id, int) or not isinstance(study_activity_id, int):
        return jsonify({
          'error': 'Invalid field types',
          'required': {
            'group_id': 'integer',
            'study_activity_id': 'integer'
          }
        }), 400

      cursor = app.db.cursor()

      # Validate group_id exists
      cursor.execute('SELECT id FROM groups WHERE id = ?', (group_id,))
      if not cursor.fetchone():
        return jsonify({
          'error': 'Group not found',
          'group_id': group_id
        }), 404

      # Validate study_activity_id exists
      cursor.execute('SELECT id FROM study_activities WHERE id = ?', (study_activity_id,))
      if not cursor.fetchone():
        return jsonify({
          'error': 'Study activity not found',
          'study_activity_id': study_activity_id
        }), 404

      # Insert new study session
      cursor.execute(INSERT_STUDY_SESSION, (group_id, study_activity_id))
      
      # Get the ID of the newly created session
      new_session_id = cursor.lastrowid
      
      # Commit the transaction
      app.db.commit()
      
      # Fetch the complete session data to return
      cursor.execute(GET_NEW_SESSION, (new_session_id,))
      
      session = cursor.fetchone()
      
      # Return the created session data
      app.logger.info(f"Created study session {new_session_id} for group {group_id}")
      return jsonify({
          'id': session['id'],
          'group_id': session['group_id'],
          'group_name': session['group_name'],
          'activity_id': session['activity_id'],
          'activity_name': session['activity_name'],
          'created_at': session['created_at']
      }), 201

    except ValueError as e:
      # Handle validation errors
      return jsonify({"error": "Validation error", "message": str(e)}), 400
    except sqlite3.IntegrityError as e:
      # Handle database constraint violations
      return jsonify({"error": "Database integrity error", "message": str(e)}), 409
    except sqlite3.Error as e:
      # Handle other database errors
      app.logger.error(f"Database error in create_study_session: {str(e)}")
      return jsonify({"error": "Database error occurred"}), 500
    except Exception as e:
      # Handle unexpected errors
      app.logger.error(f"Unexpected error in create_study_session: {str(e)}")
      return jsonify({"error": "An unexpected error occurred"}), 500
    finally:
      if cursor:
        cursor.close()
      if 'db' in g:
        g.pop('db', None)

  @app.route('/api/study_sessions/<int:session_id>/words/<int:word_id>/review', methods=['POST'])
  @cross_origin()
  def create_word_review(session_id, word_id):
    """Record a word review result in a study session.
    
    Args:
        session_id (int): ID of the study session
        word_id (int): ID of the word being reviewed
        
    Request Body:
        {
            "correct": boolean  # Whether the word was reviewed correctly
        }
        
    Returns:
        201: {
            "success": true,
            "word_id": int,
            "study_session_id": int,
            "correct": boolean,
            "created_at": string (ISO format)
        }
        400: Invalid request (bad JSON or missing fields)
        404: Session or word not found
        500: Server error
        
    Foreign Key Constraints:
        - session_id must exist in study_sessions table
        - word_id must exist in words table and belong to session's group
    """
    cursor = None
    try:
        # Get and validate JSON payload
        data = request.get_json()
        if not data:
            return jsonify({'error': 'Invalid JSON payload'}), 400

        # Extract and validate correct field
        if 'correct' not in data:
            return jsonify({
                'error': 'Missing required field',
                'required': ['correct']
            }), 400

        # Validate correct is boolean
        correct = data.get('correct')
        if not isinstance(correct, bool):
            return jsonify({
                'error': 'Invalid field type',
                'required': {
                    'correct': 'boolean'
                }
            }), 400

        cursor = app.db.cursor()

        # Validate study session exists
        cursor.execute(VALIDATE_SESSION, (session_id,))
        session = cursor.fetchone()
        if not session:
            return jsonify({
                'error': 'Study session not found',
                'session_id': session_id
            }), 404

        # Validate word exists
        cursor.execute(VALIDATE_WORD, (word_id, session['group_id']))
        word = cursor.fetchone()
        if not word:
            return jsonify({
                'error': 'Word not found or not in session group',
                'word_id': word_id,
                'group_id': session['group_id']
            }), 404

        # Insert the word review record
        cursor.execute(INSERT_WORD_REVIEW, (word_id, session_id, correct))

        # Get the ID of the newly created review
        app.db.commit()

        # Return the created review data
        return jsonify({
            'success': True,
            'word_id': word_id,
            'study_session_id': session_id,
            'correct': correct,
            'created_at': datetime.utcnow().isoformat()
        }), 201

    except ValueError as e:
        return jsonify({"error": "Validation error", "message": str(e)}), 400
    except Exception as e:
        app.logger.error(f"Unexpected error in create_word_review: {str(e)}")
        return jsonify({"error": "An unexpected error occurred"}), 500
    finally:
        if cursor:
            cursor.close()
        if 'db' in g:
            g.pop('db', None)

  @app.route('/api/study_sessions/reset', methods=['POST'])
  @cross_origin()
  def reset_study_sessions():
    try:
      cursor = app.db.cursor()
      
      # First delete all word review items since they have foreign key constraints
      cursor.execute('DELETE FROM word_review_items')
      
      # Then delete all study sessions
      cursor.execute('DELETE FROM study_sessions')
      
      app.db.commit()
      
      return jsonify({"message": "Study history cleared successfully"}), 200
    except Exception as e:
      return jsonify({"error": str(e)}), 500