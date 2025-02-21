# Objective

To create a text collection of listening practice questions for the Japanese JLPTN5 listening test.

## Core functionalities

First, the program will download the transcript of a youtube video.

The youtube video will be a practice video for the Japanese JLPTN5 listening test.

After downloading the transcript, the program will use an LLM to parse the transcript, and store the parsed contents into a text file.

The parsed contents will be a list of questions and answers.

Each question will have 4 options for answers, with only one of the options being the correct answer.

The program will then store the list of questions and answers into a text file.

## Technical details

Use python to write the program.

Use the youtube api to download the transcript of a youtube video.

Use the nano model from amazon bedrock to parse the transcript, and store the parsed contents into a text file.

