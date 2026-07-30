"use client";

import { useState } from "react";

const appointments = [
  { time: "09:00", duration: "30 min", initials: "MA", patient: "Mila Akhmetova", type: "In clinic", focus: "Annual preventive review", status: "Completed" },
  { time: "10:30", duration: "40 min", initials: "EM", patient: "Elena Markova", type: "Video", focus: "Cardiology follow-up", status: "Ready" },
  { time: "11:20", duration: "30 min", initials: "AT", patient: "Arman Tulegenov", type: "Video", focus: "Blood pressure review", status: "Brief ready" },
  { time: "13:40", duration: "45 min", initials: "SO", patient: "Sofia Omarova", type: "In clinic", focus: "Neurology consult", status: "New results" },
  { time: "15:10", duration: "30 min", initials: "DB", patient: "Daniyar Bek", type: "Video", focus: "Post-discharge check", status: "Priority" },
];

export default function AppointmentsPage() {
  const [day, setDay] = useState(30);

  return (
    <div className="portal-page appointments-page">
      <div className="portal-heading">
        <div>
          <p>Appointments</p>
          <h1>Clinical time, clearly organized.</h1>
          <span>Prepare, meet, document and follow up without leaving the patient context.</span>
        </div>
        <button className="primary-portal-button" type="button"><b>+</b> Schedule visit</button>
      </div>

      <div className="calendar-strip">
        <button type="button" aria-label="Previous week">←</button>
        {[28, 29, 30, 31, 1, 2, 3].map((date, index) => (
          <button key={`${date}-${index}`} type="button" className={day === date ? "is-active" : ""} onClick={() => setDay(date)}>
            <small>{["TUE", "WED", "THU", "FRI", "SAT", "SUN", "MON"][index]}</small>
            <strong>{date}</strong>
            {date === 30 && <i />}
          </button>
        ))}
        <button type="button" aria-label="Next week">→</button>
      </div>

      <div className="schedule-layout">
        <section className="day-schedule">
          <div className="card-heading">
            <div><span>Thursday, 30 July</span><strong>5 consultations · 175 clinical minutes</strong></div>
            <button type="button">Day view⌄</button>
          </div>
          <div className="appointment-list">
            {appointments.map((appointment) => (
              <article key={`${appointment.time}-${appointment.patient}`} className={appointment.status === "Completed" ? "is-completed" : ""}>
                <div className="appointment-time"><strong>{appointment.time}</strong><small>{appointment.duration}</small></div>
                <i className={`appointment-line ${appointment.status.toLowerCase().replace(" ", "-")}`} />
                <div className="patient-avatar">{appointment.initials}</div>
                <div className="appointment-info">
                  <small>{appointment.type}</small>
                  <h2>{appointment.patient}</h2>
                  <p>{appointment.focus}</p>
                </div>
                <em className={`status-chip ${appointment.status.toLowerCase().replace(" ", "-")}`}>{appointment.status}</em>
                <div className="appointment-actions">
                  {appointment.status === "Completed" ? (
                    <button type="button">Open note</button>
                  ) : (
                    <>
                      <button type="button">Prepare</button>
                      <button className="join-visit" type="button">{appointment.type === "Video" ? "Join room" : "Open visit"} ↗</button>
                    </>
                  )}
                </div>
              </article>
            ))}
          </div>
        </section>

        <aside className="schedule-insights">
          <div className="insight-date"><small>Next consultation</small><strong>10:30</strong><span>in 18 minutes</span></div>
          <div className="insight-patient">
            <i>EM</i>
            <div><strong>Elena Markova</strong><span>Cardiology follow-up</span></div>
          </div>
          <div className="insight-readiness">
            <span>Visit readiness</span>
            <div><i className="is-ready" /><p><strong>AI brief</strong><small>12 sources reviewed</small></p></div>
            <div><i className="is-ready" /><p><strong>Patient intake</strong><small>Completed this morning</small></p></div>
            <div><i className="is-ready" /><p><strong>New results</strong><small>ECG and wearable data</small></p></div>
          </div>
          <button className="prepare-room-button" type="button">Prepare consultation room ↗</button>
          <div className="schedule-load">
            <div><span>Clinical load</span><strong>74%</strong></div>
            <i><b style={{ width: "74%" }} /></i>
            <p>One 45-minute opening remains after 16:00.</p>
          </div>
        </aside>
      </div>
    </div>
  );
}
