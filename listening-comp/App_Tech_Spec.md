# Technical spec for listening comprehension app

## Objective

The listening comprehension app is a tool that helps users improve their listening skills by providing a platform to practice listening comprehension.

This app is aimed at building listening comprehension skills for spoken Japanese, at the JLPT N5 level.

## Core functionalities

The app shall have a single column layout with a sidebar on the left:

- The sidebar on the left shall display the following components:
  - a clickable historical list of questions previously asked to the user

- The right column shall display the following components:
  - a text field where the user may input a topic of their choice
  - a button that selects a random topic for the user
  - a text field which consists of an introduction, conversation, and question
  - a text field that consists of 4 answer choices, each of which can be clicked on by the user

Using the selected topic as a search query, the app shall connect to the backend API at http://0.0.0.0:8000 using the endpoint /api/search to retrieve a question and answer choices.

The app shall use the vector database query response as an input prompt to amazon.nova-lite-v1:0 LLM to generate a new text consisting of an introduction, conversation, question, and 4 answer choices.

Below is an example of the expected format of the response from the backend API:

```
curl -X POST "http://localhost:8000/api/search" \
-H "Content-Type: application/json" \
-d '{"query": "日本の伝統文化について", "n_results": 3}'
{
  "status":"success",
  "query":"日本の伝統文化について",
  "count":3,
  "results":[
    {
      "question":"男の学生は日本語の本をどこに置きますか？",
      "correct_answer":"机の上",
      "introduction":"男の学生が先生に返却する本について話しています。",
      "conversation":"男の学生は本をどこに置きますか\n先生日本語の本を返しますどうも\nありがとうございました\nいいえじゃあ棚の中に戻してくださいはい\n時計の下の棚でいいですかあすみません次\nの授業でりさんに貸しますから私の机の上\nに置いて くださいわかりました",
      "answers":{
        "A":"棚の中",
        "B":"机の上",
        "C":"デスク",
        "D":"床"
      }
    },
    {
      "question":"山田さんは昨日何をしていましたか？",
      "correct_answer":"B",
      "introduction":"男の人が昨日の行動について話しています。",
      "conversation":"山田さん、昨日は何をしましたか？図書館に行きました。公園のそばの図書館ですね。面白い本を読みましたか？いいえ、図書館は涼しくて静かですから、寝ていました。",
      "answers":{
        "A":"読書",
        "B":"寝る",
        "C":"散歩",
        "D":"買い物"
      }
    },
    {
      "question":"女の人は映画を見るためにどこへ行きますか？",
      "correct_answer":"電車の駅",
      "introduction":"女の人が明日の昼食について話しています。",
      "conversation":"女の人は明日まずどこへ行きますか\n明日映画を見に行きませんか\nすみません明日はアメリカから友達が来ますから\nちょっとそうですか空港まで行きますか\nいいえ電車の駅で会いますそれからから\n一緒に動物園へ行き ます女の人は明日まずどこへ行きますか\n1番いいものは4番です",
      "answers":{
        "A":"空港",
        "B":"電車の駅",
        "C":"動物園",
        "D":"家"
      }
    }
  ]
}
```
The user shall select the correct answer from a list of 4 options which will be in Japanese language.

The app will provide feedback to the user on whether the answer is correct or not.
The app shall provide feedback to the usser in the form of highlighting the correct answer in green and the incorrect answer in red. The user's selection shall be highlighted with a blue border.

After the app has presented feedback to the user, the app shall store the question and the answer choices into a json file.  

On the sidebar, the app shall display a clickable list of previous questions asked to the user, so the user can review the questions they have answered.

## Technical details

The app will use Streamlit for the frontend.

The app will use the amazon.nova-lite-v1:0 LLM to generate the text.