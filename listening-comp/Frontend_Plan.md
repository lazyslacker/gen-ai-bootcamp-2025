# Implementation Plan for Listening Comprehension App

This plan outlines the steps to build the listening comprehension app for JLPT N5. Each step is atomic with checkboxes so you can track your progress. Sample testing code is provided where applicable.

---

## 1. Environment Setup

- [ ] **Project Structure Setup**
  - Create a project folder with the following structure:

    ```
    your-project/
    ├── backend/
    │   └── vectordb/         # For the chromadb vector database files
    ├── frontend/
    │   └── questions.json     # JSON file to store questions and answer choices
    ├── app.py                 # Main Streamlit application file
    └── tests.py               # Test file for unit tests
    ```

- [ ] **Dependencies**

  - Install required packages:

    ```bash
    pip install streamlit chromadb requests  # plus any package needed for amazon.nova-lite-v1
    ```

---

## 2. Connect to the Vector Database

- [ ] **Setup Connection**
  - In `app.py`, write a function to connect to the chromadb vector database located in `backend/vectordb`.
  - Handle errors (e.g., folder not found, connection issues).

  _Example snippet:_

  ```python
  import streamlit as st
  import chromadb

  def connect_vectordb():
      try:
          client = chromadb.Client(path="backend/vectordb")
          return client
      except Exception as e:
          st.error("Failed to connect to the vector database: " + str(e))
          return None

  # Test the connection on startup
  client = connect_vectordb()
  if client:
      st.write("Connected to vector database!")

   - Test Connection
   -  Write a simple query function (even a dummy query) to verify the connection.

## 3. Create the User Interface

- [ ] **Input Components**
  - Add a text input box for a one-word topic.
  - Add a “Random topic” button.

Example snippet:

```python
import streamlit as st
import random

topic = st.text_input("Enter a one-word topic:")
if st.button("Random topic"):
    topics = ["food", "travel", "music", "sports"]
    topic = random.choice(topics)
    st.write("Selected topic: ", topic)
```

- [ ] **Question Generation**
  - Add a button to generate questions.
  - Use the `generate_questions` function to generate questions based on the selected topic.
  - Display the generated questions in a text area.

  - Trigger Query on Input
  - On user input or button click, trigger a function that queries the vector database using the topic.

## 4. Querying the Vector Database

- [ ] **Implement Query Function**
  - Write a function that takes the topic and queries the vector database for the closest matching entry.
  - Return the retrieved entry for use as a prompt.

Example snippet:

```python
def query_vector_db(client, topic):
    # Dummy implementation: replace with actual vector search logic
    # For example: results = client.query(topic=topic)
    return f"Entry related to {topic}"

if client and topic:
    vector_entry = query_vector_db(client, topic)
    st.write("Vector DB returned:", vector_entry)
```

- [ ] **Test Query Function**
  - Use dummy topics to test that the query function returns expected results.

## 5. LLM Integration

- [ ] **Prompt Construction**

  - Create a function that takes the vector database entry and constructs a prompt.
  - The prompt should instruct the LLM to generate text with an introduction, conversation, question, and 4 answer choices.

Example snippet:

```python
def build_prompt(vector_entry):
    return f"Generate an introduction, conversation, a question, and 4 answer choices (in Japanese) based on: {vector_entry}"

prompt = build_prompt(vector_entry)
st.write("Prompt:", prompt)
```

- [ ] **Call the LLM**
  - Integrate with the amazon.nova-lite-v1:0 LLM API to generate the text.
  - Parse the response into its sections (introduction, conversation, question, answers).

Example snippet (pseudo-code):

```python
def call_llm(prompt):
    # Replace with actual API call code
    response = {
        "introduction": "こんにちは、以下の会話を聞いてください。",
        "conversation": "A: おはようございます。 B: おはよう！",
        "question": "この会話でAは何と言いましたか？",
        "answers": ["おはようございます", "こんにちは", "さようなら", "ありがとう"],
        "correct_answer": "おはようございます"
    }
    return response

llm_response = call_llm(prompt)
st.write("Generated Content:", llm_response)
```

## 6. Displaying the Generated Content & Answer Selection

- [ ] **Display Text & Options**
  - Show the introduction, conversation, question, and answer choices using Streamlit.
  - Present the answer choices as clickable buttons or radio buttons.

Example snippet:

```python
st.markdown("### Introduction")
st.write(llm_response["introduction"])

st.markdown("### Conversation")
st.write(llm_response["conversation"])

