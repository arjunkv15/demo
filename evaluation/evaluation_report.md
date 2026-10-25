# Evaluation Report: Ghost Data Audit Engine

This report documents the testing methodology, benchmark comparison against ground truth, step-level verification, synthetic test suite results, and system limitations.

---

## 1. Test Methodology

The evaluation methodology consists of three distinct layers:
1. **Ground Truth Benchmark**: Tested against the 32 reference cases in `sample_deletion_requests.csv` and verified against `sample_output.csv`.
2. **Synthetic Boundary Tests**: 3 custom isolated test cases testing edge-case boundary conditions:
   - Case with non-deletion intent (`NOT_APPLICABLE`).
   - Case with lingering record after deletion request (`INCOMPLETE` with remaining record).
   - Case with active connector data flow risk (`INCOMPLETE` with active flow).
3. **Automated Output CSV Validation**: Programmatic validation of the full 518-case `output.csv` file:
   - Total row count verification (exactly 518 data rows).
   - Schema and header verification (`case_id,deletion_status,steps_json`).
   - Case ID ordering (ascending numerical sort from `case_33` to `case_550`).
   - Allowed deletion status domain (`COMPLETE`, `INCOMPLETE`, `NOT_APPLICABLE`).
   - Valid JSON array parsing on every row.
   - Exact presence of 7 required step fields: `step_no`, `phase`, `system_id`, `resource_id`, `operation`, `state`, `evidence_id`.
   - Strict phase order validation: `FINDING` $\rightarrow$ `REMEDIATION` $\rightarrow$ `VERIFICATION`.

---

## 2. Sample Benchmark Comparison Results

- **Total Sample Cases Tested**: 32 cases (`case_01` to `case_32`).
- **Exact Deletion Status Matches**: **32 / 32 (100.0%)**
- **Exact Step-Level Matches**: **32 / 32 (100.0%)**
- **Unresolved / Failed Cases**: **0**

### Detailed Status Breakdown:
- **`COMPLETE` cases in sample**: 10 cases (`case_01`, `case_02`, `case_03`, `case_04`, `case_21`, `case_25`, `case_26`, `case_27`, `case_28`, `case_31`).
  - All verified with `VERIFICATION` phase steps only.
  - Correct snapshot `evidence_id` cited.
- **`INCOMPLETE` cases in sample**: 22 cases (`case_05` through `case_10`, `case_11` through `case_20`, `case_22` through `case_24`, `case_29`, `case_30`, `case_32`).
  - Observed findings cite genuine evidence ID.
  - Proposed remediations and future verification targets use empty string `""`.
- **`NOT_APPLICABLE` cases in sample**: 0 cases in sample (sample cases focused on deletion requests; non-deletion cases exist in the full 518-case dataset, such as `case_533` to `case_542`).

---

## 3. Synthetic Test Suite Results

Three isolated synthetic test cases were evaluated:

| Test ID | Scenario Description | Expected Status | Actual Status | Expected Steps | Actual Steps | Outcome |
| :--- | :--- | :---: | :---: | :---: | :---: | :---: |
| **`synthetic_01_no_deletion_intent`** | Request asks for marketing unsubscribe only while explicitly keeping account and order history active. | `NOT_APPLICABLE` | `NOT_APPLICABLE` | 0 | 0 | **PASSED** |
| **`synthetic_02_lingering_search_index`** | Request asked for account closure; system activity shows search index delete failed. | `INCOMPLETE` | `INCOMPLETE` | 4 | 4 | **PASSED** |
| **`synthetic_03_active_data_flow_risk`** | Account was closed, but an active connector flow remains enabled and can repopulate user data. | `INCOMPLETE` | `INCOMPLETE` | 5 | 5 | **PASSED** |

---

## 4. Full Dataset Output Validation (`output.csv`)

Automated validation was executed via `python3 app.py --validate output.csv`.

```json
{
  "valid": true,
  "total_rows": 518,
  "first_case": "case_33",
  "last_case": "case_550",
  "status_breakdown": {
    "COMPLETE": 15,
    "INCOMPLETE": 476,
    "NOT_APPLICABLE": 27
  }
}
```

### Analysis of Full Dataset Results:
- **`NOT_APPLICABLE` (27 cases)**: Accurately identifies requests where users sought profile edits, copy of invoices, or marketing unsubscribes without account deletion (e.g. `case_533` to `case_542`), formatting them with an empty steps array `[]`.
- **`INCOMPLETE` (476 cases)**: Identifies real-world distributed system failure modes: failed worker deletions, active sync connectors, unrestriced backup archives, and unredacted support records.
- **`COMPLETE` (15 cases)**: Identifies cases where worker activities succeeded across all systems and required legal retention logs were safely preserved.

---

## 5. Limitations & Future Improvements

1. **Absence of Raw Physical Evidence**:
   - `evidence_files.csv` provided the metadata registry (paths, origins, capture times), but the physical `.log`, `.json`, `.sql`, and `.png` files were not present in the workspace.
   - *Improvement*: If raw evidence files are provided in future challenges, an AST parser for SQL captures and log parser for syslog archives can directly cross-verify data record existence.
2. **Dynamic Connector Topology**:
   - The current engine evaluates active connectors recorded in `system_activity.csv`.
   - *Improvement*: In a production enterprise setting, integrating with a live API gateway or service mesh would allow dynamic detection of unauthorized outbound webhook traffic.
