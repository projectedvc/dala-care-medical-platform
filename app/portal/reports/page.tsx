"use client";

import { useState } from "react";
import { reportQueue } from "../clinical-data";

const initialReport = `CLINICAL HISTORY
Intermittent palpitations with new exertional dyspnea.

FINDINGS
The central pulmonary arteries are adequately opacified. No intraluminal filling defect is identified. Mild dependent linear atelectatic change is present at both lung bases. No focal air-space consolidation or pleural effusion. The cardiac silhouette is within expected limits.

IMPRESSION
1. No acute pulmonary embolism.
2. Mild dependent atelectatic change.`;

export default function ReportsPage() {
  const [selected, setSelected] = useState(reportQueue[0]);
  const [report, setReport] = useState(initialReport);
  const [signed, setSigned] = useState(false);

  return (
    <div className="portal-page reports-page">
      <div className="portal-heading">
        <div>
          <p>Reports</p>
          <h1>From evidence to a signed decision.</h1>
          <span>Review AI-assisted drafts, edit findings and sign only when the clinical record is complete.</span>
        </div>
        <div className="research-safety"><span>MD</span><div><small>Final authority</small><strong>Clinician signature required</strong></div></div>
      </div>

      <div className="report-workspace">
        <aside className="report-queue">
          <div className="card-heading"><div><span>Reporting queue</span><strong>{reportQueue.length} active reports</strong></div><button type="button">Filter</button></div>
          {reportQueue.map((item) => (
            <button
              key={item.id}
              type="button"
              className={selected.id === item.id ? "is-selected" : ""}
              onClick={() => {
                setSelected(item);
                setSigned(item.status === "Signed");
              }}
            >
              <span className="report-modality">{item.study.split(" ")[0]}</span>
              <div><strong>{item.patient}</strong><small>{item.study} · {item.id}</small><em>{item.author}</em></div>
              <p><span className={`study-status ${item.status.toLowerCase().replaceAll(" ", "-")}`}>{item.status}</span><small>{item.updated}</small></p>
            </button>
          ))}
        </aside>

        <section className="report-editor">
          <div className="report-editor-top">
            <div><small>{selected.id} · {selected.study}</small><h2>{selected.patient}</h2><span>MRN 00842 · Today 12:41 · Dr. A. Khan</span></div>
            <div><button type="button">Compare prior</button><button type="button">Export</button></div>
          </div>
          <div className="report-editor-body">
            <div className="report-document">
              <div className="document-state"><span className="privacy-pulse" /><strong>{signed ? "Signed report" : "Editable clinical draft"}</strong><small>Autosaved just now</small></div>
              <textarea aria-label="Clinical report" value={report} onChange={(event) => setReport(event.target.value)} readOnly={signed} />
            </div>
            <aside className="report-evidence">
              <div className="report-ai-note">
                <span className="ai-orb">AI</span>
                <div><small>AI provenance</small><strong>Imaging analysis v0.4</strong><p>Draft generated from current study and one prior examination. No unsupported confidence score is displayed.</p></div>
              </div>
              <div className="report-checklist">
                <span>Before signing</span>
                <label><input type="checkbox" defaultChecked /> Patient and study verified</label>
                <label><input type="checkbox" defaultChecked /> Key images reviewed</label>
                <label><input type="checkbox" /> Clinical indication addressed</label>
              </div>
              <div className="report-history"><span>Activity</span><p><i />Draft generated<small>12:48 · Dala Clinical AI</small></p><p><i />Opened for review<small>12:55 · Dr. Williams</small></p></div>
            </aside>
          </div>
          <div className="report-footer">
            <button type="button" onClick={() => setReport(initialReport)}>Restore draft</button>
            <div><button type="button">Save for later</button><button className={signed ? "is-signed" : ""} type="button" onClick={() => setSigned(true)}>{signed ? "Signed ✓" : "Confirm and sign report"}</button></div>
          </div>
        </section>
      </div>
    </div>
  );
}
