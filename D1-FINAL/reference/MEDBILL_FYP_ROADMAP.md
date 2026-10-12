# MedBill FYDP Roadmap

## 1. Source documents and planning decision

This roadmap is based on:

- `MEDBILL_FYP proposal.docx`
- `FYDP-DSE_007_A_D1_template.docx`
- `FYDP-DSE_007_W_D1_template.docx`

The proposal explicitly selects Agile/Scrum. Therefore, the official D1 document should use the **Agile Product Backlog & Definition of Done template** (`FYDP-DSE_007_A_D1_template.docx`). The Waterfall template is useful as a requirements checklist, but should not be the submitted template unless the supervisor formally changes the methodology.

This plan assumes that implementation starts in October 2026 and that the proposal's final submission target remains May 2027.

## 2. Project outcome

MedBill will be a role-based web application for small clinics and medical billing firms. It will support this end-to-end flow:

`User login -> patient and insurance -> charge entry -> claim validation -> CMS-1500 PDF -> claim status -> payment/denial -> reports and follow-up`

The distinguishing feature is a hybrid verification layer:

1. **Deterministic rules** detect objective errors such as missing fields, invalid formats, inconsistent totals, and absent codes.
2. **An ML risk model** estimates whether a claim is likely to contain an error or be denied, with an explanation or contributing factors.
3. **Post-submission analysis** detects recurring denial patterns by insurer, code, provider, or error category.

The ML component must assist a biller; it must not silently change codes, amounts, or claim data.

## 3. Decisions to freeze in the first week

### Recommended stack

- Frontend: React with Bootstrap
- Backend/API: Django and Django REST Framework
- Database: MySQL
- ML/data work: Python, Pandas, scikit-learn
- Background jobs, only if needed later: Celery with Redis
- PDF generation: server-side HTML-to-PDF solution after a one-week layout spike
- Charts: Chart.js
- Development and deployment: Docker Compose, GitHub, GitHub Actions
- API testing: Postman/Newman or equivalent automated API tests

Use one Django backend initially. Do not create a separate FastAPI ML service during D1 unless measurement shows a real need. A modular monolith is easier for a two-person team to test, deploy, and demonstrate. The model can be moved behind a service boundary later without changing its API contract.

### Scope boundary

#### Must have

- Secure login, logout, and Admin/Biller role authorization
- User management by Admin
- Patient and insurance CRUD with validation
- Insurer, service, diagnosis-code, and procedure-code lookup/master data
- Charge entry
- Claim creation with a documented status lifecycle
- Pre-save rule-based claim validation
- CMS-1500-style preview and PDF export
- Payment posting, including partial payments and adjustments if approved by the supervisor
- Denial recording with reason/category
- A/R aging, revenue summary, denial list, and dashboard metrics
- Audit trail for important create/update/status/payment actions
- ML experiment, evaluation report, and integrated risk flag if the model meets the agreed baseline

#### Should have

- Denial-pattern analysis
- Search, filters, pagination, and CSV export
- Explainable model output or reason codes
- Configurable validation rules
- Automated reminder/follow-up worklist

#### Explicitly out of scope unless added through change control

- Direct insurance clearinghouse submission or EDI 837 integration
- Insurer eligibility verification against a live external payer API
- Electronic remittance advice integration
- Payment gateway functionality
- Mobile applications
- Automatic medical coding or autonomous claim correction
- Use of real patient-identifiable data in development or demonstrations
- Production compliance certification

CMS-1500 PDF generation means form creation/export, not electronic claim submission. Record this distinction in the SRS and D1 scope.

## 4. Issues that must be resolved before implementation expands

1. **Stack ambiguity:** The proposal lists React or plain JavaScript and Laravel or Django. Select one stack and document the justification.
2. **AI data risk:** Identify the dataset source, allowed use, target label, fields available at prediction time, sample size, class balance, and privacy restrictions.
3. **AI success criteria:** Agree on baseline and metrics such as precision, recall, F1, confusion matrix, and false-negative cost. Compare the model against a rules-only baseline.
4. **Code-set legality:** Do not redistribute proprietary code data. Confirm permitted sources and licensing for any CPT data used.
5. **Privacy:** Use synthetic or formally de-identified data. Never place real PHI, secrets, or production credentials in GitHub.
6. **Claim lifecycle:** Define Draft, Validation Failed, Ready, Submitted/Exported, Pending, Partially Paid, Paid, Denied, and Closed, including allowed transitions.
7. **Payment semantics:** Define billed, allowed, paid, adjustment, patient responsibility, and outstanding balance.
8. **Auditability:** The proposal promises accountability, so audit logging must be a requirement rather than an implied feature.
9. **Measurable quality:** Add non-functional requirements for response time, authorization, validation, backup/recovery, browser support, accessibility, and concurrent users.
10. **Acceptance criteria:** Every backlog item needs observable pass/fail criteria before development begins.

