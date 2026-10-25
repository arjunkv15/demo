# Ghost Data Audit — Evidence-Based Deletion Case Auditor

A beginner-friendly, explainable, and deterministic privacy auditor built for the HackerRank Orchestrate challenge **"Ghost Data Still Exists"**.

---

## 1. Project Purpose

When users exercise their Right to Be Forgotten under privacy regulations (such as GDPR Article 17 or CCPA), simply marking an account `COMPLETE` in a database is rarely sufficient. In real systems, "ghost data" frequently lingers in:
- Search indexes (Elasticsearch / search clusters)
- Unanonymized product analytics profiles
- Customer support conversations and ticket attachments
- Active event synchronization connectors (which repopulate deleted records)
- Unrestricted backup archives that can restore deleted profiles

This prototype acts as an **independent evidence-based auditor**:
1. It ingests deletion requests, user identity records, historical audit logs, system activity logs, and evidence captures.
2. It verifies whether requested data deletion actually completed or if ghost records persist.
3. It determines whether a case is **`COMPLETE`**, **`INCOMPLETE`**, or **`NOT_APPLICABLE`** (for non-deletion requests).
4. For incomplete cases, it produces a structured list of **confirmed findings**, **proposed remediations**, and **future verification checks** conforming to strict challenge schemas.

---

## 2. Core Features & Technology Stack

### Strict Technology Requirements
- **Python (Standard Library)**: Core auditing logic, CSV parsing, JSON formatting, and local HTTP server using `http.server`. No external AI APIs, no paid models, no heavy frameworks (no Flask, Django, Docker, or external databases).
- **HTML, CSS, & Vanilla JavaScript**: Clean, responsive frontend served locally.
- **Full Compatibility**: Works both locally via `python3 app.py` and inside full-stack dev environments.

### Core Auditor Capabilities
- **Identity & Alias Resolution**: Maps requests to `user_identities.csv` and traces previous emails through `user_audit_log.csv`.
- **Intake Intent Classification**: Identifies requests asking for profile updates, invoice copies, or marketing unsubscribes without deletion, accurately classifying them as `NOT_APPLICABLE` with `steps_json = []`.
- **Worker Outcome Verification**: Inspects `system_activity.csv` for `FAILED`, `PARTIAL`, active connectors (`CHECK_DATA_FLOW`), and unrestriced archives (`CHECK_RESTORE_ACCESS`).
- **Legal Retention Safeguard**: Preserves security audit logs (`security_service:audit_record_...`) under Rule 12 while confirming primary profile deletion.
- **Strict Phase Ordering**: Generates steps strictly adhering to `FINDING` $\rightarrow$ `REMEDIATION` $\rightarrow$ `VERIFICATION`.
- **Evidence Integrity**: Never fabricates evidence IDs. Cites genuine snapshot captures for observed findings and confirmed verifications; uses empty string `""` for proposed future actions.

---

## 3. Project Structure

```text
ghost-data-audit/
├── app.py                     # Main Python engine & local HTTP server
├── index.html                 # Semantic HTML frontend
├── style.css                  # Clean, modern CSS styling
├── script.js                  # Vanilla JS for browser interactions
├── output.csv                 # Generated 518-case output CSV
├── prompts.md                 # Development prompt & deterministic rationale
├── README.md                  # Project documentation & execution guide
├── chat_transcript.md         # Truthful record of development
├── dataset/                   # Challenge datasets
│   ├── deletion_requests.csv
│   ├── sample_deletion_requests.csv
│   ├── sample_output.csv
│   ├── user_identities.csv
│   ├── user_audit_log.csv
│   ├── system_activity.csv
│   ├── deletion_rules.csv
│   ├── evidence_files.csv
│   └── output.csv
└── evaluation/
    ├── evaluation_report.md   # Benchmark, accuracy metrics & synthetic tests
    └── usage_report.md        # AI API & token usage disclosure (Zero external API)
```

---

## 4. How to Run the Application

### A. Run the Web Interface Locally
To start the local web server using Python's built-in standard library:
```bash
python3 app.py 3000
```
Open your browser at:
```text
http://localhost:3000
```

### B. Generate & Validate `output.csv` (518 Cases)
To run the batch auditor across all 518 cases from `deletion_requests.csv`:
```bash
python3 app.py --generate-csv
```
This generates `output.csv` and automatically validates:
- Exactly 518 rows (from `case_33` to `case_550`).
- Exact header: `case_id,deletion_status,steps_json`.
- Strict ascending numerical sorting.
- Valid JSON arrays for `steps_json` with all 7 required step fields.

To validate an existing CSV file at any time:
```bash
python3 app.py --validate output.csv
```

### C. Run the Sample Benchmark (32 Cases)
To evaluate the auditor against the challenge ground truth `sample_output.csv`:
```bash
python3 app.py --test-sample
```
Current Result: **32 / 32 Status Matches (100.0%)**, **32 / 32 Exact Step Matches (100.0%)**.

### D. Run the Synthetic Test Suite
To verify privacy edge cases in isolation from the uploaded files:
```bash
python3 app.py --synthetic
```

---

## 5. Main Python Logic Explained Simply

All logic is encapsulated in short, readable functions inside `app.py`:

1. **`DatasetLoader`**: Locates dataset files across `dataset/` or `public/assets/aistudio/` gracefully handling any environment.
2. **`is_non_deletion()`**: Inspects the user's natural language request and `CLASSIFY_REQUEST` intake records. If the user only wants to change an email, download past invoices, or opt out of promotions, it classifies the case as `NOT_APPLICABLE`.
3. **`find_evidence_id()`**: Selects the appropriate snapshot capture from `evidence_files.csv` corresponding to the case's `audit_at` timestamp.
4. **`audit_case()`**:
   - Gathers worker events on the request's `reported_at` date.
   - Detects failures (`FAILED`, `PARTIAL`), active data flows, or restore risks.
   - If issues exist: Creates `FINDING` steps $\rightarrow$ `REMEDIATION` steps $\rightarrow$ `VERIFICATION` steps $\rightarrow$ sets status to `INCOMPLETE`.
   - If clean: Confirms required deletion and legal retention $\rightarrow$ sets status to `COMPLETE`.
5. **`validate_output_csv()`**: Enforces all challenge format rules, catching schema defects, bad status strings, or unescaped JSON.

---

## 6. Interview Preparation: Key Talking Points

In a 30-minute technical or AI interview, be prepared to explain:
1. **Never Trust `reported_status` Alone**: In distributed systems, a service might return "Complete", but asynchronous replica sync or search indexing may fail silently. Auditing requires verifying evidence, not taking self-reported flags as truth.
2. **Deterministic Rules vs. AI APIs**: For compliance and legal auditing, deterministic logic is explainable, repeatable, and cost-free, whereas LLM APIs introduce non-deterministic hallucinations and privacy leak risks.
3. **Phase & Evidence Discipline**: Findings represent observed facts and cite real evidence IDs. Proposed remediations and future verifications represent recommended future work and must use an empty evidence ID (`""`).
