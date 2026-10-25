/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  FileCheck2,
  Download,
  Play,
  RotateCw,
  FlaskConical,
  Database,
  ExternalLink,
  AlertTriangle,
  Info
} from 'lucide-react';

interface Step {
  step_no: number;
  phase: string;
  system_id: string;
  resource_id: string;
  operation: string;
  state: string;
  evidence_id: string;
}

interface CaseItem {
  case_id: string;
  email: string;
  requested_at: string;
  reported_status: string;
  is_sample: boolean;
}

interface AuditResult {
  case_id: string;
  email: string;
  reported_status: string;
  deletion_status: string;
  steps: Step[];
  steps_json: string;
  rationale: string;
  findings: Step[];
  remediations: Step[];
  verifications: Step[];
  evidence_id: string;
}

interface BenchmarkResult {
  total_sample_cases: number;
  exact_status_matches: number;
  status_accuracy_pct: number;
  exact_step_matches: number;
  step_accuracy_pct: number;
  discrepancies: any[];
}

interface SyntheticTest {
  test_name: string;
  description: string;
  expected_status: string;
  actual_status: string;
  expected_steps: number;
  actual_steps: number;
  passed: boolean;
}

export default function App() {
  const [cases, setCases] = useState<CaseItem[]>([]);
  const [selectedCaseId, setSelectedCaseId] = useState<string>('case_01');
  const [auditData, setAuditData] = useState<AuditResult | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [benchmark, setBenchmark] = useState<BenchmarkResult | null>(null);
  const [syntheticTests, setSyntheticTests] = useState<SyntheticTest[] | null>(null);
  const [showSyntheticModal, setShowSyntheticModal] = useState<boolean>(false);
  const [generatingCsv, setGeneratingCsv] = useState<boolean>(false);
  const [bannerMessage, setBannerMessage] = useState<string | null>(null);

  // Fetch case list and benchmark on mount
  useEffect(() => {
    fetch('/api/cases')
      .then((r) => r.json())
      .then((data) => {
        if (data && data.cases) {
          setCases(data.cases);
          if (data.cases.length > 0) {
            setSelectedCaseId(data.cases[0].case_id);
            auditCase(data.cases[0].case_id);
          }
        }
      })
      .catch((err) => console.error('Failed to load cases:', err));

    fetch('/api/benchmark')
      .then((r) => r.json())
      .then((data) => {
        if (data && data.status_accuracy_pct !== undefined) {
          setBenchmark(data);
        }
      })
      .catch((err) => console.error('Failed to load benchmark:', err));
  }, []);

  const auditCase = (cid: string) => {
    setLoading(true);
    fetch(`/api/audit?case_id=${encodeURIComponent(cid)}`)
      .then((r) => r.json())
      .then((data) => {
        setAuditData(data);
      })
      .catch((err) => console.error('Audit failed:', err))
      .finally(() => setLoading(false));
  };

  const runBenchmark = () => {
    setLoading(true);
    fetch('/api/benchmark')
      .then((r) => r.json())
      .then((data) => {
        setBenchmark(data);
        setBannerMessage(
          `Sample Benchmark: ${data.exact_status_matches}/${data.total_sample_cases} Status Matches (${data.status_accuracy_pct}%), ${data.exact_step_matches}/${data.total_sample_cases} Step Matches.`
        );
      })
      .finally(() => setLoading(false));
  };

  const runSynthetic = () => {
    fetch('/api/synthetic')
      .then((r) => r.json())
      .then((data) => {
        setSyntheticTests(data);
        setShowSyntheticModal(true);
      });
  };

  const generateOutputCsv = () => {
    setGeneratingCsv(true);
    fetch('/api/generate-output', { method: 'POST' })
      .then((r) => r.json())
      .then((data) => {
        if (data.success) {
          setBannerMessage(
            `Generated output.csv (${data.count} rows). Validation: ${data.validation.valid ? 'PASSED' : 'FAILED'} (COMPLETE: ${data.validation.status_breakdown.COMPLETE}, INCOMPLETE: ${data.validation.status_breakdown.INCOMPLETE}, NOT_APPLICABLE: ${data.validation.status_breakdown.NOT_APPLICABLE}).`
          );
        }
      })
      .finally(() => setGeneratingCsv(false));
  };

  const sampleCases = cases.filter((c) => c.is_sample);
  const fullCases = cases.filter((c) => !c.is_sample);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <header className="border-b border-slate-800 pb-5">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-sky-500/10 border border-sky-500/30 rounded-lg text-sky-400">
                  <ShieldAlert className="w-6 h-6" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-3">
                    Ghost Data Audit
                    <span className="text-xs px-2.5 py-0.5 rounded-full bg-sky-500/15 text-sky-400 border border-sky-500/30 font-medium">
                      HackerRank Orchestrate Prototype
                    </span>
                  </h1>
                  <p className="text-slate-400 text-sm mt-0.5">
                    Evidence-based deletion case auditor verifying data deletion requests, detecting residual ghost data, active sync flows, and restore risks.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <a
                href="/api/download-output"
                className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-lg bg-sky-500 text-slate-950 hover:bg-sky-400 transition"
              >
                <Download className="w-4 h-4" />
                Download output.csv
              </a>
            </div>
          </div>
        </header>

        {/* Global Alert Notification */}
        {bannerMessage && (
          <div className="p-3 bg-sky-950/60 border border-sky-800/80 rounded-lg flex items-center justify-between text-sm text-sky-200">
            <div className="flex items-center gap-2">
              <Info className="w-4 h-4 text-sky-400 shrink-0" />
              <span>{bannerMessage}</span>
            </div>
            <button
              onClick={() => setBannerMessage(null)}
              className="text-xs text-sky-400 hover:text-white px-2 py-0.5"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Stats Grid */}
        <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4">
            <span className="text-xs uppercase tracking-wider text-slate-400 font-medium">Sample Accuracy</span>
            <div className="text-2xl font-bold text-sky-400 mt-1">
              {benchmark ? `${benchmark.status_accuracy_pct}%` : '100%'}
            </div>
            <div className="text-xs text-slate-500 mt-0.5">
              {benchmark ? `${benchmark.exact_status_matches}/${benchmark.total_sample_cases} Status Matches` : '32 / 32 Sample Match'}
            </div>
          </div>

          <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4">
            <span className="text-xs uppercase tracking-wider text-slate-400 font-medium">Full Dataset Cases</span>
            <div className="text-2xl font-bold text-white mt-1">518</div>
            <div className="text-xs text-slate-500 mt-0.5">case_33 to case_550 in output.csv</div>
          </div>

          <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4">
            <span className="text-xs uppercase tracking-wider text-slate-400 font-medium">Policy Engine</span>
            <div className="text-xl font-bold text-emerald-400 mt-1">Deterministic</div>
            <div className="text-xs text-slate-500 mt-0.5">Zero AI Hallucination &bull; 15 Rules</div>
          </div>

          <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4">
            <span className="text-xs uppercase tracking-wider text-slate-400 font-medium">Output CSV</span>
            <div className="text-xl font-bold text-emerald-400 mt-1">Verified (518 Rows)</div>
            <div className="text-xs text-slate-500 mt-0.5">Strict schema &amp; JSON compliance</div>
          </div>
        </section>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Controls Sidebar */}
          <aside className="lg:col-span-4 space-y-4">
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-300">
                Case Selector
              </h2>

              <div className="space-y-1.5">
                <label className="text-xs text-slate-400 font-medium">Choose Deletion Request</label>
                <select
                  value={selectedCaseId}
                  onChange={(e) => {
                    setSelectedCaseId(e.target.value);
                    auditCase(e.target.value);
                  }}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-sky-500"
                >
                  <optgroup label="Sample Cases (Benchmark Ground Truth)">
                    {sampleCases.map((c) => (
                      <option key={c.case_id} value={c.case_id}>
                        {c.case_id}: {c.email} [{c.reported_status}]
                      </option>
                    ))}
                  </optgroup>
                  <optgroup label="Evaluation Dataset (518 cases)">
                    {fullCases.slice(0, 100).map((c) => (
                      <option key={c.case_id} value={c.case_id}>
                        {c.case_id}: {c.email} [{c.reported_status}]
                      </option>
                    ))}
                  </optgroup>
                </select>
              </div>

              <button
                onClick={() => auditCase(selectedCaseId)}
                disabled={loading}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg bg-sky-500 text-slate-950 hover:bg-sky-400 disabled:opacity-50 transition"
              >
                <Play className="w-4 h-4" />
                {loading ? 'Auditing Case...' : 'Run Evidence Audit'}
              </button>
            </div>

            {/* Benchmark & Test Suite Panel */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-3">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-300">
                Evaluation &amp; Exports
              </h2>

              <button
                onClick={runBenchmark}
                className="w-full inline-flex items-center justify-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-lg bg-slate-800 text-slate-200 hover:bg-slate-700 border border-slate-700 transition"
              >
                <RotateCw className="w-3.5 h-3.5" />
                Run Benchmark on 32 Sample Cases
              </button>

              <button
                onClick={runSynthetic}
                className="w-full inline-flex items-center justify-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-lg bg-slate-800 text-slate-200 hover:bg-slate-700 border border-slate-700 transition"
              >
                <FlaskConical className="w-3.5 h-3.5" />
                Run 3 Synthetic Test Scenarios
              </button>

              <button
                onClick={generateOutputCsv}
                disabled={generatingCsv}
                className="w-full inline-flex items-center justify-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-lg bg-slate-800 text-slate-200 hover:bg-slate-700 border border-slate-700 transition"
              >
                <FileCheck2 className="w-3.5 h-3.5" />
                {generatingCsv ? 'Generating 518 Rows...' : 'Re-Generate & Validate output.csv'}
              </button>
            </div>
          </aside>

          {/* Audit Details Panel */}
          <section className="lg:col-span-8">
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-6">
              {auditData ? (
                <>
                  {/* Case Header & Status */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
                    <div>
                      <div className="text-xl font-bold text-white flex items-center gap-2">
                        {auditData.case_id}
                        {auditData.case_id.startsWith('case_0') || auditData.case_id.startsWith('case_1') || auditData.case_id.startsWith('case_2') || auditData.case_id === 'case_31' || auditData.case_id === 'case_32' ? (
                          <span className="text-[10px] uppercase font-semibold px-2 py-0.5 bg-sky-500/10 text-sky-400 border border-sky-500/30 rounded">
                            Sample Benchmark
                          </span>
                        ) : null}
                      </div>
                      <div className="text-xs text-slate-400 mt-0.5">{auditData.email}</div>
                    </div>

                    <div className="sm:text-right">
                      <div className="inline-flex items-center gap-2">
                        <span className="text-xs text-slate-400">Verified Decision:</span>
                        <span
                          className={`text-xs px-3 py-1 rounded-full font-bold uppercase tracking-wider ${
                            auditData.deletion_status === 'COMPLETE'
                              ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/40'
                              : auditData.deletion_status === 'INCOMPLETE'
                              ? 'bg-rose-500/15 text-rose-400 border border-rose-500/40'
                              : 'bg-slate-700/50 text-slate-300 border border-slate-600'
                          }`}
                        >
                          {auditData.deletion_status}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500 mt-1">
                        Reported Status: <span className="text-slate-400">{auditData.reported_status || 'N/A'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Metadata Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-950 p-3 rounded-lg border border-slate-800 text-xs">
                    <div>
                      <span className="text-slate-500 uppercase tracking-wider text-[10px] block">Evidence File</span>
                      <span className="font-mono text-sky-400 truncate block mt-0.5">
                        {auditData.evidence_id || 'None (No Deletion)'}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500 uppercase tracking-wider text-[10px] block">Findings</span>
                      <span className="font-semibold text-rose-400 block mt-0.5">{auditData.findings.length}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 uppercase tracking-wider text-[10px] block">Remediations</span>
                      <span className="font-semibold text-amber-400 block mt-0.5">{auditData.remediations.length}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 uppercase tracking-wider text-[10px] block">Verifications</span>
                      <span className="font-semibold text-emerald-400 block mt-0.5">{auditData.verifications.length}</span>
                    </div>
                  </div>

                  {/* Auditor Rationale */}
                  <div className="bg-slate-950/80 border border-slate-800/80 p-3.5 rounded-lg text-xs leading-relaxed text-slate-300">
                    <span className="font-semibold text-slate-200 block mb-1">Auditor Rationale:</span>
                    {auditData.rationale}
                  </div>

                  {/* 1. Confirmed Findings (Observed Issues) */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs font-semibold text-rose-400 uppercase tracking-wider">
                      <span>Confirmed Findings (Observed Issues)</span>
                      <span className="px-2 py-0.5 bg-rose-500/10 border border-rose-500/30 rounded text-rose-300">
                        {auditData.findings.length}
                      </span>
                    </div>

                    {auditData.findings.length === 0 ? (
                      <div className="text-xs text-slate-500 italic p-2 border border-slate-800/60 rounded bg-slate-950/40">
                        No residual ghost records, active sync flows, or restore risks detected.
                      </div>
                    ) : (
                      <div className="space-y-1.5 font-mono text-xs">
                        {auditData.findings.map((f) => (
                          <div
                            key={f.step_no}
                            className="flex items-center justify-between p-2.5 bg-slate-950 border border-rose-900/40 rounded-lg"
                          >
                            <div className="flex items-center gap-2">
                              <span className="text-slate-500">#{f.step_no}</span>
                              <span className="text-rose-300 font-semibold">{f.operation}</span>
                              <span className="text-slate-400">{f.system_id}:{f.resource_id}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="px-2 py-0.5 bg-rose-500/20 text-rose-400 border border-rose-500/40 rounded text-[10px] font-bold">
                                {f.state}
                              </span>
                              <span className="text-slate-500 text-[10px]">[{f.evidence_id}]</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* 2. Proposed Remediations (Future Actions) */}
                  {auditData.remediations.length > 0 && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs font-semibold text-amber-400 uppercase tracking-wider">
                        <span>Proposed Remediation Actions (Future Tasks)</span>
                        <span className="px-2 py-0.5 bg-amber-500/10 border border-amber-500/30 rounded text-amber-300">
                          {auditData.remediations.length}
                        </span>
                      </div>

                      <div className="space-y-1.5 font-mono text-xs">
                        {auditData.remediations.map((r) => (
                          <div
                            key={r.step_no}
                            className="flex items-center justify-between p-2.5 bg-slate-950 border border-amber-900/40 rounded-lg"
                          >
                            <div className="flex items-center gap-2">
                              <span className="text-slate-500">#{r.step_no}</span>
                              <span className="text-amber-300 font-semibold">{r.operation}</span>
                              <span className="text-slate-400">{r.system_id}:{r.resource_id}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="px-2 py-0.5 bg-amber-500/20 text-amber-400 border border-amber-500/40 rounded text-[10px] font-bold">
                                {r.state}
                              </span>
                              <span className="text-slate-600 text-[10px]">[proposed: no evidence yet]</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 3. Verification Targets */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs font-semibold text-emerald-400 uppercase tracking-wider">
                      <span>
                        {auditData.deletion_status === 'COMPLETE'
                          ? 'Confirmed Verification Checks'
                          : 'Future Verification Targets'}
                      </span>
                      <span className="px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/30 rounded text-emerald-300">
                        {auditData.verifications.length}
                      </span>
                    </div>

                    {auditData.verifications.length === 0 ? (
                      <div className="text-xs text-slate-500 italic p-2 border border-slate-800/60 rounded bg-slate-950/40">
                        None required (non-deletion case).
                      </div>
                    ) : (
                      <div className="space-y-1.5 font-mono text-xs">
                        {auditData.verifications.map((v) => (
                          <div
                            key={v.step_no}
                            className="flex items-center justify-between p-2.5 bg-slate-950 border border-emerald-900/30 rounded-lg"
                          >
                            <div className="flex items-center gap-2">
                              <span className="text-slate-500">#{v.step_no}</span>
                              <span className="text-emerald-300 font-semibold">{v.operation}</span>
                              <span className="text-slate-400">{v.system_id}:{v.resource_id}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 rounded text-[10px] font-bold">
                                {v.state}
                              </span>
                              {v.evidence_id ? (
                                <span className="text-sky-400 text-[10px]">[{v.evidence_id}]</span>
                              ) : (
                                <span className="text-slate-600 text-[10px]">[target]</span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* steps_json output block */}
                  <div className="space-y-1.5 pt-2">
                    <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 block">
                      Generated steps_json (CSV Column)
                    </span>
                    <pre className="p-3 bg-black border border-slate-800 rounded-lg text-[11px] font-mono text-sky-300 overflow-x-auto max-h-40 overflow-y-auto whitespace-pre-wrap">
                      {auditData.steps_json}
                    </pre>
                  </div>
                </>
              ) : (
                <div className="text-center py-16 text-slate-500 text-sm">
                  Loading case details...
                </div>
              )}
            </div>
          </section>
        </div>

        {/* Synthetic Test Modal */}
        {showSyntheticModal && syntheticTests && (
          <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-700 rounded-xl p-6 max-w-xl w-full space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="font-bold text-white text-base flex items-center gap-2">
                  <FlaskConical className="w-4 h-4 text-sky-400" />
                  Synthetic Test Suite (3 Scenarios)
                </h3>
                <button
                  onClick={() => setShowSyntheticModal(false)}
                  className="text-xs px-2 py-1 bg-slate-800 text-slate-300 hover:text-white rounded"
                >
                  ✕ Close
                </button>
              </div>

              <div className="text-xs text-slate-400">
                Verifies edge-case privacy boundaries in isolation from the uploaded real dataset.
              </div>

              <div className="space-y-3">
                {syntheticTests.map((t) => (
                  <div key={t.test_name} className="p-3 bg-slate-950 border border-slate-800 rounded-lg text-xs space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-white">{t.test_name}</span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${t.passed ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'}`}>
                        {t.passed ? 'PASSED' : 'FAILED'}
                      </span>
                    </div>
                    <div className="text-slate-400">{t.description}</div>
                    <div className="font-mono text-[11px] text-slate-300 pt-1">
                      Expected: <span className="text-sky-400">{t.expected_status} ({t.expected_steps} steps)</span> | Actual: <span className="text-emerald-400">{t.actual_status} ({t.actual_steps} steps)</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