## 5. Workflow selection logic

Work is ordered using four rules:

1. **Dependencies first:** Identity and master data precede patients; patients and codes precede charges; charges precede claims; claims precede payments and reports.
2. **Risk early:** Test the dataset/model feasibility and CMS-1500 PDF layout in October, before they can become late project blockers.
3. **Vertical slices:** Each sprint should finish a demonstrable user flow across UI, API, database, validation, and tests, instead of building all screens first and all backend code later.
4. **Evidence continuously:** Tests, screenshots, Git history, decisions, and demo data are produced with each feature rather than reconstructed before evaluation.

### Scrum cadence

- Two-week sprints
- Backlog refinement: once per week
- Sprint planning: first day of each sprint
- Daily stand-up: 10-15 minutes
- Pull-request review: before every merge to `develop`
- Sprint review/demo: final day of each sprint
- Retrospective: immediately after the review
- Supervisor check-in: at least once per sprint
- D1 document update: at the end of every sprint

### Git workflow

- `main`: tagged, demonstrable, stable releases only
- `develop`: integrated work for the current sprint
- `feature/<issue>-<short-name>`: feature work
- `fix/<issue>-<short-name>`: bug fixes
- Short-lived branches, pull requests, one reviewer, and protected `main`
- Commit format: `type(scope): meaningful change`, for example `feat(claims): add pre-save validation summary`
- Never commit `.env`, secrets, private datasets, generated uploads, or patient data

### Backlog item flow

`Proposed -> Refined -> Ready -> In Progress -> Review -> Test -> Done`

A story may enter **Ready** only when it has a user, business value, acceptance criteria, dependencies, UI/API notes, test data, and an owner.

## 6. Delivery phases and dated milestones

### Phase 0: Inception and risk reduction — 5-11 October 2026

Deliverables:

- Confirm Agile template with supervisor
- Freeze the main stack
- Create GitHub repository, issue board, branch protection, README skeleton, `.gitignore`, and environment template
- Write product vision, stakeholders, glossary, assumptions, and explicit out-of-scope list
- Convert proposal modules into epics and prioritized user stories
- Create initial risk register and architecture decision records
- Conduct CMS-1500 rendering spike
- Produce AI dataset feasibility note
- Agree on D1 demo date and minimum prototype scope

Exit gate: stack, scope, backlog, D1 goal, AI data path, and PDF feasibility are documented and supervisor-reviewed.

### Phase 1: Requirements and design — 12-31 October 2026

Deliverables:

- SRS or equivalent requirements baseline
- Role-permission matrix
- Use-case/activity diagrams for the complete billing flow
- Claim and payment state-transition diagrams
- Non-functional requirements with measurable targets
- High-level architecture/component diagram
- ERD and data dictionary
- API contract/open API draft
- Low-fidelity then approved UI wireframes
- Test strategy and requirements traceability matrix
- Synthetic demo-data plan
- AI experiment protocol: dataset, split method, leakage prevention, baseline, metrics, threshold, and fallback

Suggested ownership:

- Hasan: architecture, backend/API, security, AI feasibility
- Irfan: user flows, UI, ERD/data dictionary, database setup
- Both: requirements, acceptance criteria, reviews, testing, and documentation

Exit gate: every D1 story is estimable and the design supports the full patient-to-payment path.

### Phase 2: D1 working prototype — November-December 2026

#### Sprint 1 — 2-15 November

- Project skeleton and Docker/local setup
- Database migrations
- Login/logout and Admin/Biller authorization
- User management
- Insurer/service/code master-data foundation
- CI workflow for build, lint, and unit tests

Demo: Admin logs in, creates a biller, and manages permitted master records; a biller cannot access Admin functions.

