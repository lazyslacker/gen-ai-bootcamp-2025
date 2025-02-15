# Progress log for lang-portal

## Executive summary

In this document I describe how I used Cursor + Claude Sonnet 3.5 to implement the backend for lang-portal. Key considerations:

- I have no experience with web development or any of the technologies used (front end, backend, databases, etc.)
- I am also unfamilar with Japanese language, which is the target language selected for the lang-portal implemntation

Despite my lack of technical skill and domain knowledge of the foreign language, I was successfully able to implement the backend for the lang-portal completely from scratch with AI assistance.

## First step: implementation of missing API endpoints

I started off attempting to complete the existing backend implementation with the missing API endpoints. I followed Andrew's suggestions closely and did the following:

- I did not use Cursor rules
- I copy-pasted the technical spec for the language portal into ChatGPT o3-mini high, and asked it to provide me a step-by-step guide to implement the missing API endpoints in markdown format
- I then copy-pasted the instructions into Cursor in agent mode (Composer) and let it walk through the instructions step by step
- Cursor generated the code for the missing API endpoints, generated test code and tested the API implementation. It took less than an hour to complete the implementation

## Second step: implementing the backend completely from scratch

I decided to attempt implementing the backend completely from scratch, even with my lack of knowledge of web development. Below is a step by step account of the process:

- Initially I wanted to select Rust as the technology for the backend implementation.
I asked ChatGPT (o3-mini-high) to provide me a list of suggested technologies for a backend implementation. o3-mini-high provided numerous suggestions, but seemed to recommend express.js quite strongly. I specifically enquired about using Rust, and o3-mini-high seemed to discourage the use of Rust. Therefore I decided to use express.js.
- I followed Andrew's process again, and re-used the backend technical specification that already existed for lang-portal. This time I copy-pasted the backend technical specification into ChatGPT o3-mini high, and asked it to provide me a step-by-step guide to implement the backend in markdown format.
- I then copy-pasted the instructions into Cursor in agent mode (Composer) and let it walk through the instructions step by step.
- On the first pass, Cursor did everything:

1. setup the project folder structure
2. set up the databse with the correct schema
3. implemented the API endpoints
4. generated the test code
5. tested the API implementation
6. reviewed the code and generated API documentation

The entire process took less than 2 hours. Towards the end I simply clicked and accepted everything that Cursor suggested.

After the tests passed I was confident that the implementation was correct. I was surprised at how easy it seemed.

## Learning the reality of AI-assisted development

I attended office hours and realized I needed to test the backend implementation against the existing frontend implementation. It was not sufficient to just test the API endpoints.

### Initial steps

I launched the backend and the front end, and opened lang-portal in the browser.

- It was immediately apparent that the backend implementation was not complete.
- First, I saw CORS errors in the browser console. With the help of Claude Sonnet 3.5, I was able to identify and fix the issues.
- Many pages weren't loading at all. I realized that the backend implementation was both inaccurate not complete. The AI appeared to have simply skipped implmenting some of the API endpoints.
- I prompted the AI to complete the implementation. Step by step, the AI implemented the remaining missing API endpoints.

However, many pages still wouldn't load properly. The console showed many errors.

### Blindly allowing the AI to fix the bugs without supervision

- I allowed the AI to fix the bugs as it pleased, giving it full control over the implementation.
- Unfortuntately, this resulted the AI in changing the front end, back end and the database schema to whatever it pleased, and the resulting "fixed" implementation was completely different from the desired implementation.

This is also where I ran out of Cursor credits, and I decided to upgrade to Cursor Plus to continue working.

### Fixing the bugs in a more sane way

- I threw away the existing implementation and re-started from a previous commit which seemed more closely aligned with the desired implementation.
- I began manually debugging the issues showed by the front-end, reasoning through the issues one by one. I did not know any of the technologies used, so I learned and guessed as I went along.
- I slowly fixed the issues one by one, initially using the "traditional" way, using Google to search for related fixes.
- Then I realized I could try Cursor for very specific guidance, which was much faster than Google searches--the suggestions I received were much more relevant and accurate.
- Towards the end I became familiar with the frontend and the backend. At that point I could simply tell Cursor in Composer mode "this file is the backend implementation for the API endpoint, this file is the front end implementation that invokes the API endpoint, this is the error message I'm seeing, can you help me fix it?" and the AI would fix the issue immediately.

Through a few more hours of iterative debugging with the AI assistant, I was able to fix the remaining issues.

## Looking back, conclusions and key takeaways

There were numerous reasons why the AI-assisted implementation was not initially successful :

- The AI simply forgot to implement some of the API endpoints and mis-understood the implementation specification for some of the API endpoints. 
- Since the AI generated the test code and successfully 'tested' the implementation based on it's own mis-interpretations, I had a false sense of confidence that the task was complete. 
- There were also minor errors in the backend technical specification which resulted in some of the API endpoints not working as expected. e.g. the API path specified in the technical specification was 'study_sessions', but the front end was expecting 'study-sessions'. 

Overall, I'm still very impressed with the capabilities of the AI.

This is the first time I've worked on any web development project and I'm surprised at how easy the AI made it seem. 