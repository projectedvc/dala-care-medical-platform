import type { Metadata } from "next";
import { headers } from "next/headers";
import "./globals.css";
import "./medical.css";
import "./platform.css";

export async function generateMetadata(): Promise<Metadata> {
  const requestHeaders = await headers();
  const host = requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host") ?? "localhost:3000";
  const protocol = requestHeaders.get("x-forwarded-proto") ?? (host.includes("localhost") ? "http" : "https");
  const origin = `${protocol}://${host}`;
  const description = "Dala Care connects appointments, records, vitals and clinical decisions into one continuous patient story.";

  return {
    title: "Dala Care — Connected clinical intelligence",
    description,
    icons: {
      icon: "/favicon.svg",
      shortcut: "/favicon.svg",
    },
    openGraph: {
      title: "Dala Care — See the whole patient.",
      description,
      type: "website",
      url: origin,
      images: [{ url: `${origin}/og.png`, width: 1200, height: 630, alt: "Dala Care — connected medical intelligence" }],
    },
    twitter: {
      card: "summary_large_image",
      title: "Dala Care — See the whole patient.",
      description,
      images: [`${origin}/og.png`],
    },
  };
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