#### Sprint 2 — 16-29 November

- Patient and insurance CRUD
- Validation and duplicate handling
- Search/list/detail views
- Audit events for sensitive changes
- Unit and API integration tests

Demo: Biller creates and edits a patient with insurance; invalid data is rejected and important actions are auditable.

#### Sprint 3 — 30 November-13 December

- Charge entry
- ICD/procedure lookup selection
- Claim draft construction
- Claim totals
- First pre-save rule set
- End-to-end happy-path integration test

Demo: Biller selects a patient, records services/codes, builds a claim, and receives actionable validation messages.

#### Sprint 4 — 14-27 December

- CMS-1500-style preview and PDF export
- Claim status transition
- Minimal payment/denial recording or a clearly marked partial implementation
- Basic A/R/revenue dashboard
- Stable demo dataset
- D1 release candidate and screenshots

Demo: One continuous patient-to-claim workflow, plus visible status/report impact.

#### D1 freeze and evaluation preparation — 28 December 2026-January 2027

- Fix only evaluation-blocking defects after code freeze
- Tag release `d1-v1.0`
- Complete the Agile D1 template with evidence
- Update README and installation steps from a clean machine
- Create a 7-10 minute demo script and recovery plan
- Rehearse normal, validation-failure, authorization-failure, and report scenarios
- Record known limitations honestly

D1 exit gate: a new reviewer can clone and run the project, CI passes, the main demo flow works with synthetic data, and every D1 claim in the report is visibly demonstrable.

### Phase 3: Full workflow and AI — February-March 2027

#### Sprint 5 — 1-14 February

- Complete claim lifecycle
- Complete payment, partial payment, adjustment, denial, and balance logic
- Add denial categories and follow-up fields
- Strengthen authorization and audit coverage

#### Sprint 6 — 15-28 February

- Complete A/R aging buckets, revenue summary, denial list, filters, and exports
- Reconcile dashboard numbers against hand-calculated fixtures
- Add follow-up worklist if core reports are stable

#### Sprint 7 — 1-14 March

- Clean and version the approved training dataset
- Build rules-only and simple ML baselines
- Prevent train/test leakage, especially for repeated patients or claims
- Record feature definitions, experiment configuration, and metrics
- Perform error analysis by validation/denial category

#### Sprint 8 — 15-31 March

- Integrate model inference behind a stable backend interface
- Display risk flag, confidence where meaningful, and reason/explanation
- Define low-confidence/fallback behavior
- Add denial-pattern analysis
- Monitor prediction input/output without storing sensitive raw data unnecessarily

AI exit gate: results are reproducible; evaluation is on unseen data; model performance is compared with a rules-only baseline; limitations are documented; and the UI makes clear that the result is decision support.

If the model does not outperform the agreed baseline or the dataset is inadequate, retain the rule engine as the production feature and present the ML work as a rigorously evaluated experiment rather than making unsupported AI claims.

### Phase 4: Verification and refinement — April 2027

Testing work:

- Unit tests for claim totals, aging buckets, payment allocation, status transitions, and validation rules
- API integration tests for all core workflows
- Role/authorization tests, including direct URL/API attempts
- End-to-end tests for patient-to-payment and denial flows
- PDF field-position and content checks using agreed sample claims
- Performance tests against the stated NFR load
- Security checks for input validation, access control, password handling, secrets, and dependency issues
- Data backup/restore rehearsal
- Cross-browser and responsive UI checks
- User acceptance testing with supervisor or representative biller
- Regression run after fixes

Required evidence:

- Test plan and cases
- Requirements traceability matrix
- Test result report
- UAT feedback and sign-off
- Defect log with severity and resolution
- AI evaluation report/model card

Exit gate: no open critical/high defects; all Must requirements pass; financial totals reconcile; authorization-negative tests pass; and known residual issues are accepted and documented.

### Phase 5: Deployment and final documentation — May 2027

Deliverables:

- Staging/production deployment with HTTPS and environment-based secrets
- Database migration and seed process
- Backup and recovery instructions
- Operational health check and log strategy
- Final report and updated architecture/ERD
- User manual for Admin and Biller
- Developer/setup/API documentation
- Deployment guide
- Final presentation, poster if required, and demo video/backup recording
- Tagged final release and archived reproducible artifacts

