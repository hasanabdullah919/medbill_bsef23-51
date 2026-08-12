# MedBill

Web-based Medical Billing & Revenue Cycle Management System with AI-based claim verification & validation.

**Group ID:** BSEF23-51 · Hasan Abdullah (bsef23m552) · Irfan Saleem (bsef23m553) · Supervisor: Mr. Umair Babar

## Overview
MedBill keeps the medical billing cycle — patients, insurance, charges (ICD-10/CPT), CMS-1500 claims, payments, and reports — in one system. An AI layer checks each claim for missing codes, wrong amounts, and invalid insurance details before submission, and reviews payments/denials afterward.

## Tech Stack
- **Frontend:** React, Bootstrap
- **Backend:** PHP (Laravel) or Python (Django)
- **Database:** MySQL
- **AI Service:** Python, scikit-learn, Pandas, FastAPI
- **Reporting:** DomPDF/jsPDF (CMS-1500 PDF), Chart.js

## Project Structure
```
medbill/
├── frontend/        # React app
├── backend/         # Laravel/Django API
├── ai-service/      # FastAPI claim verification service
├── database/        # Schema & migrations
└── docs/            # SRS, mockups, proposal
```

## Setup
```bash
git clone <repo-url>
cd medbill

# Frontend
cd frontend && npm install && npm start

# Backend (example: Laravel)
cd backend && composer install && php artisan serve

# AI service
cd ai-service && pip install -r requirements.txt && uvicorn main:app --reload
```

## Development
- **Methodology:** Agile (Scrum), 2-week sprints
- **Branches:** `main` (stable) · `develop` (integration) · `feature/<name>`
- **Workflow:** feature branch → commit → PR → merge to `develop`

## Roadmap
See project board on Jira for the current sprint backlog.
