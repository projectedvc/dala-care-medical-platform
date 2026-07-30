"use client";

import { useState } from "react";

const prompts = [
  "Summarize the differential diagnosis",
  "Compare current treatment guidelines",
  "Find contraindications in this record",
];

export default function ResearchWorkspace() {
  const [query, setQuery] = useState("Could the recent medication adjustment explain Elena’s palpitations?");
  const [answerVisible, setAnswerVisible] = useState(true);
  const [selectedSources, setSelectedSources] = useState(["record", "guidelines", "journals"]);

  const toggleSource = (source: string) => {
    setSelectedSources((current) =>
      current.includes(source) ? current.filter((item) => item !== source) : [...current, source],
    );
  };

  const runResearch = () => {
    setAnswerVisible(false);
    window.setTimeout(() => setAnswerVisible(true), 520);
  };

  return (
    <div className="portal-page research-page">
      <div className="portal-heading research-heading">
        <div>
          <p>AI Research</p>
          <h1>Clinical evidence, in context.</h1>
          <span>Ask a clinical question and review the reasoning, sources and patient-specific constraints.</span>
        </div>
        <div className="research-safety">
          <span>AI</span>
          <div><small>Decision support only</small><strong>Clinician review required</strong></div>
        </div>
      </div>

      <div className="research-workspace">
        <aside className="research-context">
          <div className="card-heading">
            <div><span>Active patient</span><strong>Research context</strong></div>
            <button type="button">Change</button>
          </div>
          <div className="context-patient">
            <i>EM</i>
            <div><strong>Elena Markova</strong><span>42 · MRN 00842</span></div>
            <em>Moderate</em>
          </div>
          <div className="context-block">
            <small>Clinical question</small>
            <p>Intermittent palpitations after metoprolol dose adjustment.</p>
          </div>
          <div className="context-vitals">
            <div><span>HR</span><strong>72</strong><small>bpm</small></div>
            <div><span>BP</span><strong>118/76</strong><small>mmHg</small></div>
            <div><span>SpO₂</span><strong>98</strong><small>%</small></div>
          </div>
          <div className="context-block">
            <small>Relevant timeline</small>
            <ul>
              <li><span>24 Jul</span>Metoprolol adjusted to 25 mg</li>
              <li><span>26 Jul</span>Wearable rhythm capture added</li>
              <li><span>29 Jul</span>ECG: normal sinus rhythm</li>
            </ul>
          </div>
          <button className="context-record-button" type="button">Open complete record ↗</button>
        </aside>

        <section className="research-main">
          <div className="research-composer">
            <div className="composer-label">
              <span><i /> Ask Dala Clinical</span>
              <small>Patient identifiers remain inside the protected workspace</small>
            </div>
            <textarea value={query} onChange={(event) => setQuery(event.target.value)} aria-label="Clinical research question" />
            <div className="source-row">
              <div>
                {[
                  ["record", "Patient record"],
                  ["guidelines", "Guidelines"],
                  ["journals", "Peer-reviewed"],
                ].map(([key, label]) => (
                  <button
                    key={key}
                    type="button"
                    className={selectedSources.includes(key) ? "is-selected" : ""}
                    onClick={() => toggleSource(key)}
                  >
                    <i /> {label}
                  </button>
                ))}
              </div>
              <button className="run-research" type="button" onClick={runResearch}>
                Research <span>↗</span>
              </button>
            </div>
          </div>

          <div className={`research-answer ${answerVisible ? "is-visible" : "is-loading"}`}>
            <div className="answer-heading">
              <div><span className="ai-orb">AI</span><strong>Evidence synthesis</strong></div>
              <div><button type="button">Copy</button><button type="button">Save to note</button></div>
            </div>
            {answerVisible ? (
              <>
                <p className="answer-summary">
                  The timing makes the medication adjustment a plausible contributor, but the available evidence does not establish it as the sole cause.
                </p>
                <div className="answer-section">
                  <h2>Clinical interpretation</h2>
                  <p>
                    Metoprolol can change heart-rate awareness and symptom perception, while rebound symptoms are more typical after abrupt withdrawal than dose reduction.
                    Elena&apos;s ECG is reassuring, and the wearable record shows no sustained tachyarrhythmia. The strongest association in the current record is between symptom peaks,
                    sleep disruption and caffeine exposure.
                  </p>
                </div>
                <div className="answer-grid">
                  <article>
                    <span>Supports medication link</span>
                    <ul>
                      <li>Symptoms began within 48 hours of dose change</li>
                      <li>Resting heart rate increased from baseline</li>
                      <li>No prior episode in the last six months</li>
                    </ul>
                  </article>
                  <article>
                    <span>Factors against</span>
                    <ul>
                      <li>No sustained rhythm event recorded</li>
                      <li>Symptoms cluster after poor sleep</li>
                      <li>Thyroid and electrolyte panels normal</li>
                    </ul>
                  </article>
                </div>
                <div className="suggested-next-step">
                  <span>Suggested clinician review</span>
                  <p>Confirm adherence and dose timing, review caffeine intake, correlate two additional weeks of symptom and wearable data, and provide red-flag return precautions.</p>
                </div>
                <div className="evidence-list">
                  <div className="evidence-title"><span>Sources used</span><strong>6 references</strong></div>
                  <a href="#" onClick={(event) => event.preventDefault()}><b>1</b><span>2024 ESC Guidelines for atrial fibrillation management</span><em>Guideline</em></a>
                  <a href="#" onClick={(event) => event.preventDefault()}><b>2</b><span>Beta-blocker withdrawal and dose-response review</span><em>Journal</em></a>
                  <a href="#" onClick={(event) => event.preventDefault()}><b>3</b><span>Elena M. longitudinal medication and symptom timeline</span><em>Patient record</em></a>
                </div>
              </>
            ) : (
              <div className="research-loading">
                <div className="research-vital-loader" aria-hidden="true">
                  <span>AI</span>
                  <svg viewBox="0 0 300 52">
                    <path d="M0 28h58l10-2 8-17 12 35 13-42 14 47 14-23h52l8-1 9-12 11 24 12-31 14 37 12-17h33" />
                  </svg>
                </div>
                <strong>Connecting patient context</strong>
                <span>Reviewing longitudinal record and clinical evidence…</span>
                <div className="research-loader-steps">
                  <i>01 · Record</i><i>02 · Evidence</i><i>03 · Synthesis</i>
                </div>
              </div>
            )}
          </div>

          <div className="prompt-suggestions">
            <span>Continue exploring</span>
            <div>
              {prompts.map((prompt) => (
                <button key={prompt} type="button" onClick={() => setQuery(prompt)}>{prompt} ↗</button>
              ))}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