Exit gate: the deployed application is reachable, the final demo can also run locally if hosting fails, documentation matches the released software, and all proposal objectives map to evidence.

## 7. Prioritized product backlog

| ID | Priority | Epic | User story / outcome | Target |
|---|---|---|---|---|
| AUTH-01 | Must | Access | As a user, I can log in and log out securely | Sprint 1 |
| AUTH-02 | Must | Access | As an Admin, I can manage users and roles | Sprint 1 |
| AUTH-03 | Must | Access | As the system, I prevent Billers from Admin operations | Sprint 1 |
| MASTER-01 | Must | Master data | As an Admin, I can manage insurers, services, and approved code records | Sprint 1 |
| PAT-01 | Must | Patients | As a Biller, I can create, view, update, and search patient records | Sprint 2 |
| INS-01 | Must | Insurance | As a Biller, I can maintain patient insurance and receive validation errors | Sprint 2 |
| AUD-01 | Must | Audit | As an Admin, I can see who performed important data and financial actions | Sprint 2/5 |
| CHG-01 | Must | Charges | As a Biller, I can record a service with diagnosis/procedure codes and fee | Sprint 3 |
| CLM-01 | Must | Claims | As a Biller, I can build a claim from patient, insurance, and charge data | Sprint 3 |
| VAL-01 | Must | Verification | As a Biller, I receive field-level rule errors before a claim becomes ready | Sprint 3 |
| PDF-01 | Must | Claims | As a Biller, I can preview/export an agreed CMS-1500-style PDF | Sprint 4 |
| CLM-02 | Must | Claims | As a Biller, I can move a claim only through allowed statuses | Sprint 4/5 |
| PAY-01 | Must | Payments | As a Biller, I can post payments/adjustments and see remaining balance | Sprint 5 |
| DEN-01 | Must | Denials | As a Biller, I can record and categorize a denial | Sprint 5 |
| REP-01 | Must | Reports | As a user, I can view verifiable A/R aging | Sprint 4/6 |
| REP-02 | Must | Reports | As a user, I can view revenue and denial summaries | Sprint 4/6 |
| ML-01 | Must* | AI research | As the team, we can reproduce and evaluate a claim-risk model | Sprint 7 |
| ML-02 | Must* | AI integration | As a Biller, I see a risk flag and explanation before finalizing a claim | Sprint 8 |
| ANL-01 | Should | Analytics | As a user, I can identify recurring denial patterns | Sprint 8 |
| EXP-01 | Should | Reports | As a user, I can filter and export report results | Sprint 6 |

`Must*` means required by the proposal, but deployment depends on the agreed data and quality gate. The research and evaluation remain mandatory even if the integrated model is rejected.

## 8. Definition of Ready and Definition of Done

### Definition of Ready

A story can be started when:

- The actor and business outcome are clear
- Acceptance criteria are testable
- Dependencies and data fields are known
- UI/API behavior is sketched where applicable
- Security/privacy concerns are identified
- Test data is available
- The story is small enough for one sprint
- An owner and reviewer are assigned

### Definition of Done

A feature is Done only when:

- Acceptance criteria pass
- Authorization and negative/error cases are handled
- Required validation and audit events exist
- Unit/integration tests are added and CI passes
- Code is reviewed and merged through a pull request
- No critical or high-severity defect remains
- Database migrations and seed changes are reproducible
- User-facing behavior is documented in README/user documentation as needed
- Synthetic demo data is available
- The feature works in the integrated build and is demonstrable
- Evidence/screenshot and traceability entry are updated

For AI work, Done additionally requires versioned data assumptions, reproducible training, held-out evaluation, baseline comparison, error analysis, and documented limitations.

## 9. D1 document completion map

Use `FYDP-DSE_007_A_D1_template.docx` and replace every instructional example.

| D1 section | MedBill content/evidence |
|---|---|
| 1. Product Overview | Spreadsheet/tool fragmentation, small clinics/billing firms, unified billing workflow and validation |
| 2. System Design | Architecture diagram, React/Django/MySQL modules, rule/ML verification boundary |
| 3. Features & Scope | Epics plus an exact Implemented/Partial/Planned table based on the release tag |
| 4. Product Backlog | Prioritized user stories with IDs and MoSCoW priority |
| 5. Prototype Demonstration | Exact demo flow, working behavior, partial behavior, omissions, and tools |
| 6. Progress Snapshot | Repository link, release/tag, branch structure, CI status, screenshots, build/run status |
| 7. Definition of Done | Use the project-specific DoD above, shortened to fit the template |
| 8. Development Approach | Two-week Scrum cadence, ownership, branch/PR workflow, review process |
| 9. CI/CD Plan | Current automated checks and the deployment stages planned for Semester 8 |
| 10. Next Steps | Remaining claim/payment/report/AI work, testing, deployment, and documentation with dates |

