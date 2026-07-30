"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

const navigation = [
  { href: "/portal", label: "Overview", icon: "OV" },
  { href: "/portal/studies", label: "Studies", icon: "ST", badge: "5" },
  { href: "/portal/research", label: "AI Research", icon: "AI", badge: "AI" },
  { href: "/portal/patients", label: "Patient CRM", icon: "PT" },
  { href: "/portal/reports", label: "Reports", icon: "RP" },
  { href: "/portal/appointments", label: "Appointments", icon: "AP" },
  { href: "/portal/tasks", label: "Tasks", icon: "TK", badge: "3" },
];

export default function PortalShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="portal-shell">
      <button
        className="portal-mobile-toggle"
        type="button"
        aria-label="Toggle doctor navigation"
        aria-expanded={mobileOpen}
        onClick={() => setMobileOpen((value) => !value)}
      >
        <span />
        <span />
      </button>

      <aside className={`portal-sidebar ${mobileOpen ? "is-open" : ""}`}>
        <Link className="portal-brand" href="/" aria-label="Dala Care home">
          <span>+</span>
          <strong>dala care</strong>
        </Link>

        <div className="workspace-label">
          <small>Clinical workspace</small>
          <strong>Almaty Medical Group</strong>
        </div>

        <nav className="portal-nav" aria-label="Doctor workspace">
          {navigation.map((item) => {
            const active = item.href === "/portal" ? pathname === item.href : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={active ? "is-active" : ""}
                onClick={() => setMobileOpen(false)}
              >
                <span>{item.icon}</span>
                <strong>{item.label}</strong>
                {item.badge && <i>{item.badge}</i>}
              </Link>
            );
          })}
        </nav>

        <div className="portal-side-note">
          <span className="privacy-pulse" />
          <div>
            <small>Clinical safety</small>
            <strong>Protected workspace</strong>
          </div>
        </div>

        <div className="doctor-profile">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&w=240&q=84"
            alt="Dr. Noah Williams"
          />
          <div>
            <strong>Dr. Noah Williams</strong>
            <span>Internal medicine</span>
          </div>
          <Link href="/login" aria-label="Sign out">↗</Link>
        </div>
      </aside>

      <main className="portal-main">
        <header className="portal-topbar">
          <div className="portal-search">
            <span>⌕</span>
            <input aria-label="Search patients and records" placeholder="Search patients, studies, reports…" />
            <kbd>⌘ K</kbd>
          </div>
          <div className="portal-top-actions">
            <button type="button" aria-label="Clinical inbox">
              <span>IN</span><i>4</i>
            </button>
            <button type="button" aria-label="Notifications">
              <span>NT</span><i>2</i>
            </button>
            <Link className="new-consult-button" href="/portal/appointments">
              <b>+</b> New consultation
            </Link>
          </div>
        </header>
        <div className="portal-content">{children}</div>
      </main>
    </div>
  );
}
