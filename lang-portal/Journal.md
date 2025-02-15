# Progress Log for lang-portal

## Executive Summary

This document explains how I used Cursor and Claude Sonnet 3.5 to build the lang-portal backend, despite having no web development or Japanese language experience. With AI assistance, I managed to set everything up from scratch in a surprisingly short time.

---

## First Step: Adding Missing API Endpoints

I began by completing the existing backend with missing API endpoints, closely following Andrew’s suggestions:

- I avoided Cursor rules.
- I copied the technical spec into ChatGPT (o3-mini-high) and requested step-by-step instructions in Markdown.
- I pasted these instructions into Cursor (agent mode), letting it generate and test the new code.
- The endpoints and tests were created in under an hour.

---

## Second Step: Building the Backend from Scratch

I decided to rebuild the entire backend from scratch:

1. Initially, I considered Rust, but ChatGPT strongly recommended Express.js.
2. I copied the backend technical spec into ChatGPT (o3-mini-high) and asked for a detailed plan.
3. I pasted these steps into Cursor (agent mode), and it:
   - Set up the project folder structure.
   - Established the database schema.
   - Created API endpoints.
   - Generated and ran tests.
   - Reviewed the code and provided documentation.

This first pass took less than two hours. Once tests passed, I believed everything was finished.

---

## Learning the Reality of AI-Assisted Development

### Initial Testing

When I ran the backend alongside the existing frontend:

- CORS errors immediately appeared. Claude Sonnet 3.5 helped me fix them.
- Many pages failed to load. Some endpoints were missing or incorrect.
- I prompted the AI to fill in the gaps, but the frontend still had errors.

### Unsupervised Bug Fixes

- I let the AI fix bugs on its own, altering the frontend, backend, and database schema arbitrarily.
- This veered far from the original design.
- I ran out of Cursor credits and upgraded to Cursor Plus.

### More Systematic Debugging

- I reverted to a previous commit.
- I methodically debugged issues by examining the frontend errors and verifying the database setup.
- I used AI for specific guidance instead of letting it automatically rewrite everything.
- Through iterative debugging, I fixed remaining issues, gradually learning enough to provide precise instructions to Cursor.

---

## Conclusions and Key Takeaways

- The AI sometimes skipped certain endpoints or misunderstood parts of the spec.
- Because the AI generated its own tests, I was misled into thinking everything was correct.
- Some errors were due to inconsistencies between the spec and the frontend (e.g., `study_sessions` vs. `study-sessions`).
- Despite initial setbacks, AI made the overall process much faster and easier, especially given my lack of experience.

I'm still impressed by how much AI accelerated my first web development project. 