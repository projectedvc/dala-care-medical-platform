"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

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
          <span>Clinical intelligence</span>
          <strong>01 / Connected care</strong>
        </div>
        <div className="auth-visual" aria-hidden="true">
          <div className="auth-heart">+</div>
          <i className="signal-ring ring-a" />
          <i className="signal-ring ring-b" />
          <i className="signal-ring ring-c" />
          <span className="signal-node node-a">Vitals</span>
          <span className="signal-node node-b">Labs</span>
          <span className="signal-node node-c">Imaging</span>
        </div>
        <div className="auth-story-copy">
          <p>Every clinical signal becomes part of the same patient story.</p>
          <span>Dala Care brings records, research and live care into one protected workspace for clinicians.</span>
        </div>
      </aside>

      <div className="auth-footer">
        <span>© 2026 Dala Care</span>
        <span>Privacy · Clinical safety · Support</span>
      </div>
    </main>
  );
}
