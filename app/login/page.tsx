"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { CSSProperties, FormEvent, useState } from "react";

const anatomyParticles = Array.from({ length: 84 }, (_, index) => {
  const column = (index * 37) % 101;
  const row = (index * 61) % 97;
  const size = 1.5 + ((index * 17) % 5) * 0.65;
  const duration = 6.5 + ((index * 23) % 8) * 0.7;

  return {
    x: `${column}%`,
    y: `${row}%`,
    size: `${size}px`,
    duration: `${duration}s`,
    delay: `${-((index * 29) % 90) / 10}s`,
    tone: index % 9 === 0 ? "violet" : index % 5 === 0 ? "green" : "cyan",
  };
});

export default function LoginPage() {
  const router = useRouter();
  const [role, setRole] = useState<"doctor" | "staff">("doctor");
  const [loading, setLoading] = useState(false);

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    window.setTimeout(() => router.push("/portal"), 520);
  };

  return (
    <main className="auth-page">
      <div className="auth-ambient" aria-hidden="true"><i /><i /><i /></div>
      <Link className="auth-brand" href="/">
        <span>+</span>
        <strong>dala care</strong>
      </Link>

      <section className="auth-card">
        <div className="auth-card-heading">
          <p>Protected clinical workspace</p>
          <h1>Welcome back.</h1>
          <span>Sign in to continue to patient care, research and consultations.</span>
        </div>

        <div className="role-switch" aria-label="Select workspace role">
          <button type="button" className={role === "doctor" ? "is-active" : ""} onClick={() => setRole("doctor")}>
            Doctor
          </button>
          <button type="button" className={role === "staff" ? "is-active" : ""} onClick={() => setRole("staff")}>
            Clinical staff
          </button>
        </div>

        <form onSubmit={submit}>
          <label>
            <span>Clinical email</span>
            <input type="email" defaultValue={role === "doctor" ? "doctor@dala.health" : "coordinator@dala.health"} required />
          </label>
          <label>
            <span>Password</span>
            <input type="password" defaultValue="DalaCare2026!" required />
            <button type="button">Show</button>
          </label>
          <div className="auth-options">
            <label><input type="checkbox" defaultChecked /><span>Keep me signed in</span></label>
            <a href="#" onClick={(event) => event.preventDefault()}>Forgot password?</a>
          </div>
          <button className="auth-submit" type="submit" disabled={loading}>
            {loading ? "Opening workspace…" : "Enter clinical workspace"} <span>↗</span>
          </button>
        </form>

        <div className="auth-security">
          <span className="privacy-pulse" />
          <p><strong>Demo access</strong>This interface contains fictional patient data. Production identity and permissions will be connected with the backend.</p>
        </div>
      </section>

      <aside className="auth-story">
        <div className="auth-story-top">
          <span>Patient digital twin</span>
          <strong>01 / Whole-person view</strong>
        </div>
        <div className="auth-visual" aria-hidden="true">
          <div className="auth-particle-field">
            {anatomyParticles.map((particle, index) => (
              <i
                key={index}
                className={`auth-particle auth-particle-${particle.tone}`}
                style={{
                  "--particle-x": particle.x,
                  "--particle-y": particle.y,
                  "--particle-size": particle.size,
                  "--particle-duration": particle.duration,
                  "--particle-delay": particle.delay,
                } as CSSProperties}
              />
            ))}
          </div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/assets/clinical-human-transparent-v2.png" alt="" />
          <i className="anatomy-aura" />
          <i className="body-scan" />
          <span className="signal-node node-a">Neural</span>
          <span className="signal-node node-b">Cardiac</span>
          <span className="signal-node node-c">Respiratory</span>
          <span className="signal-node node-d">Longitudinal</span>
        </div>
        <div className="auth-story-copy">
          <p>One person.<br />Every clinical signal.</p>
          <span>A protected whole-person view brings records, research and live care into one clinical workspace.</span>
        </div>
      </aside>

      <div className="auth-footer">
        <span>© 2026 Dala Care</span>
        <span>Privacy · Clinical safety · Support</span>
      </div>
    </main>
  );
}
