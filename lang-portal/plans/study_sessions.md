# Implementation Plan for POST /study_sessions Endpoint

This plan outlines the steps to implement the endpoint that creates a new study session. The endpoint should accept a JSON payload containing `group_id` and `study_activity_id`, validate these inputs, insert a new record into the `study_sessions` table, and then return the created session data.

---

## Steps

- [ ] **Step 1: Understand the Requirements**
  - [ ] Read the business and technical specifications for creating a study session.
  - [ ] Confirm that the endpoint should:
    - Accept a JSON payload with `group_id` and `study_activity_id`.
    - Validate that both IDs exist in their respective tables.
    - Insert a new record into the `study_sessions` table.
    - Return the created study session data with HTTP status `201 Created`.

- [ ] **Step 2: Set Up the Route in Flask**
  - [ ] Open your main Flask file (e.g., `app.py`).
  - [ ] Create a new route for handling POST requests to `/api/study_sessions`.
    - Example decorator: `@app.route('/api/study_sessions', methods=['POST'])`.

- [ ] **Step 3: Retrieve and Validate the JSON Payload**
  - [ ] Use `request.get_json()` to parse the incoming JSON.
  - [ ] Check if the payload is present. If not, return a `400` error with an appropriate message.
  - [ ] Extract `group_id` and `study_activity_id` from the payload.
  - [ ] If either field is missing, return a `400` error indicating both are required.

- [ ] **Step 4: Validate the Provided IDs in the Database**
  - [ ] Create a database cursor (e.g., using `app.db.cursor()`).
  - [ ] Execute a query to verify that a group with the provided `group_id` exists in the `groups` table.
    - If not found, return a `404` error with a message like "Group not found".
  - [ ] Execute a query to verify that a study activity with the provided `study_activity_id` exists in the `study_activities` table.
    - If not found, return a `404` error with a message like "Study activity not found".

- [ ] **Step 5: Insert the New Study Session**
  - [ ] Insert a new record into the `study_sessions` table with the provided `group_id` and `study_activity_id`.
  - [ ] Commit the transaction to save the record.
  - [ ] Retrieve the ID of the newly inserted session (e.g., using `cursor.lastrowid`).

- [ ] **Step 6: Build and Return the Response**
  - [ ] Optionally, query the database for the complete record of the new study session.
  - [ ] Convert the database row into a JSON-serializable dictionary.
  - [ ] Return the session data with a `201 Created` status code.

- [ ] **Step 7: Implement Error Handling**
  - [ ] Ensure that any exceptions are caught and a relevant error message is returned.
  - [ ] Use appropriate HTTP status codes for different error cases (e.g., `400` for bad requests, `404` for not found).

- [ ] **Step 8: Write Testing Code**
  - [ ] **Using Python's `requests` Library:** Create a test script (e.g., `test_post_study_sessions.py`):

    ```python
    import requests

    url = "http://localhost:5000/api/study_sessions"
    payload = {
        "group_id": 1,
        "study_activity_id": 2
    }
    
    response = requests.post(url, json=payload)
    print("Status Code:", response.status_code)
    print("Response JSON:", response.json())
    ```

  - [ ] **Using `curl`:** Test the endpoint with the following command:

    ```bash
    curl -X POST http://localhost:5000/api/study_sessions \
         -H "Content-Type: application/json" \
         -d '{"group_id": 1, "study_activity_id": 2}'
    ```

- [ ] **Step 9: Manual Testing**
  - [ ] Run your Flask application.
  - [ ] Use Postman or a similar tool to manually test the endpoint.
  - [ ] Verify that:
    - Valid payloads result in a new study session being created.
    - Invalid or missing data returns the proper error messages.

- [ ] **Step 10: Code Review and Cleanup**
  - [ ] Comment your code to explain key steps.
  - [ ] Review your code for clarity and adherence to best practices.
  - [ ] Commit your changes to version control.

---

## Example Code Snippet for the Endpoint

Below is an example of what your endpoint implementation might look like:

```python
from flask import Flask, jsonify, request
from flask_cors import cross_origin

app = Flask(__name__)

@app.route('/api/study_sessions', methods=['POST'])
@cross_origin()
def create_study_session():
    data = request.get_json()
    if not data:
        return jsonify({'error': 'Invalid JSON payload'}), 400

    group_id = data.get('group_id')
    study_activity_id = data.get('study_activity_id')
    
    if group_id is None or study_activity_id is None:
        return jsonify({'error': 'group_id and study_activity_id are required'}), 400

    cursor = app.db.cursor()

    # Validate group_id exists
    cursor.execute('SELECT id FROM groups WHERE id = ?', (group_id,))
    if not cursor.fetchone():
        return jsonify({'error': 'Group not found'}), 404

    # Validate study_activity_id exists
    cursor.execute('SELECT id FROM study_activities WHERE id = ?', (study_activity_id,))
    if not cursor.fetchone():
        return jsonify({'error': 'Study activity not found'}), 404

    # Insert new study session
    cursor.execute(
        'INSERT INTO study_sessions (group_id, study_activity_id) VALUES (?, ?)',
        (group_id, study_activity_id)
    )
    app.db.commit()
    new_session_id = cursor.lastrowid

    # Optionally, fetch the newly created session record
    cursor.execute('SELECT * FROM study_sessions WHERE id = ?', (new_session_id,))
    new_session = cursor.fetchone()
    session_data = dict(new_session)

    return jsonify(session_data), 201

if __name__ == '__main__':
    app.run(debug=True)
