"use client";

import { useMemo, useState } from "react";
import { clinicalTasks } from "../clinical-data";

export default function TasksPage() {
  const [completed, setCompleted] = useState<number[]>([]);
  const [scope, setScope] = useState("All");
  const tasks = useMemo(
    () => clinicalTasks.filter((task) => scope === "All" || task.owner === scope),
    [scope],
  );

  return (
    <div className="portal-page tasks-page">
      <div className="portal-heading">
        <div>
          <p>Clinical tasks</p>
          <h1>Nothing important falls through.</h1>
          <span>Coordinate reviews, follow-ups and care-team actions with the patient context attached.</span>
        </div>
        <button className="primary-portal-button" type="button"><b>+</b> Create task</button>
      </div>

      <section className="task-summary">
        <article><small>Due today</small><strong>3</strong><span>2 assigned to you</span></article>
        <article><small>Critical</small><strong>1</strong><span>Review now</span></article>
        <article><small>Completed</small><strong>{completed.length}</strong><span>Since 08:00</span></article>
        <article><small>Team response</small><strong>14m</strong><span>Median today</span></article>
      </section>

      <div className="task-toolbar">
        <div>{["All", "You", "Care team", "Pharmacy"].map((item) => <button key={item} type="button" className={scope === item ? "is-active" : ""} onClick={() => setScope(item)}>{item}</button>)}</div>
        <button type="button">Priority ↓</button>
      </div>

      <div className="task-board">
        {["Today", "Upcoming"].map((group) => (
          <section key={group}>
            <div className="card-heading"><div><span>{group}</span><strong>{tasks.filter((task) => task.group === group).length} actions</strong></div></div>
            {tasks.filter((task) => task.group === group).map((task) => {
              const done = completed.includes(task.id);
              return (
                <article className={done ? "is-complete" : ""} key={task.id}>
                  <button type="button" aria-label={`Complete ${task.title}`} onClick={() => setCompleted((current) => done ? current.filter((id) => id !== task.id) : [...current, task.id])}>{done ? "✓" : ""}</button>
                  <div><strong>{task.title}</strong><span>{task.patient}</span></div>
                  <em className={`priority-chip ${task.priority.toLowerCase()}`}>{task.priority}</em>
                  <p><small>Owner</small><strong>{task.owner}</strong></p>
                  <p><small>Due</small><strong>{task.due}</strong></p>
                  <button type="button">Open →</button>
                </article>
              );
            })}
          </section>
        ))}
      </div>
    </div>
  );
}
