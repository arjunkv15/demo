# Development Prompts & Architecture Rationale

## 1. Development Prompt

```markdown
# Build My Beginner-Friendly Python Project: Ghost Data Still Exists
Act as my Python mentor, beginner-friendly software engineer, and project reviewer.
I am a second-year CSE student. I know HTML and CSS, have beginner-level JavaScript knowledge, and am learning Python in depth.
I am building a prototype for the HackerRank Orchestrate challenge, "Ghost Data Still Exists."
My goal is NOT to build a perfect enterprise application. My goal is to build one reliable, explainable core feature, test it honestly, and prepare to explain my work in a 30-minute AI interview.

Key Constraints:
- Use only Python for main logic and local server (standard library).
- HTML, CSS, and Vanilla JS for the web interface.
- No paid AI APIs, OpenAI, or Gemini model calls in application runtime.
- No Flask, Django, React, Node.js, databases, Docker, or complex frameworks in the submission.
- Ground all logic in the real dataset and evidence.
- Produce output.csv with exact 518 cases, sorted, formatted with valid steps_json.
```

---

## 2. Rationale: Deterministic Rules vs. Model API Calls

In privacy engineering and compliance auditing (e.g., GDPR Article 17 "Right to Erasure" and CCPA audits), **deterministic Python rules** were chosen over LLM/model API calls for the following reasons:

### A. Explainability & Auditability
- In a legal regulatory audit or technical interview, an engineer must explain the exact line of code that triggered a decision.
- A deterministic check (`if a["reported_result"] in ["FAILED", "PARTIAL"]`) provides 100% transparency. An LLM's latent weights cannot be inspected with certainty.

### B. Prevention of Hallucinated Evidence
- A generative model might hallucinate evidence IDs (e.g., inventing `evidence_999`) or create conflicting steps.
- The deterministic auditor strictly bounds `evidence_id` to verified snapshot captures in `evidence_files.csv` for findings/verifications, and guarantees empty string `""` for future remediations.

### C. Zero API Cost & Offline Resilience
- The auditor runs locally without internet access, API keys, network latency, or token cost.
- An organization with millions of user records cannot afford per-token API billing or privacy leaks from sending sensitive PII to 3rd-party model APIs.

### D. Consistent Schema Compliance
- Step ordering (`FINDING` $\rightarrow$ `REMEDIATION` $\rightarrow$ `VERIFICATION`) and field structure (`step_no`, `phase`, `system_id`, `resource_id`, `operation`, `state`, `evidence_id`) are enforced by Python data types, ensuring 100% compliance with automated evaluation graders.