D1 evidence pack:

- Filled Agile D1 DOCX and exported PDF
- GitHub URL and tagged D1 release
- README with clean setup/run instructions
- Architecture diagram and ERD
- Current product backlog
- Screenshots with captions
- CI result
- Test summary
- Known limitations
- Short demo script and synthetic demo credentials/data

Do not claim a feature as implemented merely because its screen exists. Mark it implemented only if the integrated behavior and persistence work in the tagged D1 build.

## 10. Quality gates and measurements

Final numeric targets should be agreed with the supervisor during Phase 1. A practical starting set is:

- Core page/API operations meet the agreed response-time target under the agreed test load
- 100% of Must requirements are traceable to at least one acceptance test
- 100% of role-restricted endpoints have authorization-negative tests
- 100% of financial formulas have deterministic unit tests and hand-calculated fixtures
- No critical/high security or correctness defect is open at release
- Clean installation succeeds from documented instructions
- AI metrics include per-class precision/recall/F1 and confusion matrix, not accuracy alone
- AI threshold is selected using the business cost of missed errors versus false warnings

## 11. Team operating model

Primary ownership avoids duplication but does not mean isolated development.

| Area | Primary | Required reviewer |
|---|---|---|
| Backend/API, authentication, rule engine | Hasan | Irfan |
| ML experiments and evaluation | Hasan | Irfan + supervisor/domain reviewer |
| Frontend and UX | Irfan | Hasan |
| Database design, fixtures, reporting queries | Irfan | Hasan |
| Requirements, tests, documentation, demos | Both | Each other |

Rules:

- No one merges their own unreviewed feature.
- Both team members must be able to set up, run, and explain the entire system.
- Rotate at least one story per month outside the primary ownership area to reduce single-person dependency.
- Record important choices in short architecture decision records.

## 12. Risk register

| Risk | Early signal | Mitigation / fallback |
|---|---|---|
| No suitable claim dataset | Source, label, or usage rights unresolved by 11 October | Use approved synthetic/de-identified data; deliver rules-first validation and treat ML as evaluated research |
| Data leakage or misleading AI results | Very high test score without realistic split | Group/time-aware split, held-out test set, simple baseline, error analysis |
| CPT/code licensing issue | Full code data scraped or committed | Use permitted sample/reference data and document licensing; never redistribute restricted data |
| CMS-1500 layout mismatch | PDF fields drift on test print | October spike, fixed reference samples, automated/manual layout checks |
| Scope creep | Requests for live clearinghouse/eligibility/ERA | Enforce out-of-scope list and supervisor-approved change control |
| Financial calculation defects | Dashboard totals disagree with claim/payment records | Centralize calculation logic and test with hand-calculated fixtures |
| Unauthorized data access | UI hides actions but APIs allow them | Backend authorization on every restricted endpoint plus negative tests |
| Privacy breach | Real patient data appears in repo/demo | Synthetic data only, secrets scan, access control, logging/data-retention rules |
| Integration delayed until late | Frontend and backend appear complete separately | Deliver a tested vertical slice every sprint |
| Two-person availability risk | A module is understood by only one member | Reviews, documentation, rotated stories, shared demos |
| Deployment failure during evaluation | Demo depends on one remote service | Tagged local Docker build, seed data, and recorded backup demo |

## 13. Weekly control dashboard

Review these every week:

- Sprint goal: on track / at risk / missed
- Stories completed versus committed
- Blockers older than two working days
- Open critical/high defects
- CI status and test pass rate
- Requirements implemented and tested
- Demo flow health
- AI dataset/experiment status
- Document/evidence freshness
- Risks whose probability or impact changed

The roadmap should be updated when evidence changes, but the May 2027 outcome, D1 evaluation goal, privacy boundary, and core billing workflow should not change without supervisor-approved change control.
