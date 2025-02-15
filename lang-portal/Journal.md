# Progress Log for lang-portal

## Executive Summary

This document explains how I, with no prior web development experience or Japanese language knowledge, used AI tools—Cursor and Claude Sonnet 3.5—to build the lang-portal backend. Despite my initial unfamiliarity with front-end, back-end, databases, and the target language, I was able to create and refine this backend in a relatively short time. Below is a detailed account of the process, lessons learned, and final reflections.

---

## Initial Situation

- I had zero experience with web technologies (front end, back end, databases).
- The target language for lang-portal is Japanese, with which I am also unfamiliar.
- AI assistance (ChatGPT o3-mini-high and Cursor) played a crucial role in guiding each step, from planning to debugging.

---

## First Step: Completing Missing API Endpoints

I started by finishing the partially built backend:

1. **Gathering Requirements**  
   I took the existing technical specification for lang-portal and copied it into ChatGPT (o3-mini-high), asking for a detailed list of steps to create the missing endpoints.

2. **Following the AI’s Instructions**  
   - I pasted these steps into Cursor in agent mode (Composer).
   - Cursor generated the necessary code for the missing endpoints and also produced test code.
   - The process, from start to tested code, took less than an hour.

3. **Insights**  
   - I avoided using any Cursor rules as recommended.
   - By letting Cursor generate the tests, I felt confident—though later I discovered some limitations in relying entirely on AI-generated tests.

---

## Second Step: Building from Scratch

Encouraged by the quick success with the missing endpoints, I decided to rebuild the backend entirely:

1. **Deciding on the Tech Stack**  
   - I initially wanted to use Rust.
   - When I asked ChatGPT (o3-mini-high) for suggestions, it strongly recommended Express.js, partly discouraging Rust.
   - Following the advice, I opted for Express.js.

2. **Implementation Plan**  
   - I reused the existing technical specification and pasted it into ChatGPT (o3-mini-high) for a step-by-step guide.
   - Once I had the Markdown instructions, I again used Cursor (agent mode) to execute them.

3. **Execution**  
   - Cursor automated everything: setting up the project folder structure, creating the database schema, building the endpoints, generating tests, running those tests, and even providing documentation.
   - It finished in under two hours. Everything passed the AI-generated tests, so I initially assumed it was complete.

---

## Reality Check: AI-Assisted Development

### Testing with the Frontend

When I ran the new backend alongside the existing frontend, I encountered multiple issues:

- **CORS Errors**: They appeared in the browser console. Claude Sonnet 3.5 helped me fix them.
- **Missing or Inaccurate Endpoints**: Many pages didn’t load because some endpoints had been skipped or misread by the AI. Despite the passing tests, it became clear the coverage was incomplete.

I asked the AI to fix those gaps, but errors persisted.

### Blind AI Bug-Fixing

- I let the AI proceed unsupervised, which resulted in arbitrary changes to both frontend, backend, and database schema.
- The code diverged significantly from the original intended design.
- I ran out of Cursor credits during this process, so I upgraded to Cursor Plus to continue.

### Methodical Debugging

Realizing the chaotic state of the code, I reverted to a previous commit:

1. **Validating the Database**  
   - I asked the AI to generate database schemas, migration scripts, and seed data, then confirmed they aligned with the original specification.
   - Ensuring the database was correct prevented confusion in subsequent debugging.

2. **Systematic Fixes**  
   - Initially, I used “traditional” Google searches to troubleshoot front-end errors because of my unfamiliarity with web development.
   - Later, I switched back to targeted AI queries in Cursor, which gave more direct and accurate help.

3. **Iterative Refinement**  
   - Each time I encountered a new error message or mismatch between the backend and frontend, I explained the situation to Cursor in Composer mode.
   - By specifying the exact files (backend code, the front-end method calling it, and the error message), the AI was able to offer precise fixes.
   - Over a few hours, I resolved all remaining issues.

---

## Conclusions and Takeaways

1. **AI Tools Are Powerful but Imperfect**  
   - The AI sometimes skipped certain features or misread parts of the specification.
   - It wrote tests aligned with its own incorrect assumptions, creating a false sense of completeness.

2. **Specifications Can Contain Errors**  
   - Minor discrepancies, like `study_sessions` vs. `study-sessions`, caused parts of the frontend to fail.
   - It’s crucial to keep specs and code consistently aligned.

3. **Human Oversight Remains Essential**  
   - Giving the AI full autonomy can lead to unexpected or undesired results.
   - A combination of manual checks, careful debugging, and AI-driven hints is most effective.

4. **Impact on a Novice Developer**  
   - Despite lacking prior experience, I was able to build and refine a functioning backend fairly quickly.
   - The AI greatly accelerated learning and coding, though it did require active guidance and validation.

In the end, I remain impressed by how much AI shortened my learning curve for a web development project of this scope. With careful supervision and iterative testing, AI-assisted coding was a valuable, time-saving experience.