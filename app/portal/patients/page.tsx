"use client";

import { useMemo, useState } from "react";

const patientData = [
  { initials: "EM", name: "Elena Markova", id: "00842", age: 42, pathway: "Cardiology", status: "Active", risk: "Moderate", next: "Today · 10:30", note: "Wearable review" },
  { initials: "AT", name: "Arman Tulegenov", id: "00611", age: 58, pathway: "Hypertension", status: "Monitoring", risk: "Low", next: "Today · 11:20", note: "BP follow-up" },
  { initials: "SO", name: "Sofia Omarova", id: "00918", age: 35, pathway: "Neurology", status: "New results", risk: "Moderate", next: "Today · 13:40", note: "Ferritin panel" },
  { initials: "DB", name: "Daniyar Bek", id: "00407", age: 67, pathway: "Post-discharge", status: "Priority", risk: "High", next: "Today · 15:10", note: "Dyspnea reported" },
  { initials: "AK", name: "Amina Kassen", id: "00874", age: 29, pathway: "Primary care", status: "Stable", risk: "Low", next: "31 Jul · 09:00", note: "Annual review" },
  { initials: "RK", name: "Ruslan Karimov", id: "00732", age: 51, pathway: "Endocrinology", status: "Active", risk: "Moderate", next: "1 Aug · 14:20", note: "HbA1c review" },
];

export default function PatientCrm() {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All");
  const [selected, setSelected] = useState(patientData[0]);

  const patients = useMemo(() => patientData.filter((patient) => {
    const matchesSearch = `${patient.name} ${patient.id} ${patient.pathway}`.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = filter === "All" || patient.risk === filter;
    return matchesSearch && matchesFilter;
  }), [search, filter]);

  return (
    <div className="portal-page patients-page">
      <div className="portal-heading">
        <div>
          <p>Patient CRM</p>
          <h1>Every patient, one continuous story.</h1>
          <span>Manage clinical relationships, pathways, appointments and follow-up from a single workspace.</span>
        </div>
        <button className="primary-portal-button" type="button"><b>+</b> Add patient</button>
      </div>

      <div className="crm-toolbar">
        <label><span>⌕</span><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search by name, MRN or pathway" /></label>
        <div>
          {["All", "High", "Moderate", "Low"].map((item) => (
            <button key={item} type="button" className={filter === item ? "is-active" : ""} onClick={() => setFilter(item)}>{item}</button>
          ))}
        </div>
        <button type="button">Filters <span>2</span></button>
      </div>

      <div className="crm-layout">
        <section className="crm-list">
          <div className="crm-list-head">
            <span>Patient</span><span>Pathway</span><span>Status</span><span>Risk</span><span>Next touchpoint</span>
          </div>
          {patients.map((patient) => (
            <button
              className={`crm-patient-row ${selected.id === patient.id ? "is-selected" : ""}`}
              type="button"
              key={patient.id}
              onClick={() => setSelected(patient)}
            >
              <span className="patient-cell"><i>{patient.initials}</i><b>{patient.name}<small>MRN {patient.id} · {patient.age} y</small></b></span>
              <span>{patient.pathway}</span>
              <span><em className={`status-chip ${patient.status.toLowerCase().replace(" ", "-")}`}>{patient.status}</em></span>
              <span><em className={`risk-label ${patient.risk.toLowerCase()}`}>{patient.risk}</em></span>
              <span><b>{patient.next}</b><small>{patient.note}</small></span>
            </button>
          ))}
        </section>

        <aside className="patient-detail">
          <div className="detail-profile">
            <i>{selected.initials}</i>
            <div><h2>{selected.name}</h2><span>MRN {selected.id} · {selected.age} years</span></div>
            <button type="button">•••</button>
          </div>
          <div className="detail-badges">
            <em className={`risk-label ${selected.risk.toLowerCase()}`}>{selected.risk} risk</em>
            <span>{selected.pathway}</span>
          </div>
          <div className="detail-section">
            <div><small>Last contact</small><strong>28 July · Video visit</strong></div>
            <div><small>Primary clinician</small><strong>Dr. Noah Williams</strong></div>
          </div>
          <div className="detail-section care-progress">
            <span>Care pathway</span>
            <div><i className="is-done" /><p><strong>Initial assessment</strong><small>Completed 12 Jul</small></p></div>
            <div><i className="is-done" /><p><strong>Diagnostics</strong><small>ECG and labs complete</small></p></div>
            <div><i className="is-active" /><p><strong>Treatment review</strong><small>Next consultation today</small></p></div>
            <div><i /><p><strong>Outcome check</strong><small>Planned in 14 days</small></p></div>
          </div>
          <div className="detail-alert">
            <span>AI</span>
            <div><strong>New context available</strong><p>Six days of wearable data can be added to today&apos;s consultation brief.</p></div>
          </div>
          <div className="detail-actions">
            <button type="button">Open record</button>
            <button type="button">Start research</button>
          </div>
        </aside>
      </div>
    </div>
  );
}
