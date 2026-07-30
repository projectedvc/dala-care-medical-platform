"use client";

import { useMemo, useState } from "react";
import { ClinicalStudy, clinicalStudies } from "../clinical-data";

const stages = ["Incoming", "Validated", "AI analyzed", "Draft ready", "Signed"];

export default function StudiesPage() {
  const [selected, setSelected] = useState<ClinicalStudy>(clinicalStudies[0]);
  const [filter, setFilter] = useState("All");
  const [query, setQuery] = useState("");
  const [uploadOpen, setUploadOpen] = useState(false);
  const [analysisState, setAnalysisState] = useState<"idle" | "running" | "complete">("idle");

  const studies = useMemo(
    () =>
      clinicalStudies.filter((study) => {
        const matchesFilter =
          filter === "All" ||
          (filter === "Priority" && study.priority !== "Routine") ||
          study.modality === filter ||
          study.status === filter;
        const haystack = `${study.patient} ${study.mrn} ${study.accession} ${study.modality} ${study.region}`.toLowerCase();
        return matchesFilter && haystack.includes(query.toLowerCase());
      }),
    [filter, query],
  );

  const runAnalysis = () => {
    setAnalysisState("running");
    window.setTimeout(() => setAnalysisState("complete"), 850);
  };

  return (
    <div className="portal-page studies-page">
      <div className="portal-heading">
        <div>
          <p>Clinical studies</p>
          <h1>Every study, ready for review.</h1>
          <span>Ingest images, validate quality, review AI evidence and hand the final decision back to the clinician.</span>
        </div>
        <button className="primary-portal-button" type="button" onClick={() => setUploadOpen(true)}>
          <b>+</b> Upload study
        </button>
      </div>

      <section className="study-pipeline" aria-label="Study workflow">
        {stages.map((stage, index) => (
          <article key={stage}>
            <i>{String(index + 1).padStart(2, "0")}</i>
            <div><small>{stage}</small><strong>{[2, 3, 4, 2, 18][index]}</strong></div>
            {index < stages.length - 1 && <span>→</span>}
          </article>
        ))}
      </section>

      <div className="study-toolbar">
        <label><span>⌕</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Patient, MRN or accession" /></label>
        <div>
          {["All", "Priority", "CT", "MR", "XR", "US"].map((item) => (
            <button type="button" key={item} className={filter === item ? "is-active" : ""} onClick={() => setFilter(item)}>{item}</button>
          ))}
        </div>
        <button type="button">Today ↓</button>
      </div>

      <div className="studies-workspace">
        <section className="study-worklist">
          <div className="study-list-head">
            <span>Patient / Study</span><span>Received</span><span>Priority</span><span>Status</span>
          </div>
          {studies.map((study) => (
            <button
              type="button"
              key={study.id}
              className={`study-row ${selected.id === study.id ? "is-selected" : ""}`}
              onClick={() => {
                setSelected(study);
                setAnalysisState("idle");
              }}
            >
              <span className="study-patient">
                <i>{study.initials}</i>
                <b>{study.patient}<small>{study.modality} · {study.region} · {study.accession}</small></b>
              </span>
              <span>{study.received}<small>{study.slices} images</small></span>
              <span><em className={`priority-chip ${study.priority.toLowerCase()}`}>{study.priority}</em></span>
              <span><em className={`study-status ${study.status.toLowerCase().replaceAll(" ", "-")}`}>{study.status}</em></span>
            </button>
          ))}
        </section>

        <aside className="study-review">
          <div className="study-review-head">
            <div><small>{selected.id}</small><strong>{selected.patient}</strong><span>MRN {selected.mrn} · {selected.age} years</span></div>
            <button type="button">•••</button>
          </div>

          <div className="scan-viewer" aria-label={`${selected.modality} ${selected.region} preview`}>
            <div className={`scan-anatomy modality-${selected.modality.toLowerCase()}`}>
              <i className="scan-ring ring-one" />
              <i className="scan-ring ring-two" />
              <i className="scan-ring ring-three" />
              <span className="scan-focus" />
            </div>
            <div className="scan-overlay top-left">{selected.modality} · {selected.region}<small>{selected.accession}</small></div>
            <div className="scan-overlay top-right">SE 3 / IM 124<small>W 350 · L 40</small></div>
            <div className="scan-scrubber"><i style={{ width: "47%" }} /><span>124 / {selected.slices}</span></div>
          </div>

          <div className="study-meta-grid">
            <div><small>Clinical indication</small><p>{selected.indication}</p></div>
            <div><small>Requested by</small><p>{selected.requestedBy}</p></div>
          </div>

          <div className="study-ai-card">
            <div className="study-ai-title">
              <span className="ai-orb">AI</span>
              <div><small>Dala imaging analysis</small><strong>Clinician verification required</strong></div>
              <em>{analysisState === "running" ? "Analyzing…" : analysisState === "complete" ? "Updated" : selected.status}</em>
            </div>
            {analysisState === "running" ? (
              <div className="analysis-progress"><i /><span>Reviewing image series and prior studies…</span></div>
            ) : (
              <>
                <p>{selected.aiFinding}</p>
                <div className="evidence-chips">
                  {selected.evidence.map((item) => <button type="button" key={item}>{item}</button>)}
                </div>
              </>
            )}
          </div>

          <div className="study-review-actions">
            <button type="button" onClick={runAnalysis}>{analysisState === "complete" ? "Run again" : "Run AI analysis"}</button>
            <button type="button">Open report workspace →</button>
          </div>
        </aside>
      </div>

      {uploadOpen && (
        <div className="portal-modal" role="dialog" aria-modal="true" aria-label="Upload clinical study">
          <button className="modal-backdrop" type="button" aria-label="Close upload" onClick={() => setUploadOpen(false)} />
          <section>
            <div className="modal-heading"><div><small>New study</small><h2>Upload clinical images</h2></div><button type="button" onClick={() => setUploadOpen(false)}>×</button></div>
            <div className="upload-dropzone">
              <span>+</span><strong>Drop DICOM, JPEG or PNG files</strong><small>Files remain inside the protected clinical workspace</small>
              <button type="button">Choose files</button>
            </div>
            <div className="upload-fields">
              <label><span>Patient MRN</span><input defaultValue="00842" /></label>
              <label><span>Study type</span><select defaultValue="CT"><option>CT</option><option>MR</option><option>XR</option><option>US</option></select></label>
              <label><span>Clinical note</span><textarea defaultValue="Follow-up imaging for new clinical symptoms." /></label>
            </div>
            <button className="auth-submit" type="button" onClick={() => setUploadOpen(false)}>Validate and create study <span>→</span></button>
          </section>
        </div>
      )}
    </div>
  );
}
