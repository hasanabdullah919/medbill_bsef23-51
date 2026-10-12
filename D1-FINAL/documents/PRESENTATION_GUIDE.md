# MedBill D1 Presentation Guide

## One minute project explanation

MedBill is a web-based medical billing and revenue-cycle system for small clinics and billing teams. The approved proposal covers patient and insurance records, charge entry, claim validation, CMS-1500 output, claim status, payments, denials, reports, and an AI verification layer. For D1, we built and tested the first vertical slice: a Biller signs in, registers patient coverage, creates a claim draft, and receives an explainable validation result from the backend.

The important point is that this is a real full-stack prototype. React is not displaying hard-coded success messages. It sends data to Django, Django validates and stores the record, and the interface shows the returned status.

## Why this technology stack

### React and Bootstrap

React builds the browser interface from reusable components. State holds the current user, patient list, claim list, forms, and dashboard values. Bootstrap supplies reliable form and layout foundations, while the custom CSS gives MedBill its visual identity.

Use this sentence in the presentation: “React controls what the user sees and does, but it does not decide whether a claim is valid.”

### Django and Django REST Framework

Django is the backend application. It handles authentication, database models, and server-side business rules. Django REST Framework turns those capabilities into JSON endpoints the React application can call.

Use this sentence: “Validation runs on the server so a user cannot bypass it by changing the browser.”

### Relational database

Patients and claims have clear relationships: one patient can have many claims, while every claim belongs to one patient. A relational database fits that structure and supports constraints and accurate financial calculations.

SQLite is used only for the current local demonstration because it requires no separate database server. The settings already support MySQL, which remains the proposal-aligned target.

### Playwright

Playwright controls a real Chromium browser. The first test signs in, creates a valid claim, and confirms the Ready status. The second submits invalid codes and a zero amount, then confirms that all correction messages appear.

## How one request moves through the system

1. The Biller completes the Create claim form in React.
2. React sends JSON to `POST /api/claims/` with the authentication token.
3. Django REST Framework checks the token and parses the request.
4. `ClaimSerializer` calls `validate_claim` before saving.
5. The validation service checks coverage, ICD-10 shape, procedure-code length, and amount.
6. Django stores the draft as `ready` or `validation_failed` with its messages.
7. The API returns the stored claim as JSON.
8. React updates the claim worklist and dashboard.

## Code map

- `backend/billing/models.py`: database structure for patients and claims.
- `backend/billing/services.py`: deterministic claim validation rules.
- `backend/billing/serializers.py`: conversion between JSON and database models.
- `backend/billing/views.py`: authentication, dashboard, patient, and claim endpoints.
- `backend/billing/tests.py`: backend API and rule tests.
- `frontend/src/App.jsx`: login, navigation, forms, tables, and dashboard.
- `frontend/src/api.js`: authenticated HTTP request helper.
- `frontend/tests/d1-flow.spec.js`: real-browser D1 tests and screenshots.

## Seven minute demonstration order

### 1. State the scope

Say: “This is the D1 vertical slice, not the final FYDP. It proves our architecture and the patient-to-validation flow. Payment posting, reporting, PDF export, and the evaluated ML model remain Semester 8 work.”

### 2. Show login

Sign in as `biller` with `MedBillD1!`. Explain that the server returns a token and each protected API request sends it back.

### 3. Show the dashboard

Point to patient count, claim count, Ready count, Needs attention, and draft billed value. Explain that these numbers come from the database through the dashboard API.

### 4. Show the patient registry

Open Patients and show the synthetic patient and insurance details. Stress that real patient information must not be used in development or presentation.

### 5. Create a valid claim

Open Create claim, select the patient, enter `J06.9`, `99213`, and a positive amount, then submit. Show the Ready result.

### 6. Explain the failure path

Explain that the automated browser test also submits `bad`, `12`, and `0`. The backend keeps the draft in Validation failed and returns three specific correction messages.

### 7. Close with next steps

State the next implementation order: user and master data, full claim state machine, CMS-1500 PDF, payments and denials, reports, then the measured ML experiment.

## Likely viva questions

### Why not put validation only in React

Browser code can be changed or bypassed. Backend validation protects every client and keeps one authoritative rule set.

### Is the current rule engine the AI feature

No. The rules are deterministic controls. The proposal’s AI commitment requires an approved dataset, a prediction target, leakage prevention, a rules-only baseline, precision and recall metrics, a threshold, and explainable output. We will integrate a model only if the experiment meets the agreed baseline.

### Why SQLite now if the proposal says MySQL

SQLite makes the D1 demonstration reproducible without a database service. The Django settings contain a MySQL path for the target deployment. Before claiming MySQL completion, we will run the migrations and full test suite against MySQL.

### What is a vertical slice

A vertical slice completes one user outcome across the UI, API, business rules, database, and tests. It is more useful for D1 than building many disconnected screens.

### How do you know the prototype works

The evidence is four passing backend tests, two passing Playwright browser tests, a successful production frontend build, a clean Django system check, no migration drift, and zero known npm dependency vulnerabilities at the time of verification.

### What happens if the ML model is weak

The deterministic rules remain the safe production fallback. The team will present the model as an experiment rather than making an unsupported AI claim.

## Commands to remember

Backend:

```bash
cd backend
.venv/bin/python manage.py migrate
.venv/bin/python manage.py seed_demo
.venv/bin/python manage.py runserver
```

Frontend:

```bash
cd frontend
npm run dev -- --host 127.0.0.1
```

Verification:

```bash
cd backend && .venv/bin/python manage.py test
cd frontend && npm run build && npm run test:e2e
```
