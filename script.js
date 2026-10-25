// Ghost Data Still Exists - Vanilla Browser Interactions

document.addEventListener("DOMContentLoaded", () => {
  const caseSelect = document.getElementById("caseSelect");
  const runAuditBtn = document.getElementById("runAuditBtn");
  const runBenchmarkBtn = document.getElementById("runBenchmarkBtn");
  const runSyntheticBtn = document.getElementById("runSyntheticBtn");
  const generateOutputBtn = document.getElementById("generateOutputBtn");
  const downloadOutputBtn = document.getElementById("downloadOutputBtn");

  // Load all cases on startup
  fetch("/api/cases")
    .then((r) => r.json())
    .then((data) => {
      if (data && data.cases) {
        populateCaseSelect(data.cases);
        // Default to first sample case
        if (data.cases.length > 0) {
          caseSelect.value = data.cases[0].case_id;
          auditSelectedCase(data.cases[0].case_id);
        }
      }
    })
    .catch((err) => {
      console.warn("Could not fetch cases from Python API, fallback:", err);
    });

  // Load benchmark on startup
  fetch("/api/benchmark")
    .then((r) => r.json())
    .then((data) => {
      if (data && data.status_accuracy_pct !== undefined) {
        updateBenchmarkUI(data);
      }
    })
    .catch((err) => console.warn(err));

  function populateCaseSelect(cases) {
    caseSelect.innerHTML = "";
    const sampleGroup = document.createElement("optgroup");
    sampleGroup.label = "Sample Reference Cases (32)";
    const fullGroup = document.createElement("optgroup");
    fullGroup.label = "Full Evaluation Dataset (518)";

    cases.forEach((c) => {
      const opt = document.createElement("option");
      opt.value = c.case_id;
      opt.textContent = `${c.case_id}: ${c.email} [rep: ${c.reported_status}]`;
      if (c.is_sample) {
        sampleGroup.appendChild(opt);
      } else {
        fullGroup.appendChild(opt);
      }
    });

    caseSelect.appendChild(sampleGroup);
    caseSelect.appendChild(fullGroup);
  }

  function auditSelectedCase(caseId) {
    if (!caseId) return;
    const auditView = document.getElementById("auditResultView");
    auditView.innerHTML = '<div class="empty-state">Running evidence-based audit...</div>';

    fetch(`/api/audit?case_id=${encodeURIComponent(caseId)}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.error) {
          auditView.innerHTML = `<div class="empty-state" style="color:var(--danger-text);">${data.error}</div>`;
          return;
        }
        renderAuditView(data);
      })
      .catch((err) => {
        auditView.innerHTML = `<div class="empty-state" style="color:var(--danger-text);">Audit failed: ${err.message}</div>`;
      });
  }

  caseSelect.addEventListener("change", (e) => {
    auditSelectedCase(e.target.value);
  });

  runAuditBtn.addEventListener("click", () => {
    auditSelectedCase(caseSelect.value);
  });

  runBenchmarkBtn.addEventListener("click", () => {
    runBenchmarkBtn.disabled = true;
    runBenchmarkBtn.textContent = "Benchmarking...";
    fetch("/api/benchmark")
      .then((r) => r.json())
      .then((data) => {
        updateBenchmarkUI(data);
        alert(`Benchmark complete: ${data.exact_status_matches} / ${data.total_sample_cases} status matches (${data.status_accuracy_pct}%), ${data.exact_step_matches} / ${data.total_sample_cases} exact step matches.`);
      })
      .finally(() => {
        runBenchmarkBtn.disabled = false;
        runBenchmarkBtn.textContent = "Run Sample Benchmark (32 Cases)";
      });
  });

  runSyntheticBtn.addEventListener("click", () => {
    fetch("/api/synthetic")
      .then((r) => r.json())
      .then((data) => {
        showSyntheticModal(data);
      });
  });

  generateOutputBtn.addEventListener("click", () => {
    generateOutputBtn.disabled = true;
    generateOutputBtn.textContent = "Generating 518 Rows...";
    fetch("/api/generate-output", { method: "POST" })
      .then((r) => r.json())
      .then((data) => {
        if (data.success) {
          alert(`Success! Generated output.csv with ${data.count} rows.\n\nValidation status: ${data.validation.valid ? "PASSED" : "FAILED"}\nCOMPLETE: ${data.validation.status_breakdown.COMPLETE}\nINCOMPLETE: ${data.validation.status_breakdown.INCOMPLETE}\nNOT_APPLICABLE: ${data.validation.status_breakdown.NOT_APPLICABLE}`);
        } else {
          alert(`Error generating output: ${data.error}`);
        }
      })
      .finally(() => {
        generateOutputBtn.disabled = false;
        generateOutputBtn.textContent = "Generate & Validate output.csv";
      });
  });

  downloadOutputBtn.addEventListener("click", () => {
    window.location.href = "/api/download-output";
  });

  function updateBenchmarkUI(data) {
    document.getElementById("benchmarkAccuracyVal").textContent = `${data.status_accuracy_pct}%`;
    document.getElementById("benchmarkSubVal").textContent = `${data.exact_status_matches}/${data.total_sample_cases} Status Matches | ${data.exact_step_matches}/${data.total_sample_cases} Step Matches`;
  }

  function renderAuditView(res) {
    const auditView = document.getElementById("auditResultView");

    let statusBadgeClass = "badge-incomplete";
    if (res.deletion_status === "COMPLETE") statusBadgeClass = "badge-complete";
    if (res.deletion_status === "NOT_APPLICABLE") statusBadgeClass = "badge-na";

    let steps = res.steps || [];
    let findings = res.findings || steps.filter((s) => s.phase === "FINDING");
    let remediations = res.remediations || steps.filter((s) => s.phase === "REMEDIATION");
    let verifications = res.verifications || steps.filter((s) => s.phase === "VERIFICATION");

    let html = `
      <div class="audit-header">
        <div>
          <div class="case-headline">${res.case_id}</div>
          <div class="case-meta">${res.email}</div>
        </div>
        <div style="text-align:right;">
          <span class="badge ${statusBadgeClass}" style="font-size:0.9rem; padding:6px 14px;">${res.deletion_status}</span>
          <div style="font-size:0.75rem; color:var(--text-muted); margin-top:4px;">Reported: ${res.reported_status || "N/A"}</div>
        </div>
      </div>

      <div class="audit-meta-grid">
        <div class="meta-item">
          <div class="meta-item-label">Evidence Snapshot</div>
          <div class="meta-item-val" style="color:var(--accent);">${res.evidence_id || "None (No Deletion)"}</div>
        </div>
        <div class="meta-item">
          <div class="meta-item-label">Confirmed Findings</div>
          <div class="meta-item-val">${findings.length}</div>
        </div>
        <div class="meta-item">
          <div class="meta-item-label">Proposed Remediations</div>
          <div class="meta-item-val">${remediations.length}</div>
        </div>
        <div class="meta-item">
          <div class="meta-item-label">Verification Steps</div>
          <div class="meta-item-val">${verifications.length}</div>
        </div>
      </div>

      <div class="rationale-box">
        <div class="rationale-title">Auditor Assessment Rationale</div>
        <div>${res.rationale}</div>
      </div>
    `;

    // 1. Confirmed Findings Section
    html += `
      <div class="section-title" style="color:var(--danger-text);">
        <span>Confirmed Findings (Observed Issues)</span>
        <span class="badge badge-incomplete" style="font-size:0.7rem;">${findings.length}</span>
      </div>
    `;
    if (findings.length === 0) {
      html += '<div style="font-size:0.85rem; color:var(--text-muted); padding:8px 0;">No active risks, remaining records, or data leaks detected.</div>';
    } else {
      html += '<div class="findings-list">';
      findings.forEach((f) => {
        html += renderStepCard(f, "state-present");
      });
      html += '</div>';
    }

    // 2. Proposed Remediations Section
    if (remediations.length > 0) {
      html += `
        <div class="section-title" style="color:var(--warning-text); margin-top:20px;">
          <span>Proposed Remediation Actions (Future Tasks)</span>
          <span class="badge" style="background:var(--warning-bg); color:var(--warning-text); border:1px solid var(--warning-border); font-size:0.7rem;">${remediations.length}</span>
        </div>
        <div class="remediations-list">
      `;
      remediations.forEach((r) => {
        html += renderStepCard(r, "state-disabled");
      });
      html += '</div>';
    }

    // 3. Verifications Section
    html += `
      <div class="section-title" style="color:var(--success-text); margin-top:20px;">
        <span>${res.deletion_status === "COMPLETE" ? "Confirmed Verification Checks" : "Future Verification Targets"}</span>
        <span class="badge badge-complete" style="font-size:0.7rem;">${verifications.length}</span>
      </div>
    `;
    if (verifications.length === 0) {
      html += '<div style="font-size:0.85rem; color:var(--text-muted); padding:8px 0;">None required (non-deletion case).</div>';
    } else {
      html += '<div class="verifications-list">';
      verifications.forEach((v) => {
        html += renderStepCard(v, "state-absent");
      });
      html += '</div>';
    }

    // 4. Raw JSON Output view
    html += `
      <div class="section-title" style="margin-top:24px;">Generated steps_json</div>
      <div class="json-preview">${res.steps_json || JSON.stringify(res.steps, null, 2)}</div>
    `;

    auditView.innerHTML = html;
  }

  function renderStepCard(step, stateClass) {
    return `
      <div class="step-card">
        <div class="step-left">
          <span class="step-no">#${step.step_no}</span>
          <span class="step-op">${step.operation}</span>
          <span class="step-target">${step.system_id}:${step.resource_id}</span>
        </div>
        <div>
          <span class="step-state ${stateClass}">${step.state}</span>
          ${step.evidence_id ? `<span style="color:var(--text-muted); font-size:0.72rem; margin-left:8px;">[${step.evidence_id}]</span>` : ''}
        </div>
      </div>
    `;
  }

  function showSyntheticModal(tests) {
    let modal = document.getElementById("syntheticModal");
    if (!modal) {
      modal = document.createElement("div");
      modal.id = "syntheticModal";
      modal.className = "modal-backdrop";
      document.body.appendChild(modal);
    }

    let rowsHtml = tests
      .map(
        (t) => `
      <div style="border:1px solid var(--border); border-radius:6px; padding:12px; margin-bottom:10px; background:var(--bg-primary);">
        <div style="display:flex; justify-content:space-between;">
          <strong>${t.test_name}</strong>
          <span class="badge ${t.passed ? "badge-complete" : "badge-incomplete"}">${t.passed ? "PASSED" : "FAILED"}</span>
        </div>
        <div style="font-size:0.85rem; color:var(--text-muted); margin:4px 0;">${t.description}</div>
        <div style="font-size:0.8rem; font-family:monospace; margin-top:6px;">
          Expected: <span style="color:var(--accent);">${t.expected_status} (${t.expected_steps} steps)</span> | 
          Actual: <span style="color:${t.passed ? 'var(--success-text)' : 'var(--danger-text)'};">${t.actual_status} (${t.actual_steps} steps)</span>
        </div>
      </div>
    `
      )
      .join("");

    modal.innerHTML = `
      <div class="modal-content">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px;">
          <h3>Synthetic Test Suite (3 Scenarios)</h3>
          <button id="closeModalBtn" class="badge badge-na" style="cursor:pointer; border:none;">✕ Close</button>
        </div>
        <div style="font-size:0.85rem; color:var(--text-muted); margin-bottom:14px;">
          Verifying key privacy boundary conditions in isolation from real dataset.
        </div>
        ${rowsHtml}
      </div>
    `;

    modal.style.display = "flex";
    document.getElementById("closeModalBtn").onclick = () => {
      modal.style.display = "none";
    };
  }
});
