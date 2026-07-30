import PortalShell from "./PortalShell";

export const metadata = {
  title: "Doctor Workspace — Dala Care",
  description: "Clinical research, patient CRM and connected consultations for Dala Care clinicians.",
};

export default function PortalLayout({ children }: { children: React.ReactNode }) {
  return <PortalShell>{children}</PortalShell>;
}
