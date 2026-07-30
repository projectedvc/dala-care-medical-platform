import Link from "next/link";

const patients = [
  { initials: "EM", name: "Elena Markova", age: 42, focus: "Palpitations", status: "Review", risk: "Moderate", time: "10:30" },
  { initials: "AT", name: "Arman Tulegenov", age: 58, focus: "Hypertension", status: "Stable", risk: "Low", time: "11:20" },
  { initials: "SO", name: "Sofia Omarova", age: 35, focus: "Migraine", status: "New data", risk: "Moderate", time: "13:40" },
  { initials: "DB", name: "Daniyar Bek", age: 67, focus: "Post-discharge", status: "Priority", risk: "High", time: "15:10" },
];

export default function PortalOverview() {
  return (
    <div className="portal-page">
      <div className="portal-heading">
        <div>
          <p>Thursday, 30 July</p>
          <h1>Good afternoon, Dr. Williams.</h1>
          <span>Your clinical day is ready. Two cases need review before the next visit.</span>
        </div>
        <div className="system-status">
          <i />
          <div><small>Workspace status</small><strong>All systems connected</strong></div>
        </div>
      </div>

      <section className="metric-grid" aria-label="Today at a glance">
        <article>
          <span className="metric-icon cyan">PT</span>
          <div><small>Patients today</small><strong>12</strong><em>3 remaining</em></div>
          <b>+8%</b>
        </article>
        <article>
          <span className="metric-icon violet">AI</span>
          <div><small>AI case briefs</small><strong>7</strong><em>2 need review</em></div>
          <b>Live</b>
        </article>
        <article>
          <span className="metric-icon coral">AL</span>
          <div><small>Priority alerts</small><strong>3</strong><em>1 high risk</em></div>
          <b>Action</b>
        </article>
        <article>
          <span className="metric-icon green">FU</span>
          <div><small>Follow-ups due</small><strong>9</strong><em>Across 4 pathways</em></div>
          <b>Today</b>
        </article>
      </section>

      <div className="portal-dashboard-grid">
        <section className="next-consult-card">
          <div className="card-heading">
            <div><span>Next consultation</span><strong>Starts in 18 min</strong></div>
            <Link href="/portal/appointments">Full schedule ↗</Link>
          </div>
          <div className="next-patient">
            <div className="patient-avatar">EM</div>
            <div>
              <small>10:30 · Video consultation</small>
              <h2>Elena Markova</h2>
              <p>42 years · Cardiology follow-up</p>
            </div>
            <button type="button">Open room <span>↗</span></button>
          </div>
          <div className="case-context">
            <div>
              <small>Visit focus</small>
              <p>Palpitations after recent medication adjustment</p>
            </div>
            <div>
              <small>New since last visit</small>
              <p>ECG result · 6 days of wearable data · symptom journal</p>
            </div>
          </div>
          <div className="ai-brief">
            <span className="ai-orb">AI</span>
            <div>
              <small>Dala clinical brief</small>
              <p>No red-flag rhythm events detected. Sleep disruption correlates with symptom peaks. Review dose timing and caffeine intake.</p>
            </div>
            <Link href="/portal/research">Review evidence</Link>
          </div>
        </section>

        <aside className="clinical-feed">
          <div className="card-heading">
            <div><span>Clinical activity</span><strong>Live updates</strong></div>
            <button type="button">•••</button>
          </div>
          <div className="feed-list">
            <article>
              <i className="feed-dot coral" />
              <div><strong>High-risk flag added</strong><p>Daniyar Bek · Post-discharge pathway</p><small>8 minutes ago</small></div>
            </article>
            <article>
              <i className="feed-dot cyan" />
              <div><strong>New lab result</strong><p>Sofia Omarova · Ferritin panel</p><small>24 minutes ago</small></div>
            </article>
            <article>
              <i className="feed-dot violet" />
              <div><strong>AI brief prepared</strong><p>Elena Markova · 12 sources connected</p><small>31 minutes ago</small></div>
            </article>
            <article>
              <i className="feed-dot green" />
              <div><strong>Care plan completed</strong><p>Arman Tulegenov · Hypertension</p><small>1 hour ago</small></div>
            </article>
          </div>
        </aside>
      </div>

      <section className="patient-queue">
        <div className="card-heading">
          <div><span>Today&apos;s patient queue</span><strong>Prioritized by clinical need</strong></div>
          <Link href="/portal/patients">Open patient CRM ↗</Link>
        </div>
        <div className="queue-table">
          <div className="queue-row queue-head">
            <span>Patient</span><span>Clinical focus</span><span>Status</span><span>Risk</span><span>Time</span><span />
          </div>
          {patients.map((patient) => (
            <div className="queue-row" key={patient.name}>
              <span className="patient-cell"><i>{patient.initials}</i><b>{patient.name}<small>{patient.age} years</small></b></span>
              <span>{patient.focus}</span>
              <span><em className={`status-chip ${patient.status.toLowerCase().replace(" ", "-")}`}>{patient.status}</em></span>
              <span><em className={`risk-label ${patient.risk.toLowerCase()}`}>{patient.risk}</em></span>
              <span>{patient.time}</span>
              <span><button type="button">Open ↗</button></span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
