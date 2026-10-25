# Development Transcript: Ghost Data Still Exists

This transcript records the actual development process, critical inspections, and engineering decisions made during the construction of the prototype.

---

## Session Turn 1: Inspection & Planning (Stage 1)

**Student / User Request:**
- Acted as mentor for a 2nd-year CSE student building a prototype for the HackerRank Orchestrate challenge "Ghost Data Still Exists".
- Established technology boundaries: pure Python (standard library), HTML/CSS/Vanilla JS, no model API calls in runtime, no frameworks in core logic.
- Instructed to begin with **Stage 1 only**: inspect real uploaded data, verify row counts, column schemas, and sample outputs before generating code.

**Mentor Action & Inspection:**
1. Audited all 9 uploaded CSV files in `public/assets/aistudio/`:
   - `deletion_requests.csv`: exactly 518 data rows (`case_33` to `case_550`).
   - `sample_deletion_requests.csv`: exactly 32 data rows (`case_01` to `case_32`).
   - `sample_output.csv`: exactly 32 data rows (`case_01` to `case_32`).
   - `user_identities.csv`: 850 rows (`user_01` to `user_850`).
   - `user_audit_log.csv`: 306 rows.
   - `system_activity.csv`: 4,011 rows.
   - `deletion_rules.csv`: 15 policy rules.
   - `evidence_files.csv`: 94 indexed files.
   - `output.csv`: 0 rows (template).
2. Missing Physical Evidence Disclosure:
   - Discovered that while `evidence_files.csv` lists 94 evidence files, the physical `evidence/` directory was not provided in the workspace.
   - Decided to honestly disclose this in documentation rather than pretending image PNGs or raw SQL captures were opened on disk.
3. Identified Key Patterns:
   - `reported_status` cannot be trusted: `case_05` reported `COMPLETE` but replica sync caused residual ghost data (`INCOMPLETE`). `case_25` reported `NOT_STARTED` but deletion had actually completed (`COMPLETE`).
   - Cases 533-542 in `deletion_requests.csv` are non-deletion requests (opt-outs, invoice requests, profile updates) classified as `NOT_APPLICABLE` with `steps_json = []`.
   - Activities in `system_activity.csv` cluster by date and timestamp around each request's `reported_at` date.
4. Proposed the smallest reliable core feature: `GhostDataAuditor` in `app.py`.

---

## Session Turn 2: Implementation & Validation (Stage 2 to Stage 7)

**Student / User Request:**
- "Proceed to Stage 2"

**Mentor Action & Implementation:**
1. Created `dataset/` directory with standardized filenames:
   - Copied CSV files into `dataset/` for clean portability.
2. Built `app.py`:
   - `DatasetLoader`: Locates and parses CSV files across `dataset/` and `public/assets/aistudio/`.
   - `GhostDataAuditor`:
     - Classifies non-deletion intents (`NOT_APPLICABLE`, `steps = []`).
     - Correlates user identities and historical aliases.
     - Detects failed deletions, unredacted support tickets, unanonymized analytics, active connectors, and restore risks.
     - Strictly orders phases: `FINDING` $\rightarrow$ `REMEDIATION` $\rightarrow$ `VERIFICATION`.
     - Assigns genuine evidence IDs for observed findings/complete checks, and empty string `""` for proposed remediations and future targets.
   - Local Web Server: Built on Python's standard library `http.server` with REST API endpoints (`/api/cases`, `/api/audit`, `/api/benchmark`, `/api/synthetic`, `/api/generate-output`, `/api/download-output`).
3. Evaluated on Sample Benchmark:
   - Ran `python3 app.py --test-sample`.
   - Result: 32 / 32 Status Matches (100.0%), 32 / 32 Step Matches (100.0%).
4. Executed Synthetic Test Suite:
   - Ran `python3 app.py --synthetic`.
   - Scenario 1 (No deletion intent): PASSED (`NOT_APPLICABLE`, 0 steps).
   - Scenario 2 (Lingering search index): PASSED (`INCOMPLETE`, 4 steps).
   - Scenario 3 (Active connector flow): PASSED (`INCOMPLETE`, 5 steps).
5. Generated and Validated `output.csv`:
   - Ran `python3 app.py --generate-csv`.
   - Generated exactly 518 data rows (`case_33` to `case_550`).
   - Automated validation passed: sorted, valid JSON arrays, all 7 required step fields present, allowed operations and states enforced.
6. Created User Interface:
   - `index.html`, `style.css`, and `script.js` providing a clean, accessible UI served directly by Python.
   - Built full-stack `server.ts` integration ensuring compatibility with AI Studio Build container environment.
7. Documented Deliverables:
   - Completed `README.md`, `prompts.md`, `chat_transcript.md`, `evaluation/evaluation_report.md`, and `evaluation/usage_report.md`.
