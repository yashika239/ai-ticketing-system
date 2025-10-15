# 🤖 AI Prompts and Cline Instructions

This document captures all the AI-driven steps used to build the **AI-Powered Ticketing System** using **Cline** and **ChatGPT**.

---

## 🧠 1. Initial System Design Prompt (Cline)

**Prompt:**
You are designing an issue ticketing system.
Stack: Node.js + Express + React + SQLite (or PostgreSQL).
The app should allow users to create, track, assign, and resolve support tickets.
You should summarize issue descriptions and auto-classify them into categories (e.g., bug, feature request, query).


**Cline Actions:**
- Created a `server/` folder with Express backend setup
- Created a `client/` folder with React setup
- Initialized `package.json` with required dependencies
- Generated boilerplate routes for ticket CRUD operations
- Added `AI summarization` and `classification` placeholder logic

---

## ✉️ 2. Gmail Notification Feature

**Prompt:**
Implement a Gmail notification feature where it can send an email to the assignee once a ticket is assigned to them.


**Cline Actions:**
- Added Nodemailer integration in backend
- Created `.env` variables for Gmail credentials
- Added utility for sending notifications upon ticket assignment

**Manual Edits:**
- Updated `assignTicket` controller to trigger email function
- Added `GMAIL_NOTIFICATIONS_SETUP.md` for environment setup

---

## 🧩 3. AI Enhancement Prompt

**Prompt:**
Implement automatic summarization and classification logic for tickets.
Use lightweight NLP libraries to analyze ticket descriptions and generate a short summary and category.
Add endpoints for summarization and classification.


**Cline Actions:**
- Integrated `natural` and `compromise` libraries
- Created `aiRoutes.js` for summarization/classification APIs
- Added confidence scoring logic
- Connected AI analysis to ticket creation UI

**Manual Refinements:**
- Improved keyword classification for “bug”, “feature”, “query”
- Tuned confidence scoring thresholds

---


## 🧩 4. ChatGPT Guidance Prompts

In addition to Cline, I used ChatGPT (GPT-5) to:
- Design the overall project architecture
- Refine the AI classification logic
- Write detailed documentation and README
- Suggest improvements like duplicate detection and insights dashboard

**Sample ChatGPT Prompts:**
Help me design a scalable AI-powered issue ticketing system architecture.
Explain how to integrate simple AI summarization in Node.js.
Write a clean README for my project highlighting AI usage.
Suggest future AI improvements to make this project stand out.