st.markdown("### Question")
st.write(llm_response["question"])

answer = st.radio("Choose your answer:", llm_response["answers"])
```

- [ ] **Test Answer Selection**
  - Verify that the user can select an answer and that the selection is captured.

## 7. Providing Feedback

- [ ] Implement Feedback Logic
  - Compare the user’s selection with the correct answer.
  - Highlight the correct answer in green and incorrect ones in red.
  - Add a blue border around the user’s selected answer.

Example snippet:

```python
def show_feedback(selected, correct, answers):
    for ans in answers:
        if ans == correct:
            st.markdown(f"<div style='background-color: lightgreen; border: 2px solid {'blue' if ans == selected else 'black'}; padding: 5px'>{ans}</div>", unsafe_allow_html=True)
        elif ans == selected:
            st.markdown(f"<div style='background-color: lightcoral; border: 2px solid blue; padding: 5px'>{ans}</div>", unsafe_allow_html=True)
        else:
            st.markdown(f"<div style='padding: 5px'>{ans}</div>", unsafe_allow_html=True)

if answer:
    show_feedback(answer, llm_response["correct_answer"], llm_response["answers"])
```

- [ ] Test Feedback Mechanism
  - Manually test by selecting both correct and incorrect options.

## 8. Storing and Displaying Past Questions

- [ ] **Save Q&A to JSON**
  - After feedback is shown, append the current question and answer choices to frontend/questions.json.

Example snippet:

```python
import json
import os

def save_question(data, filepath="frontend/questions.json"):
    if os.path.exists(filepath):
        with open(filepath, "r", encoding="utf-8") as f:
            questions = json.load(f)
    else:
        questions = []
    questions.append(data)
    with open(filepath, "w", encoding="utf-8") as f:
        json.dump(questions, f, ensure_ascii=False, indent=2)

question_data = {
    "prompt": prompt,
    "question": llm_response["question"],
    "answers": llm_response["answers"],
    "correct_answer": llm_response["correct_answer"]
}
save_question(question_data)
```

- [ ] **Display Sidebar**
  - Read from the JSON file and display the list of previous questions in a Streamlit sidebar.

Example snippet:

```python
def load_questions(filepath="frontend/questions.json"):
    if os.path.exists(filepath):
        with open(filepath, "r", encoding="utf-8") as f:
            return json.load(f)
    return []

with st.sidebar:
    st.markdown("## Past Questions")
    past_questions = load_questions()
    for q in past_questions:
        st.write(q["question"])
```

## 9. Navigation Between Questions

- [ ] **Implement Navigation**
  - Allow the user to click anywhere on the screen (or add a “Next Question” button) to load the next question.

Example snippet (using a button):

```python
if st.button("Next Question"):
    st.experimental_rerun()
```

- [ ] **Test Navigation**
  - Ensure that clicking the button reloads the app and triggers a new question cycle.

## 10. Testing Code (tests.py)

- [ ] **Write Unit Tests**

- Create tests for key functions such as vector DB query, prompt building, LLM integration, and JSON read/write.

Example testing code (using pytest):

```python
import json
import os
from app import build_prompt, save_question, load_questions, query_vector_db

def test_build_prompt():
    entry = "test entry"
    prompt = build_prompt(entry)
    assert "test entry" in prompt

def test_save_and_load_question(tmp_path):
    test_file = tmp_path / "questions.json"
    data = {
        "question": "Test question?",
        "answers": ["a", "b", "c", "d"],
        "correct_answer": "a"
    }
    # Save question
    save_question(data, filepath=str(test_file))
    # Load and verify
    questions = load_questions(filepath=str(test_file))
    assert questions[-1]["question"] == "Test question?"

def test_query_vector_db():
    # Dummy client object, replace with a mock if needed
    class DummyClient:
        pass
    client = DummyClient()
    topic = "sample"
    result = query_vector_db(client, topic)
    assert "sample" in result

if __name__ == "__main__":
    import pytest
    pytest.main()
```

- [ ] Run Tests
  - Execute tests with:

```bash
pytest tests.py
```

## 11. Final Checks and Documentation

- [ ] **Manual End-to-End Testing**
  - Run the app using streamlit run app.py and walk through the full flow.
  - Ensure proper error handling, feedback, and JSON updates.
- [ ] **Code Documentation**
  - Add comments and documentation in code for maintainability.
- [ ] Cleanup & Refactoring
  - Refactor any duplicate code and ensure consistency.
