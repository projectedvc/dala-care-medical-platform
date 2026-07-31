"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

type LoaderPhase = "visible" | "leaving" | "hidden";

export default function MedicalChrome() {
  const pathname = usePathname();
  const firstRoute = useRef(true);
  const [loaderPhase, setLoaderPhase] = useState<LoaderPhase>("visible");

  useEffect(() => {
    const fullSequence = firstRoute.current;
    firstRoute.current = false;
    const visibleTimer = window.setTimeout(() => setLoaderPhase("visible"), 0);

    const leavingTimer = window.setTimeout(
      () => setLoaderPhase("leaving"),
      fullSequence ? 760 : 220,
    );
    const hiddenTimer = window.setTimeout(
      () => setLoaderPhase("hidden"),
      fullSequence ? 1080 : 440,
    );

    return () => {
      window.clearTimeout(visibleTimer);
      window.clearTimeout(leavingTimer);
      window.clearTimeout(hiddenTimer);
    };
  }, [pathname]);

  return (
    <>
      {loaderPhase !== "hidden" && (
        <div
          className={`medical-loader ${loaderPhase === "leaving" ? "is-leaving" : ""}`}
          role="status"
          aria-label="Loading clinical workspace"
        >
          <div className="loader-diagnostic">
            <div className="loader-orbit orbit-one" />
            <div className="loader-orbit orbit-two" />
            <div className="loader-cross">+</div>
            <svg className="loader-ecg" viewBox="0 0 420 80" aria-hidden="true">
              <path d="M2 43h78l13-1 9-18 14 39 15-57 18 70 17-33h58l9-1 8-13 14 27 13-42 16 51 14-23h104" />
            </svg>
          </div>
          <div className="loader-copy">
            <span>Dala clinical system</span>
            <strong>Connecting patient context</strong>
            <small>VITALS · RECORDS · EVIDENCE</small>
          </div>
          <div className="loader-progress"><i /></div>
        </div>
      )}
    </>
  );
}
