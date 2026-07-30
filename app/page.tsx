"use client";

import { useEffect, useState } from "react";
import WebGLMorphScene from "./WebGLMorphScene";

const clinicians = [
  {
    name: "Dr. Amira Khan",
    role: "Cardiology / Preventive care",
    image: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&w=1200&q=88",
  },
  {
    name: "Dr. Noah Williams",
    role: "Internal medicine / Diagnostics",
    image: "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&w=1200&q=88",
  },
  {
    name: "Dr. Sofia Mendes",
    role: "Neurology / Digital health",
    image: "https://images.unsplash.com/photo-1594824476967-48c8b964273f?auto=format&fit=crop&w=1200&q=88",
  },
];

export default function Home() {
  const [activeClinician, setActiveClinician] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [micOn, setMicOn] = useState(true);
  const [cameraOn, setCameraOn] = useState(true);
  const [callEnded, setCallEnded] = useState(false);
  useEffect(() => {
    let frame = 0;
    const updateProgress = () => {
      window.cancelAnimationFrame(frame);
      frame = window.requestAnimationFrame(() => {
        const maximum = document.documentElement.scrollHeight - window.innerHeight;
        setScrollProgress(maximum > 0 ? window.scrollY / maximum : 0);
      });
    };
    window.addEventListener("scroll", updateProgress, { passive: true });
    updateProgress();
    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("scroll", updateProgress);
    };
  }, []);

  const previousClinician = () =>
    setActiveClinician((current) => (current - 1 + clinicians.length) % clinicians.length);
  const nextClinician = () =>
    setActiveClinician((current) => (current + 1) % clinicians.length);

  return (
    <main id="top" className="medical-site">
      <WebGLMorphScene />
      <div className="noise" aria-hidden="true" />
      <div className="scroll-meter" aria-hidden="true">
        <span style={{ transform: `scaleX(${scrollProgress})` }} />
      </div>

      <header className="site-header">
        <a className="brand" href="#top" aria-label="Dala Care home">
          <span className="brand-mark">+</span>
          <span>dala care</span>
        </a>
        <button
          className="menu-toggle"
          type="button"
          aria-label="Toggle navigation"
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((open) => !open)}
        >
          <span />
          <span />
        </button>
        <nav className={menuOpen ? "site-nav is-open" : "site-nav"}>
          <a href="#platform" onClick={() => setMenuOpen(false)}>Platform</a>
          <a href="#clinicians" onClick={() => setMenuOpen(false)}>Clinicians</a>
          <a href="#consultation" onClick={() => setMenuOpen(false)}>Live care</a>
        </nav>
        <a className="access-button" href="/login">
          <span>Doctor login</span>
          <b aria-hidden="true">↗</b>
        </a>
      </header>

      <section className="hero" data-particle-shape="energy-generator">
        <div className="hero-core-aura" aria-hidden="true" />
        <div className="hero-status tech-label">
          <i /> Connected care intelligence
        </div>
        <div className="hero-copy">
          <h1>
            <span>See the</span>
            <span>whole</span>
            <span className="outline">patient.</span>
          </h1>
        </div>
        <div className="energy-axis-nodes" aria-hidden="true">
          <div className="energy-axis-node axis-wind"><i className="energy-node-light" /><span><b>01</b> Vitals</span></div>
          <div className="energy-axis-node axis-solar"><i className="energy-node-light" /><span><b>02</b> Labs</span></div>
          <div className="energy-axis-node axis-grid"><i className="energy-node-light" /><span><b>03</b> Imaging</span></div>
          <div className="energy-axis-node axis-storage"><i className="energy-node-light" /><span><b>04</b> History</span></div>
        </div>
        <div className="data-tag data-tag-a" aria-hidden="true">
          <small>Clinical context</small><strong>Connected</strong>
        </div>
        <div className="data-tag data-tag-b" aria-hidden="true">
          <small>Care signal</small><strong>Live</strong>
        </div>
        <p className="hero-description">
          One calm place for appointments, records and decisions.<br />
          Dala Care turns fragmented health data into a clear path<br />
          for patients and clinicians.
        </p>
        <a className="round-link" href="#platform" aria-label="Discover Dala Care">
          <span>Discover</span><b aria-hidden="true">↓</b>
        </a>
      </section>

      <section className="manifesto" id="platform" data-particle-shape="cloud">
        <div className="section-number">01 / Platform</div>
        <div className="manifesto-copy reveal">
          <p>Your health is more than a list of isolated results.</p>
          <h2>
            Every signal becomes<br />
            one continuous story —<br />
            ready when care begins.
          </h2>
        </div>
        <p className="manifesto-note reveal">
          Records, symptoms and measurements.<br />Connected around the person.
        </p>
      </section>

      <section className="spark medical-signal organ-section organ-section-heart" id="signal" data-particle-shape="heart">
        <div className="section-number">02 / Living signal</div>
        <div className="organ-readout organ-readout-left" aria-hidden="true">
          <span>01 / Cardiac system</span><strong>HEART</strong><small>Rhythm · perfusion · context</small>
        </div>
        <div className="spark-copy reveal">
          <p className="tech-label"><i /> Continuous patient context</p>
          <h2>Care starts<br />before the visit.</h2>
          <p>
            Daily symptoms, wearable vitals, medications and lab results arrive in one
            clinically useful timeline — not six disconnected portals.
          </p>
          <a className="text-link" href="#diagnostics">Follow the patient signal <span>↗</span></a>
        </div>
      </section>

      <section className="world organ-section organ-section-lungs" id="diagnostics" data-particle-shape="lungs">
        <div className="section-number">03 / Diagnostics</div>
        <div className="organ-readout organ-readout-right" aria-hidden="true">
          <span>02 / Respiratory system</span><strong>LUNGS</strong><small>Airflow · exchange · reserve</small>
        </div>
        <div className="world-copy reveal">
          <p className="tech-label"><i /> Evidence, in motion</p>
          <h2>From data<br />to direction.</h2>
          <div className="world-columns">
            <p>Patterns across labs, imaging and longitudinal records surface early, while clinicians keep the final judgment.</p>
            <p>Every insight is traceable to the clinical evidence behind it — clear enough to explain and act on.</p>
          </div>
        </div>
      </section>

      <section className="energy-system organ-section organ-section-brain" id="care-system" data-particle-shape="brain">
        <div className="section-number">04 / Care system</div>
        <div className="organ-readout organ-readout-left" aria-hidden="true">
          <span>03 / Neural system</span><strong>BRAIN</strong><small>Signals · cognition · coordination</small>
        </div>
        <div className="energy-system-copy reveal">
          <p className="tech-label"><i /> One coordinated pathway</p>
          <h2>Health has<br />many dimensions.</h2>
          <p>
            Primary care, specialists, diagnostics and follow-up work as one connected
            system — centered on the patient instead of the institution.
          </p>
          <a className="text-link" href="#clinicians">Meet the clinical team <span>↗</span></a>
        </div>
      </section>

      <section className="team" id="clinicians" data-particle-shape="ambient">
        <div className="section-number">05 / Clinicians</div>
        <div className="team-copy reveal">
          <p className="tech-label"><i /> Human expertise, always present</p>
          <h2>World-class care.<br />Genuinely human.</h2>
          <p>
            A multidisciplinary clinical team reviews the full picture, explains what
            matters and stays with you through every next step.
          </p>
          <a className="text-link" href="#consultation">Meet your doctor <span>↗</span></a>
          <div className="team-counter"><span>0{activeClinician + 1}</span><i /><span>0{clinicians.length}</span></div>
        </div>
        <div className="team-gallery reveal">
          <button className="portrait-frame" type="button" onClick={nextClinician} aria-label="Show next clinician">
            {clinicians.map((clinician, index) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img key={clinician.name} src={clinician.image} alt={clinician.name} className={index === activeClinician ? "is-active" : ""} />
            ))}
            <span className="portrait-scan" aria-hidden="true" />
            <span className="portrait-code">MD–{String(activeClinician + 24).padStart(2, "0")}</span>
          </button>
          <div className="team-meta"><strong>{clinicians[activeClinician].name}</strong><span>{clinicians[activeClinician].role}</span></div>
          <div className="team-buttons">
            <button type="button" onClick={previousClinician} aria-label="Previous clinician">←</button>
            <button type="button" onClick={nextClinician} aria-label="Next clinician">→</button>
          </div>
        </div>
      </section>

      <section className="investors organ-section organ-section-liver" id="pathways" data-particle-shape="liver">
        <div className="section-number">06 / Care pathways</div>
        <div className="organ-readout organ-readout-left" aria-hidden="true">
          <span>04 / Metabolic system</span><strong>LIVER</strong><small>Metabolism · filtration · response</small>
        </div>
        <div className="investors-copy reveal">
          <p className="tech-label"><i /> Designed around outcomes</p>
          <h2>One pathway.<br />Every specialist<br /><em>in sync.</em></h2>
          <p>
            Each clinical signal resolves into the same care plan, so patients never
            have to carry their story from one appointment to the next.
          </p>
        </div>
      </section>

      <section
        className="connection consultation"
        id="consultation"
        data-particle-shape="hands"
        data-particle-anchor="0.22"
      >
        <div className="section-number">07 / Live consultation</div>
        <div className="hand-sequence-copy" aria-hidden="true">
          <span>Human connection</span>
          <strong>Context meets care.</strong>
          <small>Scroll to see the shared signal disperse.</small>
        </div>
        <div className="meeting-shell reveal">
          <div className="meeting-topbar">
            <div>
              <span className="meeting-live-dot" />
              <strong>{callEnded ? "Visit summary ready" : "Consultation in progress"}</strong>
            </div>
            <span>Today · 14:30 · 24 min</span>
          </div>

          <div className="meeting-grid">
            <div className={`doctor-video ${cameraOn && !callEnded ? "" : "camera-off"}`}>
              {cameraOn && !callEnded ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={clinicians[activeClinician].image} alt={`${clinicians[activeClinician].name} on video`} />
              ) : (
                <div className="camera-placeholder"><span>AK</span><small>Camera is off</small></div>
              )}
              <div className="video-soft-light" aria-hidden="true" />
              <div className="speaker-label">
                <strong>{clinicians[activeClinician].name}</strong>
                <span>{clinicians[activeClinician].role}</span>
              </div>
              <div className="call-quality">HD · Secure</div>
            </div>

            <aside className="clinical-panel">
              <div className="clinical-panel-heading">
                <span>Patient overview</span><strong>Elena M.</strong>
              </div>
              <div className="vital-strip">
                <div><span>Heart rate</span><strong>72 <small>bpm</small></strong><i className="vital-wave" /></div>
                <div><span>Blood pressure</span><strong>118/76</strong><small>Normal range</small></div>
                <div><span>SpO₂</span><strong>98%</strong><small>Stable</small></div>
              </div>
              <div className="visit-focus">
                <span>Today&apos;s focus</span>
                <p>Review palpitations, sleep pattern and recent ECG result.</p>
              </div>
              <div className="clinical-note">
                <span>Live clinical note</span>
                <p>{callEnded ? "Consultation completed. Follow-up plan shared with patient." : "Symptoms improved after medication adjustment. No red flags reported."}</p>
              </div>
              <button className="open-record-button" type="button">Open longitudinal record <b>↗</b></button>
            </aside>
          </div>

          <div className="patient-pip">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=640&q=84" alt="Patient Elena on video" />
            <span>You · Elena</span>
          </div>

          <div className="meeting-controls" aria-label="Video consultation controls">
            <button className={micOn ? "" : "is-off"} type="button" onClick={() => setMicOn((value) => !value)} aria-pressed={!micOn}>
              <span>{micOn ? "MIC" : "MUTE"}</span><small>{micOn ? "Mute" : "Unmute"}</small>
            </button>
            <button className={cameraOn ? "" : "is-off"} type="button" onClick={() => setCameraOn((value) => !value)} aria-pressed={!cameraOn}>
              <span>{cameraOn ? "CAM" : "OFF"}</span><small>{cameraOn ? "Camera" : "Start video"}</small>
            </button>
            <button type="button"><span>CC</span><small>Captions</small></button>
            <button className="end-call" type="button" onClick={() => setCallEnded((value) => !value)}>
              <span>{callEnded ? "JOIN" : "END"}</span><small>{callEnded ? "Rejoin" : "End visit"}</small>
            </button>
          </div>
        </div>
      </section>

      <section className="final-cta" id="start" data-particle-shape="energy-hub">
        <div className="section-number">08 / Begin care</div>
        <div className="cta-copy reveal">
          <p className="tech-label"><i /> Your next appointment can feel different</p>
          <h2>Your health story<br />is already there.<br /><em>See it clearly.</em></h2>
          <a className="cta-button" href="/login"><span>Enter Dala Care</span><b>↗</b></a>
        </div>
      </section>

      <footer className="site-footer">
        <div className="footer-statement">
          <div>
            <span className="tech-label"><i /> Connected care, without the noise</span>
            <p>Medicine that sees<br /><em>the whole person.</em></p>
          </div>
          <a className="footer-top-link" href="#top"><span>Back to top</span><b>↑</b></a>
        </div>
        <a className="brand footer-brand" href="#top"><span className="brand-mark">+</span><span>dala care</span></a>
        <p>Connected medical intelligence<br />for people and clinicians.</p>
        <div className="footer-links">
          <a href="#platform">Platform</a><a href="#clinicians">Clinicians</a><a href="#consultation">Live care</a><a href="/login">Doctor login</a>
        </div>
        <div className="footer-bottom"><span>© 2026 DALA CARE</span><span>PRIVACY / CLINICAL SAFETY</span><span>CARE, CONNECTED</span></div>
      </footer>
    </main>
  );
}
