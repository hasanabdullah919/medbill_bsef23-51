# MedBill D1 Rebuild

MedBill is a proposal-aligned Agile D1 prototype for small clinics and medical billing teams. This clean rebuild demonstrates one complete learning-friendly slice: role-based access, patient and insurance capture, claim drafting, explainable pre-submission validation, and a dashboard backed by a Django API.

## D1 boundary

Implemented now:

- Admin and Biller authentication
- Patient and insurance records
- Claim drafts with ICD-10/CPT-style code fields
- Deterministic checks for missing insurance, invalid code shape, and non-positive amounts
- Dashboard totals and validation status
- Automated backend tests and frontend production build

Planned for Semester 8:

- CMS-1500 pixel-accurate PDF export
- Payment posting, denials, A/R aging, and revenue reports
- Evaluated ML risk model with rules-only fallback
- Production MySQL deployment, audit expansion, and CI/CD deployment

## Architecture

```text
React browser UI
       |
       | JSON over HTTP
       v
Django REST API ----> SQLite for local demo
       |
       +-----------> MySQL target through environment settings
```

The frontend never connects to the database directly. Django owns validation and authorization so the rules cannot be bypassed by hiding or changing browser controls.

## Run the demo

Backend:

```bash
cd backend
python3 -m venv .venv
.venv/bin/pip install -r requirements.txt
.venv/bin/python manage.py migrate
.venv/bin/python manage.py seed_demo
.venv/bin/python manage.py runserver
```

Frontend, in a second terminal:

```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:5173`.

Demo accounts:

- Admin: `admin` / `MedBillD1!`
- Biller: `biller` / `MedBillD1!`

All included records are synthetic.

## Verification

```bash
cd backend && .venv/bin/python manage.py test
cd frontend && npm run build
```

## Database selection

SQLite is the default only to make tomorrow's demonstration reliable. To use the proposal's MySQL target, set `DB_ENGINE=mysql` together with `DB_NAME`, `DB_USER`, `DB_PASSWORD`, `DB_HOST`, and `DB_PORT` before running migrations.
