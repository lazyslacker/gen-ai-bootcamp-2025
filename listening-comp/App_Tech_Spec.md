# Technical spec for listening comprehension app

## Objective

The listening comprehension app is a tool that helps users improve their listening skills by providing a platform to practice listening comprehension.

This app is aimed at building listening comprehension skilsl for spoken Japanese, at the JLPT N5 level.

## Core functionalities

The app will present an audio clip in Japanese to the user.

The app will present a question to the user in Japanese language based on the contents of the audio clip.

The user shall select the correct answer from a list of 4 options which will  be in Japanese language.

The app will provide feedback to the user on whether the answer is correct or not.
This feedback shall be provided in the form of highlighting the correct answer in green and the incorrect answer in red. The user's selection shall be highlighted with a blue border.

After the app has presented feedback to the user, the app shall store the question and the answer choices into a json file.  The app shall also allow display a sidebar with a list of previous questions asked to the user, so the user can review the questions they have answered.

After the app has presented feedback to the user, the user can click anywhere on the screen to go to the next question.

## Technical details

The app will use Streamlit for the frontend.
